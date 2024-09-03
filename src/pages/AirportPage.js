import React, { useEffect, useState } from 'react';
import MapComponent from '../components/MapComponent';
import './AirportPage.css';

const AirportPage = () => {
    const [airports, setAirports] = useState([]);
    const [airportCode, setAirportCode] = useState('');
    const [selectedCodes, setSelectedCodes] = useState([]);
    const [filteredAirports, setFilteredAirports] = useState([]);
    const [result, setResult] = useState(null);
    const [startingAirportCode, setStartingAirportCode] = useState('');
    const [durationLimit, setDurationLimit] = useState(null);
    const [polyline, setPolyline] = useState([]);
    const [markers, setMarkers] = useState([]);
    const [center, setCenter] = useState([0,0]); // default center for initial render



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
                console.log(result.route)
                console.log(result.coordinates);

                if (result.error) {
                    console.error('Error:', result.error);
                } else {
                    setResult(result);

                    // dynamically create polyline and markers
                    const polyline = result.coordinates.map(coord => [coord.latitude, coord.longitude]);
                    console.log('polyline', polyline)
                    const markers = result.coordinates.map(coord => ({
                        position: [coord.latitude, coord.longitude],
                        label: coord.code
                    }));
                    const center = [result.coordinates[0].latitude, result.coordinates[0].longitude];

                    setPolyline(polyline);
                    setMarkers(markers);
                    setCenter(center);
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
            <div>
                <h3>
                Starting Airport:
                </h3>
                    <p>
                        {startingAirportCode}
                    </p>
            </div>
            <div>
                <h3>
                    Added Airports:
                </h3>
                <ul className="code-list">
                        {selectedCodes.map((code, index) => (
                            <li key={index} className="code-item">{code}</li>
                        ))}
                </ul>
            </div>
            <div>
                <h3>
                    Hours Available:
                </h3>
                    <p>
                        {durationLimit}
                    </p>
            </div>

            {result && (
                <div className="results-section">
                    <h2 className="info-title">Selected Route Details:</h2>
                    <p><strong>Route:</strong> {result.route.join(' → ')}</p>
                    <p><strong>Total Value:</strong> {result.total_value}</p>
                    <p><strong>Total Duration:</strong> {result.total_duration}</p>

                    {/* Pass coordinates to the MapComponent */}
                    <MapComponent
                        center={center} // or calculate dynamic center based on coordinates
                        polyline={polyline}
                        circleCenter={center} // or set to first airport in coordinates
                        circleRadius={10}
                        markers={markers}
                    />
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
