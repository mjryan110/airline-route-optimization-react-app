// src/pages/MapComponent.js
import React, { useEffect, useState } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '500px',
};

const center = {
  lat: 0, // Default center of the map (you can update it dynamically)
  lng: 0,
};

const MapComponent = ({ selectedAirports }) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY, // Add your API Key here
  });

  return isLoaded ? (
    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={2}>
      {selectedAirports.map((airport, index) => (
        <Marker
          key={index}
          position={{
            lat: parseFloat(airport.latitude),
            lng: parseFloat(airport.longitude),
          }}
          label={airport.code}
        />
      ))}
    </GoogleMap>
  ) : <div>Loading...</div>;
};

export default MapComponent;
