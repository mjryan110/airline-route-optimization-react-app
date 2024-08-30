import React, { useEffect, useState } from 'react';
import './AirportPage.css'; // Import the updated CSS file

const AirportPage = () => {
    const [airports, setAirports] = useState([]);
    const [airportCode, setAirportCode] = useState('');
    const [selectedCodes, setSelectedCodes] = useState([]);
    const [filteredAirports, setFilteredAirports] = useState([]);
    const [result, setResult] = useState(null);
    const [startingAirportCode, setStartingAirportCode] = useState('');
    const [durationLimit, setDurationLimit] = useState(null);

    useEffect(() => {
        const fetchAirportData = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/data/airport');
                const data = await response.json();
                setAirports(data);
                setFilteredAirports(data);
            } catch (error) {
                console.error('Error fetching airport data:', error);
            }
        };

        fetchAirportData();
    }, []);

    const handleInputChange = (e) => setAirportCode(e.target.value);

    const handleStartingInputChange = (e) => setStartingAirportCode(e.target.value.toUpperCase());

    const handleDurationInputChange = (e) => setDurationLimit(e.target.value);

    const handleAddCode = () => {
        if (airportCode.trim() !== '' && !selectedCodes.includes(airportCode.toUpperCase())) {
            setSelectedCodes([...selectedCodes, airportCode.toUpperCase()]);
            setAirportCode('');
        }
    };

    const handleSubmit = async () => {
        if (selectedCodes.length > 0 && startingAirportCode.trim() !== '' && durationLimit > 0) {
            const filtered = airports.filter(airport =>
                selectedCodes.includes(airport.code)
            );
            setFilteredAirports(filtered);

            try {
                const response = await fetch('http://localhost:3001/api/submit-airports', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ startingAirportCode, selectedCodes, durationLimit })
                });

                const result = await response.json();

                if (result.error) {
                    console.error('Error:', result.error);
                } else {
                    setResult(result);
                }
            } catch (error) {
                console.error('Error submitting airport codes:', error);
            }
        }
    };

    const handleClear = () => {
        setStartingAirportCode('');
        setSelectedCodes([]);
        setFilteredAirports(airports);
        setResult(null);
        setDurationLimit('');
    };

    return (
        <div className="airport-page-container">
            <h1 className="page-title">Airport Data</h1>

            <div className="input-section">
                <div className="input-group">
                    <label htmlFor="startingAirportInput" className="input-label">Starting Airport Code:</label>
                    <input
                        type="text"
                        id="startingAirportInput"
                        value={startingAirportCode}
                        onChange={handleStartingInputChange}
                        placeholder="E.g., JFK"
                        className="input-field"
                    />
                </div>
                <div className="input-group">
                    <label htmlFor="startingDurationInput" className="input-label">Duration Available (hours):</label>
                    <input
                        type="text"
                        id="durationLimitInput"
                        value={durationLimit}
                        onChange={handleDurationInputChange}
                        placeholder="E.g., 5"
                        className="input-field"
                    />
                </div>
                <div className="input-group">
                    <label htmlFor="airportInput" className="input-label">Add Airport Code:</label>
                    <input
                        type="text"
                        id="airportInput"
                        value={airportCode}
                        onChange={handleInputChange}
                        placeholder="E.g., LAX"
                        className="input-field"
                    />
                    <button onClick={handleAddCode} className="action-button">Add</button>
                    <button onClick={handleSubmit} className="action-button">Submit</button>
                    <button onClick={handleClear} className="action-button">Clear</button>
                </div>
            </div>

            {startingAirportCode && (
                <div className="info-section">
                    <h3 className="info-title">Starting Airport:</h3>
                    <p>{startingAirportCode}</p>
                </div>
            )}

            {selectedCodes.length > 0 && (
                <div className="info-section">
                    <h3 className="info-title">Selected Airport Codes:</h3>
                    <ul className="code-list">
                        {selectedCodes.map((code, index) => (
                            <li key={index} className="code-item">{code}</li>
                        ))}
                    </ul>
                </div>
            )}

            {result && (
                <div className="results-section">
                    <h2 className="info-title">Selected Route Details:</h2>
                    <p><strong>Route:</strong> {result.route.join(' → ')}</p>
                    <p><strong>Total Value:</strong> {result.total_value}</p>
                    <p><strong>Total Duration:</strong> {result.total_duration}</p>
                </div>
            )}

            <table className="airport-table">
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Country</th>
                        <th>City</th>
                        <th>Latitude</th>
                        <th>Longitude</th>
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
