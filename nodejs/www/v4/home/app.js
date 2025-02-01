const MAPTILER_KEY = 'QcH5sAeCUv5rMXKrnJms';
let featuresMap = {};
let markersMap = {}; // To keep track of markers
let currentFormId = null; // To track the currently selected layer

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

const getFeatures = async (checkboxId, checkboxName) => {
    try {
        const response = await axios.post('/api/load_layer', { formid: checkboxId });
        const featureArray = [];
        const markersArray = [];

        response.data.forEach(({ geojson, refid }) => {
            const data = JSON.parse(geojson);
            const type = data.type;

            if (type === 'Point') {
                const marker = new maplibregl.Marker().setLngLat(data.coordinates).addTo(map);
                const popup = new maplibregl.Popup({ offset: 25 })
                    .setHTML(`<b>Feature ID:</b> ${refid}`);

                marker.setPopup(popup);
                markersArray.push(marker);
            } else {
                map.addSource(refid, { type: 'geojson', data: { type: 'Feature', geometry: data } });
                map.addLayer({
                    id: refid,
                    type: type === 'LineString' ? 'line' : 'fill',
                    source: refid,
                    paint: type === 'LineString' ? { 'line-color': '#ff0000', 'line-width': 3 } : { 'fill-color': '#00ff00', 'fill-opacity': 0.5 }
                });
                featureArray.push(refid);

                map.on('click', refid, (e) => {
                    const coordinates = e.lngLat;
                    new maplibregl.Popup()
                        .setLngLat(coordinates)
                        .setHTML(`<b>Feature ID:</b> ${refid}`)
                        .addTo(map);
                });
            }
        });

        featuresMap[checkboxId] = featureArray;
        markersMap[checkboxId] = markersArray; // Store markers
        addToLayerSelect(checkboxId, checkboxName);
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