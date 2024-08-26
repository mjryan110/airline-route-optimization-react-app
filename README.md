# ✈️ Airline Route Optimization with Neo4j and Graph Data Science

This React App offers a solution to optimize airline routes based on available flight hours using Neo4j's Graph Data Science (GDS) library.

Imagine you're a pilot with only 15 working hours left for the week. How do you maximize your earnings? Sure, you could manually search for the most lucrative routes, but why settle for guesswork? This notebook automates the process, providing an optimal flight schedule that tells you exactly which routes to fly to make the most out of your remaining time.

> **Current Status:**  
> The application is being actively updated. Right now, you can enter desired airport codes, and it will filter down the codes from the Neo4j database.

### 🛠 How It Works
- **Yen's K-Shortest Path Algorithm** is employed to identify multiple shortest paths between airports.
- Users can input any number of airport codes, and the notebook will generate the possible routes.
- A **linear programming** step at the end calculates the optimal path, maximizing earnings while considering the time constraints.

---

## 🚀 Setup

To get started, you'll need a Neo4j instance with Graph Data Science installed:

1. **Option 1:** [Get started with AuraDS](https://neo4j.com/product/auradb/)
2. **Option 2:** Download and install [Neo4j Desktop with GDS](https://neo4j.com/download/)

You will also need to install some python libraries:

1. `graphdatascience`

    ```
    pip install graphdatascience
    ```
2. `pulp`
    ```
    pip install pulp
    ```

Once your database is up and running, you can proceed to configure the notebook.

---

## 📓 Usage Instructions

1. **Configure Neo4j Settings:**  
   Open the notebook and update the Neo4j connection settings with your `HOST`, `USERNAME`, and `PASSWORD` to connect your database.

2. **Load Your Data:**  
   After configuring the connection, load your dataset into the Neo4j environment.

3. **Run the Notebook:**  
   Execute the cells to find the optimal flight routes based on your inputs and constraints.

Enjoy exploring optimized routes and maximizing your value!

---
