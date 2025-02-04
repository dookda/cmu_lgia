// Initialize the map
const initMap = () => {
    const MAPTILER_KEY = 'QcH5sAeCUv5rMXKrnJms';
    const map = new maplibregl.Map({
        container: 'map',
        style: 'https://api.maptiler.com/maps/streets/style.json?key=' + MAPTILER_KEY,
        center: [100.523186, 13.736717], // Bangkok coordinates
        zoom: 10
    });

    // Add map controls
    map.addControl(new maplibregl.NavigationControl());

    // Handle base map selection
    document.getElementById('baseMapSelector').addEventListener('change', function (event) {
        const selectedStyle = event.target.value;
        let styleUrl = '';

        switch (selectedStyle) {
            case 'maptiler':
                styleUrl = 'https://api.maptiler.com/maps/streets/style.json?key=' + MAPTILER_KEY;
                break;
            case 'osm':
                styleUrl = 'https://api.maptiler.com/maps/openstreetmap/style.json?key=' + MAPTILER_KEY;
                break;
            case 'grod':
                styleUrl = 'https://api.maptiler.com/maps/streets/style.json?key=' + MAPTILER_KEY;
                break;
            case 'gsat':
                styleUrl = 'https://api.maptiler.com/maps/satellite/style.json?key=' + MAPTILER_KEY;
                break;
            case 'ghyb':
                styleUrl = 'https://api.maptiler.com/maps/hybrid/style.json?key=' + MAPTILER_KEY;
                break;
        }

        map.setStyle(styleUrl);
    });
}

// Initialize the map when the page loads
document.addEventListener('DOMContentLoaded', initMap);