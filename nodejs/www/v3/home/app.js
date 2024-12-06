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

    // Handle base map selector changes
    const baseMapSelector = document.getElementById('baseMapSelector');
    baseMapSelector.addEventListener('change', (event) => {
        const selectedBaseMap = event.target.value;

        // Hide all base map layers
        map.setLayoutProperty('osm', 'visibility', 'none');
        map.setLayoutProperty('grod', 'visibility', 'none');
        map.setLayoutProperty('ghyb', 'visibility', 'none');
        map.setLayoutProperty('maptiler', 'visibility', 'none');

        // Show the selected base map layer
        map.setLayoutProperty(selectedBaseMap, 'visibility', 'visible');
    });
});
