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

        let checkedLayers = [];
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

                checkedLayers.forEach(layer => {
                    getFeatures(layer.formid, layer.layerName, layer.layerType);
                });
            } catch (error) {
                console.error('Error in updateBaseMap:', error);
            }
        };

        const defaultLayerConfigs = {
            point: { type: 'circle', paint: { 'circle-radius': 5, 'circle-color': '#FF0000', 'circle-opacity': 0.8, 'circle-stroke-width': 1, 'circle-stroke-color': '#FFFFFF' } },
            linestring: { type: 'line', paint: { 'line-color': '#00FF00', 'line-width': 2 } },
            polygon: { type: 'fill', paint: { 'fill-color': '#0000FF', 'fill-opacity': 0.5 } }
        };

        const layerReferences = {};
        const markerInstances = [];

        const createCustomMarkerIcon = (color, symbol) => {
            const img = document.createElement('img');
            img.src = `https://api.geoapify.com/v1/icon/?type=awesome&color=%23${color.slice(1)}&icon=${symbol}&size=small&scaleFactor=2&apiKey=${API_KEYS.GEOAPIFY}`;
            img.alt = 'Marker';
            img.style.width = '35px';
            img.style.height = '50px';
            return img;
        };

        const addMarker = (feature, color, symbol) => {
            try {
                const geometry = parseGeometry(feature);
                const coordinates = geometry.coordinates;
                const element = createCustomMarkerIcon(color, symbol);
                const marker = new maplibregl.Marker({ element, offset: [0, -16] })
                    .setLngLat(coordinates)
                    .addTo(map);
                markerInstances.push({ ...feature, instance: marker });
            } catch (error) {
                console.error(`Error adding marker for feature ${feature.refid}:`, error);
            }
        };

        const removeMarkers = async (formid) => {
            try {
                markerInstances.forEach(marker => {
                    marker.instance.remove();
                });
            } catch (error) {
                console.error(`Error removing markers for formid ${formid}:`, error);
            }
        };

        const addPointLayer = (feature, sourceId, layerId, customStyles, defaultLayerConfigs, geometry) => {
            try {
                const styleId = 'gl-draw-point';
                const customStyle = customStyles.find(style => style.id === styleId) || {};

                if (customStyle.metadata?.['marker-icon'] && customStyle.metadata['marker-icon'] !== 'none') {
                    const color = customStyle.paint?.['circle-color'] || '#FF0000';
                    const symbol = customStyle.metadata['marker-icon'];
                    addMarker(feature, color, symbol);
                } else {
                    const layerConfig = createLayerConfig(layerId, sourceId, customStyle, defaultLayerConfigs.point, feature.refid);
                    if (!map.getLayer(layerId)) map.addLayer(layerConfig);
                }
            } catch (error) {
                console.error(`Error in addPointLayer for feature ${feature.refid}:`, error);
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

        const addLayerToMap = (features, featureType, formid) => {
            try {
                const sourceId = `features-source-${formid}`;
                if (!map.getSource(sourceId)) {
                    map.addSource(sourceId, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
                }

                const geojsonFeatures = features.map(feature => createGeoJSONFeature(feature));
                map.getSource(sourceId).setData({ type: 'FeatureCollection', features: geojsonFeatures });

                const layerIds = [];

                features.forEach(feature => {
                    const geometry = parseGeometry(feature);
                    const layerId = `feature-layer-${feature.refid}`;
                    const customStyles = parseCustomStyles(feature);

                    if (geometry.type.toLowerCase() === 'polygon') {
                        addPolygonLayers(feature, sourceId, layerId, customStyles, defaultLayerConfigs);
                        layerIds.push(layerId, `${layerId}-outline`);
                    } else if (geometry.type.toLowerCase() === 'linestring') {
                        addLineLayer(feature, sourceId, layerId, customStyles, defaultLayerConfigs, geometry);
                        layerIds.push(layerId);
                    } else {
                        addPointLayer(feature, sourceId, layerId, customStyles, defaultLayerConfigs, geometry);
                        layerIds.push(layerId);
                    }
                });

                layerReferences[formid] = { sourceId, layerIds };
            } catch (error) {
                console.error(`Error in addLayerToMap for formid ${formid}:`, error);
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

        const createLayerConfig = (layerId, sourceId, customStyle, defaultConfig, refid) => {
            const layerConfig = {
                id: layerId,
                source: sourceId,
                filter: ['==', 'refid', refid]
            };

            if (customStyle.type && customStyle.paint) {
                layerConfig.type = customStyle.type;
                layerConfig.paint = customStyle.paint;
            } else {
                console.warn(`No valid custom style found for feature ${refid}. Using default.`);
                Object.assign(layerConfig, defaultConfig);
            }

            return layerConfig;
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

        const listLayer = async () => {
            try {
                const response_division = await fetch('/api/v2/divisions', { method: 'GET' });
                if (!response_division.ok) {
                    throw new Error('Network response was not ok');
                }
                const data_division = await response_division.json();
                document.getElementById('divisionCount').textContent = data_division.length + ' หน่วยงาน';

                const response_layer = await fetch('/api/list_layer', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response_layer.ok) {
                    throw new Error('Network response_layer was not ok');
                }

                const data_layer = await response_layer.json();
                document.getElementById('layerCount').textContent = data_layer.length + ' ชั้นข้อมูล';

                const layerList = document.getElementById('layerList');

                layerList.innerHTML = data_layer.map(layer => `
                    <li class="list-group-item d-flex align-items-center">
                        <input type="checkbox" id="${layer.formid}" layername="${layer.layername}" layertype="${layer.layertype}" class="form-check-input me-2 checkbox">
                        <label for="${layer.formid}" class="form-check-label stretched-link">${layer.layername}</label>
                    </li>`).join('');
            } catch (error) {
                console.error('Error fetching layer list:', error);
            }
        };

        const removeFeatures = (formid) => {
            try {
                const layerReference = layerReferences[formid];
                if (layerReference) {
                    const { sourceId, layerIds } = layerReference;
                    layerIds.forEach(layerId => {
                        if (map.getLayer(layerId)) map.removeLayer(layerId);
                    });
                    if (map.getSource(sourceId)) map.removeSource(sourceId);
                    delete layerReferences[formid];
                }
                removeMarkers(formid);
            } catch (error) {
                console.error(`Error removing features for formid ${formid}:`, error);
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

        const getFeatures = async (formid, layerName, featureType) => {
            try {
                const [featuresData] = await Promise.all([
                    fetchAPI(`/api/v2/load_layer/`, { method: 'POST', body: JSON.stringify({ formid }) }),
                ]);

                addLayerToMap(featuresData, featureType, formid);
                zoomToLayerExtent(featuresData);
            } catch (error) {
                console.error(`Error fetching features for formid ${formid}:`, error);
            }
        };

        const addLayerSelect = (checkboxId, checkboxName) => {
            const layerSelect = document.getElementById('layerSelect');
            if (![...layerSelect.options].some(opt => opt.value === checkboxId)) {
                layerSelect.appendChild(new Option(checkboxName, checkboxId));
            }
        };

        const removeLayerSelect = (checkboxId) => {
            const layerSelect = document.getElementById('layerSelect');
            const option = [...layerSelect.options].find(opt => opt.value === checkboxId);
            if (option) layerSelect.removeChild(option);
        }

        const loadColumnList = async (formid) => {
            try {
                if ($.fn.DataTable.isDataTable('#table')) {
                    $('#table').DataTable().destroy();
                    document.getElementById('table').innerHTML = '';
                }

                const columnsResponse = await fetch('/api/load_column_description', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ formid }),
                });
                const columnsData = await columnsResponse.json();

                const tb = `<th>Zoom</th>` + columnsData.map(i => `<th>${i.col_name}</th>`).join('');
                const col = [{
                    "data": "refid",
                    "title": "Zoom", // Set the column header name to "Zoom"
                    "render": function (data, type, row) {
                        return `<button class="btn btn-sm btn-primary zoom-btn" data-refid="${data}">Zoom</button>`;
                    },
                    "className": "text-center"
                }].concat(columnsData.map(i => ({ 'data': i.col_id, })));

                document.getElementById('table').innerHTML = `<thead><tr>${tb}</tr></thead><tbody></tbody>`;

                const layerResponse = await fetch('/api/load_layer', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ formid }),
                });
                const layerData = await layerResponse.json();

                const table = $('#table').DataTable({
                    data: layerData,
                    columns: col,
                    scrollX: true,
                    autoWidth: true,
                });

                $('#table tbody').on('click', '.zoom-btn', function () {
                    const refid = $(this).data('refid');
                    zoomToFeature(refid, formid, layerData);
                });

                currentFormId = formid;
            } catch (error) {
                console.error('Failed to load column list:', error);
            }
        };

        let popup = null; // Store the popup instance globally

        const togglePopup = (data, popupContent) => {
            // If a popup already exists, remove it and set the variable to null
            if (popup) {
                popup.remove();
                popup = null;
                // return; 
            }

            // Create and add a new popup
            if (data.type === 'Point') {
                map.flyTo({
                    center: data.coordinates,
                    zoom: 18,
                    essential: true
                });

                popup = new maplibregl.Popup({ offset: 10 })
                    .setLngLat(data.coordinates)
                    .setHTML(popupContent)
                    .addTo(map);

            } else if (data.type === 'Polygon' || data.type === 'LineString') {
                const bbox = turf.bbox(data);
                map.fitBounds(bbox, { padding: 50 });

                const center = turf.centerOfMass(data).geometry.coordinates;

                popup = new maplibregl.Popup({ offset: 10 })
                    .setLngLat(center)
                    .setHTML(popupContent)
                    .addTo(map);
            }
        };

        const zoomToFeature = (refid, formid, featureData) => {
            const feature = featureData.find(f => f.refid === refid);
            if (!feature || !feature.geojson) return;

            const data = JSON.parse(feature.geojson);
            let popupContent = `<strong>Reference ID:</strong> ${refid}<br>`;

            Object.entries(feature).forEach(([key, value]) => {
                if (key !== 'geojson' && key !== 'refid') {
                    popupContent += `<strong>${key}:</strong> ${value}<br>`;
                }
            });

            togglePopup(data, "popupContent")
        };

        await listLayer();

        document.getElementById('baseMapSelector').addEventListener('change', (e) => {
            updateBaseMap(e.target.value);
        });

        document.getElementById('layerSelect').addEventListener('change', event => {
            loadColumnList(event.target.value);
        });

        document.getElementById('layerList').addEventListener('change', event => {
            const checkbox = event.target;
            if (!checkbox.matches('.checkbox')) return; // Ensure event is from checkbox

            const inputElement = document.getElementById(checkbox.id);
            const layerName = inputElement.getAttribute('layername');
            const layerType = inputElement.getAttribute('layertype');

            if (checkbox.checked) {
                checkedLayers.push({ formid: checkbox.id, layerName, layerType });
                getFeatures(checkbox.id, layerName, layerType);
                addLayerSelect(checkbox.id, layerName);
            } else {
                checkedLayers = checkedLayers.filter(layer => layer.formid !== checkbox.id);
                removeFeatures(checkbox.id);
                removeLayerSelect(checkbox.id);
            }
        });

    } catch (error) {
        console.error('Error in DOMContentLoaded event:', error);
    }
});