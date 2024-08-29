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
    // get the selected airport codes
    const { selectedCodes } = req.body;
    // get the starting airport code
    const { startingAirportCode } = req.body;
    console.log(selectedCodes)
    console.log(startingAirportCode)

    // combine the two with starting at the beginning
    const allSelectedCodes = [startingAirportCode, ...selectedCodes]
    console.log(allSelectedCodes)

    if (!allSelectedCodes || !Array.isArray(allSelectedCodes)) {
        return res.status(400).send('Invalid request: selectedCodes is required and must be an array.');
    }

    try {
        // Spawn the Python script process and pass the selectedCodes as arguments
        const pythonProcess = spawn('python3', ['../route-optimizer.py', ...allSelectedCodes]);

        let scriptOutput = '';

        // Capture the output from the Python script
        pythonProcess.stdout.on('data', (data) => {
            scriptOutput += data.toString();
            console.log(`Python script output: ${data}`);
            console.log('scriptOutput:', scriptOutput)
        });

        // Handle error output from the Python script
        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python script error: ${data}`);
        });

        // Handle when the python script process exits
        pythonProcess.on('close', (code) => {
            console.log(`Python script exited with code ${code}`);

            try {
                const result = JSON.parse(scriptOutput);
                res.json(result);
                console.log('result:', result)
            } catch (error) {
                console.error('Error parsing Python script output:', error);
                res.status(500).send('Internal Server Error');
            }
        });
    } catch (error) {
        console.log('Error triggering Python script:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})