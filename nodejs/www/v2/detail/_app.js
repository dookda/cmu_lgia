// Constants
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
    zoom: 15.5,
    pitch: 0,
    antialias: true
};

const MARKER_ICONS = [
    'map-marker', 'map-pin', 'location-arrow', 'crosshairs', 'compass', 'street-view',
    'road', 'flag', 'flag-checkered', 'building', 'home', 'hospital', 'school',
    'coffee', 'car', 'bus', 'train', 'bicycle', 'ship', 'plane', 'rocket'
];

// Global Variables
const map = new maplibregl.Map(MAP_CONFIG);
const featuresMeta = new Map();
let drawControl;

// Utility Functions
const rgbToHex = rgb => {
    if (!rgb) return '#007cbf';
    const [, ...rgbValues] = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(rgb) || [];
    return rgbValues.length ? `#${rgbValues.map(v => parseInt(v).toString(16).padStart(2, '0')).join('')}` : rgb;
};

const fetchAPI = async (url, options = {}) => {
    const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};

// Map Layer Management
const addRasterLayer = (id, url) => {
    if (id === 'maptiler' || map.getSource(id)) return;
    map.addSource(id, { type: 'raster', tiles: [url], tileSize: 256 });
    map.addLayer({ id, type: 'raster', source: id, layout: { visibility: 'none' } });
};

const switchBaseMap = selectedLayer => {
    [...Object.keys(BASE_MAPS), 'maptiler'].forEach(layer =>
        map.setLayoutProperty(layer, 'visibility', layer === selectedLayer ? 'visible' : 'none')
    );
};

// Feature Management
const bindFeatureEvents = refid => {
    map.on('click', refid, e => {
        filterDataTableByRefId(refid);
        new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`<b>Feature ID:</b> ${refid}<br>`)
            .addTo(map);
    });
    map.on('mouseenter', refid, () => map.getCanvas().style.cursor = 'pointer');
    map.on('mouseleave', refid, () => map.getCanvas().style.cursor = '');
};

const openEditModal = (refid, type) => {
    const modalConfig = {
        Point: ['pointFields', { markerColor: '#007cbf', markerSymbol: 'map-marker', markerSize: 30 }],
        LineString: ['lineFields', { lineColor: '#ff0000', lineWidth: 3, lineDash: '' }],
        Polygon: ['polygonFields', { fillColor: '#00ff00', fillOpacity: 0.5, polygonBorderColor: '#000000', polygonBorderWidth: 2, polygonBorderDash: '' }]
    };

    ['featureId', 'featureType'].forEach((id, i) => document.getElementById(id).value = [refid, type][i]);
    Object.entries(modalConfig).forEach(([key, [field]]) =>
        document.getElementById(field).style.display = key === type ? 'block' : 'none'
    );

    const feature = featuresMeta.get(refid);
    if (!feature) return;

    const updateField = (id, value) => document.getElementById(id).value = value;
    if (type === 'Point' && feature.marker) {
        const markerEl = feature.marker.getElement();
        updateField('markerColor', rgbToHex(markerEl.style.backgroundColor));
        updateField('markerSymbol', markerEl.dataset.icon || 'map-marker'); // Store icon in dataset
        updateField('markerSize', parseInt(window.getComputedStyle(markerEl).fontSize) || 30);
    } else if (type === 'LineString') {
        updateField('lineColor', map.getPaintProperty(refid, 'line-color') || '#ff0000');
        updateField('lineWidth', map.getPaintProperty(refid, 'line-width') || 3);
        updateField('lineDash', (map.getPaintProperty(refid, 'line-dasharray') || []).join(','));
    } else if (type === 'Polygon') {
        updateField('fillColor', map.getPaintProperty(refid, 'fill-color') || '#00ff00');
        updateField('fillOpacity', map.getPaintProperty(refid, 'fill-opacity') || 0.5);
        updateField('polygonBorderColor', map.getPaintProperty(`${refid}_border`, 'line-color') || '#000000');
        updateField('polygonBorderWidth', map.getPaintProperty(`${refid}_border`, 'line-width') || 2);
        updateField('polygonBorderDash', (map.getPaintProperty(`${refid}_border`, 'line-dasharray') || []).join(','));
    }
};

const applyStyleToFeature = (refid, type, values) => {
    const feature = featuresMeta.get(refid);
    if (type === 'Point' && feature?.marker) {
        const marker = feature.marker;
        marker.remove();
        const coordinates = [marker._lngLat.lng, marker._lngLat.lat];
        const markerEl = document.createElement('div');
        markerEl.style.cursor = 'pointer';
        markerEl.dataset.icon = values.markerSymbol; // Store icon for later retrieval

        const offset = values.markerType === 'simple' ? [0, -16] : [0, 0];
        if (values.markerType === 'simple') {
            const color = values.markerColor.replace('#', '');
            markerEl.innerHTML = `<img src="https://api.geoapify.com/v1/icon/?type=awesome&color=%23${color}&icon=${values.markerSymbol}&size=small&scaleFactor=2&apiKey=${API_KEYS.GEOAPIFY}" alt="Marker" style="width:35px;height:50px;display:block;">`;
            markerEl.style.border = `${values.markerBorderWidth || 0}px solid ${values.markerBorderColor || '#000'}`;
        } else {
            markerEl.innerHTML = values.markerSymbol;
            markerEl.style.cssText = `font-size:${values.markerSize}px;line-height:${values.markerSize}px;background-color:transparent;border:none`;
        }

        const newMarker = new maplibregl.Marker({ element: markerEl, offset })
            .setLngLat(coordinates)
            .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`<b>Feature ID:</b> ${refid}<br>`))
            .addTo(map);
        newMarker.getElement().addEventListener('click', () => filterDataTableByRefId(refid));
        featuresMeta.set(refid, { ...feature, marker: newMarker });
    } else if (type === 'LineString') {
        map.setPaintProperty(refid, 'line-color', values.lineColor);
        map.setPaintProperty(refid, 'line-width', parseFloat(values.lineWidth));
        map.setPaintProperty(refid, 'line-dasharray', values.lineDash ? values.lineDash.split(',').map(Number) : null);
    } else if (type === 'Polygon') {
        map.setPaintProperty(refid, 'fill-color', values.fillColor);
        map.setPaintProperty(refid, 'fill-opacity', parseFloat(values.fillOpacity));
        map.setPaintProperty(`${refid}_border`, 'line-color', values.polygonBorderColor);
        map.setPaintProperty(`${refid}_border`, 'line-width', parseFloat(values.polygonBorderWidth));
        map.setPaintProperty(`${refid}_border`, 'line-dasharray', values.polygonBorderDash ? values.polygonBorderDash.split(',').map(Number) : []);
    }
};

const extractCoordinates = (geometry, allCoords) => {
    if (!geometry?.type) return console.error('Invalid geometry:', geometry);
    const { type, coordinates } = geometry;
    if (type === 'Point') allCoords.push(coordinates);
    else if (type === 'LineString') coordinates.forEach(coord => allCoords.push(coord));
    else if (type === 'Polygon') coordinates.forEach(ring => ring.forEach(coord => allCoords.push(coord)));
};

const addFeatureToMap = (feature, map, draw, featuresMeta, allCoords) => {
    const { geojson, refid, style } = feature;
    const defaultStyle = {
        markerType: 'simple', markerColor: '#007cbf', markerSymbol: 'map-marker', markerSize: '12',
        lineColor: '#ff0000', lineWidth: 3, lineDash: [1, 0],
        fillColor: '#00ff00', fillOpacity: 0.5, polygonBorderColor: '#000000', polygonBorderDash: '', polygonBorderWidth: 2
    };
    const appliedStyle = style ? { ...defaultStyle, ...(typeof style === 'string' ? JSON.parse(style) : style) } : defaultStyle;

    let geometry;
    if (typeof geojson === 'string') {
        try {
            geometry = JSON.parse(geojson || '{}');
        } catch (error) {
            console.error(`Invalid JSON string for refid ${refid}:`, geojson, error);
            return;
        }
    } else if (geojson && typeof geojson === 'object') {
        geometry = geojson;
    } else {
        console.error(`Invalid geojson for refid ${refid}:`, geojson);
        return;
    }

    if (!geometry.type) return console.error(`Invalid geometry for refid ${refid}:`, geometry);

    extractCoordinates(geometry, allCoords);

    if (geometry.type === 'Point') {
        addPointFeature(refid, geometry, appliedStyle, map, featuresMeta);
    } else {
        addLineOrPolygonFeature(refid, geometry, appliedStyle, map, featuresMeta);
    }

    draw.deleteAll();
    draw.add({ type: 'Feature', geometry, properties: { refid, style: appliedStyle } });
};

const addPointFeature = (refid, geometry, style, map, featuresMeta) => {
    featuresMeta.set(refid, featuresMeta.get(refid) || {});
    const newMarkerEl = document.createElement('div');
    newMarkerEl.style.cursor = 'pointer';
    newMarkerEl.dataset.icon = style.markerSymbol;

    const offset = style.markerType === 'simple' ? [0, -16] : [0, 0];
    if (style.markerType === 'simple') {
        const color = style.markerColor.replace('#', '');
        newMarkerEl.innerHTML = `<img src="https://api.geoapify.com/v1/icon/?type=awesome&color=%23${color}&icon=${style.markerSymbol}&size=small&scaleFactor=2&apiKey=${API_KEYS.GEOAPIFY}" alt="Marker" style="width:33px;height:50px;display:block;">`;
        newMarkerEl.style.border = `${style.markerBorderWidth || 0}px solid ${style.markerBorderColor || '#000'}`;
    } else {
        newMarkerEl.innerHTML = style.markerSymbol;
        newMarkerEl.style.cssText = `font-size:${style.markerSize}px;line-height:${style.markerSize}px`;
    }

    const marker = new maplibregl.Marker({ element: newMarkerEl, offset })
        .setLngLat(geometry.coordinates)
        .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`<b>Feature ID:</b> ${refid}<br>`))
        .addTo(map);

    marker.getElement().addEventListener('click', () => filterDataTableByRefId(refid));
    featuresMeta.set(refid, { ...featuresMeta.get(refid), marker });
};

const addLineOrPolygonFeature = (refid, geometry, style, map, featuresMeta) => {
    if (!map.getSource(refid)) {
        map.addSource(refid, { type: 'geojson', data: { type: 'Feature', geometry } });
    }

    if (!map.getLayer(refid)) {
        const layerConfig = geometry.type === 'LineString'
            ? {
                id: refid, type: 'line', source: refid,
                paint: {
                    'line-color': style.lineColor, 'line-width': Number(style.lineWidth),
                    'line-dasharray': Array.isArray(style.lineDash) ? style.lineDash : style.lineDash.split(',').map(Number)
                }
            }
            : {
                id: refid, type: 'fill', source: refid,
                paint: { 'fill-color': style.fillColor, 'fill-opacity': Number(style.fillOpacity) }
            };
        map.addLayer(layerConfig);
        bindFeatureEvents(refid);
    }

    if (geometry.type === 'Polygon' && !map.getLayer(`${refid}_border`)) {
        map.addLayer({
            id: `${refid}_border`, type: 'line', source: refid,
            paint: {
                'line-color': style.polygonBorderColor, 'line-width': Number(style.polygonBorderWidth),
                'line-dasharray': style.polygonBorderDash ? style.polygonBorderDash.split(',').map(Number) : []
            }
        });
    }
    featuresMeta.set(refid, { type: geometry.type });
};

// Data Management
const filterDataTableByRefId = refid => $('#dataTable').DataTable().search(refid).draw();

const reloadFeatures = async (formid, refid) => {
    try {
        const features = await fetchAPI(`/api/v2/load_layer/${formid}/${refid}`);
        if (!features?.length) {
            console.warn('No features found.');
            return;
        }

        const allCoords = [];
        features.forEach(feature => addFeatureToMap(feature, map, drawControl, featuresMeta, allCoords));

        if (allCoords.length) {
            const [minLng, minLat, maxLng, maxLat] = allCoords.reduce(([minX, minY, maxX, maxY], [x, y]) => [
                Math.min(minX, x), Math.min(minY, y), Math.max(maxX, x), Math.max(maxY, y)
            ], [Infinity, Infinity, -Infinity, -Infinity]);
            map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 20, duration: 1000 });
        }
    } catch (error) {
        console.error('Failed to reload features:', error);
    }
};

const getFeatures = async (formid, refid, type) => {
    window.currentFormId = formid;
    const allCoords = [];

    try {
        // Clear all existing features first
        featuresMeta.forEach((feature, ref) => {
            if (feature.marker) feature.marker.remove();
            if (map.getLayer(ref)) map.removeLayer(ref);
            if (map.getSource(ref)) map.removeSource(ref);
            featuresMeta.delete(ref);
        });

        const [columnsData, featuresData] = await Promise.all([
            fetchAPI(`/api/v2/load_layer_description/${formid}`),
            fetchAPI(`/api/v2/load_layer/${formid}/${refid}`)
        ]);

        generateFormFields(columnsData, featuresData[0], formid, refid);

        const features = featuresData.filter(f => f.geojson != null).map(f => ({ ...f }));
        if (!features.length) {
            console.warn('No valid features found.');
            return;
        }

        const firstFeatureType = features[0].geojson.type;
        console.log('Features:', firstFeatureType);

        // Remove existing draw control if it exists
        if (drawControl) {
            map.removeControl(drawControl);
        }

        drawControl = new MapboxDraw({
            displayControlsDefault: false,
            controls: {
                point: type === 'Point',
                line_string: type === 'LineString',
                polygon: type === 'Polygon',
                trash: false
            }
        });
        map.addControl(drawControl);

        // Remove existing event listeners to prevent duplicates
        map.off('draw.create', handleFeatureCreation);
        map.off('draw.update', handleFeatureUpdate);

        // Add fresh event listeners
        map.on('draw.create', e => handleFeatureCreation(e, map, drawControl, formid, refid, featuresMeta));
        map.on('draw.update', e => handleFeatureUpdate(e, map, formid, refid));

        features.forEach(feature => addFeatureToMap(feature, map, drawControl, featuresMeta, allCoords));

        if (allCoords.length) {
            const [minLng, minLat, maxLng, maxLat] = allCoords.reduce(([minX, minY, maxX, maxY], [x, y]) => [
                Math.min(minX, x), Math.min(minY, y), Math.max(maxX, x), Math.max(maxY, y)
            ], [Infinity, Infinity, -Infinity, -Infinity]);
            map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 20, duration: 1000 });
        }
    } catch (error) {
        console.error('Failed to get features:', error);
    }
};

const handleFeatureCreation = (e, map, draw, formid, refid, featuresMeta) => {
    const style = {
        markerType: 'simple', markerColor: '#007cbf', markerSymbol: 'map-marker', markerSize: '12',
        lineColor: '#ff0000', lineWidth: 3, lineDash: [1, 0],
        fillColor: '#00ff00', fillOpacity: 0.5, polygonBorderColor: '#000000', polygonBorderDash: '', polygonBorderWidth: 2
    };

    e.features.forEach(feature => {
        const geometry = feature.geometry;
        if (geometry.type === 'Point') {
            addPointFeature(refid, geometry, style, map, featuresMeta);
        } else {
            addLineOrPolygonFeature(refid, geometry, style, map, featuresMeta);
        }

        draw.deleteAll();
        draw.add({ type: 'Feature', geometry, properties: { refid, style } });

        fetchAPI(`/api/v2/update_feature/${formid}/${refid}`, {
            method: 'PUT',
            body: JSON.stringify({ geom: geometry, style })
        })
            .then(() => {
                console.log("Feature updated successfully, reloading data...");
                // Clear all features and reload
                featuresMeta.forEach((feature, ref) => {
                    if (feature.marker) feature.marker.remove();
                    if (map.getLayer(ref)) map.removeLayer(ref);
                    if (map.getSource(ref)) map.removeSource(ref);
                    featuresMeta.delete(ref);
                });
                return getFeatures(formid, refid, geometry.type);
            })
            .catch(error => {
                console.error("Failed to update feature:", error);
            });
    });
};

const handleFeatureUpdate = (e, map, formid, refid) => {
    e.features.forEach(feature => {
        const { geometry, properties: { style } } = feature;
        if (geometry.type === 'Point' && featuresMeta.get(refid)?.marker) {
            featuresMeta.get(refid).marker.setLngLat(geometry.coordinates);
        } else if (map.getSource(refid)) {
            map.getSource(refid).setData({ type: 'Feature', geometry });
        }

        fetchAPI(`/api/v2/update_feature/${formid}/${refid}`, {
            method: 'PUT',
            body: JSON.stringify({ geom: geometry, style })
        }).then(data => console.log('Feature updated:', data)).catch(console.error);
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

        await fetchAPI(`/api/v2/update_feature/${formid}/${refid}`, {
            method: 'PUT',
            body: JSON.stringify(formData)
        });
        alert('Data updated successfully!');
    } catch (error) {
        console.error('Error updating data:', error);
        alert('Failed to update data.');
    }
};

const updateFeatureStyleToTable = async (refid, type, values) => {
    try {
        await fetchAPI('/api/v2/update_feature_style', {
            method: 'POST',
            body: JSON.stringify({ formid: window.currentFormId, refid, style: values })
        });
    } catch (error) {
        console.error('Failed to update feature style:', error);
    }
};


const populateMarkerList = () => {
    const container = document.getElementById('awesomeIconSelection');
    if (!container) return;

    container.innerHTML = '';
    MARKER_ICONS.forEach(icon => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-outline-secondary p-1';
        btn.innerHTML = `<i class="fa fa-${icon}"></i>`;
        btn.title = icon; // Tooltip for accessibility
        btn.addEventListener('click', () => {
            document.getElementById('markerSymbol').value = icon;
            document.getElementById('editSymbolForm').dispatchEvent(new Event('change')); // Trigger form change
        });
        container.appendChild(btn);
    });
};

const initMap = () => {
    map.on('load', async () => {
        Object.entries(BASE_MAPS).forEach(([id, url]) => addRasterLayer(id, url));
        map.addSource('maptiler', { type: 'vector', url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${API_KEYS.MAPTILER}` });
        map.addLayer({ id: 'maptiler', type: 'symbol', source: 'maptiler', 'source-layer': 'landuse', layout: { visibility: 'none' } });

        document.getElementById('baseMapSelector')?.addEventListener('change', e => switchBaseMap(e.target.value));
        switchBaseMap('osm');

        const { formid, refid, type } = Object.fromEntries(new URLSearchParams(window.location.search));
        await getFeatures(formid, refid, type);
        openEditModal(refid, type);
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    MapboxDraw.constants.classes.CANVAS = 'maplibregl-canvas';
    MapboxDraw.constants.classes.CONTROL_BASE = 'maplibregl-ctrl';
    MapboxDraw.constants.classes.CONTROL_PREFIX = 'maplibregl-ctrl-';
    MapboxDraw.constants.classes.CONTROL_GROUP = 'maplibregl-ctrl-group';
    MapboxDraw.constants.classes.ATTRIBUTION = 'maplibregl-ctrl-attrib';
};

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    populateMarkerList();

    document.getElementById('editSymbolForm')?.addEventListener('change', async e => {
        e.preventDefault();
        const { featureId: refid, featureType: type, markerSymbol, ...values } = Object.fromEntries(new FormData(e.currentTarget));
        const updatedValues = { ...values, markerSymbol: markerSymbol || 'map-marker' }; // Ensure markerSymbol is set
        await applyStyleToFeature(refid, type, updatedValues);
        await updateFeatureStyleToTable(refid, type, updatedValues);
        await reloadFeatures(window.currentFormId, refid);
    });

    document.getElementById('searchLatLng')?.addEventListener('submit', e => {
        e.preventDefault();
        const [lat, lng] = ['latitude', 'longitude'].map(id => parseFloat(document.getElementById(id).value));
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return alert('Please enter valid latitude (-90 to 90) and longitude (-180 to 180) values.');
        }
        map.flyTo({ center: [lng, lat], zoom: 15 });
        new maplibregl.Marker().setLngLat([lng, lat]).addTo(map);
    });

    document.getElementById('clear-marker')?.addEventListener('click', () => {
        document.querySelectorAll('.maplibregl-marker').forEach(marker => marker.remove());
        ['latitude', 'longitude'].forEach(id => document.getElementById(id).value = '');
    });
});