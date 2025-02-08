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

const getFeatures = async (formid, markerColor = '#007cbf') => {
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
        console.log(features);
        for (const { geojson, refid } of features) {
            let geometry;
            try {
                geometry = JSON.parse(geojson);
            } catch (error) {
                console.error(`Invalid GeoJSON for refid ${refid}:`, error);
                continue;
            }
            if (!geometry || !geometry.type) {
                console.error(`Empty or invalid geometry for feature: ${refid}`);
                continue;
            }
            const { type } = geometry;
            extractCoordinates(geometry);

            if (type === 'Point') {
                // Use the provided markerColor option here.
                const el = createMarkerElement(markerColor);
                console.log(el);

                var trainStationIcon = document.createElement('div');
                trainStationIcon.style.width = '38px';
                trainStationIcon.style.height = '55px';
                // Explicitly set scaleFactor=2 in the call 
                // and backgroundSize=contain to get better 
                // Marker Icon quality with MapLibre GL
                trainStationIcon.style.backgroundSize = "contain";
                trainStationIcon.style.backgroundImage = "url(https://api.geoapify.com/v1/icon/?type=awesome&scaleFactor=2&color=%23e68d6f&size=large&icon=train&iconSize=large&apiKey=6dc7fb95a3b246cfa0f3bcef5ce9ed9a)";
                trainStationIcon.style.cursor = "pointer";

                // const marker = new maplibregl.Marker({ element: el })
                const marker = new maplibregl.Marker({ element: trainStationIcon })
                    .setLngLat(geometry.coordinates)
                    .addTo(map);

                featuresMeta[refid] = { type, marker };
                marker.setPopup(
                    new maplibregl.Popup({ offset: 25 }).setHTML(
                        `<b>Feature ID:</b> ${refid}<br>
               <button class="edit-feature btn btn-sm btn-outline-primary" data-refid="${refid}" data-type="Point">Edit Symbol</button>`
                    )
                );
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
                            'line-color': '#ff0000',
                            'line-width': 3
                        }
                    };
                } else {
                    layerConfig = {
                        id: refid,
                        type: 'fill',
                        source: refid,
                        paint: {
                            'fill-color': '#00ff00',
                            'fill-opacity': 0.5
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
                            'line-color': '#000000',
                            'line-width': 2,
                            'line-dasharray': []
                        }
                    });
                }
                featuresMeta[refid] = { type };
            }
        }
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

function createMarkerElement(color = '#007cbf') {
    const el = document.createElement('div');
    el.className = 'custom-marker';
    Object.assign(el.style, {
        backgroundColor: color,
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        cursor: 'pointer',
        border: '2px solid #000000'
    });
    el.innerHTML = "";
    return el;
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
