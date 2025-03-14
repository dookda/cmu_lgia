
const API_KEYS = {
    MAPTILER: 'QcH5sAeCUv5rMXKrnJms',
    GEOAPIFY: '5c607231c8c24f9b89ff3af7a110185b'
};

const BASE_MAPS = {
    osm: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    grod: 'https://mt0.google.com/vt/lyrs=r&x={x}&y={y}&z={z}',
    ghyb: 'https://mt0.google.com/vt/lyrs=y,m&x={x}&y={y}&z={z}',
    gsat: 'https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
};

const map = new maplibregl.Map({
    container: 'map',
    style: `https://api.maptiler.com/maps/streets/style.json?key=${API_KEYS.MAPTILER}`,
    center: [0, 0],
    zoom: 1,
    pitch: 0,
    antialias: true
});

map.addControl(new maplibregl.NavigationControl());

let marker = null;
let draw = null;
let existingFeatures = null;
const offset = [0, -16];

const fetchAPI = async (url, options = {}) => {
    const response = await fetch(url, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options.headers }
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};

const saveStyle = async (formid, refid, style) => {
    return await fetchAPI(`/api/v2/update_feature_style`, {
        method: 'PUT',
        body: JSON.stringify({ formid, refid, style })
    });
};

const saveGeojson = async (formid, refid, geojson, style) => {
    return await fetchAPI(`/api/v2/update_feature`, {
        method: 'PUT',
        body: JSON.stringify({ formid, refid, geojson, style })
    });
};

const createCustomMarkerIcon = (color, symbol) => {
    const img = document.createElement('img');
    img.src = `https://api.geoapify.com/v1/icon/?type=awesome&color=%23${color.slice(1)}&icon=${symbol}&size=small&scaleFactor=2&apiKey=${API_KEYS.GEOAPIFY}`;
    img.alt = 'Marker';
    img.style.width = '35px';
    img.style.height = '50px';
    return img;
};

const updateMarker = (coordinates) => {

    const color = document.getElementById('circle-color').value;
    const icon = document.getElementById('marker-icon').value || 'M';

    if (marker) marker.remove();
    const markerIcon = createCustomMarkerIcon(color, icon);
    marker = new maplibregl.Marker({ element: markerIcon, offset })
        .setLngLat(coordinates)
        .addTo(map);
};

// Update circle marker (creates a circular element using div styling)
const updateCircleMarker = (coordinates) => {
    if (marker) marker.remove();
    const circleElement = document.createElement('div');

    const color = document.getElementById('circle-color').value;
    const radius = parseInt(document.getElementById('circle-radius').value, 10);
    const strokeColor = document.getElementById('circle-stroke-color').value;
    const strokeWidth = parseInt(document.getElementById('circle-stroke-width').value, 10);

    const diameter = radius * 2;
    circleElement.style.width = diameter + 'px';
    circleElement.style.height = diameter + 'px';
    circleElement.style.backgroundColor = color;
    circleElement.style.border = `${strokeWidth}px solid ${strokeColor}`;
    circleElement.style.borderRadius = '50%';

    marker = new maplibregl.Marker({ element: circleElement })
        .setLngLat(coordinates)
        .addTo(map);
};


const calculateBounds = (features) => {
    const bounds = new maplibregl.LngLatBounds();
    features.features.forEach(feature => {
        const geom = feature.geometry;
        if (geom.type === 'Point') bounds.extend(geom.coordinates);
        else if (geom.type === 'LineString') geom.coordinates.forEach(coord => bounds.extend(coord));
        else if (geom.type === 'Polygon') geom.coordinates[0].forEach(coord => bounds.extend(coord));
    });
    return bounds;
};

const getCustomStyles = () => {
    const style = [
        {
            id: 'gl-draw-point',
            type: 'circle',
            filter: ['all', ['==', '$type', 'Point']],
            paint: {
                'circle-radius': parseInt(document.getElementById('circle-radius').value),
                'circle-color': document.getElementById('circle-color').value,
                'circle-stroke-width': parseInt(document.getElementById('circle-stroke-width').value),
                'circle-stroke-color': document.getElementById('circle-stroke-color').value,
            },
            metadata: { 'marker-icon': document.getElementById('marker-icon').value }
        },
        {
            id: 'gl-draw-line',
            type: 'line',
            filter: ['all', ['==', '$type', 'LineString']],
            paint: {
                'line-color': document.getElementById('line-color').value,
                'line-width': parseInt(document.getElementById('line-width').value)
            }
        },
        {
            id: 'gl-draw-polygon',
            type: 'fill',
            filter: ['all', ['==', '$type', 'Polygon']],
            paint: {
                'fill-color': document.getElementById('polygon-color').value,
                'fill-opacity': parseFloat(document.getElementById('polygon-opacity').value)
            }
        },
        {
            id: 'gl-draw-polygon-outline',
            type: 'line',
            filter: ['all', ['==', '$type', 'Polygon']],
            paint: {
                'line-color': document.getElementById('line-color').value,
                'line-width': parseInt(document.getElementById('line-width').value)
            }
        }
    ];
    // console.log('Custom styles:', style);
    return style;
};

const updateBaseMap = (baseMapValue) => {
    let newStyle;
    if (baseMapValue === 'maptiler') {
        newStyle = `https://api.maptiler.com/maps/streets/style.json?key=${API_KEYS.MAPTILER}`;
    } else {
        const tileUrl = BASE_MAPS[baseMapValue];
        newStyle = {
            version: 8,
            sources: { 'raster-tiles': { type: 'raster', tiles: [tileUrl], tileSize: 256 } },
            layers: [{ id: 'raster-layer', type: 'raster', source: 'raster-tiles', minzoom: 0, maxzoom: 22 }]
        };
    }
    map.setStyle(newStyle);

    setTimeout(() => {
        const features = draw.getAll();
        if (features && features.length > 0 && featureType) {
            draw.deleteAll();
            draw.add(features);
        } else {
            console.warn('No features or featureType available to re-add layers');
        }
    }, 50);
};

const generateFormFields = (columnsData, rowData, formid, refid) => {
    const formContainer = document.getElementById('formContainer');
    formContainer.innerHTML = '';
    columnsData.forEach(column => {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        const label = document.createElement('label');
        label.textContent = column.col_name;
        label.setAttribute('for', column.col_id);
        const input = document.createElement('input');
        input.id = column.col_id;
        input.name = column.col_id;
        input.className = 'form-control';
        input.placeholder = column.col_desc;
        input.type = { text: 'text', numeric: 'number', date: 'date' }[column.col_type] || 'text';
        if (rowData?.[column.col_id] !== undefined) {
            input.value = column.col_type === 'date' && rowData[column.col_id]
                ? new Date(rowData[column.col_id]).toISOString().split('T')[0]
                : rowData[column.col_id];
        }
        formGroup.append(label, input);
        formContainer.appendChild(formGroup);
    });
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.className = 'btn btn-primary';
    saveButton.addEventListener('click', () => updateData(formid, refid));
    formContainer.appendChild(saveButton);
};

const updateData = async (formid, refid) => {
    try {
        const formData = Object.fromEntries(
            Array.from(document.getElementById('formContainer').querySelectorAll('input'))
                .map(input => [input.name, input.value])
        );
        await fetchAPI(`/api/v2/update_row/${formid}/${refid}`, {
            method: 'PUT',
            body: JSON.stringify(formData)
        });
        alert('Data updated successfully!');
    } catch (error) {
        console.error('Error updating data:', error);
        alert('Failed to update data.');
    }
};

const initDraw = (styles, type) => {
    return new MapboxDraw({
        displayControlsDefault: false,
        controls: {
            point: type === 'Point',
            line_string: type == 'LineString',
            polygon: type == 'Polygon',
            trash: false
        },
        styles: styles || getCustomStyles()
    });
};

const urlParams = new URLSearchParams(window.location.search);
const formid = urlParams.get('formid');
const refid = urlParams.get('refid');
const type = urlParams.get('type');

if (type == 'Point') {
    document.getElementById('casePoint').style.display = 'block';
    document.getElementById('caseLine').style.display = 'none';
    document.getElementById('casePolygon').style.display = 'none';
} else if (type == 'LineString') {
    document.getElementById('casePoint').style.display = 'none';
    document.getElementById('caseLine').style.display = 'block';
    document.getElementById('casePolygon').style.display = 'none';
} else if (type == 'Polygon') {
    document.getElementById('casePoint').style.display = 'none';
    document.getElementById('caseLine').style.display = 'block';
    document.getElementById('casePolygon').style.display = 'block';
}

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
    "question-circle", "exclamation-circle", "life-ring", "square", "star-of-life", "shield-alt", "bomb", "bug", "code", "terminal", "database",
    "cloud-upload-alt", "cloud-download-alt", "sync", "refresh", "cog", "archive", "circle-o", "square-o", "bell-slash", "plug", "battery-half",
    "battery-quarter", "battery-three-quarters", "lightbulb", "briefcase", "percent", "dollar-sign", "euro-sign", "yen-sign", "ruble-sign", "wheelchair",
    "wheelchair-alt", "user", "users", "user-circle", "address-book", "address-card", "id-badge", "id-card", "hand-pointer", "handshake", "envelope", "envelope-open",
    "comment", "comments", "comment-dots", "phone", "phone-square", "fax", "drum", "drum-steelpan", "volleyball-ball", "football-ball", "baseball-ball", "tennis-ball",
    "golf-ball", "skateboard", "running", "swimmer", "ticket", "mask", "user-md", "stethoscope", "heartbeat", "thermometer", "thermometer-full", "thermometer-three-quarters",
    "thermometer-half", "thermometer-quarter", "thermometer-empty", "stamp", "envelope-square", "window-close", "window-maximize", "window-minimize",
    "window-restore", "clone", "balance-scale", "balance-scale-left", "balance-scale-right", "hourglass"];

const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min)) + min;
};

function handleIconClick(iconName, element) {
    document.getElementById('marker-icon').value = iconName;
    document.querySelectorAll('#marker-panel i').forEach(icon => {
        icon.style.border = '';
    });
    // element.style.color = 'red';
    element.style.border = '2px solid red';
    displayStyle();
}

const svgCircle = document.getElementById('svg-circle');

function updateSVGCircle() {
    const fillColor = colorInput.value;
    const radius = parseInt(radiusInput.value, 10);
    const strokeColor = strokeColorInput.value;
    const strokeWidth = parseInt(strokeWidthInput.value, 10);

    svgCircle.setAttribute('fill', fillColor);
    svgCircle.setAttribute('r', radius);
    svgCircle.setAttribute('stroke', strokeColor);
    svgCircle.setAttribute('stroke-width', strokeWidth);

    displayStyle();
}

function updateStyle(type) {
    if (type === 'circle') {
        updateSVGCircle();
    } else if (type === 'marker') {
        displayStyle();
    }
}

// Attach change event listeners to each input
const colorInput = document.getElementById('circle-color');
const radiusInput = document.getElementById('circle-radius');
const strokeColorInput = document.getElementById('circle-stroke-color');
const strokeWidthInput = document.getElementById('circle-stroke-width');
colorInput.addEventListener('change', updateSVGCircle);
radiusInput.addEventListener('change', updateSVGCircle);
strokeColorInput.addEventListener('change', updateSVGCircle);
strokeWidthInput.addEventListener('change', updateSVGCircle);

function togglePanel() {
    try {
        const selectedPanel = document.querySelector('input[name="panel"]:checked').value;
        if (selectedPanel === 'circle') {
            document.getElementById('circle-panel').style.display = 'block';
            document.getElementById('marker-panel').style.display = 'none';
            document.getElementById('marker-icon').value = 'none';
        } else if (selectedPanel === 'marker') {
            document.getElementById('circle-panel').style.display = 'none';
            document.getElementById('marker-panel').style.display = 'flex';
        }
    } catch (error) {
        console.error('Error toggling panel:', error);
    }
}

const populateMarkerPanel = () => {
    try {
        let randomIconsHTML = '';
        for (let i = 0; i < 200; i++) {
            const randomIndex = getRandomInt(0, iconNames.length);
            const iconName = iconNames[randomIndex];
            randomIconsHTML += `<i class="fa fa-${iconName} pointer" style="font-size: 18px;" onclick="handleIconClick('${iconName}', this)"></i>\n`;
        }
        document.getElementById('marker-panel').innerHTML = randomIconsHTML;
    } catch (error) {
        console.error('Error populating marker panel:', error);
    }
};

const loadFeature = async (featuresData, draw) => {
    try {
        let geojsonData = featuresData[0]?.geojson ? JSON.parse(featuresData[0].geojson) : null;
        if (geojsonData) {
            existingFeatures = geojsonData.type === 'FeatureCollection'
                ? geojsonData
                : { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: geojsonData, properties: {} }] };
            draw.add(existingFeatures);
            if (existingFeatures.features.length > 0) {
                const bounds = calculateBounds(existingFeatures);
                if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 50 });
                // if (type === 'Point') updateMarker(existingFeatures.features[0].geometry.coordinates);
                if (type === 'Point') {
                    let currentMarker = document.getElementById('marker-icon').value;
                    if (currentMarker !== 'none') {
                        updateMarker(existingFeatures.features[0].geometry.coordinates);
                    } else {
                        updateCircleMarker(existingFeatures.features[0].geometry.coordinates);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error loading default features:', error);
    }
}

const initPanel = () => {
    let pointType = document.getElementById('marker-icon').value;
    if (pointType !== 'none') {
        const defaultRadio = document.querySelector('input[name="panel"][value="marker"]');
        if (defaultRadio) {
            defaultRadio.checked = true;
        }
    } else {
        const defaultRadio = document.querySelector('input[name="panel"][value="circle"]');
        if (defaultRadio) {
            defaultRadio.checked = true;
        }
    }
}

const initStyle = async (styleData) => {
    try {
        if (styleData.style) {
            let style = JSON.parse(styleData.style)
            if (style.length > 0) {
                let json = style;
                document.getElementById('circle-color').value = json[0]?.paint['circle-color'] || '#FF0000';
                document.getElementById('circle-radius').value = json[0]?.paint['circle-radius'] || 4;
                document.getElementById('circle-stroke-color').value = json[0]?.paint['circle-stroke-color'] || '#FFFFFF';
                document.getElementById('circle-stroke-width').value = json[0]?.paint['circle-stroke-width'] || 1;
                document.getElementById('marker-icon').value = json[0]?.metadata?.['marker-icon'] || 'none';
                document.getElementById('line-color').value = json[1]?.paint['line-color'] || '#00FF00';
                document.getElementById('line-width').value = json[1]?.paint['line-width'] || 2;
                document.getElementById('polygon-color').value = json[2]?.paint['fill-color'] || '#0000FF';
                document.getElementById('polygon-opacity').value = json[2]?.paint['fill-opacity'] || 0.5;

                initPanel();

                return style;
            } else {
                return getCustomStyles();
            }
        }
    } catch (error) {
        console.error('Error loading default features:', error);
    }
}

const handleDrawUpdate = async (e) => {
    try {
        const currentStyles = getCustomStyles();
        const geojsonJson = JSON.stringify(e.features[0].geometry);
        await saveGeojson(formid, refid, geojsonJson, JSON.stringify(currentStyles));
        // if (type === 'Point') updateMarker(e.features[0].geometry.coordinates);
        if (type === 'Point') {
            let currentMarker = document.getElementById('marker-icon').value;
            if (currentMarker !== 'none') {
                updateMarker(e.features[0].geometry.coordinates);
            } else {
                updateCircleMarker(e.features[0].geometry.coordinates);
            }
        }
    } catch (error) {
        console.error('Error updating feature:', error);
    }
};

const handleDrawCreate = async (e) => {
    try {
        const allFeatures = draw.getAll();
        allFeatures.features.forEach(feature => {
            if (!e.features.some(newFeature => newFeature.id === feature.id)) {
                draw.delete(feature.id);
            }
        });
        await handleDrawUpdate(e);
    } catch (error) {
        console.error('Error creating feature:', error);
    }
};

const handleDrawDelete = async () => {
    try {
        if (type === 'Point' && marker) {
            marker.remove();
            marker = null;
        }
    } catch (error) {
        console.error('Error deleting feature:', error);
    }
};

const displayStyle = async () => {
    const currentStyles = getCustomStyles();
    const currentFeatures = draw.getAll();
    map.removeControl(draw);
    draw = initDraw(currentStyles, type);
    map.addControl(draw);
    if (currentFeatures.features.length > 0) {
        draw.add(currentFeatures);
        if (type === 'Point') {
            let currentMarker = document.getElementById('marker-icon').value;
            if (currentMarker !== 'none') {
                updateMarker(currentFeatures.features[0].geometry.coordinates);
            } else {
                updateCircleMarker(currentFeatures.features[0].geometry.coordinates);
            }
        }

    } else if (existingFeatures) {
        draw.add(existingFeatures);
    }
}

document.getElementById('baseMapSelector').addEventListener('change', (e) => {
    updateBaseMap(e.target.value);
});

document.getElementById('searchLatLng').addEventListener('submit', e => {
    e.preventDefault();
    const lat = parseFloat(document.getElementById('latitude').value);
    const lng = parseFloat(document.getElementById('longitude').value);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return alert('Please enter valid latitude (-90 to 90) and longitude (-180 to 180) values.');
    }
    map.flyTo({ center: [lng, lat], zoom: 15 });
    if (marker) marker.remove();
    marker = new maplibregl.Marker().setLngLat([lng, lat]).addTo(map);
});

document.getElementById('clear-marker').addEventListener('click', () => {
    if (marker) marker.remove();
    marker = null;
    ['latitude', 'longitude'].forEach(id => document.getElementById(id).value = '');
});

document.getElementById('styleForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    displayStyle();
    const currentStyles = getCustomStyles();
    await saveStyle(formid, refid, JSON.stringify(currentStyles));
});

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const [columnsData, featuresData, styleData] = await Promise.all([
            fetchAPI(`/api/v2/load_layer_description/${formid}`),
            fetchAPI(`/api/v2/load_layer/${formid}/${refid}`),
            fetchAPI(`/api/v2/load_feature_style/${formid}/${refid}`)
        ]);

        generateFormFields(columnsData, featuresData[0], formid, refid);
        populateMarkerPanel();

        let json = await initStyle(styleData);

        draw = initDraw(json, type);
        map.addControl(draw);

        loadFeature(featuresData, draw);

        togglePanel();

        map.on('draw.create', handleDrawCreate);
        map.on('draw.update', handleDrawUpdate);
        map.on('draw.delete', handleDrawDelete);
    } catch (error) {
        console.error('Error loading default features:', error);
    }
});