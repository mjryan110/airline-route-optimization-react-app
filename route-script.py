#################################
####### Install packages #######
#################################

# pip install graphdatascience
import numpy as np 
import pandas as pd
import collections
import os
import math
from itertools import permutations
import itertools
from neo4j import GraphDatabase
from graphdatascience import GraphDataScience
from dotenv import load_dotenv

# load env variables
load_dotenv()

#################################
#### connect to Neo4j server ####
#################################

HOST = os.getenv('REACT_APP_AURADS_HOST')
USERNAME = os.getenv('REACT_APP_AURADS_USERNAME')
PASSWORD = os.getenv('REACT_APP_AURADS_PASSWORD')

# Use Neo4j URI and credentials according to your setup
gds = GraphDataScience(HOST, auth=(USERNAME, PASSWORD), aura_ds=True)

driver = GraphDatabase.driver(uri=HOST,auth=(USERNAME, PASSWORD))

#################################
#### Run shortest path algo #####
#################################

# Get all possible paths with starting at DFW and with the input destinations

airports = ['IAH', 'YYZ', 'AMS']
permutations_list = list(permutations(airports))

orders = []

for order in permutations_list:
    orders.append(list(('DFW',) + order))

print(orders)

# Get all the adjacent pairs - source and dest but in a single list

paths = []

for order in orders:
    path = []
    for i in range(len(order) - 1):
        pair = [order[i], order[i + 1]]
        path.append(pair)
    paths.append(path)

print(paths)

# Loop through all possible routes and find shortest paths between them
dataframes = []

for j in range(len(paths)):
    for i in range(len(paths[0])):
        source = paths[j][i][0]
        dest = paths[j][i][1]
        result = gds.run_cypher('''
            MATCH (source:Airport {code: $source}), (dest:Airport {code: $dest})
            CALL gds.shortestPath.yens.stream('shortestPathGraph',{
                sourceNode: source,
                targetNode: dest,
                k: 5,
                relationshipWeightProperty: 'distance'
            })
            YIELD index, sourceNode, targetNode, totalCost, nodeIds, costs, path
            WITH index, sourceNode, targetNode, totalCost, nodeIds, costs, path
            UNWIND relationships(path) as r
            WITH index, sourceNode, targetNode, totalCost, nodeIds, costs, path, r
            MATCH (n)-[f:FLEW_TO]->(m)
            WHERE n.code = startNode(r).code AND m.code = endNode(r).code
            RETURN
                totalCost AS totalDistance,
                [nodeId IN nodeIds | gds.util.asNode(nodeId).code] AS nodeNames,
                ROUND(SUM(DISTINCT(f.value)), 2) AS value,
                ROUND(SUM(DISTINCT(f.duration)), 3) AS duration
        ''', 
        params = {'source': source, 'dest': dest}
        )

        # Convert the result into a pandas dataframe
        df = pd.DataFrame(result, columns=['totalDistance', 'nodeNames', 'value', 'duration'])
        
        df['path'] = [paths[j]] * len(df)
        
        # Append the dataframe to the list
        dataframes.append(df)

print(len(dataframes))

# loop through dataframes and create a single dataframe
dfRoutes = pd.DataFrame(columns = ['totalDistance', 'nodeNames', 'value', 'duration', 'path','leg'])

# Create dataframes dynamically in a loop
for i in range(len(dataframes)):
    dfRoutes = dfRoutes.append(dataframes[i], ignore_index=True)

# adding legs for later use
for i in range(len(dfRoutes)):
    dfRoutes['leg'][i] = dfRoutes['path'].iloc[i].index([dfRoutes['nodeNames'].str[0][i], dfRoutes['nodeNames'].str[-1][i]])

# making a dataframe based on the results - this is automated so you can add as many stops as you want
df = dfRoutes

# Convert 'path' column to a tuple of tuples to make it hashable
df['path_tuple'] = df['path'].apply(lambda x: tuple(tuple(i) for i in x))

# Group by 'path_tuple' first, then 'leg' within each path group
path_groups = df.groupby('path_tuple')

results = []

# Iterate over each path group
for path_tuple, group in path_groups:
    # Group by 'leg' within this path
    legs_grouped = [leg_group for _, leg_group in group.groupby('leg')]
    
    # Generate all combinations of rows across the different leg groups for this path
    combinations = list(itertools.product(*[leg_group.itertuples(index=False) for leg_group in legs_grouped]))
    
    # Calculate totals for each combination within this path
    for combo in combinations:
        totalDistance = sum(item.totalDistance for item in combo)
        totalValue = sum(item.value for item in combo)
        totalDuration = sum(item.duration for item in combo)
        combined_nodeNames = [item.nodeNames for item in combo]
        
        results.append({
            'totalDistance': totalDistance,
            'totalValue': totalValue,
            'totalDuration': totalDuration,
            'nodeNames': combined_nodeNames,
            'path': [list(i) for i in path_tuple]  # Convert back to list of lists for the final output
        })

# Convert results to DataFrame
result_df = pd.DataFrame(results)

# Display the result
result_df.sort_values('totalDistance')

#################################
###### Linear Programming #######
#################################

from pulp import LpMaximize, LpProblem, LpVariable, lpSum

dfLP = result_df

# Initialize the LP problem
problem = LpProblem("Maximize_Value", LpMaximize)

# Decision Variables: One for each path
x = [LpVariable(f'x{i}', cat='Binary') for i in range(len(dfLP))]

# Objective Function: Maximize totalValue
problem += lpSum([dfLP['totalValue'][i] * x[i] for i in range(len(dfLP))])

# Constraint: Ensure total duration does not exceed a specified maximum
max_duration = 14.25  # You can adjust this limit as needed
problem += lpSum([dfLP['totalDuration'][i] * x[i] for i in range(len(dfLP))]) <= max_duration

# Solve the problem
problem.solve()

# Print the selected route
for i in range(len(dfLP)):
    if x[i].value() == 1:
        print(f"Selected Route: {dfLP['nodeNames'][i]} with Total Value: {dfLP['totalValue'][i]}, Total Duration: {dfLP['totalDuration'][i]}")