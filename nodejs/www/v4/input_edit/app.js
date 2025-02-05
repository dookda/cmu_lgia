// --- Global Variables and Map Initialization ---

const MAPTILER_KEY = 'QcH5sAeCUv5rMXKrnJms';

const BASE_MAPS = {
    osm: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    grod: 'https://mt0.google.com/vt/lyrs=r&x={x}&y={y}&z={z}',
    ghyb: 'https://mt0.google.com/vt/lyrs=y,m&x={x}&y={y}&z={z}',
    gsat: 'https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
};

const map = new maplibregl.Map({
    container: 'map',
    style: `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`,
    center: [99.0173, 18.5762],
    zoom: 15.5,
    pitch: 45,
    antialias: true,
});

// Global object to store feature metadata (for updating styles)
const featuresMeta = {};

// --- Helper Functions ---

/**
 * Adds a raster layer for a given base map.
 * Skips if the layer id is 'maptiler' (handled separately).
 */
const addRasterLayer = (id, url) => {
    if (id === 'maptiler') return;
    map.addSource(id, {
        type: 'raster',
        tiles: [url],
        tileSize: 256
    });
    map.addLayer({
        id,
        type: 'raster',
        source: id,
        layout: { visibility: 'none' }
    });
};

/**
 * Hides all base map layers and then shows the selected one.
 */
const switchBaseMap = (selectedLayer) => {
    const allLayers = [...Object.keys(BASE_MAPS), 'maptiler'];
    allLayers.forEach(layer => map.setLayoutProperty(layer, 'visibility', 'none'));
    map.setLayoutProperty(selectedLayer, 'visibility', 'visible');
};

/**
 * Binds click and hover events to a feature layer.
 * For non‑point features, the popup includes an "Edit Symbol" button.
 */
const bindFeatureEvents = (refid) => {
    map.on('click', refid, (e) => {
        const coordinates = e.lngLat;
        new maplibregl.Popup()
            .setLngLat(coordinates)
            .setHTML(
                `<b>Feature ID:</b> ${refid}<br>
         <button class="edit-feature btn btn-sm btn-outline-primary" data-refid="${refid}" data-type="${featuresMeta[refid].type}">Edit Symbol</button>`
            )
            .addTo(map);
    });
    map.on('mouseenter', refid, () => {
        map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', refid, () => {
        map.getCanvas().style.cursor = '';
    });
};

/**
 * Opens the Bootstrap modal and populates the form fields based on feature type.
 */
const openEditModal = (refid, type) => {
    const featureIdInput = document.getElementById('featureId');
    const featureTypeInput = document.getElementById('featureType');

    // Save current feature info in hidden fields.
    featureIdInput.value = refid;
    featureTypeInput.value = type;

    // Show/Hide the appropriate form sections.
    document.getElementById('pointFields').style.display = (type === 'Point') ? 'block' : 'none';
    document.getElementById('lineFields').style.display = (type === 'LineString') ? 'block' : 'none';
    document.getElementById('polygonFields').style.display = (type === 'Polygon') ? 'block' : 'none';

    // Pre-fill form fields based on current style.
    if (type === 'Point') {
        const markerEl = featuresMeta[refid].marker.getElement();
        document.getElementById('markerColor').value = rgbToHex(markerEl.style.backgroundColor || '#007cbf');
        document.getElementById('markerSymbol').value = markerEl.innerHTML || "";
        let border = markerEl.style.border;
        if (!border) {
            border = "2px solid rgb(0, 0, 0)";
        }
        const borderMatch = border.match(/(\d+)px\s+solid\s+(.+)/);
        if (borderMatch) {
            document.getElementById('markerBorderWidth').value = borderMatch[1];
            document.getElementById('markerBorderColor').value = rgbToHex(borderMatch[2].trim());
        } else {
            document.getElementById('markerBorderWidth').value = 2;
            document.getElementById('markerBorderColor').value = "#000000";
        }
    } else if (type === 'LineString') {
        const currentColor = map.getPaintProperty(refid, 'line-color') || '#ff0000';
        const currentWidth = map.getPaintProperty(refid, 'line-width') || 3;
        document.getElementById('lineColor').value = currentColor;
        document.getElementById('lineWidth').value = currentWidth;
        const dashArray = map.getPaintProperty(refid, 'line-dasharray');
        document.getElementById('lineDash').value = dashArray ? dashArray.join(',') : "";
    } else if (type === 'Polygon') {
        const currentFillColor = map.getPaintProperty(refid, 'fill-color') || '#00ff00';
        const currentOpacity = map.getPaintProperty(refid, 'fill-opacity') || 0.5;
        // For border, use the extra border layer.
        const currentBorderColor = map.getPaintProperty(`${refid}_border`, 'line-color') || '#000000';
        const borderDash = map.getPaintProperty(`${refid}_border`, 'line-dasharray');
        const borderWidth = map.getPaintProperty(`${refid}_border`, 'line-width') || 2;
        document.getElementById('fillColor').value = currentFillColor;
        document.getElementById('fillOpacity').value = currentOpacity;
        document.getElementById('polygonBorderColor').value = currentBorderColor;
        document.getElementById('polygonBorderDash').value = borderDash ? borderDash.join(',') : "";
        document.getElementById('polygonBorderWidth').value = borderWidth;
    }

    // Show the Bootstrap modal.
    const modalEl = document.getElementById('editModal');
    const editModal = new bootstrap.Modal(modalEl);
    editModal.show();
};

/**
 * Converts an RGB color string to HEX.
 * (Works for strings like "rgb(0, 123, 255)".)
 */
const rgbToHex = (rgb) => {
    if (!rgb) return '#007cbf';
    const result = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(rgb);
    return result
        ? "#" +
        ("0" + parseInt(result[1], 10).toString(16)).slice(-2) +
        ("0" + parseInt(result[2], 10).toString(16)).slice(-2) +
        ("0" + parseInt(result[3], 10).toString(16)).slice(-2)
        : rgb;
};

/**
 * Helper: Updates the style for a single feature based on its type.
 */
const applyStyleToFeature = (id, type, values) => {
    if (type === 'Point') {
        const marker = featuresMeta[id].marker;
        const markerEl = marker.getElement();
        markerEl.style.backgroundColor = values.markerColor;
        markerEl.innerHTML = values.markerSymbol;
        markerEl.style.border = `${values.markerBorderWidth}px solid ${values.markerBorderColor}`;
    } else if (type === 'LineString') {
        map.setPaintProperty(id, 'line-color', values.lineColor);
        map.setPaintProperty(id, 'line-width', parseFloat(values.lineWidth));
        if (values.lineDash && values.lineDash.trim() !== "") {
            const dashArray = values.lineDash.split(',').map(n => parseFloat(n.trim())).filter(n => !isNaN(n));
            map.setPaintProperty(id, 'line-dasharray', dashArray);
        } else {
            map.setPaintProperty(id, 'line-dasharray', null);
        }
    } else if (type === 'Polygon') {
        // Update fill layer properties.
        map.setPaintProperty(id, 'fill-color', values.fillColor);
        map.setPaintProperty(id, 'fill-opacity', parseFloat(values.fillOpacity));
        // Update border (line layer) properties.
        map.setPaintProperty(`${id}_border`, 'line-color', values.polygonBorderColor);
        map.setPaintProperty(`${id}_border`, 'line-width', parseFloat(values.polygonBorderWidth));
        if (values.polygonBorderDash && values.polygonBorderDash.trim() !== "") {
            const dashArray = values.polygonBorderDash.split(',').map(n => parseFloat(n.trim())).filter(n => !isNaN(n));
            map.setPaintProperty(`${id}_border`, 'line-dasharray', dashArray);
        } else {
            map.setPaintProperty(`${id}_border`, 'line-dasharray', []);
        }
    }
};

/**
 * Updates the feature symbol using values from the modal form.
 * If the "applyToAll" checkbox is checked, the style is applied to all features of that type.
 */
const updateFeatureSymbol = (refid, type, values) => {
    if (values.applyToAll) {
        // Iterate through all features and apply style to those of the same type.
        Object.keys(featuresMeta).forEach(id => {
            if (featuresMeta[id].type === type) {
                applyStyleToFeature(id, type, values);
            }
        });
    } else {
        applyStyleToFeature(refid, type, values);
    }
};

/**
 * Loads features from the server using fetch, adds them to the map,
 * and then zooms to the extent of all features.
 */
const getFeatures = async (formid) => {
    const allCoords = [];

    const extractCoordinates = (geometry) => {
        const { type, coordinates } = geometry;
        if (type === 'Point') {
            allCoords.push(coordinates);
        } else if (type === 'LineString') {
            coordinates.forEach(coord => allCoords.push(coord));
        } else if (type === 'Polygon') {
            coordinates.forEach(ring => ring.forEach(coord => allCoords.push(coord)));
        }
    };

    try {
        const response = await fetch('/api/v2/load_layer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ formid })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const features = await response.json();
        console.log(features);

        features.forEach(({ geojson, refid }) => {
            let geometry;
            try {
                geometry = JSON.parse(geojson);
            } catch (error) {
                console.error(`Invalid GeoJSON for refid ${refid}:`, error);
                return;
            }
            if (!geometry || !geometry.type) {
                console.error(`Empty or invalid geometry for feature: ${refid}`);
                return;
            }

            const { type } = geometry;
            extractCoordinates(geometry);

            if (type === 'Point') {
                // Create a custom element for the marker.
                const el = document.createElement('div');
                el.className = 'custom-marker';
                el.style.backgroundColor = '#007cbf';
                el.style.width = '20px';
                el.style.height = '20px';
                el.style.borderRadius = '50%';
                el.style.cursor = 'pointer';
                // Default border and symbol.
                el.style.border = "2px solid #000000";
                el.innerHTML = "";  // default no symbol

                const marker = new maplibregl.Marker({ element: el })
                    .setLngLat(geometry.coordinates)
                    .addTo(map);

                // Store metadata so we can update later.
                featuresMeta[refid] = { type, marker };

                // Attach a popup with an Edit button.
                marker.setPopup(
                    new maplibregl.Popup({ offset: 25 }).setHTML(
                        `<b>Feature ID:</b> ${refid}<br>
             <button class="edit-feature btn btn-sm btn-outline-primary" data-refid="${refid}" data-type="Point">Edit Symbol</button>`
                    )
                );
            } else {
                // For LineString or Polygon features, create a GeoJSON source.
                const sourceData = { type: 'Feature', geometry };
                if (!map.getSource(refid)) {
                    map.addSource(refid, { type: 'geojson', data: sourceData });
                }
                let layerConfig;
                if (type === 'LineString') {
                    layerConfig = {
                        id: refid,
                        type: 'line',
                        source: refid,
                        paint: {
                            'line-color': '#ff0000',
                            'line-width': 3
                            // 'line-dasharray' will be added when updated.
                        }
                    };
                } else {
                    // For polygons, create a fill layer...
                    layerConfig = {
                        id: refid,
                        type: 'fill',
                        source: refid,
                        paint: {
                            'fill-color': '#00ff00',
                            'fill-opacity': 0.5
                            // The outline will be drawn in a separate layer.
                        }
                    };
                }

                if (!map.getLayer(refid)) {
                    map.addLayer(layerConfig);
                    bindFeatureEvents(refid);
                }
                // For polygons, add a border (line) layer if not already present.
                if (type === 'Polygon' && !map.getLayer(`${refid}_border`)) {
                    map.addLayer({
                        id: `${refid}_border`,
                        type: 'line',
                        source: refid,
                        paint: {
                            'line-color': '#000000',
                            'line-width': 2,
                            'line-dasharray': []
                        }
                    });
                }
                // Store metadata for non‑point features.
                featuresMeta[refid] = { type };
            }
        });

        // Zoom to the extent of all features.
        if (allCoords.length > 0) {
            const lons = allCoords.map(coord => coord[0]);
            const lats = allCoords.map(coord => coord[1]);
            const minLng = Math.min(...lons);
            const minLat = Math.min(...lats);
            const maxLng = Math.max(...lons);
            const maxLat = Math.max(...lats);
            map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 20, duration: 1000 });
        }
    } catch (error) {
        console.error('Failed to get features:', error);
    }
};

// --- Modal Event Handlers ---

// Open modal when an "Edit Symbol" button is clicked (using event delegation)
document.addEventListener('click', (e) => {
    if (e.target && e.target.matches('.edit-feature')) {
        const refid = e.target.dataset.refid;
        const type = e.target.dataset.type;
        openEditModal(refid, type);
    }
});

// Handle form submission to update the feature symbol.
document.getElementById('editForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const refid = document.getElementById('featureId').value;
    const type = document.getElementById('featureType').value;
    const formData = new FormData(e.target);
    const values = Object.fromEntries(formData.entries());
    // The checkbox value will be "on" if checked.
    updateFeatureSymbol(refid, type, values);

    // Hide the modal using Bootstrap's API.
    const modalEl = document.getElementById('editModal');
    const editModal = bootstrap.Modal.getInstance(modalEl);
    if (editModal) {
        editModal.hide();
    }
});

// --- Map Initialization ---

const initMap = () => {
    // Add navigation controls.
    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', async () => {
        // Add raster base map layers.
        Object.entries(BASE_MAPS).forEach(([id, url]) => addRasterLayer(id, url));

        // Add the MapTiler vector source and layer.
        map.addSource('maptiler', {
            type: 'vector',
            url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${MAPTILER_KEY}`
        });
        map.addLayer({
            id: 'maptiler',
            type: 'symbol',
            source: 'maptiler',
            'source-layer': 'landuse',
            layout: { visibility: 'none' }
        });

        // Bind base map selector change event if exists.
        const baseMapSelector = document.getElementById('baseMapSelector');
        if (baseMapSelector) {
            baseMapSelector.addEventListener('change', (event) => {
                switchBaseMap(event.target.value);
            });
        } else {
            console.warn('Base map selector element not found.');
        }

        // Optionally, set a default base map.
        switchBaseMap('osm');

        // Load features after the map is ready.
        const urlParams = new URLSearchParams(window.location.search);
        const formid = urlParams.get('formid');

        await getFeatures(formid);
    });
};

document.addEventListener('DOMContentLoaded', initMap);
