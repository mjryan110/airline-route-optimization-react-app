#################################
####### Install packages #######
#################################

# pip install graphdatascience
import numpy as np 
import pandas as pd
import os
import json
from itertools import permutations
import itertools
from neo4j import GraphDatabase
from graphdatascience import GraphDataScience
from dotenv import load_dotenv
import sys
from pulp import LpMaximize, LpProblem, LpVariable, lpSum, PULP_CBC_CMD

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
#### get codes from react app ###
#################################

def main():
    # The selected airport codes will be passed as command-line arguments
    selected_codes = sys.argv[1:]  

    processed_codes = []

    for code in selected_codes:
        processed_codes.append(code)

    # Return the processed_codes list
    return processed_codes

if __name__ == "__main__":
    processed_codes_array = main()

#################################
#### Run shortest path algo #####
#################################

# Get all possible paths with starting at DFW and with the input destinations

airports = processed_codes_array
permutations_list = list(permutations(airports))

orders = []

for order in permutations_list:
    orders.append(list(('DFW',) + order))

# print(orders)

# Get all the adjacent pairs - source and dest but in a single list

paths = []

for order in orders:
    path = []
    for i in range(len(order) - 1):
        pair = [order[i], order[i + 1]]
        path.append(pair)
    paths.append(path)

# print(paths)

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
                k: 2,
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

# loop through dataframes and create a single dataframe
dfRoutes = pd.DataFrame(columns = ['totalDistance', 'nodeNames', 'value', 'duration', 'path','leg'])

# Create dataframes dynamically in a loop
for i in range(len(dataframes)):
    dfRoutes = pd.concat([dfRoutes, dataframes[i]], ignore_index=True)


# adding legs for later use
for i in range(len(dfRoutes)):
    dfRoutes.loc[i, 'leg'] = dfRoutes['path'].iloc[i].index([dfRoutes['nodeNames'].str[0][i], dfRoutes['nodeNames'].str[-1][i]])


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
solver = PULP_CBC_CMD(msg=False)
problem.solve(solver)

# Initialize variables to store the best route
max_value_route = None
max_value = 0
max_duration = 0

# Iterate through results to find the route with the maximum value
for i in range(len(dfLP)):
    if x[i].value() == 1:
        route_value = dfLP['totalValue'][i]
        if route_value > max_value:
            max_value = route_value
            max_value_route = dfLP['nodeNames'][i]
            max_duration = dfLP['totalDuration'][i]

# comment out to test new method
# # Print the selected route with the maximum value
# if max_value_route:
#     print(f"Selected Route with Maximum Value: {max_value_route} with Total Value: {max_value}, Total Duration: {max_duration}")
# else:
#     print("No route found that meets the constraints.")

# new method
if max_value_route:
    result = {
        'route': max_value_route,
        'total_value': max_value,
        'total_duration': max_duration
    }
    print(json.dumps(result))
else:
    result = {
        'error': 'No route found that meets the constraints'
    }
    print(json.dumps(result))