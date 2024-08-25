require('dotenv').config({path: '../.env'});
const express = require('express');
const cors = require('cors');
const neo4j = require('neo4j-driver');
// const { default: App } = require('./App');

const app = express();
const port = 3001;

app.use(cors());

const auradsPassword = process.env.REACT_APP_AURADS_PASSWORD;
const auradsUsername = process.env.REACT_APP_AURADS_USERNAME;
const auradsHost = process.env.REACT_APP_AURADS_HOST

// Configure the connection to Neo4j
const driver = neo4j.driver(
  auradsHost,
  neo4j.auth.basic(auradsUsername, auradsPassword)
);

// get airport code
app.get('/api/data/airport', async (req, res) => {
    const session = driver.session()
    
    try {
        const result = await session.run('MATCH (a:Airport) WHERE a.country = "United States" RETURN DISTINCT a.code AS code, a.country AS country, a.city AS city, a.latitude AS latitude, a.longitude AS longitude LIMIT 500');
        const airports = result.records.map(record => ({
            code: record.get('code'),
            country: record.get('country'),
            city: record.get('city'),
            latitude: record.get('latitude'),
            longitude: record.get('longitude')
        }));
        res.json(airports);
    } catch (error) {
        console.log('Error running query:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})