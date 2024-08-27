require('dotenv').config({path: '../.env'});
const express = require('express');
const cors = require('cors');
const neo4j = require('neo4j-driver');
const { spawn } = require('child_process');
// const { default: App } = require('./App');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json())

const auradsPassword = process.env.REACT_APP_AURADS_PASSWORD;
const auradsUsername = process.env.REACT_APP_AURADS_USERNAME;
const auradsHost = process.env.REACT_APP_AURADS_HOST

// Configure the connection to Neo4j
const driver = neo4j.driver(
  auradsHost,
  neo4j.auth.basic(auradsUsername, auradsPassword)
);

// get airport code from the endpoint
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

// Endpoint to submit selected airport codes and trigger Python script
app.post('/api/submit-airports', async (req, res) => {
    const { selectedCodes } = req.body;

    if (!selectedCodes || !Array.isArray(selectedCodes)) {
        return res.status(400).send('Invalid request: selectedCodes is required and must be an array.');
    }

    try {
        // Spawn the Python script process and pass the selectedCodes as arguments
        const pythonProcess = spawn('python3', ['../test.py', ...selectedCodes]);

        // Capture the output from the Python script
        pythonProcess.stdout.on('data', (data) => {
            console.log(`Python script output: ${data}`);
        });

        // Handle error output from the Python script
        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python script error: ${data}`);
        });

        // Handle when the Python script process exits
        pythonProcess.on('close', (code) => {
            console.log(`Python script exited with code ${code}`);
            res.json({ message: 'Python script triggered successfully', selectedCodes });
        });
    } catch (error) {
        console.log('Error triggering Python script:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})