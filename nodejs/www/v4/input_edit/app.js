const MAPTILER_KEY = 'QcH5sAeCUv5rMXKrnJms';
const geoapifyKey = '5c607231c8c24f9b89ff3af7a110185b';
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
    pitch: 0,
    antialias: true,
});

// Add base maps
const featuresMeta = {};

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

const switchBaseMap = (selectedLayer) => {
    const allLayers = [...Object.keys(BASE_MAPS), 'maptiler'];
    allLayers.forEach(layer => map.setLayoutProperty(layer, 'visibility', 'none'));
    map.setLayoutProperty(selectedLayer, 'visibility', 'visible');
};

const bindFeatureEvents = (refid) => {
    map.on('click', refid, (e) => {
        filterDataTableByRefId(refid);

        const coordinates = e.lngLat;
        const selectedFeature = new maplibregl.Popup()
            .setLngLat(coordinates)
            .setHTML(
                `<b>Feature ID:</b> ${refid}<br>`
            )
            .addTo(map);

        selectedFeature.on('close', () => {
            const table = $('#dataTable').DataTable();
            table.search('').columns().search('').draw();
        });
        selectedFeature.on('open', () => {
            const table = $('#dataTable').DataTable();
            const refidColumnIndex = table.column(':contains("refid")').index();
            table.column(refidColumnIndex).search(refid).draw();
        });
    });
    map.on('mouseenter', refid, () => {
        map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', refid, () => {
        map.getCanvas().style.cursor = '';
    });
};

const openEditModal = (refid, type) => {
    console.log('Edit feature:', refid, type);

    const featureIdInput = document.getElementById('featureId');
    const featureTypeInput = document.getElementById('featureType');

    featureIdInput.value = refid;
    featureTypeInput.value = type;

    document.getElementById('pointFields').style.display = (type === 'Point') ? 'block' : 'none';
    document.getElementById('lineFields').style.display = (type === 'LineString') ? 'block' : 'none';
    document.getElementById('polygonFields').style.display = (type === 'Polygon') ? 'block' : 'none';

    if (type === 'Point') {
        const markerEl = featuresMeta[refid].marker.getElement();
        document.getElementById('markerColor').value = rgbToHex(markerEl.style.backgroundColor || '#007cbf');
        document.getElementById('markerSymbol').value = markerEl.innerHTML || "";
        const computedFontSize = window.getComputedStyle(markerEl).fontSize;
        document.getElementById('markerSize').value = computedFontSize ? parseInt(computedFontSize) : 30;
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
        const currentBorderColor = map.getPaintProperty(`${refid}_border`, 'line-color') || '#000000';
        const borderDash = map.getPaintProperty(`${refid}_border`, 'line-dasharray');
        const borderWidth = map.getPaintProperty(`${refid}_border`, 'line-width') || 2;
        document.getElementById('fillColor').value = currentFillColor;
        document.getElementById('fillOpacity').value = currentOpacity;
        document.getElementById('polygonBorderColor').value = currentBorderColor;
        document.getElementById('polygonBorderDash').value = borderDash ? borderDash.join(',') : "";
        document.getElementById('polygonBorderWidth').value = borderWidth;
    }

    const modalEl = document.getElementById('editModal');
    const editModal = new bootstrap.Modal(modalEl);
    editModal.show();
    // openSidebar();
};

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

function filterDataTableByRefId(refid) {
    const table = $('#dataTable').DataTable();
    table.search(refid).draw();
}

const applyStyleToFeature = (refid, type, values) => {
    console.log('Applying style to feature:', refid, type, values);
    console.log(featuresMeta[refid]);

    if (type === 'Point' && featuresMeta[refid]?.marker) {
        // Remove the existing marker
        featuresMeta[refid].marker.remove();

        const coordinates = [featuresMeta[refid].marker._lngLat.lng, featuresMeta[refid].marker._lngLat.lat];

        // Construct a GeoJSON geometry object
        const geometry = {
            type: "Point",
            coordinates: coordinates
        };

        if (!geometry || !geometry.coordinates) {
            console.error('Geometry coordinates are missing for feature:', refid);
            return;
        }

        // Create a new marker based on the marker type
        if (values.markerType === "simple") {
            featuresMeta[refid].markerType = "simple";
            let color = values.markerColor;
            if (color.startsWith('#')) {
                color = color.substring(1);
            }
            const url = `https://api.geoapify.com/v1/icon/?type=awesome&color=%23${color}&icon=${values.markerSymbol}&size=small&scaleFactor=2&apiKey=5c607231c8c24f9b89ff3af7a110185b`;

            const newMarkerEl = document.createElement('div');
            newMarkerEl.innerHTML = `<img src="${url}" alt="Marker" style="width:38px; height:55px; display:block;">`;
            newMarkerEl.style.border = `${values.markerBorderWidth}px solid ${values.markerBorderColor}`;
            newMarkerEl.style.cursor = 'pointer';

            const newMarker = new maplibregl.Marker({ element: newMarkerEl })
                .setLngLat(geometry.coordinates)
                .addTo(map);

            setMarkerPopup(newMarker, refid);
            featuresMeta[refid].marker = newMarker;
        } else {
            featuresMeta[refid].markerType = "emoji";
            const newMarkerEl = document.createElement('div');
            newMarkerEl.innerHTML = values.markerSymbol;
            newMarkerEl.style.fontSize = values.markerSize + 'px';
            newMarkerEl.style.lineHeight = values.markerSize + 'px';
            newMarkerEl.style.backgroundColor = "transparent";
            newMarkerEl.style.border = "none";
            newMarkerEl.style.cursor = 'pointer';

            const newMarker = new maplibregl.Marker({ element: newMarkerEl })
                .setLngLat(geometry.coordinates)
                .addTo(map);

            setMarkerPopup(newMarker, refid);
            featuresMeta[refid].marker = newMarker;
        }
    } else if (type === 'LineString') {
        // Update line string style
        map.setPaintProperty(refid, 'line-color', values.lineColor);
        map.setPaintProperty(refid, 'line-width', parseFloat(values.lineWidth));
        if (values.lineDash && values.lineDash.trim() !== "") {
            const dashArray = values.lineDash.split(',').map(n => parseFloat(n.trim())).filter(n => !isNaN(n));
            map.setPaintProperty(refid, 'line-dasharray', dashArray);
        } else {
            map.setPaintProperty(refid, 'line-dasharray', null);
        }
    } else if (type === 'Polygon') {
        // Update polygon style
        map.setPaintProperty(refid, 'fill-color', values.fillColor);
        map.setPaintProperty(refid, 'fill-opacity', parseFloat(values.fillOpacity));
        map.setPaintProperty(`${refid}_border`, 'line-color', values.polygonBorderColor);
        map.setPaintProperty(`${refid}_border`, 'line-width', parseFloat(values.polygonBorderWidth));
        if (values.polygonBorderDash && values.polygonBorderDash.trim() !== "") {
            const dashArray = values.polygonBorderDash.split(',').map(n => parseFloat(n.trim())).filter(n => !isNaN(n));
            map.setPaintProperty(`${refid}_border`, 'line-dasharray', dashArray);
        } else {
            map.setPaintProperty(`${refid}_border`, 'line-dasharray', []);
        }
    }
};

const setMarkerPopup = (marker, refid) => {
    marker.setPopup(
        new maplibregl.Popup({ offset: 25 }).setHTML(
            `<b>Feature ID:</b> ${refid}<br>`
        )
    );
    marker.getElement().addEventListener('click', () => {
        filterDataTableByRefId(refid);
    });
    marker.getPopup().on('close', () => {
        const table = $('#dataTable').DataTable();
        table.search('').columns().search('').draw();
    });
};

const getFeatures = async (formid) => {
    window.currentFormId = formid;
    const allCoords = [];

    const extractCoordinates = (geometry) => {
        const { type, coordinates } = geometry;
        if (type === 'Point') {
            allCoords.push(coordinates);
        } else if (type === 'LineString') {
            for (const coord of coordinates) {
                allCoords.push(coord);
            }
        } else if (type === 'Polygon') {
            for (const ring of coordinates) {
                for (const coord of ring) {
                    allCoords.push(coord);
                }
            }
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
        const firstFeatureType = JSON.parse(features[0].geojson).type;

        // Configure controls based on the first feature's type
        const controls = {
            point: firstFeatureType === 'Point',
            line_string: firstFeatureType === 'LineString',
            polygon: firstFeatureType === 'Polygon',
            trash: true // Enable trash control for all cases
        };

        // Initialize Mapbox GL Draw with the configured controls
        const draw = new MapboxDraw({
            displayControlsDefault: false,
            controls: controls
        });

        map.addControl(draw);

        for (const { geojson, refid, style } of features) {
            const defaultStyle = {
                "markerType": "simple",
                "markerColor": "#007cbf",
                "markerSymbol": "user-circle",
                "markerSize": "12",
                "lineColor": "#ff0000",
                "lineWidth": "3",
                "lineDash": "1,0",
                "fillColor": "#00ff00",
                "fillOpacity": "0.5",
                "polygonBorderColor": "#000000",
                "polygonBorderDash": "",
                "polygonBorderWidth": "2"
            };

            let appliedStyle = defaultStyle;
            if (style) {
                const parsedStyle = JSON.parse(style);
                if (Object.keys(parsedStyle).length > 0) {
                    appliedStyle = parsedStyle;
                }
            }

            let geometry;
            try {
                geometry = JSON.parse(geojson);
            } catch (error) {
                console.error(`Invalid GeoJSON for refid ${refid}:`, error);
                continue;
            }
            if (!geometry || !geometry.type) {
                continue;
            }
            const { type } = geometry;
            extractCoordinates(geometry);

            if (type === 'Point') {
                if (!featuresMeta[refid]) {
                    featuresMeta[refid] = {};
                }

                if (appliedStyle.markerType === "simple") {
                    featuresMeta[refid].markerType = "simple";
                    let color = appliedStyle.markerColor;
                    if (color.startsWith('#')) {
                        color = color.substring(1);
                    }
                    const url = `https://api.geoapify.com/v1/icon/?type=awesome&color=%23${color}&icon=${appliedStyle.markerSymbol}&size=small&scaleFactor=2&apiKey=5c607231c8c24f9b89ff3af7a110185b`;
                    console.log('Marker URL:', appliedStyle.markerSymbol);

                    const newMarkerEl = document.createElement('div');
                    newMarkerEl.innerHTML = `<img src="${url}" alt="Marker" style="width:38px; height:55px; display:block;">`;
                    newMarkerEl.style.border = `${appliedStyle.markerBorderWidth}px solid ${appliedStyle.markerBorderColor}`;
                    newMarkerEl.style.fontSize = "";
                    newMarkerEl.style.lineHeight = "";
                    newMarkerEl.style.backgroundColor = "";
                    newMarkerEl.style.cursor = 'pointer';

                    const newMarker = new maplibregl.Marker({ element: newMarkerEl })
                        .setLngLat(geometry.coordinates)
                        .addTo(map);

                    newMarker.setPopup(
                        new maplibregl.Popup({ offset: 25 }).setHTML(
                            `<b>Feature ID:</b> ${refid}<br>`
                        )
                    );
                    newMarker.getElement().addEventListener('click', () => {
                        filterDataTableByRefId(refid);
                    });
                    newMarker.getPopup().on('close', () => {
                        const table = $('#dataTable').DataTable();
                        table.search('').columns().search('').draw();
                    });

                    featuresMeta[refid].marker = newMarker;
                } else {
                    featuresMeta[refid].markerType = "emoji";
                    const newMarkerEl = document.createElement('div');
                    newMarkerEl.innerHTML = appliedStyle.markerSymbol;
                    newMarkerEl.style.fontSize = appliedStyle.markerSize + 'px';
                    newMarkerEl.style.lineHeight = appliedStyle.markerSize + 'px';
                    newMarkerEl.style.backgroundColor = "transparent";
                    newMarkerEl.style.border = "none";
                    newMarkerEl.style.cursor = 'pointer';

                    const newMarker = new maplibregl.Marker({ element: newMarkerEl })
                        .setLngLat(geometry.coordinates)
                        .addTo(map);

                    newMarker.setPopup(
                        new maplibregl.Popup({ offset: 25 }).setHTML(
                            `<b>Feature ID:</b> ${refid}<br>`
                        )
                    );
                    newMarker.getElement().addEventListener('click', () => {
                        filterDataTableByRefId(refid);
                    });
                    newMarker.getPopup().on('close', () => {
                        const table = $('#dataTable').DataTable();
                        table.search('').columns().search('').draw();
                    });

                    featuresMeta[refid].marker = newMarker;
                }
            } else {
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
                            'line-color': appliedStyle.lineColor || '#ff0000',
                            'line-width': Number(appliedStyle.lineWidth) || 3,
                            'line-dasharray': appliedStyle.lineDash != null ? (appliedStyle.lineDash).split(',').map(Number) : [0]
                        }
                    };
                } else if (type === 'Polygon') {
                    layerConfig = {
                        id: refid,
                        type: 'fill',
                        source: refid,
                        paint: {
                            'fill-color': appliedStyle.fillColor || '#00ff00',
                            'fill-opacity': Number(appliedStyle.fillOpacity) || 0.5
                        }
                    };
                }

                if (!map.getLayer(refid)) {
                    map.addLayer(layerConfig);
                    bindFeatureEvents(refid);
                }

                if (type === 'Polygon' && !map.getLayer(`${refid}_border`)) {
                    map.addLayer({
                        id: `${refid}_border`,
                        type: 'line',
                        source: refid,
                        paint: {
                            'line-color': appliedStyle.polygonBorderColor || '#000000',
                            'line-width': Number(appliedStyle.polygonBorderWidth) || 2,
                            'line-dasharray': appliedStyle.polygonBorderDash != null ? (appliedStyle.polygonBorderDash).split(',').map(Number) : [0]
                        }
                    });
                }
                featuresMeta[refid] = { type };
            }

            // Add feature to Mapbox GL Draw for editing
            draw.add({
                type: 'Feature',
                geometry: geometry,
                properties: { refid, style: appliedStyle }
            });
        }

        // Handle new feature creation
        map.on('draw.create', (e) => {
            const newFeatures = e.features;
            newFeatures.forEach((feature) => {
                const geometry = feature.geometry;
                const style = {
                    "markerType": "simple",
                    "markerColor": "#007cbf",
                    "markerSymbol": "user-circle",
                    "markerSize": "12",
                    "lineColor": "#ff0000",
                    "lineWidth": "3",
                    "lineDash": "1,0",
                    "fillColor": "#00ff00",
                    "fillOpacity": "0.5",
                    "polygonBorderColor": "#000000",
                    "polygonBorderDash": "",
                    "polygonBorderWidth": "2"
                };

                if (geometry.type === 'Point') {
                    const newMarkerEl = document.createElement('div');
                    newMarkerEl.innerHTML = `<img src="https://api.geoapify.com/v1/icon/?type=awesome&color=%23${style.markerColor.substring(1)}&icon=${style.markerSymbol}&size=small&scaleFactor=2&apiKey=5c607231c8c24f9b89ff3af7a110185b" alt="Marker" style="width:38px; height:55px; display:block;">`;
                    newMarkerEl.style.border = `${style.markerBorderWidth}px solid ${style.markerBorderColor}`;
                    newMarkerEl.style.cursor = 'pointer';

                    const newMarker = new maplibregl.Marker({ element: newMarkerEl })
                        .setLngLat(geometry.coordinates)
                        .addTo(map);

                    newMarker.setPopup(
                        new maplibregl.Popup({ offset: 25 }).setHTML(
                            `<b>Feature ID:</b> ${feature.id}<br>`
                        )
                    );

                    featuresMeta[feature.id] = { marker: newMarker, markerType: "simple" };
                } else if (geometry.type === 'LineString') {
                    // Add line
                    map.addSource(feature.id, { type: 'geojson', data: { type: 'Feature', geometry } });
                    map.addLayer({
                        id: feature.id,
                        type: 'line',
                        source: feature.id,
                        paint: {
                            'line-color': style.lineColor,
                            'line-width': Number(style.lineWidth),
                            'line-dasharray': style.lineDash.split(',').map(Number)
                        }
                    });
                } else if (geometry.type === 'Polygon') {
                    // Add polygon
                    map.addSource(feature.id, { type: 'geojson', data: { type: 'Feature', geometry } });
                    map.addLayer({
                        id: feature.id,
                        type: 'fill',
                        source: feature.id,
                        paint: {
                            'fill-color': style.fillColor,
                            'fill-opacity': Number(style.fillOpacity)
                        }
                    });
                    map.addLayer({
                        id: `${feature.id}_border`,
                        type: 'line',
                        source: feature.id,
                        paint: {
                            'line-color': style.polygonBorderColor,
                            'line-width': Number(style.polygonBorderWidth),
                            'line-dasharray': style.polygonBorderDash.split(',').map(Number)
                        }
                    });
                }

                fetch('/api/v2/create_feature', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ formid, geojson: geometry, style })
                })
                    .then(response => response.json())
                    .then(data => {
                        if ($.fn.DataTable.isDataTable('#dataTable')) {
                            $('#dataTable').DataTable().destroy();
                        }
                        $('#dataTable').empty();
                        getTableData(formid);

                        draw.add({
                            type: 'Feature',
                            geometry,
                            properties: { refid: data.refid, style }
                        });

                        bindFeatureEvents(data.refid);
                    })
                    .catch(error => {
                        console.error('Error creating feature:', error);
                    });
            });
        });

        // Handle feature edits
        map.on('draw.update', (e) => {
            const updatedFeatures = e.features;
            updatedFeatures.forEach((feature) => {
                const refid = feature.properties.refid;
                const style = feature.properties.style;

                // Update the feature on the map
                if (map.getSource(refid)) {
                    map.getSource(refid).setData({
                        type: 'Feature',
                        geometry: feature.geometry
                    });
                }

                // Optionally, send the updated feature back to your API
                fetch('/api/v2/update_feature', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ formid, refid, geojson: feature.geometry, style })
                })
                    .then(response => response.json())
                    .then(data => {
                        console.log('Feature updated:', data);
                    })
                    .catch(error => {
                        console.error('Error updating feature:', error);
                    });
            });
        });

        // Handle feature deletions
        map.on('draw.delete', (e) => {
            const deletedFeatures = e.features;
            deletedFeatures.forEach((feature) => {
                const refid = feature.properties.refid;

                // Remove the feature from the map
                if (map.getLayer(refid)) {
                    map.removeLayer(refid);
                }
                if (map.getSource(refid)) {
                    map.removeSource(refid);
                }

                fetch('/api/v2/delete_feature', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ formid, refid })
                })
                    .then(response => response.json())
                    .then(data => {
                        console.log('Feature deleted:', data);
                        $('#dataTable').DataTable().destroy();
                        getTableData(formid);
                    })
                    .catch(error => {
                        console.error('Error deleting feature:', error);
                    });
            });
        });

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

const saveChanges = async (formid, changes) => {
    try {
        const response = await fetch('/api/v2/update_layer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ formid, changes }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Changes saved successfully:', result);
    } catch (error) {
        console.error('Failed to save changes:', error);
    }
};

const deleteRow = async (formid, refid) => {
    try {
        const response = await fetch('/api/v2/delete_row', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ formid, refid })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Feature deleted:', result);
    } catch (error) {
        console.error('Failed to delete feature:', error);
    }
};

const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

function isISODate(str) {
    // Regular expression for ISO 8601 format
    const isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;

    if (!isoDatePattern.test(str)) return false;

    // Additional validation by trying to parse the date
    const date = new Date(str);
    return date instanceof Date && !isNaN(date);
}

// Function to format date to Thai format
function formatThaiDate(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543; // Convert to Buddhist Era (BE)

    return `${day} ${month} ${year}`;
}

// Function to format date and time to Thai format
function formatThaiDateTime(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543;
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${day} ${month} ${year} ${hours}:${minutes} น.`;
}

const getTableData = async (formid) => {
    try {
        // Fetch column descriptions
        const columnsResponse = await fetch('/api/load_column_description', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ formid }),
        });

        if (!columnsResponse.ok) {
            throw new Error(`HTTP error! status: ${columnsResponse.status}`);
        }

        const columnsData = await columnsResponse.json();

        // Fetch data from the API
        const response = await fetch('/api/v2/load_layer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ formid })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('No data received or invalid data format');
        }

        const nonEditableColumns = ['refid', 'id', 'ts', 'geojson', 'style', 'type'];

        // Define columns for the DataTable
        const columns = [
            {
                title: 'Actions',
                data: null,
                orderable: false,
                searchable: false,
                render: function (data, type, row) {
                    let _type = row.geojson ? JSON.parse(row.geojson).type : '';
                    let geojson = row.geojson ? JSON.parse(row.geojson) : '';

                    if (geojson && geojson.type && geojson.coordinates) {
                        var _geojson = JSON.stringify(geojson);
                    } else {
                        console.error('Invalid GeoJSON:', geojson);
                        geojson = { type: 'Point', coordinates: [0, 0] };
                    }

                    return `<div class="btn-group">
                        <button class="btn btn-success center map-btn" data-refid="${row.refid}" data-geojson='${_geojson}'>
                            <i class="fas fa-magnifying-glass"></i>
                        </button>
                        <button class="btn btn-info center edit-btn" data-refid="${row.refid}" data-type="${_type || ''}">
                            <i class="fas fa-paint-roller"></i>
                        </button>
                        <button class="btn btn-info center edit-btn" data-refid="${row.refid}" data-type="${_type || ''}">
                            <i class="fas fa-table-list"></i>
                        </button>
                        <button class="btn btn-danger center delete-btn" data-refid="${row.refid}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>`;
                }
            },
            ...Object.keys(data[0])
                .filter(key => !['geojson', 'style'].includes(key))
                .map(key => {
                    const isHidden = key === 'refid' || key === 'ts';
                    return {
                        title: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
                        data: key,
                        className: nonEditableColumns.includes(key) ? '' : 'editable',
                        visible: !isHidden,
                        render: function (data, type, row) {
                            if (isISODate(data)) {
                                if (type === 'display') {
                                    return formatThaiDate(data);
                                }
                                return data;
                            }

                            if (type === 'display' && !nonEditableColumns.includes(key)) {
                                return `<div class="editable-cell">${data !== null && data !== undefined ? data : ''}</div>`;
                            }
                            return data;
                        }
                    };
                })
        ];

        // Destroy existing DataTable instance if it exists
        if ($.fn.DataTable.isDataTable('#dataTable')) {
            $('#dataTable').DataTable().destroy();
        }

        // Clear the table HTML
        $('#dataTable').empty();

        // Update column titles based on column descriptions
        columns.forEach(col => {
            if (col.data === null) return;
            const match = columnsData.find(i => col.data === i.col_id);
            if (match) {
                col.title = match.col_name;
                col.type = match.col_type;
            }
        });

        // Rebuild the table header
        const headerHtml = columns.map(col => `<th>${col.title}</th>`).join('');
        $('#dataTable').html(`<thead><tr>${headerHtml}</tr></thead><tbody></tbody>`);

        // Initialize a new DataTable instance
        const table = $('#dataTable').DataTable({
            data,
            columns,
            autoWidth: true,
            scrollX: true,
            dom: '<"top"Bf>rt<"bottom"lip><"clear">', // Position buttons at the top
            buttons: [
                {
                    extend: 'excel', // Show only the Excel export button
                    text: '<i class="fas fa-download"></i> Export to Excel', // Custom text and icon
                    className: 'btn-primary', // Add a class for styling
                    title: 'Data Export', // Optional: Set a title for the exported file
                    exportOptions: {
                        modifier: {
                            page: 'all' // Export all data (not just the current page)
                        }
                    }
                }
            ],
            language: {
                search: "_INPUT_",
                searchPlaceholder: "Search records...",
                lengthMenu: "Show _MENU_ entries",
                info: "Showing _START_ to _END_ of _TOTAL_ entries",
                infoEmpty: "Showing 0 to 0 of 0 entries",
                infoFiltered: "(filtered from _MAX_ total entries)"
            },
            initComplete: function () {
                $('.dataTables_filter input')
                    .before('<i class="fas fa-search" style="position: relative; left: 25px;"></i>')
                    .css('text-indent', '20px');
                $('.dataTables_length select').addClass('custom-select custom-select-sm');
            },
            responsive: false
        });

        // Event listeners for buttons and editable cells
        $('#dataTable').on('click', '.map-btn', function (e) {
            e.stopPropagation();
            try {
                const geojson = $(this).data('geojson');
                const bbox = turf.bbox(geojson);
                map.fitBounds(bbox, {
                    padding: 20,
                    duration: 1000
                });
            } catch (error) {
                console.error('Failed to parse GeoJSON:', error);
            }
        });

        $('#dataTable').on('click', '.edit-btn', function (e) {
            e.stopPropagation();
            const refid = $(this).data('refid');
            const type = $(this).data('type');
            openEditModal(refid, type);
        });

        $('#dataTable').on('click', '.delete-btn', function (e) {
            e.stopPropagation();
            const refid = $(this).data('refid');
            if (confirm('ยืนยันการลบ  ?')) {
                console.log('Delete item:', refid);
                deleteRow(formid, refid);
                table.row($(this).closest('tr')).remove().draw(false);
            }
        });

    } catch (error) {
        console.error('Failed to get table data:', error);
        $('#tableError').text('Failed to load data: ' + error.message).show();
    }
};

const updateFeatureSymbol = (refid, type, values) => {
    console.log(values);

    if (values.applyToAll) {
        Object.keys(featuresMeta).forEach(refid => {
            if (featuresMeta[refid].type === type) {
                applyStyleToFeature(refid, type, values);
            }
        });
    } else {
        applyStyleToFeature(refid, type, values);
    }
};

const updateFeatureStyleToTable = async (refid, type, values) => {
    let style = values;
    const formid = window.currentFormId;
    try {
        if (values.applyToAll) {
            for (const id in featuresMeta) {
                if (featuresMeta[id].type === type) {
                    const response = await fetch('/api/v2/update_feature_style', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ formid, refid: id, style })
                    });
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    // Use response.text() because the API returns plain text.
                    const data = await response.text();
                    console.log('Feature style updated:', data);
                }
            }
            return;
        }

        const response = await fetch('/api/v2/update_feature_style', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ formid, refid, style })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Parse the response as text
        const data = await response.text();
    } catch (error) {
        console.error('Failed to update feature style:', error);
    }
};


const initMap = () => {
    map.on('load', async () => {
        Object.entries(BASE_MAPS).forEach(([id, url]) => addRasterLayer(id, url));
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
        const baseMapSelector = document.getElementById('baseMapSelector');
        if (baseMapSelector) {
            baseMapSelector.addEventListener('change', (event) => {
                switchBaseMap(event.target.value);
            });
        } else {
            console.warn('Base map selector element not found.');
        }
        switchBaseMap('osm');
        const urlParams = new URLSearchParams(window.location.search);
        const formid = urlParams.get('formid');
        await getTableData(formid);
        await getFeatures(formid);
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    MapboxDraw.constants.classes.CANVAS = 'maplibregl-canvas';
    MapboxDraw.constants.classes.CONTROL_BASE = 'maplibregl-ctrl';
    MapboxDraw.constants.classes.CONTROL_PREFIX = 'maplibregl-ctrl-';
    MapboxDraw.constants.classes.CONTROL_GROUP = 'maplibregl-ctrl-group';
    MapboxDraw.constants.classes.ATTRIBUTION = 'maplibregl-ctrl-attrib';

};

const updateMarkerPreview = () => {
    let color = document.getElementById('markerColor').value;
    if (color.startsWith('#')) {
        color = color.substring(1);
        const url = `https://api.geoapify.com/v1/icon/?type=awesome&color=%23${color}&icon=${currentAwesomeIcon}&iconType=awesome&scaleFactor=2&apiKey=${geoapifyKey}`;
        document.getElementById('markerPreview').innerHTML = `<img src="${url}" alt="Marker Preview">`;
    }
}

const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min)) + min;
};

var currentAwesomeIcon = 'map-marker';
document.addEventListener('DOMContentLoaded', () => {
    const iconNames = ["map-marker", "map-pin", "location-arrow", "crosshairs", "compass", "street-view", "road", "flag", "flag-checkered", "building", "hospital",
        "university", "school", "coffee", "cutlery", "glass", "beer", "ambulance", "car", "bus", "train", "subway", "taxi", "bicycle", "motorcycle", "ship", "plane",
        "helicopter", "fire-extinguisher", "anchor", "globe", "institution", "hotel", "bed", "graduation-cap", "truck", "shipping-fast", "rocket", "satellite-dish",
        "car-alt", "bus-alt", "map-marker-alt", "building-o", "city", "home", "bank", "church", "mosque", "synagogue", "temple", "cathedral", "factory", "office",
        "store", "shopping-cart", "shopping-basket", "medkit", "fountain", "landmark", "monument", "park", "tree", "leaf", "seedling", "industry", "utensils",
        "wine-glass", "cocktail", "pizza-slice", "apple-alt", "lemon", "ice-cream", "cookie", "hamburger", "hotdog", "bread-slice", "carrot", "cheese", "mug-hot",
        "tint", "cloud", "sun", "moon", "star", "book", "camera", "video-camera", "microphone", "music", "paint-brush", "pencil-alt", "paint-roller", "pen", "file",
        "newspaper", "clock", "calendar", "heart", "bolt", "battery-full", "gift", "shopping-bag", "tag", "money-bill", "credit-card", "chart-bar", "chart-line",
        "chart-pie", "clipboard", "paper-plane", "key", "lock", "unlock", "wifi", "signal", "battery-empty", "mobile", "tablet", "desktop", "paw", "dog", "cat",
        "fish", "dove", "feather", "frog", "dragon", "dragonfly", "shuttle-van", "steering-wheel", "school-bus", "walking", "ticket-alt", "theater-masks", "gamepad",
        "puzzle-piece", "headphones", "tv", "radio", "camera-retro", "flag-usa", "flag-uk", "flag-fr", "paperclip", "folder", "folder-open", "bookmark", "bell",
        "volume-up", "volume-mute", "wrench", "screwdriver", "hammer", "toolbox", "magic", "cube", "cubes", "sitemap", "trophy", "medal", "certificate", "info-circle",
        "question-circle", "exclamation-circle", "life-ring", "circle", "square", "star-of-life", "shield-alt", "bomb", "bug", "code", "terminal", "database",
        "cloud-upload-alt", "cloud-download-alt", "sync", "refresh", "cog", "archive", "circle-o", "square-o", "bell-slash", "plug", "battery-half",
        "battery-quarter", "battery-three-quarters", "lightbulb", "briefcase", "percent", "dollar-sign", "euro-sign", "yen-sign", "ruble-sign", "wheelchair",
        "wheelchair-alt", "user", "users", "user-circle", "address-book", "address-card", "id-badge", "id-card", "hand-pointer", "handshake", "envelope", "envelope-open",
        "comment", "comments", "comment-dots", "phone", "phone-square", "fax", "drum", "drum-steelpan", "volleyball-ball", "football-ball", "baseball-ball", "tennis-ball",
        "golf-ball", "skateboard", "running", "swimmer", "ticket", "mask", "user-md", "stethoscope", "heartbeat", "thermometer", "thermometer-full", "thermometer-three-quarters",
        "thermometer-half", "thermometer-quarter", "thermometer-empty", "stamp", "envelope-square", "window-close", "window-maximize", "window-minimize",
        "window-restore", "clone", "balance-scale", "balance-scale-left", "balance-scale-right", "hourglass"];

    let randomIconsHTML = '';
    for (let i = 0; i < 200; i++) {
        const randomIndex = getRandomInt(0, iconNames.length);
        const iconName = iconNames[randomIndex];
        randomIconsHTML += `<i class="fa fa-${iconName} pointer" style="font-size: 24px;"></i>\n`;
    }

    document.getElementById('awesomeIconSelection').innerHTML = randomIconsHTML;

    const emojiNames = ["📍", "🚩", "🏁", "🎯", "🗺", "🧭", "🚉", "🚂", "🚆", "🚇", "🚊", "🚌", "🚍", "🚎", "🚐", "🚒", "🚑", "🚓", "🚔", "🚕", "🚖", "🚗", "🚙",
        "🛻", "🚚", "🚛", "🚜", "🛵", "🏍", "🛺", "🚲", "🛴", "🚏", "🚦", "🚧", "🏎", "🚘", "🛣", "🛤", "🗼", "🗽", "🏙", "🌇", "🌆", "🏞", "🏜", "🏝", "🏖", "🏟",
        "🎡", "🎢", "🏰", "🏯", "🏛", "⛪", "🕌", "🕍", "🕋", "⛩", "🛕", "🏠", "🏡", "🏘", "🏚", "🏢", "🏬", "🏭", "🏣", "🏤", "🏥", "🏦", "🏨", "🏪", "🏫", "🏩",
        "💒", "⛲", "🌳", "🌲", "🌴", "🌵", "🌻", "🌼", "🌸", "🍀", "🍁", "🍂", "🍃", "🌾", "⛰", "🏔", "🌋", "🗻", "🌄", "🌅", "🌉", "🌌", "🌠", "⭐", "🌟", "✨",
        "⚡", "🌈", "☀️", "🌤", "⛅", "🌥", "☁️", "🌦", "🌧", "⛈", "🌩", "❄️", "🌨", "☃️", "⛄", "💧", "💦", "🌊", "🛳", "⛴", "🚢", "🛥", "⛵", "🚤", "🛶", "🛩", "✈️",
        "🛫", "🛬", "🚁", "🛰", "🚀", "🛸", "🗾", "🏕", "⛺", "🛖", "🛎", "📌", "🔖", "🏷", "💼", "📦", "🛒", "💰", "🎫", "🗳", "💵", "💳", "💸", "💎", "📈", "📉",
        "📊", "🔍", "🔎", "📝", "✏️", "📋", "💡", "🔦", "🔑", "🔒", "🔓", "🗝", "💻", "📱", "📲", "☎️", "📞", "📟", "🔋", "🔌", "📡", "🕹", "🎮", "📺", "📻", "🎙",
        "🎚", "🎛", "⏰", "⏱", "⏲", "🕰", "⌚", "📅", "📆", "🗓", "📇", "📁", "📂", "🗂", "📄", "📃", "📑", "🗞", "📰", "✉️", "📧", "📨", "📩", "📤", "📥", "💌",
        "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "🎈", "🎉", "🎊", "🎁", "🎗", "🏆", "🏅", "🥇", "🥈",
        "🥉", "🎖", "🏵", "🎯", "🔰", "🚸", "⚠️", "🚫", "⛔", "📛", "❌", "✅", "✔️", "☑️", "🔲", "🔳", "⚪", "⚫", "🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "🟤", "⬜",
        "⬛", "◼️", "◻️", "◾", "◽", "🔺", "🔻", "🔸", "🔹", "💠", "🔷", "🔶", "🌀", "🌐", "🎒", "👓", "🕶", "👔", "👕", "👖", "👗", "👙", "👚", "👘", "💄", "💍",
        "👑", "🎩", "🧢", "⛑", "👒", "👟", "👞", "🥾", "🥿", "👠", "👡", "🩰", "👢", "🧥", "🧤", "🧣"];

    let randomEmoji = '';
    for (let i = 0; i < 200; i++) {
        const randomIndex = getRandomInt(0, emojiNames.length);
        const emojiName = emojiNames[randomIndex];
        randomEmoji += `<span class="emoji-choice pointer">${emojiName}</span>\n`;
    }

    document.getElementById('emojiSelection').innerHTML = randomEmoji;

    document.querySelectorAll('input[name="markerType"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === "simple") {
                document.getElementById("simpleMarkerFields").style.display = "block";
                document.getElementById("emojiMarkerFields").style.display = "none";
                document.getElementById('markerPreview').innerHTML = "";
            } else {
                document.getElementById("simpleMarkerFields").style.display = "none";
                document.getElementById("emojiMarkerFields").style.display = "block";
                document.getElementById('markerPreview').innerHTML = "";
            }
        });
    });

    document.getElementById('emojiSelection').addEventListener('click', (e) => {
        if (e.target.classList.contains('emoji-choice')) {
            const chosenEmoji = e.target.textContent;
            const fontSize = document.getElementById('markerSize').value;
            document.getElementById('markerSymbol').value = chosenEmoji;
            document.getElementById('markerPreview').innerHTML = chosenEmoji;
            document.getElementById('markerPreview').style.fontSize = `${fontSize}px`;
        }
    });

    document.getElementById('markerSize').addEventListener('input', (e) => {
        const fontSize = e.target.value;
        document.getElementById('markerPreview').style.fontSize = `${fontSize}px`;
    });

    document.getElementById('markerColor').addEventListener('input', (e) => {
        updateMarkerPreview();
    });

    document.getElementById('awesomeIconSelection').addEventListener('click', (e) => {
        if (e.target.classList.contains('fa')) {
            const classes = e.target.className.split(' ');
            const iconClass = classes.find(c => c.startsWith('fa-') && c !== 'fa');
            if (iconClass) {
                currentAwesomeIcon = iconClass.substring(3);
                document.getElementById('markerSymbol').value = `${currentAwesomeIcon}`;
                updateMarkerPreview();
            }
        }
    });

    document.addEventListener('click', (e) => {
        if (e.target && e.target.matches('.edit-feature')) {
            const refid = e.target.dataset.refid;
            const type = e.target.dataset.type;
            openEditModal(refid, type);
        }
    });

    document.getElementById('editForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const refid = document.getElementById('featureId').value;
        const type = document.getElementById('featureType').value;
        const formData = new FormData(e.target);
        const values = Object.fromEntries(formData.entries());
        const modalEl = document.getElementById('editModal');
        const editModal = bootstrap.Modal.getInstance(modalEl);
        if (editModal) {
            editModal.hide();
        }
        updateFeatureSymbol(refid, type, values);
        updateFeatureStyleToTable(refid, type, values);
    });

    document.addEventListener('hide.bs.modal', function (event) {
        if (document.activeElement) {
            document.activeElement.blur();
        }
    });

    initMap();
    // $('#markersTable').DataTable();
});

