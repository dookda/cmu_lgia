document.getElementById('header').innerHTML = header;
document.getElementById('listMenu').innerHTML = menuWithLayer;
document.getElementById('footer').innerHTML = footer;

// Initialize MapLibre map
// var map = new maplibregl.Map({
//     container: 'map',
//     style: 'https://demotiles.maplibre.org/style.json',
//     center: [99.01730749096882, 18.5761825900007],
//     zoom: 15
// });


const MAPTILER_KEY = 'get_your_own_OpIi9ZULNHzrESv6T2vL';
var map = new maplibregl.Map({
    style: `https://api.maptiler.com/tiles/v3-openmaptiles/{z}/{x}/{y}.json?key=${MAPTILER_KEY}`,
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
    // Add OpenStreetMap layer
    map.addSource('osm', {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
    });

    map.addLayer({
        id: 'osm',
        type: 'raster',
        source: 'osm',
        layout: { visibility: 'visible' }, // Make OSM the default visible layer
    });

    // Add Google Roads layer
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

    // Add Google Hybrid layer
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

    // Add MapTiler layer
    map.addSource('maptiler', {
        type: 'vector',
        tiles: [
            `https://api.maptiler.com/tiles/v3-openmaptiles/{z}/{x}/{y}.json?key=${MAPTILER_KEY}`
        ]
    });

    map.addLayer({
        id: 'maptiler-layer',
        type: 'fill',
        source: 'maptiler',
        'source-layer': 'openmaptiles',  // You may need to change this layer name based on the actual MapTiler setup
        paint: {
            'fill-color': '#888888',
            'fill-opacity': 0.5
        }
    });

    // Handle base map selector changes
    const baseMapSelector = document.getElementById('baseMapSelector');
    baseMapSelector.addEventListener('change', (event) => {
        const selectedBaseMap = event.target.value;

        // Hide all base map layers
        map.setLayoutProperty('osm', 'visibility', 'none');
        map.setLayoutProperty('grod', 'visibility', 'none');
        map.setLayoutProperty('ghyb', 'visibility', 'none');
        map.setLayoutProperty('maptiler', 'visibility', 'none'); // Hide MapTiler layer

        // Show the selected base map layer
        map.setLayoutProperty(selectedBaseMap, 'visibility', 'visible');
    });
});



// Function to add radar and weather layers
function loadRadarAndWeatherLayers() {
    axios.get("https://api.rainviewer.com/public/weather-maps.json")
        .then(response => {
            const apiData = response.data;

            if (apiData && apiData.radar && apiData.radar.past) {
                const frames = apiData.radar.past;

                frames.forEach((frame, index) => {
                    const frameId = `radar-${index}`;
                    map.addSource(frameId, {
                        type: 'raster',
                        tiles: [`${apiData.host}${frame.path}/256/{z}/{x}/{y}/2_1_1.png`],
                        tileSize: 256,
                    });

                    map.addLayer({
                        id: frameId,
                        type: 'raster',
                        source: frameId,
                        layout: { visibility: index === frames.length - 1 ? 'visible' : 'none' },
                    });
                });
            }
        })
        .catch(error => console.error("Error loading radar layers:", error));
}

// Function to add hotspots
function loadHotspot() {
    axios.get("https://firms.modaps.eosdis.nasa.gov/mapserver/wfs/SouthEast_Asia/c56f7d70bc06160e3c443a592fd9c87e/?SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0&TYPENAME=ms:fires_snpp_24hrs&STARTINDEX=0&COUNT=5000&SRSNAME=urn:ogc:def:crs:EPSG::4326&BBOX=5,96,22,107,urn:ogc:def:crs:EPSG::4326&outputformat=geojson")
        .then(response => {
            const features = response.data.features;

            map.addSource('hotspots', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: features,
                },
            });

            map.addLayer({
                id: 'hotspots',
                type: 'circle',
                source: 'hotspots',
                paint: {
                    'circle-radius': 5,
                    'circle-color': '#ff5100',
                },
            });
        })
        .catch(error => console.error('Error loading hotspots:', error));
}

// Add hotspots
loadHotspot();



const layers = ['osm', 'grod', 'ghyb'];
document.getElementById('layerToggle').addEventListener('change', (e) => {
    const selectedLayer = e.target.value;
    layers.forEach(layer => {
        map.setLayoutProperty(layer, 'visibility', layer === selectedLayer ? 'visible' : 'none');
    });
});