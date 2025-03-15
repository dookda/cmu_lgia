document.addEventListener('DOMContentLoaded', async () => {
    try {
        const API_KEYS = {
            MAPTILER: 'QcH5sAeCUv5rMXKrnJms',
            GEOAPIFY: '5c607231c8c24f9b89ff3af7a110185b'
        };

        const BASE_MAPS = {
            osm: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            grod: 'https://mt0.google.com/vt/lyrs=r&x={x}&y={y}&z={z}',
            ghyb: 'https://mt0.google.com/vt/lyrs=y,m&x={x}&y={y}&z={z}',
            gsat: 'https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
        };

        const MAP_CONFIG = {
            container: 'map',
            style: `https://api.maptiler.com/maps/streets/style.json?key=${API_KEYS.MAPTILER}`,
            center: [99.0173, 18.5762],
            zoom: 5,
            pitch: 0,
            antialias: true
        };

        const map = new maplibregl.Map(MAP_CONFIG);
        map.addControl(new maplibregl.NavigationControl());

        const defaultLayerConfigs = {
            point: {
                type: 'circle',
                paint: {
                    'circle-radius': 5,
                    'circle-color': '#FF0000',
                    'circle-opacity': 0.8,
                    'circle-stroke-width': 1,
                    'circle-stroke-color': '#FFFFFF'
                }
            },
            linestring: {
                type: 'line',
                paint: { 'line-color': '#00FF00', 'line-width': 2 }
            },
            polygon: {
                type: 'fill',
                paint: { 'fill-color': '#0000FF', 'fill-opacity': 0.5 }
            }
        };

        const calculateBoundingBox = (features) => {
            try {
                const bounds = new maplibregl.LngLatBounds();
                features.forEach(feature => {
                    let geometry;
                    try {
                        geometry = feature.geojson ? JSON.parse(feature.geojson) : null;
                    } catch (error) {
                        console.error(`Invalid geojson in calculateBoundingBox for feature ${feature.refid}:`, error);
                        geometry = null;
                    }

                    if (!geometry || !geometry.type || !geometry.coordinates) {
                        console.warn(`Skipping feature ${feature.refid} in bounding box calculation due to invalid geometry`);
                        return;
                    }

                    if (geometry.type === 'Point') {
                        const [lng, lat] = geometry.coordinates;
                        bounds.extend([lng, lat]);
                    } else if (geometry.type === 'LineString' || geometry.type === 'MultiPoint') {
                        geometry.coordinates.forEach(coord => bounds.extend(coord));
                    } else if (geometry.type === 'Polygon' || geometry.type === 'MultiLineString') {
                        geometry.coordinates.flat().forEach(coord => bounds.extend(coord));
                    } else if (geometry.type === 'MultiPolygon') {
                        geometry.coordinates.flat(2).forEach(coord => bounds.extend(coord));
                    }
                });

                if (bounds.isEmpty()) {
                    console.warn('No valid geometries found; returning default bounds');
                    return new maplibregl.LngLatBounds([-180, -90], [180, 90]);
                }
                return bounds;
            } catch (error) {
                console.error('Error in calculateBoundingBox:', error);
                return new maplibregl.LngLatBounds([-180, -90], [180, 90]);
            }
        };

        const zoomToLayerExtent = (features) => {
            try {
                const boundingBox = calculateBoundingBox(features);
                map.fitBounds(boundingBox, { padding: 50, maxZoom: 15 });
            } catch (error) {
                console.error('Error in zoomToLayerExtent:', error);
            }
        };

        const addLayerToMap = (features, featureType, formid) => {
            try {
                const sourceId = `features-source-${formid}`;

                // Add the source (it will only be added if it doesn't already exist)
                if (!map.getSource(sourceId)) {
                    map.addSource(sourceId, {
                        type: 'geojson',
                        data: { type: 'FeatureCollection', features: [] }
                    });
                }

                const geojsonFeatures = features.map(feature => createGeoJSONFeature(feature));
                map.getSource(sourceId).setData({
                    type: 'FeatureCollection',
                    features: geojsonFeatures
                });

                const layerIds = [];

                features.forEach(feature => {
                    const geometry = parseGeometry(feature);
                    const layerId = `feature-layer-${feature.refid}`;
                    const customStyles = parseCustomStyles(feature);

                    if (geometry.type.toLowerCase() === 'polygon') {
                        addPolygonLayers(feature, sourceId, layerId, customStyles, defaultLayerConfigs);
                        layerIds.push(layerId); // Add fill layer ID
                        layerIds.push(`${layerId}-outline`); // Add outline layer ID
                    } else if (geometry.type.toLowerCase() === 'linestring') {
                        addLineLayer(feature, sourceId, layerId, customStyles, defaultLayerConfigs, geometry);
                        layerIds.push(layerId); // Add line layer ID
                    } else {
                        addPointLayer(feature, sourceId, layerId, customStyles, defaultLayerConfigs, geometry);
                        layerIds.push(layerId); // Add point layer ID
                    }
                });

                // Store the layer reference for later removal
                layerReferences[formid] = {
                    sourceId,
                    layerIds
                };

            } catch (error) {
                console.error('Error in addLayerToMap:', error);
            }
        };

        const createGeoJSONFeature = (feature) => {
            try {
                let geometry;
                try {
                    geometry = feature.geojson ? JSON.parse(feature.geojson) : { type: 'Point', coordinates: [0, 0] };
                } catch (error) {
                    console.error(`Invalid geojson for feature ${feature.refid}:`, error);
                    geometry = { type: 'Point', coordinates: [0, 0] };
                }
                return {
                    type: 'Feature',
                    geometry,
                    properties: { ...feature, refid: feature.refid }
                };
            } catch (error) {
                console.error('Error in createGeoJSONFeature:', error);
                return {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [0, 0] },
                    properties: { refid: feature.refid }
                };
            }
        };

        const parseGeometry = (feature) => {
            try {
                return feature.geojson ? JSON.parse(feature.geojson) : { type: 'Point', coordinates: [0, 0] };
            } catch (error) {
                console.error(`Invalid geojson for feature ${feature.refid}:`, error);
                return { type: 'Point', coordinates: [0, 0] };
            }
        };

        const parseCustomStyles = (feature) => {
            try {
                if (!feature.style) return [];
                try {
                    const parsedStyles = JSON.parse(feature.style);
                    return Array.isArray(parsedStyles) ? parsedStyles : [];
                } catch (error) {
                    console.error(`Error parsing style for feature ${feature.refid}:`, error);
                    return [];
                }
            } catch (error) {
                console.error('Error in parseCustomStyles:', error);
                return [];
            }
        };

        const addPolygonLayers = (feature, sourceId, layerId, customStyles, defaultLayerConfigs) => {
            try {
                const fillStyle = customStyles.find(style => style.id === 'gl-draw-polygon') || {};
                const outlineStyle = customStyles.find(style => style.id === 'gl-draw-polygon-outline') || {};

                const fillLayerConfig = createLayerConfig(layerId, sourceId, fillStyle, defaultLayerConfigs.polygon, feature.refid);
                const outlineLayerConfig = createLayerConfig(`${layerId}-outline`, sourceId, outlineStyle, {
                    type: 'line',
                    paint: { 'line-color': '#000000', 'line-width': 1 }
                }, feature.refid);

                if (!map.getLayer(fillLayerConfig.id)) map.addLayer(fillLayerConfig);
                if (!map.getLayer(outlineLayerConfig.id)) map.addLayer(outlineLayerConfig);

                // Ensure both layer IDs are tracked
                if (!layerReferences[feature.formid]) {
                    layerReferences[feature.formid] = { sourceId, layerIds: [] };
                }
                layerReferences[feature.formid].layerIds.push(fillLayerConfig.id, outlineLayerConfig.id);
            } catch (error) {
                console.error('Error in addPolygonLayers:', error);
            }
        };

        const addLineLayer = (feature, sourceId, layerId, customStyles, defaultLayerConfigs, geometry) => {
            try {
                const styleMap = { 'linestring': 'gl-draw-line' };
                const styleId = styleMap[geometry.type.toLowerCase()] || '';
                const customStyle = customStyles.find(style => style.id === styleId) || {};

                const layerConfig = createLayerConfig(layerId, sourceId, customStyle, defaultLayerConfigs[geometry.type.toLowerCase()], feature.refid);

                try {
                    if (!map.getLayer(layerId)) map.addLayer(layerConfig);
                } catch (error) {
                    console.error(`Error adding layer for feature ${feature.refid}:`, error);
                }
            } catch (error) {
                console.error('Error in addLineLayer:', error);
            }
        };

        const addPointLayer = (feature, sourceId, layerId, customStyles, defaultLayerConfigs, geometry) => {
            try {
                const styleMap = { 'point': 'gl-draw-point' };
                const styleId = styleMap[geometry.type.toLowerCase()] || '';
                const customStyle = customStyles.find(style => style.id === styleId) || {};

                if (customStyle.metadata && customStyle.metadata['marker-icon'] !== 'none') {
                    addMarker(feature, customStyle.paint['circle-color'], customStyle.metadata['marker-icon']);
                } else {
                    const layerConfig = createLayerConfig(layerId, sourceId, customStyle, defaultLayerConfigs[geometry.type.toLowerCase()], feature.refid);

                    try {
                        if (!map.getLayer(layerId)) map.addLayer(layerConfig);
                    } catch (error) {
                        console.error(`Error adding layer for feature ${feature.refid}:`, error);
                    }
                }
            } catch (error) {
                console.error('Error in addPointLayer:', error);
            }
        };

        const createCustomMarkerIcon = (color, symbol) => {
            try {
                const img = document.createElement('img');
                img.src = `https://api.geoapify.com/v1/icon/?type=awesome&color=%23${color.slice(1)}&icon=${symbol}&size=small&scaleFactor=2&apiKey=${API_KEYS.GEOAPIFY}`;
                img.alt = 'Marker';
                img.style.width = '35px';
                img.style.height = '50px';
                return img;
            } catch (error) {
                console.error('Error in createCustomMarkerIcon:', error);
                return document.createElement('div'); // Fallback to a simple div
            }
        };

        const addMarker = (feature, color, symbol) => {
            try {
                const geometry = parseGeometry(feature);
                const coordinates = geometry.coordinates;
                const element = createCustomMarkerIcon(color, symbol);
                const offset = [0, -16];
                new maplibregl.Marker({ element, offset })
                    .setLngLat(coordinates)
                    .addTo(map);
            } catch (error) {
                console.error('Error in addMarker:', error);
            }
        };

        const createLayerConfig = (layerId, sourceId, customStyle, defaultConfig, refid) => {
            try {
                if (customStyle.type && customStyle.paint) {
                    return {
                        id: layerId,
                        source: sourceId,
                        type: customStyle.type,
                        paint: customStyle.paint,
                        filter: ['==', 'refid', refid]
                    };
                } else {
                    console.warn(`No valid custom style found for feature ${refid}. Using default.`);
                    return {
                        id: layerId,
                        source: sourceId,
                        ...defaultConfig,
                        filter: ['==', 'refid', refid]
                    };
                }
            } catch (error) {
                console.error('Error in createLayerConfig:', error);
                return {
                    id: layerId,
                    source: sourceId,
                    ...defaultConfig,
                    filter: ['==', 'refid', refid]
                };
            }
        };

        const updateBaseMap = (baseMapValue) => {
            try {
                let newStyle;
                if (baseMapValue === 'maptiler') {
                    newStyle = `https://api.maptiler.com/maps/streets/style.json?key=${API_KEYS.MAPTILER}`;
                } else {
                    const tileUrl = BASE_MAPS[baseMapValue];
                    newStyle = {
                        version: 8,
                        sources: { 'raster-tiles': { type: 'raster', tiles: [tileUrl], tileSize: 256 } },
                        layers: [{ id: 'raster-layer', type: 'raster', source: 'raster-tiles', minzoom: 0, maxzoom: 22 }]
                    };
                }
                map.setStyle(newStyle);

                setTimeout(() => {
                    try {
                        if (features && features.length > 0 && featureType) {
                            addLayerToMap(features, featureType);
                        } else {
                            console.warn('No features or featureType available to re-add layers');
                        }
                    } catch (error) {
                        console.error('Error in setTimeout callback:', error);
                    }
                }, 50);
            } catch (error) {
                console.error('Error in updateBaseMap:', error);
            }
        };

        const fetchAPI = async (url, options = {}) => {
            try {
                const response = await fetch(url, {
                    ...options,
                    headers: { 'Content-Type': 'application/json', ...options.headers }
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP error! status: ${response.status}: ${errorText}`);
                }
                return response.json();
            } catch (error) {
                console.error('Fetch error:', error);
                return { error: true, message: error.message };
            }
        };

        const listLayer = async () => {
            try {
                const response = await fetch('/api/list_layer', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();
                const layerList = document.getElementById('layerList');

                layerList.innerHTML = data.map(layer => `
                    <li class="list-group-item d-flex align-items-center">
                        <input type="checkbox" id="${layer.formid}" layername="${layer.layername}" layertype="${layer.layertype}" class="form-check-input me-2 checkbox">
                        <label for="${layer.formid}" class="form-check-label stretched-link">${layer.layername}</label>
                    </li>`).join('');
            } catch (error) {
                console.error('Error fetching layer list:', error);
            }
        };

        const layerReferences = {};
        let features = [];

        const getFeatures = async (formid, layerName, featureType) => {
            try {
                const [columnsData, featuresData] = await Promise.all([
                    fetchAPI(`/api/v2/load_layer_description/${formid}`),
                    fetchAPI(`/api/v2/load_layer/`, { method: 'POST', body: JSON.stringify({ formid }) })
                ]);

                features = featuresData;

                // Build layers and track them inside addLayerToMap()
                addLayerToMap(featuresData, featureType, formid);

                zoomToLayerExtent(featuresData);

                // Remove or merge any reassignments of layerReferences here
                // so that all added layers (including outlines) remain tracked.
            } catch (error) {
                console.error('Error in getFeatures:', error);
            }
        };


        const removeFeatures = (formid) => {
            try {
                const layerReference = layerReferences[formid];
                if (layerReference) {
                    const { sourceId, layerIds } = layerReference;

                    // Remove all layers associated with this source
                    layerIds.forEach(layerId => {
                        if (map.getLayer(layerId)) {
                            map.removeLayer(layerId);
                        }
                    });

                    // Remove the source only after all layers are removed
                    if (map.getSource(sourceId)) {
                        map.removeSource(sourceId);
                    }

                    // Clean up the reference
                    delete layerReferences[formid];
                }
            } catch (error) {
                console.error('Error in removeFeatures:', error);
            }
        };

        try {

            listLayer();

            document.getElementById('baseMapSelector').addEventListener('change', (e) => {
                try {
                    updateBaseMap(e.target.value);
                } catch (error) {
                    console.error('Error in baseMapSelector change event:', error);
                }
            });

            document.getElementById('layerList').addEventListener('change', event => {
                const checkbox = event.target;

                const inputElement = document.getElementById(checkbox.id);
                const layerName = inputElement.getAttribute("layername");
                const layerType = inputElement.getAttribute("layertype");

                if (checkbox.checked) {
                    getFeatures(checkbox.id, layerName, layerType);
                } else {
                    removeFeatures(checkbox.id);
                }
            });

        } catch (error) {
            console.error('Initialization error:', error);
        }
    } catch (error) {
        console.error('Error in DOMContentLoaded event:', error);
    }
});