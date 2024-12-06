const MAPTILER_KEY = 'QcH5sAeCUv5rMXKrnJms';

var map = new maplibregl.Map({
    style: `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`,
    center: [99.01730749096882, 18.5761825900007],
    zoom: 15.5,
    pitch: 45,
    bearing: -17.6,
    container: 'map',
    antialias: true
});

// Add navigation controls
map.addControl(new maplibregl.NavigationControl(), 'top-right');

map.on('load', function () {
    // Add OpenStreetMap (OSM) layer
    map.addSource('osm', {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
    });

    map.addLayer({
        id: 'osm',
        type: 'raster',
        source: 'osm',
        layout: { visibility: 'none' }, // Initially hidden
    });

    // Add Google Roads (GROD) layer
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
        layout: { visibility: 'none' }, // Initially hidden
    });

    // Add Google Hybrid (GHYB) layer
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
        layout: { visibility: 'none' }, // Initially hidden
    });

    // Add Google Satellite (GSAT) layer
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
        layout: { visibility: 'none' }, // Initially hidden
    });

    // Add MapTiler Vector Tile Layer
    map.addSource('maptiler', {
        type: 'vector',
        url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${MAPTILER_KEY}`,
    });

    // Replace 'roads' with the correct source-layer name from your MapTiler vector tiles
    map.addLayer({
        id: 'maptiler',
        type: 'symbol',  // You can use 'fill', 'line', 'symbol' depending on the data
        source: 'maptiler',
        'source-layer': 'landuse',
        layout: { visibility: 'none' }, // Initially hidden
    });

    // random 500 marker
    for (var i = 0; i < 2000; i++) {
        var marker = new maplibregl.Marker()
            .setLngLat([
                99.01730749096882 + (Math.random() - 0.5) * 0.1,
                18.5761825900007 + (Math.random() - 0.5) * 0.1
            ])
        // .addTo(map);
    }

    // Add a marker at the center of the map
    var marker = new maplibregl.Marker()
        .setLngLat([99.01730749096882, 18.5761825900007])
        .addTo(map);

    var popup = new maplibregl.Popup({ offset: 25 })
        .setText('This is a marker at [99.01730749096882, 18.5761825900007]')
        .addTo(map);

    marker.setPopup(popup);

    // Handle base map selector changes
    const baseMapSelector = document.getElementById('baseMapSelector');
    baseMapSelector.addEventListener('change', (event) => {
        const selectedBaseMap = event.target.value;

        // Hide all base map layers
        map.setLayoutProperty('osm', 'visibility', 'none');
        map.setLayoutProperty('grod', 'visibility', 'none');
        map.setLayoutProperty('gsat', 'visibility', 'none');
        map.setLayoutProperty('ghyb', 'visibility', 'none');
        map.setLayoutProperty('maptiler', 'visibility', 'none');

        // Show the selected base map layer
        map.setLayoutProperty(selectedBaseMap, 'visibility', 'visible');
    });
});

let listLayer = () => {
    axios.post('/api/list_layer')
        .then(response => {
            console.log(response.data);  // Log the response data to see its structure

            // Assuming the response contains an array of layers
            const layers = response.data;

            // Get the parent element for the checkboxes
            const layerList = document.getElementById('layerList');

            // Clear any existing list items
            layerList.innerHTML = '';

            // Loop through the layers and create checkboxes
            layers.forEach(layer => {
                // Create a list item and a checkbox
                const listItem = document.createElement('li');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = layer.formid;
                checkbox.name = layer.layertype;
                checkbox.checked = false;

                // Create a label for the checkbox
                const label = document.createElement('label');
                label.setAttribute('for', layer.formid);  // Associate label with checkbox
                label.textContent = layer.layername;

                // Append the checkbox and label to the list item
                listItem.appendChild(checkbox);
                listItem.appendChild(label);

                // Append the list item to the parent list
                layerList.appendChild(listItem);

                // Add Bootstrap classes for styling and layout
                listItem.classList.add('list-group-item', 'd-flex', 'align-items-center');  // Make the list item a flex container
                checkbox.classList.add('form-check-input', 'me-2', 'checkbox');  // Add margin-right for spacing
                label.classList.add('form-check-label', 'stretched-link');  // Make label clickable and aligned

            });
        })
        .catch(error => {
            console.error('Error fetching layer list:', error);
        });
};

let checkboxChanged = () => {
    removeLayer();
    const checkboxes = document.querySelectorAll('.checkbox');
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            drawLayer(checkbox.value, checkbox.name);
        }
    });
};

// checkbox change event
document.getElementById('layerList').addEventListener('change', (event) => {
    const checkboxes = document.querySelectorAll('.checkbox');
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            // drawLayer(checkbox.value, checkbox.name);
            console.log(checkbox.id, checkbox.name);
        }
    });
    // map.setLayoutProperty(layerId, 'visibility', visibility);
});


window.onload = () => listLayer()
