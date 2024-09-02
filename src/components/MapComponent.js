import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Circle, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MapWithBounds = ({ positions }) => {
    const map = useMap();

    useEffect(() => {
        if (positions.length) {
            const bounds = positions.reduce((bounds, pos) => bounds.extend(L.latLng(pos)), L.latLngBounds());
            map.fitBounds(bounds);
        }
    }, [positions, map]);

    return null;
};

const MapComponent = ({ center, polyline, circleCenter, circleRadius, markers }) => {
    return (
        <MapContainer center={center} zoom={5} scrollWheelZoom={false} style={{ height: '400px', width: '100%' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Circle center={circleCenter} pathOptions={{ fillColor: 'blue' }} radius={circleRadius} />
            {markers.map((marker, index) => (
                <CircleMarker key={index} center={marker.position} pathOptions={{ color: 'red' }} radius={20}>
                    <Popup>{marker.label}</Popup>
                </CircleMarker>
            ))}
            <Polyline pathOptions={{ color: 'black' }} positions={polyline} />
            <MapWithBounds positions={polyline} />
        </MapContainer>
    );
};

export default MapComponent;
