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
    pitch: 45,
    antialias: true,
});

// Global object to store feature metadata (for updating styles)
const featuresMeta = {};

// --- Helper Functions ---

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
        const coordinates = e.lngLat;
        new maplibregl.Popup()
            .setLngLat(coordinates)
            .setHTML(
                `<b>Feature ID:</b> ${refid}<br>
         <button class="edit-feature btn btn-sm btn-outline-primary" data-refid="${refid}" data-type="${featuresMeta[refid].type}">Edit Symbol</button>`
            )
            .addTo(map);
    });
    map.on('mouseenter', refid, () => {
        map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', refid, () => {
        map.getCanvas().style.cursor = '';
    });
};

const openEditModal = (refid, type) => {
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
        document.getElementById('emojiSize').value = computedFontSize ? parseInt(computedFontSize) : 30;
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

const applyStyleToFeature = (id, type, values) => {
    console.log('Applying style to feature:', id, type, values);

    if (type === 'Point' && featuresMeta[id]?.marker) {
        const marker = featuresMeta[id].marker;
        const markerEl = marker.getElement();
        if (values.markerType === "simple") {
            featuresMeta[id].markerType = "simple";
            markerEl.style.backgroundColor = values.markerColor;
            markerEl.style.border = `${values.markerBorderWidth}px solid ${values.markerBorderColor}`;
            markerEl.innerHTML = "";
            markerEl.style.fontSize = "";
            markerEl.style.lineHeight = "";
        } else {
            featuresMeta[id].markerType = "emoji";
            markerEl.innerHTML = values.markerSymbol;
            markerEl.style.fontSize = values.markerEmojiSize + 'px';
            markerEl.style.lineHeight = values.markerEmojiSize + 'px';
            markerEl.style.backgroundColor = "transparent";
            markerEl.style.border = "none";
        }
    } else if (type === 'LineString') {
        map.setPaintProperty(id, 'line-color', values.lineColor);
        map.setPaintProperty(id, 'line-width', parseFloat(values.lineWidth));
        if (values.lineDash && values.lineDash.trim() !== "") {
            const dashArray = values.lineDash.split(',').map(n => parseFloat(n.trim())).filter(n => !isNaN(n));
            map.setPaintProperty(id, 'line-dasharray', dashArray);
        } else {
            map.setPaintProperty(id, 'line-dasharray', null);
        }
    } else if (type === 'Polygon') {
        map.setPaintProperty(id, 'fill-color', values.fillColor);
        map.setPaintProperty(id, 'fill-opacity', parseFloat(values.fillOpacity));
        map.setPaintProperty(`${id}_border`, 'line-color', values.polygonBorderColor);
        map.setPaintProperty(`${id}_border`, 'line-width', parseFloat(values.polygonBorderWidth));
        if (values.polygonBorderDash && values.polygonBorderDash.trim() !== "") {
            const dashArray = values.polygonBorderDash.split(',').map(n => parseFloat(n.trim())).filter(n => !isNaN(n));
            map.setPaintProperty(`${id}_border`, 'line-dasharray', dashArray);
        } else {
            map.setPaintProperty(`${id}_border`, 'line-dasharray', []);
        }
    }
};

function createMarkerElement(styleValue) {
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.style.width = '38px';
    el.style.height = '55px';
    el.style.backgroundSize = 'contain';
    el.style.cursor = 'pointer';

    switch (styleValue) {
        case 'train':
            el.style.backgroundImage =
                "url(https://api.geoapify.com/v1/icon/?type=material&color=%2323246e&icon=cloud&iconType=awesome&scaleFactor=2&apiKey=" + geoapifyKey + ")";
            break;
        case 'bus':
            el.style.backgroundImage =
                "url(https://api.geoapify.com/v1/icon/?type=awesome&color=yellow&size=large&icon=bus&iconSize=large&scaleFactor=2&apiKey=" + geoapifyKey + ")";
            break;
        case 'default':
        default:
            el.style.backgroundImage =
                "url(https://api.geoapify.com/v1/icon/?type=awesome&color=red&size=small&icon=cloud&iconSize=small&scaleFactor=2&apiKey=" + geoapifyKey + ")";
            break;
    }
    return el;
}

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
        for (const { geojson, refid, style } of features) {
            console.log('Feature:', style);

            const defaultStyle = {
                lineColor: '#ff0000',
                lineDash: "1,0",        // This is already an array
                lineWidth: 1,
                polygonBorderColor: '#000000',
                polygonBorderWidth: 0,
                fillColor: '#00ff00',
                fillOpacity: 0.8
            };

            let appliedStyle = defaultStyle;
            if (style && typeof style === 'object') {
                const parsedStyle = JSON.parse(style);
                console.log('Parsed style:', parsedStyle);

                if (Object.keys(parsedStyle).length > 0) {
                    appliedStyle = parsedStyle;
                }
            }

            // Parse the GeoJSON geometry.
            let geometry;
            try {
                geometry = JSON.parse(geojson);
            } catch (error) {
                console.error(`Invalid GeoJSON for refid ${refid}:`, error);
                continue;
            }
            if (!geometry || !geometry.type) {
                // console.error(`Empty or invalid geometry for feature: ${refid}`);
                continue;
            }
            const { type } = geometry;
            extractCoordinates(geometry);

            if (type === 'Point') {
                // Create a custom marker using the applied style.
                const customIcon = createMarkerElement(appliedStyle);
                const marker = new maplibregl.Marker({ element: customIcon })
                    .setLngLat(geometry.coordinates)
                    .addTo(map);

                featuresMeta[refid] = { type, marker };
                marker.setPopup(
                    new maplibregl.Popup({ offset: 25 }).setHTML(
                        `<b>Feature ID:</b> ${refid}<br>
                        <button id="edit-symbol" class="edit-feature btn btn-sm btn-outline-primary" data-refid="${refid}" data-type="Point">Edit Symbol</button>`
                    )
                );
            } else {
                // For non‑point geometries, add a GeoJSON source and corresponding layer.
                const sourceData = { type: 'Feature', geometry };
                if (!map.getSource(refid)) {
                    map.addSource(refid, { type: 'geojson', data: sourceData });
                }

                // Define layer configuration based on geometry type and applied style.
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
                    console.log(appliedStyle.fillColor);

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

                // Add the layer to the map if it doesn't already exist.
                if (!map.getLayer(refid)) {
                    map.addLayer(layerConfig);
                    bindFeatureEvents(refid);
                }

                // Add a border for Polygon geometries if not already present.
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

const updateFeatureSymbol = (refid, type, values) => {
    if (values.applyToAll) {
        Object.keys(featuresMeta).forEach(id => {
            if (featuresMeta[id].type === type) {
                applyStyleToFeature(id, type, values);
            }
        });
    } else {
        applyStyleToFeature(refid, type, values);
    }
};

const updateFeatureStyle = async (refid, type, values) => {
    let style;
    if (type === 'Point') {
        if (values.markerType === 'simple') {
            // Build a style string for simple markers.
            style = `simple|${values.markerColor}|${values.markerBorderColor}|${values.markerBorderWidth}`;
        } else if (values.markerType === 'emoji') {
            style = `emoji|${values.markerSymbol}|${values.markerEmojiSize}`;
        }
    } else {
        style = values;
    }
    const formid = window.currentFormId; // Set when getFeatures() was called.
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
        console.log('Feature style updated:', data);
    } catch (error) {
        console.error('Failed to update feature style:', error);
    }
};

const initMap = () => {
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
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
        await getFeatures(formid);
    });
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
}

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
            const fontSize = document.getElementById('emojiSize').value;
            document.getElementById('markerSymbol').value = chosenEmoji;
            document.getElementById('markerPreview').innerHTML = chosenEmoji;
            document.getElementById('markerPreview').style.fontSize = `${fontSize}px`;
        }
    });

    document.getElementById('emojiSize').addEventListener('input', (e) => {
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

    document.getElementById('editForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const refid = document.getElementById('featureId').value;
        const type = document.getElementById('featureType').value;
        const formData = new FormData(e.target);
        const values = Object.fromEntries(formData.entries());
        updateFeatureSymbol(refid, type, values);
        const modalEl = document.getElementById('editModal');
        const editModal = bootstrap.Modal.getInstance(modalEl);
        if (editModal) {
            editModal.hide();
        }
        updateFeatureStyle(refid, type, values);
    });

    document.addEventListener('hide.bs.modal', function (event) {
        if (document.activeElement) {
            document.activeElement.blur();
        }
    });

    initMap();
    $('#markersTable').DataTable();
});




