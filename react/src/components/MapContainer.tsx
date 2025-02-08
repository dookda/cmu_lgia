// src/components/MapContainer.tsx
import React, { useEffect, useRef, useContext } from 'react';
import maplibregl from 'maplibre-gl';
import { MapContext } from '../MapContext';

const MAPTILER_KEY = 'QcH5sAeCUv5rMXKrnJms';

const baseMaps: { [key: string]: string } = {
    osm: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    grod: 'https://mt0.google.com/vt/lyrs=r&x={x}&y={y}&z={z}',
    ghyb: 'https://mt0.google.com/vt/lyrs=y,m&x={x}&y={y}&z={z}',
    gsat: 'https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
};

const MapContainer: React.FC = () => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const { map } = useContext(MapContext)!;

    useEffect(() => {
        if (mapContainerRef.current && !map.current) {
            const newMap = new maplibregl.Map({
                container: mapContainerRef.current,
                style: `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`,
                center: [99.0173, 18.5762],
                zoom: 15.5,
                pitch: 45,
                antialias: true
            });
            map.current = newMap;

            newMap.addControl(new maplibregl.NavigationControl(), 'top-right');

            // Helper to add a raster layer
            const addRasterLayer = (id: string, url: string) => {
                newMap.addSource(id, { type: 'raster', tiles: [url], tileSize: 256 });
                newMap.addLayer({ id, type: 'raster', source: id, layout: { visibility: 'none' } });
            };

            newMap.on('load', () => {
                Object.entries(baseMaps).forEach(([id, url]) => {
                    addRasterLayer(id, url);
                });

                newMap.addSource('maptiler', {
                    type: 'vector',
                    url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${MAPTILER_KEY}`
                });

                newMap.addLayer({
                    id: 'maptiler',
                    type: 'symbol',
                    source: 'maptiler',
                    'source-layer': 'landuse',
                    layout: { visibility: 'none' }
                });
            });
        }
    }, [map]);

    // Update base map layer visibility based on selector change
    const handleBaseMapChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedLayer = event.target.value;
        if (map.current) {
            // Hide all layers
            Object.keys(baseMaps).concat(['maptiler']).forEach(layer => {
                if (map.current!.getLayer(layer)) {
                    map.current!.setLayoutProperty(layer, 'visibility', 'none');
                }
            });
            // Make the selected layer visible
            if (map.current.getLayer(selectedLayer)) {
                map.current.setLayoutProperty(selectedLayer, 'visibility', 'visible');
            }
        }
    };

    return (
        <div>
            <div className="side-panel-basemap p-2 mt-2">
                <label htmlFor="baseMapSelector">เลือกแผนที่ฐาน:</label>
                <select className="form-select" id="baseMapSelector" onChange={handleBaseMapChange}>
                    <option value="maptiler">Maptiler 3D</option>
                    <option value="osm">OpenStreetMap</option>
                    <option value="grod">Google Roads</option>
                    <option value="gsat">Google Satellite</option>
                    <option value="ghyb">Google Hybrid</option>
                </select>
            </div>
            <div ref={mapContainerRef} id="map" style={{ width: '100%', height: '500px' }} />
        </div>
    );
};

export default MapContainer;
