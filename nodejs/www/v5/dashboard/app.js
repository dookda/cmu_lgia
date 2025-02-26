const MAPTILER_KEY = 'QcH5sAeCUv5rMXKrnJms';
let featuresMap = {};
let markersMap = {};
let currentFormId = null;

const map = new maplibregl.Map({
    style: `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`,
    center: [99.0173, 18.5762],
    zoom: 15.5,
    pitch: 45,
    container: 'map',
    antialias: true
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');

const baseMaps = {
    osm: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    grod: 'https://mt0.google.com/vt/lyrs=r&x={x}&y={y}&z={z}',
    ghyb: 'https://mt0.google.com/vt/lyrs=y,m&x={x}&y={y}&z={z}',
    gsat: 'https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
};

const addRasterLayer = (id, url) => {
    map.addSource(id, { type: 'raster', tiles: [url], tileSize: 256 });
    map.addLayer({ id, type: 'raster', source: id, layout: { visibility: 'none' } });
};

map.on('load', () => {
    Object.entries(baseMaps).forEach(([id, url]) => addRasterLayer(id, url));

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

    document.getElementById('baseMapSelector').addEventListener('change', event => {
        Object.keys(baseMaps).concat(['maptiler']).forEach(layer => map.setLayoutProperty(layer, 'visibility', 'none'));
        map.setLayoutProperty(event.target.value, 'visibility', 'visible');
    });
});

const listLayer = async () => {
    try {
        const response = await axios.post('/api/list_layer');
        const layerList = document.getElementById('layerList');
        layerList.innerHTML = response.data.map(layer => `
            <li class="list-group-item d-flex align-items-center">
                <input type="checkbox" id="${layer.formid}" name="${layer.layername}" class="form-check-input me-2 checkbox">
                <label for="${layer.formid}" class="form-check-label stretched-link">${layer.layername}</label>
            </li>`).join('');
    } catch (error) {
        console.error('Error fetching layer list:', error);
    }
};


// Define the default style (including marker border settings for the custom marker case)
const defaultStyle = {
    "markerType": "simple",
    "markerColor": "#007cbf",
    "markerSymbol": "user-circle",
    "markerSize": "12",
    "markerBorderWidth": "2",
    "markerBorderColor": "#000000",
    "lineColor": "#ff0000",
    "lineWidth": "3",
    "lineDash": "1,0",
    "fillColor": "#00ff00",
    "fillOpacity": "0.5",
    "polygonBorderColor": "#000000",
    "polygonBorderDash": "",
    "polygonBorderWidth": "2"
};

// Global objects to keep track of features and markers
// let featuresMap = {};
let featuresMeta = {};
// markersArray holds custom markers created when zoom > 15
let markersArray = [];
// pointFeaturesMap stores point features for each layer (by formid)
let pointFeaturesMap = {};

const getFeatures = async (checkboxId, checkboxName) => {
    try {
        const response = await axios.post('/api/load_layer', { formid: checkboxId });
        let nonPointFeatures = [];
        let pointFeatures = [];
        // Create a unique source id for this layer's points
        const clusterSourceId = 'points-' + checkboxId;

        response.data.forEach(({ geojson, refid, style: styleStr }) => {
            if (!geojson) {
                console.warn(`GeoJSON is null for feature ${refid}. Skipping.`);
                return;
            }
            let data;
            try {
                data = JSON.parse(geojson);
            } catch (e) {
                console.error(`Error parsing GeoJSON for feature ${refid}:`, e);
                return;
            }
            if (!data || !data.type) {
                console.warn(`Invalid GeoJSON for feature ${refid}:`, data);
                return;
            }

            // Parse the style (or use the default)
            let appliedStyle;
            if (styleStr && styleStr.trim() !== "") {
                try {
                    appliedStyle = JSON.parse(styleStr);
                } catch (e) {
                    console.error('Error parsing style JSON for feature', refid, e);
                    appliedStyle = defaultStyle;
                }
            } else {
                appliedStyle = defaultStyle;
            }

            if (data.type === 'Point') {
                // Store point features (with styling properties) for clustering and later custom marker creation
                pointFeatures.push({
                    type: 'Feature',
                    geometry: data,
                    properties: {
                        refid: refid,
                        markerType: appliedStyle.markerType, // "simple" or "emoji"
                        markerColor: appliedStyle.markerColor,
                        markerSymbol: appliedStyle.markerSymbol,
                        markerSize: appliedStyle.markerSize,
                        markerBorderWidth: appliedStyle.markerBorderWidth,
                        markerBorderColor: appliedStyle.markerBorderColor
                    }
                });
            } else if (data.type === 'LineString') {
                // Add LineString features directly to the map
                map.addSource(refid, { type: 'geojson', data: { type: 'Feature', geometry: data } });
                map.addLayer({
                    id: refid,
                    type: 'line',
                    source: refid,
                    paint: {
                        'line-color': appliedStyle.lineColor,
                        'line-width': parseFloat(appliedStyle.lineWidth),
                        'line-dasharray': appliedStyle.lineDash.split(',').map(Number)
                    }
                });
                nonPointFeatures.push(refid);
                map.on('click', refid, (e) => {
                    const coordinates = e.lngLat;
                    new maplibregl.Popup({ offset: 25 })
                        .setLngLat(coordinates)
                        .setHTML(`<b>Feature ID:</b> ${refid}`)
                        .addTo(map);
                });
            } else if (data.type === 'Polygon') {
                // Add Polygon features
                map.addSource(refid, { type: 'geojson', data: { type: 'Feature', geometry: data } });
                map.addLayer({
                    id: refid,
                    type: 'fill',
                    source: refid,
                    paint: {
                        'fill-color': appliedStyle.fillColor,
                        'fill-opacity': parseFloat(appliedStyle.fillOpacity)
                    }
                });
                // Add an optional border layer for the polygon
                map.addLayer({
                    id: refid + '-border',
                    type: 'line',
                    source: refid,
                    paint: {
                        'line-color': appliedStyle.polygonBorderColor,
                        'line-width': parseFloat(appliedStyle.polygonBorderWidth),
                        'line-dasharray': appliedStyle.polygonBorderDash ? appliedStyle.polygonBorderDash.split(',').map(Number) : []
                    }
                });
                nonPointFeatures.push(refid, refid + '-border');
                map.on('click', refid, (e) => {
                    const coordinates = e.lngLat;
                    new maplibregl.Popup({ offset: 25 })
                        .setLngLat(coordinates)
                        .setHTML(`<b>Feature ID:</b> ${refid}`)
                        .addTo(map);
                });
            }
        });

        // Save the array of point features for this layer so we can later create custom markers
        pointFeaturesMap[checkboxId] = pointFeatures;

        // If there are any point features, add them as a clustered source
        if (pointFeatures.length > 0) {
            const geojsonData = {
                type: 'FeatureCollection',
                features: pointFeatures
            };
            map.addSource(clusterSourceId, {
                type: 'geojson',
                data: geojsonData,
                cluster: true,
                clusterMaxZoom: 14, // Clustering until zoom level 15
                clusterRadius: 50
            });

            // Add cluster layers (visible when zoom ≤ 15)
            map.addLayer({
                id: clusterSourceId + '-clusters',
                type: 'circle',
                source: clusterSourceId,
                filter: ['has', 'point_count'],
                paint: {
                    'circle-color': '#51bbd6',
                    'circle-radius': 20
                }
            });

            map.addLayer({
                id: clusterSourceId + '-cluster-count',
                type: 'symbol',
                source: clusterSourceId,
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': '{point_count_abbreviated}',
                    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                    'text-size': 12
                }
            });
        }

        // Save non-point features for later removal
        featuresMap[checkboxId] = featuresMap[checkboxId]
            ? featuresMap[checkboxId].concat(nonPointFeatures)
            : nonPointFeatures;
        addToLayerSelect(checkboxId, checkboxName);

        // Add a zoom listener to toggle between cluster layers and custom markers
        map.on('zoomend', function markerZoomListener() {
            const currentZoom = map.getZoom();
            if (currentZoom > 15) {
                // Hide the cluster layers
                if (pointFeatures.length > 0) {
                    map.setLayoutProperty(clusterSourceId + '-clusters', 'visibility', 'none');
                    map.setLayoutProperty(clusterSourceId + '-cluster-count', 'visibility', 'none');
                }
                // Create custom markers only if they haven't been created yet
                if (markersArray.length === 0 && pointFeaturesMap[checkboxId]) {
                    pointFeaturesMap[checkboxId].forEach(feature => {
                        const { refid, markerType, markerColor, markerSymbol, markerSize, markerBorderWidth, markerBorderColor } = feature.properties;
                        const coordinates = feature.geometry.coordinates;
                        if (markerType === "simple") {
                            featuresMeta[refid] = { markerType: "simple" };
                            let color = markerColor;
                            if (color.startsWith('#')) {
                                color = color.substring(1);
                            }
                            const url = `https://api.geoapify.com/v1/icon/?type=awesome&color=%23${color}&icon=${markerSymbol}&size=small&scaleFactor=2&apiKey=5c607231c8c24f9b89ff3af7a110185b`;

                            const newMarkerEl = document.createElement('div');
                            newMarkerEl.innerHTML = `<img src="${url}" alt="Marker" style="width:33px; height:50px; display:block;">`;
                            // Removed border style from here
                            newMarkerEl.style.cursor = 'pointer';

                            const newMarker = new maplibregl.Marker({ element: newMarkerEl, offset: [0, -16] })
                                .setLngLat(coordinates)
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
                            markersArray.push(newMarker);
                        } else {
                            featuresMeta[refid] = { markerType: "emoji" };
                            const newMarkerEl = document.createElement('div');
                            newMarkerEl.innerHTML = markerSymbol;
                            newMarkerEl.style.fontSize = markerSize + 'px';
                            newMarkerEl.style.lineHeight = markerSize + 'px';
                            newMarkerEl.style.cursor = 'pointer';

                            const newMarker = new maplibregl.Marker({ element: newMarkerEl })
                                .setLngLat(coordinates)
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
                            markersArray.push(newMarker);
                        }
                    });
                }
            } else {
                // When zoom ≤ 15, remove custom markers and show the cluster layers again
                markersArray.forEach(marker => marker.remove());
                markersArray = [];
                if (pointFeatures.length > 0) {
                    map.setLayoutProperty(clusterSourceId + '-clusters', 'visibility', 'visible');
                    map.setLayoutProperty(clusterSourceId + '-cluster-count', 'visibility', 'visible');
                }
            }
        });

    } catch (error) {
        console.error('Failed to get features:', error);
    }
};


const addToLayerSelect = (checkboxId, checkboxName) => {
    const layerSelect = document.getElementById('layerSelect');
    if (![...layerSelect.options].some(opt => opt.value === checkboxId)) {
        layerSelect.appendChild(new Option(checkboxName, checkboxId));
    }
};

const removeFeatures = (checkboxId) => {
    // Remove features and markers from the map
    if (featuresMap[checkboxId]) {
        featuresMap[checkboxId].forEach(feature => {
            if (typeof feature === 'string') {
                map.removeLayer(feature);
                map.removeSource(feature);
            }
        });
        featuresMap[checkboxId] = [];
    }

    if (markersMap[checkboxId]) {
        markersMap[checkboxId].forEach(marker => marker.remove());
        markersMap[checkboxId] = [];
    }

    // Destroy DataTable if it exists
    if ($.fn.DataTable.isDataTable('#table')) {
        $('#table').DataTable().destroy();
        document.getElementById('table').innerHTML = ''; // Clear table content
    }

    // Remove the option from the layer select dropdown
    const layerSelect = document.getElementById('layerSelect');
    const optionToRemove = layerSelect.querySelector(`option[value="${checkboxId}"]`);
    if (optionToRemove) {
        optionToRemove.remove();
        layerSelect.value = '';
    }

    // Reset the currentFormId if the removed layer was the currently selected one
    if (currentFormId === checkboxId) {
        currentFormId = null;
    }
};

const loadColumnList = async (formid) => {
    try {
        if ($.fn.DataTable.isDataTable('#table')) {
            $('#table').DataTable().destroy();
            document.getElementById('table').innerHTML = '';
        }

        const columnsResponse = await axios.post('/api/load_column_description', { formid });
        const tb = columnsResponse.data.map(i => `<th>${i.col_name}</th>`).join('');
        // const col = columnsResponse.data.map(i => ({ 'data': i.col_id, "className": "text-center" }));
        const col = [{
            "data": "refid",
            "render": function (data, type, row) {
                return `<button class="btn btn-sm btn-primary zoom-btn" data-refid="${data}">Zoom</button>`;
            },
            "className": "text-center"
        }].concat(columnsResponse.data.map(i => ({ 'data': i.col_id, "className": "text-center" })));



        document.getElementById('table').innerHTML = `<thead><tr>${tb}</tr></thead><tbody></tbody>`;

        const r = await axios.post('/api/load_layer', { formid });

        const table = $('#table').DataTable({
            data: r.data,
            columns: col,
            scrollX: true,
            autoWidth: true,
            initComplete: function () {
                this.api().columns.adjust();
            }
        });

        // Add search event listener to filter map features
        table.on('search.dt', () => {
            const filteredData = table.rows({ search: 'applied' }).data();
            const filteredRefIds = filteredData.toArray().map(row => row.refid);

            if (featuresMap[formid]) {
                featuresMap[formid].forEach(feature => {
                    const visibility = filteredRefIds.includes(feature) ? 'visible' : 'none';
                    map.setLayoutProperty(feature, 'visibility', visibility);
                });
            }

            if (markersMap[formid]) {
                markersMap[formid].forEach((marker, index) => {
                    const refid = r.data[index].refid;
                    if (filteredRefIds.includes(refid)) {
                        marker.getElement().style.display = 'block';
                    } else {
                        marker.getElement().style.display = 'none';
                    }
                });
            }
        });

        $('#table tbody').on('click', '.zoom-btn', function () {
            const refid = $(this).data('refid');
            zoomToFeature(refid, formid, r.data);
        });

        currentFormId = formid; // Track the currently selected layer
    } catch (error) {
        console.error('Failed to load column list:', error);
    }
};

const zoomToFeature = (refid, formid, featureData) => {
    // Find the feature by refid
    const feature = featureData.find(f => f.refid === refid);
    if (!feature || !feature.geojson) return;

    const data = JSON.parse(feature.geojson);
    let popupContent = `<strong>Reference ID:</strong> ${refid}<br>`;

    // Add properties to the popup content
    Object.entries(feature).forEach(([key, value]) => {
        if (key !== 'geojson' && key !== 'refid') {
            popupContent += `<strong>${key}:</strong> ${value}<br>`;
        }
    });

    if (data.type === 'Point') {
        // Fly to point and open popup
        map.flyTo({
            center: data.coordinates,
            zoom: 18,
            essential: true
        });

        new maplibregl.Popup({ offset: 25 })
            .setLngLat(data.coordinates)
            .setHTML(popupContent)
            .addTo(map);

    } else if (data.type === 'Polygon' || data.type === 'LineString') {
        // Compute bounding box using Turf.js
        const bbox = turf.bbox(data);
        map.fitBounds(bbox, { padding: 50 });

        // Get center of geometry to place popup
        const center = turf.centerOfMass(data).geometry.coordinates;

        new maplibregl.Popup({ offset: 25 })
            .setLngLat(center)
            .setHTML(popupContent)
            .addTo(map);
    }
};


document.getElementById('layerList').addEventListener('change', event => {
    const checkbox = event.target;
    checkbox.checked ? getFeatures(checkbox.id, checkbox.name) : removeFeatures(checkbox.id);
});

document.getElementById('layerSelect').addEventListener('change', event => {
    loadColumnList(event.target.value);
});

window.onload = listLayer;