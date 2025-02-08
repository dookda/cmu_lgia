// src/components/LayerList.tsx
import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import maplibregl from 'maplibre-gl';
import { MapContext } from '../MapContext';

interface Layer {
    formid: string;
    layername: string;
}

const LayerList: React.FC = () => {
    const [layers, setLayers] = useState<Layer[]>([]);
    const { map, featuresMap, markersMap } = useContext(MapContext)!;
    const server = 'http://localhost:3000';
    useEffect(() => {
        const fetchLayers = async () => {
            try {
                const response = await axios.post(server + '/api/list_layer');
                setLayers(response.data);
            } catch (error) {
                console.error('Error fetching layer list:', error);
            }
        };
        fetchLayers();
    }, []);

    const handleCheckboxChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const checkbox = event.target;
        const formid = checkbox.id;
        const layerName = checkbox.name;
        if (checkbox.checked) {
            await getFeatures(formid, layerName);
        } else {
            removeFeatures(formid);
        }
    };

    const getFeatures = async (formid: string, layerName: string) => {
        if (!map.current) return;
        try {
            const response = await axios.post(server + '/api/load_layer', { formid });
            const featureArray: string[] = [];
            const markersArray: maplibregl.Marker[] = [];

            response.data.forEach(({ geojson, refid }: { geojson: string; refid: string }) => {
                const data = JSON.parse(geojson);
                const type = data.type;
                if (type === 'Point') {
                    const marker = new maplibregl.Marker()
                        .setLngLat(data.coordinates)
                        .addTo(map.current!);
                    const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`<b>Feature ID:</b> ${refid}`);
                    marker.setPopup(popup);
                    markersArray.push(marker);
                } else {
                    if (!map.current!.getSource(refid)) {
                        map.current!.addSource(refid, { type: 'geojson', data: { type: 'Feature', geometry: data } });
                    }
                    map.current!.addLayer({
                        id: refid,
                        type: type === 'LineString' ? 'line' : 'fill',
                        source: refid,
                        paint:
                            type === 'LineString'
                                ? { 'line-color': '#ff0000', 'line-width': 3 }
                                : { 'fill-color': '#00ff00', 'fill-opacity': 0.5 }
                    });
                    featureArray.push(refid);

                    map.current!.on('click', refid, (e) => {
                        const coordinates = e.lngLat;
                        new maplibregl.Popup()
                            .setLngLat(coordinates)
                            .setHTML(`<b>Feature ID:</b> ${refid}`)
                            .addTo(map.current!);
                    });
                }
            });

            featuresMap.current[formid] = featureArray;
            markersMap.current[formid] = markersArray;

            // Optionally, notify a shared state (e.g. in DataPanel) to update the layer selector.
            addToLayerSelect(formid, layerName);
        } catch (error) {
            console.error('Failed to get features:', error);
        }
    };

    const removeFeatures = (formid: string) => {
        if (!map.current) return;
        if (featuresMap.current[formid]) {
            featuresMap.current[formid].forEach(feature => {
                if (map.current!.getLayer(feature)) {
                    map.current!.removeLayer(feature);
                    map.current!.removeSource(feature);
                }
            });
            featuresMap.current[formid] = [];
        }
        if (markersMap.current[formid]) {
            markersMap.current[formid].forEach(marker => marker.remove());
            markersMap.current[formid] = [];
        }
        // Also remove the layer option from the shared layer select (if implemented)
        removeLayerSelectOption(formid);
    };

    // These helper stubs can be implemented to update shared state or notify parent components.
    const addToLayerSelect = (formid: string, layerName: string) => {
        console.log('Add to layer select:', formid, layerName);
    };

    const removeLayerSelectOption = (formid: string) => {
        console.log('Remove from layer select:', formid);
    };

    return (
        <ul className="list-group" id="layerList">
            {layers.map(layer => (
                <li key={layer.formid} className="list-group-item d-flex align-items-center">
                    <input
                        type="checkbox"
                        id={layer.formid}
                        name={layer.layername}
                        className="form-check-input me-2 checkbox"
                        onChange={handleCheckboxChange}
                    />
                    <label htmlFor={layer.formid} className="form-check-label stretched-link">
                        {layer.layername}
                    </label>
                </li>
            ))}
        </ul>
    );
};

export default LayerList;
