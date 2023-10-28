import React from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Map.css';
import { useEffect } from 'react';

const Map = () => {
    useEffect(() => {
        const map = L.map('map').setView([51.505, -0.09], 13);

        // Add a tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
        }).addTo(map);

        // Cleanup function
        return () => {
            map.remove();
        };
    }, []);

    return (
        <div id="map" className='map'>Map</div>
    )
}

export default Map