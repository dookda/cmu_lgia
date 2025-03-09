document.addEventListener('DOMContentLoaded', async () => {
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
        center: [0, 0],
        zoom: 1,
        pitch: 0,
        antialias: true
    };

    const map = new maplibregl.Map(MAP_CONFIG);
    map.addControl(new maplibregl.NavigationControl());

    let marker = null;
    let draw;
    let existingFeatures = null;
    const offset = [0, -16];

    const fetchAPI = async (url, options = {}) => {
        const response = await fetch(url, {
            ...options,
            headers: { 'Content-Type': 'application/json', ...options.headers }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    };

    const updateFeatureStyle = async (formid, refid, style) => {
        const response = await fetch(`/api/v2/update_feature_style`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ formid, refid, style })
        });
        if (!response.ok) throw new Error(`Failed to update feature style: ${response.status}`);
        return response.json();
    };

    const updateFeatureGeojson = async (formid, refid, geojson, style) => {
        const response = await fetch(`/api/v2/update_feature`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ formid, refid, geojson, style })
        });
        if (!response.ok) throw new Error(`Failed to update feature geojson: ${response.status}`);
        return response.json();
    };

    const createCustomMarkerIcon = (color, symbol) => {
        const img = document.createElement('img');
        img.src = `https://api.geoapify.com/v1/icon/?type=awesome&color=%23${color}&icon=${symbol}&size=small&scaleFactor=2&apiKey=${API_KEYS.GEOAPIFY}`;
        img.alt = 'Marker';
        img.style.width = '35px';
        img.style.height = '50px';
        return img;
    };

    const updateMarker = (coordinates, currentStyles) => {
        const selectedIcon = getMarkerIconFromStyles(currentStyles);
        const color = document.getElementById('point-color').value.slice(1);
        if (marker) marker.remove();
        const markerIcon = createCustomMarkerIcon(color, selectedIcon);
        marker = new maplibregl.Marker({ element: markerIcon, offset })
            .setLngLat(coordinates)
            .addTo(map);
    };

    const calculateBounds = (features) => {
        const bounds = new maplibregl.LngLatBounds();
        features.features.forEach(feature => {
            const geom = feature.geometry;
            if (geom.type === 'Point') bounds.extend(geom.coordinates);
            else if (geom.type === 'LineString') geom.coordinates.forEach(coord => bounds.extend(coord));
            else if (geom.type === 'Polygon') geom.coordinates[0].forEach(coord => bounds.extend(coord));
        });
        return bounds;
    };

    const getCustomStyles = () => {
        const selectedIcon = document.getElementById('marker-icon').value;
        return [
            {
                id: 'gl-draw-point',
                type: 'circle',
                filter: ['all', ['==', '$type', 'Point']],
                paint: {
                    'circle-radius': parseInt(document.getElementById('point-radius').value),
                    'circle-color': document.getElementById('point-color').value,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#FFFFFF'
                },
                metadata: { 'marker-icon': selectedIcon }
            },
            {
                id: 'gl-draw-line',
                type: 'line',
                filter: ['all', ['==', '$type', 'LineString']],
                paint: {
                    'line-color': document.getElementById('line-color').value,
                    'line-width': parseInt(document.getElementById('line-width').value)
                }
            },
            {
                id: 'gl-draw-polygon',
                type: 'fill',
                filter: ['all', ['==', '$type', 'Polygon']],
                paint: {
                    'fill-color': document.getElementById('polygon-color').value,
                    'fill-opacity': parseFloat(document.getElementById('polygon-opacity').value)
                }
            },
            {
                id: 'gl-draw-polygon-outline',
                type: 'line',
                filter: ['all', ['==', '$type', 'Polygon']],
                paint: {
                    'line-color': document.getElementById('line-color').value,
                    'line-width': parseInt(document.getElementById('line-width').value)
                }
            }
        ];
    };

    const getMarkerIconFromStyles = (styles) => {
        if (!Array.isArray(styles)) return 'map-marker';
        const pointStyle = styles.find(s => s.id === 'gl-draw-point');
        return pointStyle?.metadata?.['marker-icon'] || 'map-marker';
    };

    const updateBaseMap = (baseMapValue) => {
        let newStyle;
        if (baseMapValue === 'maptiler') {
            newStyle = `https://api.maptiler.com/maps/streets/style.json?key=${API_KEYS.MAPTILER}`;
        } else {
            let tileUrl;
            switch (baseMapValue) {
                case 'osm': tileUrl = BASE_MAPS.osm; break;
                case 'grod': tileUrl = BASE_MAPS.grod; break;
                case 'gsat': tileUrl = BASE_MAPS.gsat; break;
                case 'ghyb': tileUrl = BASE_MAPS.ghyb; break;
            }
            newStyle = {
                version: 8,
                sources: {
                    'raster-tiles': {
                        type: 'raster',
                        tiles: [tileUrl],
                        tileSize: 256,
                    }
                },
                layers: [{
                    id: 'raster-layer',
                    type: 'raster',
                    source: 'raster-tiles',
                    minzoom: 0,
                    maxzoom: 22
                }]
            };
        }

        const center = map.getCenter();
        const zoom = map.getZoom();
        const bearing = map.getBearing();
        const pitch = map.getPitch();

        map.setStyle(newStyle);
        map.once('style.load', () => {
            map.setCenter(center);
            map.setZoom(zoom);
            map.setBearing(bearing);
            map.setPitch(pitch);

            const features = draw.getAll();
            if (features.features.length > 0) {
                draw.deleteAll();
                draw.add(features);
            }
        });
    };

    const generateFormFields = (columnsData, rowData, formid, refid) => {
        const formContainer = document.getElementById('formContainer');
        formContainer.innerHTML = '';
        columnsData.forEach(column => {
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';
            const label = document.createElement('label');
            label.textContent = column.col_name;
            label.setAttribute('for', column.col_id);
            const input = document.createElement('input');
            input.id = column.col_id;
            input.name = column.col_id;
            input.className = 'form-control';
            input.placeholder = column.col_desc;
            input.type = { text: 'text', numeric: 'number', date: 'date' }[column.col_type] || 'text';
            if (rowData?.[column.col_id] !== undefined) {
                input.value = column.col_type === 'date' && rowData[column.col_id]
                    ? new Date(rowData[column.col_id]).toISOString().split('T')[0]
                    : rowData[column.col_id];
            }
            formGroup.append(label, input);
            formContainer.appendChild(formGroup);
        });
        const saveButton = document.createElement('button');
        saveButton.textContent = 'Save';
        saveButton.className = 'btn btn-primary';
        saveButton.addEventListener('click', () => updateData(formid, refid));
        formContainer.appendChild(saveButton);
    };

    const updateData = async (formid, refid) => {
        try {
            const formData = Object.fromEntries(
                Array.from(document.getElementById('formContainer').querySelectorAll('input, select, textarea'))
                    .map(input => [input.name, input.value])
            );
            await fetchAPI(`/api/v2/update_row/${formid}/${refid}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });
            alert('Data updated successfully!');
        } catch (error) {
            console.error('Error updating data:', error);
            alert('Failed to update data.');
        }
    };

    const initDraw = (styles) => {
        // Ensure styles is always an array
        if (!Array.isArray(styles)) {
            console.warn('Styles is not an array. Defaulting to empty array.');
            styles = [];
        }

        return new MapboxDraw({
            displayControlsDefault: false,
            controls: {
                point: type === 'Point',
                line_string: type === 'LineString',
                polygon: type === 'Polygon',
                trash: false
            },
            styles: styles
        });
    };

    const urlParams = new URLSearchParams(window.location.search);
    const formid = urlParams.get('formid');
    const refid = urlParams.get('refid');
    const type = urlParams.get('type');

    // Set display to block for the div with id == type
    if (type) {
        const divToShow = document.getElementById(type);
        if (divToShow) {
            divToShow.style.display = "block";
        }
    }

    // Fetch and parse style data
    let styleData = await fetchAPI(`/api/v2/load_feature_style/${formid}/${refid}`);
    let json = [];
    if (styleData && styleData.style) {
        try {
            const parsed = JSON.parse(styleData.style);
            json = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error('Error parsing style JSON:', e);
        }
    }

    // Fill json with default styles if empty or incomplete
    json[0] = json[0] || {
        id: 'gl-draw-point',
        type: 'circle',
        filter: ['all', ['==', '$type', 'Point']],
        paint: { 'circle-color': '#FF0000', 'circle-radius': 4, 'circle-stroke-width': 2, 'circle-stroke-color': '#FFFFFF' },
        metadata: { 'marker-icon': 'map-marker' }
    };
    json[1] = json[1] || {
        id: 'gl-draw-line',
        type: 'line',
        filter: ['all', ['==', '$type', 'LineString']],
        paint: { 'line-color': '#00FF00', 'line-width': 2 }
    };
    json[2] = json[2] || {
        id: 'gl-draw-polygon',
        type: 'fill',
        filter: ['all', ['==', '$type', 'Polygon']],
        paint: { 'fill-color': '#0000FF', 'fill-opacity': 0.5 }
    };
    json[3] = json[3] || {
        id: 'gl-draw-polygon-outline',
        type: 'line',
        filter: ['all', ['==', '$type', 'Polygon']],
        paint: { 'line-color': '#00FF00', 'line-width': 2 }
    };

    // Update form inputs based on json
    document.getElementById('point-color').value = json[0].paint['circle-color'] || '#FF0000';
    document.getElementById('point-radius').value = json[0].paint['circle-radius'] || 4;
    document.getElementById('line-color').value = json[1].paint['line-color'] || '#00FF00';
    document.getElementById('line-width').value = json[1].paint['line-width'] || 2;
    document.getElementById('polygon-color').value = json[2].paint['fill-color'] || '#0000FF';
    document.getElementById('polygon-opacity').value = json[2].paint['fill-opacity'] || 0.5;
    document.getElementById('marker-icon').value = getMarkerIconFromStyles(json);

    // Initialize draw with validated styles
    draw = initDraw(json);
    map.addControl(draw);

    const [columnsData, featuresData] = await Promise.all([
        fetchAPI(`/api/v2/load_layer_description/${formid}`),
        fetchAPI(`/api/v2/load_layer/${formid}/${refid}`)
    ]);
    generateFormFields(columnsData, featuresData[0], formid, refid);

    document.getElementById('baseMapSelector').addEventListener('change', (e) => {
        updateBaseMap(e.target.value);
    });

    document.getElementById('searchLatLng')?.addEventListener('submit', e => {
        e.preventDefault();
        const lat = parseFloat(document.getElementById('latitude').value);
        const lng = parseFloat(document.getElementById('longitude').value);
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return alert('Please enter valid latitude (-90 to 90) and longitude (-180 to 180) values.');
        }
        map.flyTo({ center: [lng, lat], zoom: 15 });
        new maplibregl.Marker().setLngLat([lng, lat]).addTo(map);
    });

    document.getElementById('clear-marker')?.addEventListener('click', () => {
        document.querySelectorAll('.maplibregl-marker').forEach(m => m.remove());
        ['latitude', 'longitude'].forEach(id => document.getElementById(id).value = '');
    });

    document.getElementById('styleForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentStyles = getCustomStyles();
        const stylesJson = JSON.stringify(currentStyles, null, 2);
        try {
            await updateFeatureStyle(formid, refid, stylesJson);
        } catch (error) {
            console.error('Error updating feature style:', error);
        }
        const currentFeatures = draw.getAll();
        map.removeControl(draw);
        draw = initDraw(currentStyles);
        map.addControl(draw);
        if (currentFeatures.features.length > 0) {
            draw.add(currentFeatures);
            if (type === 'Point' && currentFeatures.features[0]) {
                updateMarker(currentFeatures.features[0].geometry.coordinates, currentStyles);
            }
        } else if (existingFeatures) {
            draw.add(existingFeatures);
        }
    });

    let selectedMarkerIcon = 'map-marker';

    const markerIcons = [
        "map-marker", "star", "home", "car", "tree", "flag", "heart", "user",
        "lock", "phone", "bell", "camera", "coffee", "envelope", "gift", "plane",
        "rocket", "shopping-cart", "tag", "thumbs-up", "trophy", "truck", "umbrella",
        "wrench", "anchor", "bicycle", "bolt", "cloud", "globe", "leaf"
    ];

    const populateMarkerPanel = () => {
        const markerPanel = document.getElementById("marker-panel");
        markerPanel.innerHTML = '';

        markerIcons.forEach(icon => {
            const color = document.getElementById('point-color').value.slice(1);
            const iconImg = createCustomMarkerIcon(color, icon);
            iconImg.classList.add("marker-icon-option");
            iconImg.style.cursor = "pointer";
            iconImg.style.border = "2px solid transparent";
            iconImg.style.padding = "2px";

            if (icon === selectedMarkerIcon) {
                // iconImg.style.borderColor = "blue";
            }

            iconImg.addEventListener('click', () => {
                selectedMarkerIcon = icon;
                document.querySelectorAll(".marker-icon-option").forEach(el => {
                    el.style.borderColor = "transparent";
                });
                iconImg.style.borderColor = "blue";
            });

            markerPanel.appendChild(iconImg);
        });
    };

    populateMarkerPanel();
    document.getElementById('point-color').addEventListener('change', populateMarkerPanel);

    map.on('load', async () => {
        try {
            const featureData = await fetchAPI(`/api/v2/load_layer/${formid}/${refid}`);
            let geojsonData;
            if (Array.isArray(featureData) && featureData.length && featureData[0].geojson) {
                const parsed = JSON.parse(featureData[0].geojson);
                geojsonData = (parsed.type === 'Polygon' || parsed.type === 'Point' || parsed.type === 'LineString')
                    ? { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: parsed, properties: {} }] }
                    : parsed;
            } else if (featureData.features) {
                geojsonData = featureData;
            } else {
                throw new Error('Unexpected API response structure');
            }
            if (!geojsonData || !Array.isArray(geojsonData.features)) {
                throw new Error(`Invalid GeoJSON structure: ${JSON.stringify(geojsonData)}`);
            }
            existingFeatures = geojsonData;
            draw.add(existingFeatures);
            if (existingFeatures.features.length > 0) {
                const bounds = calculateBounds(existingFeatures);
                if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 50 });
                if (type === 'Point') {
                    updateMarker(existingFeatures.features[0].geometry.coordinates, json);
                }
            }
        } catch (error) {
            console.error('Error loading default features:', error);
        }

        const handleDrawEvent = async (e) => {
            const currentStyles = getCustomStyles();
            const styleJson = JSON.stringify(currentStyles);
            const geojsonJson = JSON.stringify(e.features[0].geometry);
            try {
                await updateFeatureGeojson(formid, refid, geojsonJson, styleJson);
                if (type === 'Point') {
                    updateMarker(e.features[0].geometry.coordinates, currentStyles);
                }
            } catch (error) {
                console.error('Error updating feature on draw event:', error);
            }
        };

        map.on('draw.create', async (e) => {
            const allFeatures = draw.getAll();
            allFeatures.features.forEach(feature => {
                if (!e.features.some(newFeature => newFeature.id === feature.id)) {
                    draw.delete(feature.id);
                }
            });
            await handleDrawEvent(e);
        });
        map.on('draw.update', handleDrawEvent);
        map.on('draw.delete', () => {
            if (type === 'Point' && marker) {
                marker.remove();
                marker = null;
            }
        });
    });
});