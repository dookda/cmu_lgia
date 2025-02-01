const MAPTILER_KEY = 'QcH5sAeCUv5rMXKrnJms';
let featuresMap = {};
let optionsMap = {};
let table;

var map = new maplibregl.Map({
    style: `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`,
    center: [99.01730749096882, 18.5761825900007],
    zoom: 15.5,
    pitch: 45,
    // bearing: -17.6,
    container: 'map',
    antialias: true
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');

map.on('load', function () {
    map.addSource('osm', {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
    });

    map.addLayer({
        id: 'osm',
        type: 'raster',
        source: 'osm',
        layout: { visibility: 'none' },
    });

    map.addSource('grod', {
        type: 'raster',
        tiles: [
            'https://mt0.google.com/vt/lyrs=r&x={x}&y={y}&z={z}',
            'https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}',
            'https://mt2.google.com/vt/lyrs=r&x={x}&y={y}&z={z}',
            'https://mt3.google.com/vt/lyrs=r&x={x}&y={y}&z={z}',
        ],
        tileSize: 256,
    });

    map.addLayer({
        id: 'grod',
        type: 'raster',
        source: 'grod',
        layout: { visibility: 'none' },
    });

    map.addSource('ghyb', {
        type: 'raster',
        tiles: [
            'https://mt0.google.com/vt/lyrs=y,m&x={x}&y={y}&z={z}',
            'https://mt1.google.com/vt/lyrs=y,m&x={x}&y={y}&z={z}',
            'https://mt2.google.com/vt/lyrs=y,m&x={x}&y={y}&z={z}',
            'https://mt3.google.com/vt/lyrs=y,m&x={x}&y={y}&z={z}',
        ],
        tileSize: 256,
    });

    map.addLayer({
        id: 'ghyb',
        type: 'raster',
        source: 'ghyb',
        layout: { visibility: 'none' },
    });

    map.addSource('gsat', {
        type: 'raster',
        tiles: [
            'https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
            'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
            'https://mt2.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
            'https://mt3.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        ],
        tileSize: 256,
    });

    map.addLayer({
        id: 'gsat',
        type: 'raster',
        source: 'gsat',
        layout: { visibility: 'none' },
    });

    map.addSource('maptiler', {
        type: 'vector',
        url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${MAPTILER_KEY}`,
    });

    map.addLayer({
        id: 'maptiler',
        type: 'symbol',  // 'fill', 'line', 'symbol' 
        source: 'maptiler',
        'source-layer': 'landuse',
        layout: { visibility: 'none' },
    });

    const baseMapSelector = document.getElementById('baseMapSelector');
    baseMapSelector.addEventListener('change', (event) => {
        const selectedBaseMap = event.target.value;

        map.setLayoutProperty('osm', 'visibility', 'none');
        map.setLayoutProperty('grod', 'visibility', 'none');
        map.setLayoutProperty('gsat', 'visibility', 'none');
        map.setLayoutProperty('ghyb', 'visibility', 'none');
        map.setLayoutProperty('maptiler', 'visibility', 'none');

        map.setLayoutProperty(selectedBaseMap, 'visibility', 'visible');
    });
});

let listLayer = () => {
    axios.post('/api/list_layer')
        .then(response => {
            const layers = response.data;
            // console.log(layers);

            const layerList = document.getElementById('layerList');
            layerList.innerHTML = '';
            layers.forEach(layer => {
                const listItem = document.createElement('li');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = layer.formid;
                // checkbox.datatype = layer.layertype;
                checkbox.name = layer.layername;
                checkbox.checked = false;

                const label = document.createElement('label');
                label.setAttribute('for', layer.formid);
                label.textContent = layer.layername;

                listItem.appendChild(checkbox);
                listItem.appendChild(label);

                layerList.appendChild(listItem);

                listItem.classList.add('list-group-item', 'd-flex', 'align-items-center');
                checkbox.classList.add('form-check-input', 'me-2', 'checkbox');
                label.classList.add('form-check-label', 'stretched-link');

            });
        })
        .catch(error => {
            console.error('Error fetching layer list:', error);
        });
};

const getFeatures = async (checkboxId, checkboxName) => {
    try {
        let resp = await axios.post('/api/load_layer', { formid: checkboxId });

        console.log(resp.data);

        let featureArray = [];
        resp.data.forEach((data) => {
            const geojson = JSON.parse(data.geojson);
            const geometryType = geojson.type;

            switch (geometryType) {
                case 'Point':
                    const emojiElement = document.createElement('div');
                    emojiElement.textContent = '🐯';
                    emojiElement.style.fontSize = '24px';
                    emojiElement.style.lineHeight = '1';

                    const triangleElement = document.createElement('div');
                    triangleElement.style.width = '0';
                    triangleElement.style.height = '0';
                    triangleElement.style.borderLeft = '10px solid transparent';
                    triangleElement.style.borderRight = '10px solid transparent';
                    triangleElement.style.borderBottom = '20px solid #007cbf';

                    const circleElement = document.createElement('div');
                    circleElement.style.width = '12px';
                    circleElement.style.height = '12px';
                    circleElement.style.borderRadius = '50%';
                    circleElement.style.backgroundColor = '#007cbf';
                    circleElement.style.border = '2px solid #ffffff';

                    const coordinates = geojson.coordinates;
                    const marker = new maplibregl.Marker({
                        element: emojiElement,
                        anchor: 'center'
                    })
                        .setLngLat([coordinates[0], coordinates[1]])
                        .setPopup(
                            new maplibregl.Popup()
                                .setHTML(`<strong>${data.id}</strong><br>${data.id}`)
                        )
                        .addTo(map);

                    featureArray.push(marker);
                    break;

                case 'LineString':
                    map.addSource(data.refid, {
                        type: 'geojson',
                        data: {
                            type: 'Feature',
                            geometry: geojson
                        }
                    });
                    map.addLayer({
                        id: data.refid,
                        type: 'line',
                        source: data.refid,
                        paint: {
                            'line-color': '#ff0000',
                            'line-width': 3
                        }
                    });
                    featureArray.push(data.refid);
                    break;

                case 'Polygon':
                    map.addSource(data.refid, {
                        type: 'geojson',
                        data: {
                            type: 'Feature',
                            geometry: geojson
                        }
                    });
                    map.addLayer({
                        id: data.refid,
                        type: 'fill',
                        source: data.refid,
                        paint: {
                            'fill-color': '#00ff00',
                            'fill-opacity': 0.5
                        }
                    });
                    featureArray.push(data.refid);
                    break;

                default:
                    console.warn(`Unsupported geometry type: ${geometryType}`);
            }
        });
        featuresMap[checkboxId] = featureArray;
        await addToLayerSelect(checkboxId, checkboxName);

    } catch (error) {
        console.error('Failed to get features:', error);

    }
}

const addToLayerSelect = async (checkboxId, checkboxName) => {
    const layerSelect = document.getElementById('layerSelect');
    const option = document.createElement('option');
    option.value = checkboxId;
    option.textContent = checkboxName;
    if (!Array.from(layerSelect.options).some(opt => opt.value === checkboxId)) {
        layerSelect.appendChild(option);
    }
}

document.getElementById('layerList').addEventListener('change', (event) => {
    const checkbox = event.target;

    if (checkbox.checked) {
        getFeatures(checkbox.id, checkbox.name);
    } else {
        if (featuresMap[checkbox.id]) {
            featuresMap[checkbox.id].forEach(feature => {
                if (typeof feature === 'string') {
                    map.removeLayer(feature);
                    map.removeSource(feature);
                } else {
                    feature.remove();
                }
            });
            featuresMap[checkbox.id] = [];

            $('#table').DataTable().destroy();
            document.getElementById('table').innerHTML = '';
        }
        const layerSelect = document.getElementById('layerSelect');
        const option = Array.from(layerSelect.options).find(opt => opt.value === checkbox.id);
        if (option) {
            layerSelect.removeChild(option);
        }
    }
});

const zoomToLayer = async (formid, id) => {
    try {
        let data = await axios.post('/api/load_layer_by_id', { formid, id });

        let geojson = JSON.parse(data.data[0].geojson);
        const bounds = new maplibregl.LngLatBounds();
        let zoomLevel = 16;
        if (geojson.type === "FeatureCollection" && geojson.features) {
            geojson.features.forEach(feature => {
                if (feature.geometry.type === 'Point') {
                    bounds.extend(feature.geometry.coordinates);
                    zoomLevel = 19;
                } else if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
                    feature.geometry.coordinates.forEach(ring => {
                        ring.forEach(coord => bounds.extend(coord));
                    });
                } else if (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString') {
                    feature.geometry.coordinates.forEach(coord => bounds.extend(coord));
                }
            });
        } else if (geojson.type && geojson.coordinates) {
            if (geojson.type === 'Point') {
                bounds.extend(geojson.coordinates);
                zoomLevel = 19;
            } else if (geojson.type === 'Polygon' || geojson.type === 'MultiPolygon') {
                geojson.coordinates.forEach(ring => {
                    ring.forEach(coord => bounds.extend(coord));
                });
            } else if (geojson.type === 'LineString' || geojson.type === 'MultiLineString') {
                geojson.coordinates.forEach(coord => bounds.extend(coord));
            }
        }
        if (!bounds.isEmpty()) {
            map.fitBounds(bounds, {
                padding: 50,
                maxZoom: zoomLevel,
            });
        } else {
            console.warn('GeoJSON data has no valid geometry to zoom to.');
        }
    } catch (error) {
        console.error('Failed to zoom to layer:', error);
    }
};

const loadColumnList = async (formid) => {
    try {
        if ($.fn.DataTable.isDataTable('#table')) {
            $('#table').DataTable().destroy();
            document.getElementById('table').innerHTML = '';
        }

        const columnsResponse = await axios.post('/api/load_column_description', { formid });

        const tb = columnsResponse.data.map(i => `<th>${i.col_name}</th>`).join('');  // Column headers for the table
        const col = columnsResponse.data.map(i => ({ 'data': i.col_id, "className": "text-center" })); // Column data

        const tb_btn = `<th>ซูม</th>${tb}`;
        const col_btn = [{
            "data": null,
            "className": "text-left",
            "render": function (data, type, row, meta) {
                return `<button class="btn btn-primary" onclick="zoomToLayer('${formid}', ${data.id})"><i class="bi bi-search"></i></button>`;
            }
        }, ...col];

        document.getElementById('table').innerHTML = `<thead><tr>${tb_btn}</tr></thead><tbody></tbody>`;

        const r = await axios.post('/api/load_layer', { formid });

        const table = $('#table').DataTable({
            data: r.data,
            columns: col_btn,
            scrollX: true,
            autoWidth: true,
            initComplete: function () {
                this.api().columns.adjust();
            }
        });

        $('#keyword').on('input', function () {
            const keyword = $(this).val();
            table.search(keyword).draw();
        });

        table.on('search.dt', function () {
            const resp = table.rows({ search: 'applied' }).data().toArray();
            console.log(resp);
        });

    } catch (error) {
        console.error('Failed to load column list:', error);
    }
};

document.getElementById('layerSelect').addEventListener('change', async (event) => {
    const selectedLayerId = event.target.value;
    loadColumnList(selectedLayerId);
});


window.onload = () => listLayer()
