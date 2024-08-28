import React, { useEffect, useState } from 'react';
// import MapComponent from '../components/MapComponent';

const AirportPage = () => {
    const [airports, setAirports] = useState([]);
    const [airportCode, setAirportCode] = useState('');
    const [selectedCodes, setSelectedCodes] = useState([]);
    const [filteredAirports, setFilteredAirports] = useState([]);
    const [result, setResult] = useState(null); // State to hold the results

    useEffect(() => {
        // Fetch data from the Express server
        const fetchAirportData = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/data/airport');
                const data = await response.json();
                setAirports(data);
                setFilteredAirports(data); // Set initial filtered data
            } catch (error) {
                console.error('Error fetching airport data:', error);
            }
        };

        fetchAirportData();
    }, []);

    // Handle input field change
    const handleInputChange = (e) => {
        setAirportCode(e.target.value);
    };

    // Handle adding airport code to the list
    const handleAddCode = () => {
        if (airportCode.trim() !== '' && !selectedCodes.includes(airportCode.toUpperCase())) {
            setSelectedCodes([...selectedCodes, airportCode.toUpperCase()]);
            setAirportCode(''); // Clear the input field
        }
    };

    const handleSubmit = async () => {
        if (selectedCodes.length > 0) {
            // Filter the airports to display only the selected ones
            const filtered = airports.filter(airport =>
                selectedCodes.includes(airport.code)
            );
            setFilteredAirports(filtered);
    
            // Submit the selected airport codes to the backend to trigger the Python script
            try {
                const response = await fetch('http://localhost:3001/api/submit-airports', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ selectedCodes })
                });
    
                const result = await response.json();

                if (result.error) {
                    console.error('Error:', result.error);
                } else {
                    setResult(result); // Store the result in state to display it
                }
            } catch (error) {
                console.error('Error submitting airport codes:', error);
            }
        }
    };
    

    // Handle clearing the selection and showing all airports
    const handleClear = () => {
        setSelectedCodes([]);
        setFilteredAirports(airports); // Reset to the original list
        setResult(null); // Clear the result when clearing selections
    };

    return (
        <div className="container">
            <h1 className="title">Airport Data</h1>

            {/* Input Field to Add Airport Codes */}
            <div className="input-section">
                <label htmlFor="airportInput" className="label">Enter Airport Code:</label>
                <input
                    type="text"
                    id="airportInput"
                    value={airportCode}
                    onChange={handleInputChange}
                    placeholder="E.g., JFK"
                    className="input"
                />
                <button onClick={handleAddCode} className="button">Add Airport Code</button>
                <button onClick={handleSubmit} className="button">Submit</button>
                <button onClick={handleClear} className="button">Clear</button>
            </div>

            {/* Results Section */}
            {result && (
                <div className="results-section">
                    <h2 className="subtitle">Selected Route Details:</h2>
                    <p><strong>Route:</strong> {result.route.join(' → ')}</p>
                    <p><strong>Total Value:</strong> {result.total_value}</p>
                    <p><strong>Total Duration:</strong> {result.total_duration}</p>
                </div>
            )}

            {/* List of Selected Airport Codes */}
            {selectedCodes.length > 0 && (
                <div className="selected-codes-section">
                    <h3 className="subtitle">Selected Airport Codes:</h3>
                    <ul className="code-list">
                        {selectedCodes.map((code, index) => (
                            <li key={index} className="code-item">{code}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Airport Data Table */}
            <table id="airportTable" className="table">
                <thead>
                    <tr>
                        <th className="table-header">Code</th>
                        <th className="table-header">Country</th>
                        <th className="table-header">City</th>
                        <th className="table-header">Latitude</th>
                        <th className="table-header">Longitude</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredAirports.map(airport => (
                        <tr key={airport.code}>
                            <td>{airport.code}</td>
                            <td>{airport.country}</td>
                            <td>{airport.city}</td>
                            <td>{airport.latitude}</td>
                            <td>{airport.longitude}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AirportPage;
