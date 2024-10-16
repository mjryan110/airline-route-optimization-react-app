import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Default icon setup for Leaflet markers
const defaultIcon = new L.Icon({
    iconUrl: require('leaflet/dist/images/marker-icon.png'), // Path to marker icon image
    iconSize: [25, 41], // Size of the icon
    iconAnchor: [12, 41], // Anchor point of the icon
    popupAnchor: [1, -34], // Popup anchor
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
    shadowSize: [41, 41]
});

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

const MapComponent = ({ center, polyline, markers }) => {
    return (
        <MapContainer center={center} zoom={5} scrollWheelZoom={false} style={{ height: '400px', width: '100%' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Polyline pathOptions={{ color: 'black' }} positions={polyline} />
            {markers.map((marker, index) => (
                <Marker key={index} position={marker.position} icon={defaultIcon}>
                    <Popup>{marker.label}</Popup>
                </Marker>
            ))}
            <MapWithBounds positions={polyline} />
        </MapContainer>
    );
};

export default MapComponent;
