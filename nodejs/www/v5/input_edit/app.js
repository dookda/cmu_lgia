document.addEventListener('DOMContentLoaded', async () => {
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

    const MAP_CONFIG = {
        container: 'map',
        style: `https://api.maptiler.com/maps/streets/style.json?key=${API_KEYS.MAPTILER}`,
        center: [0, 0],
        zoom: 1,
        pitch: 0,
        antialias: true
    };

    const map = new maplibregl.Map(MAP_CONFIG);
    map.addControl(new maplibregl.NavigationControl());

    const THAI_MONTHS = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    const calculateBoundingBox = (features) => {
        const bounds = new maplibregl.LngLatBounds();
        features.forEach(feature => {
            let geometry;
            try {
                geometry = feature.geojson ? JSON.parse(feature.geojson) : null;
            } catch (error) {
                console.error(`Invalid geojson in calculateBoundingBox for feature ${feature.refid}:`, error);
                geometry = null;
            }

            if (!geometry || !geometry.type || !geometry.coordinates) {
                console.warn(`Skipping feature ${feature.refid} in bounding box calculation due to invalid geometry`);
                return;
            }

            if (geometry.type === 'Point') {
                const [lng, lat] = geometry.coordinates;
                bounds.extend([lng, lat]);
            } else if (geometry.type === 'LineString' || geometry.type === 'MultiPoint') {
                geometry.coordinates.forEach(coord => bounds.extend(coord));
            } else if (geometry.type === 'Polygon' || geometry.type === 'MultiLineString') {
                geometry.coordinates.flat().forEach(coord => bounds.extend(coord));
            } else if (geometry.type === 'MultiPolygon') {
                geometry.coordinates.flat(2).forEach(coord => bounds.extend(coord));
            }
        });

        if (bounds.isEmpty()) {
            console.warn('No valid geometries found; returning default bounds');
            return new maplibregl.LngLatBounds([-180, -90], [180, 90]);
        }
        return bounds;
    };

    const zoomToLayerExtent = (features) => {
        const boundingBox = calculateBoundingBox(features);
        map.fitBounds(boundingBox, { padding: 50, maxZoom: 15 });
    };

    const addLayerToMap = (features, featureType) => {
        console.log('Adding layers to map:', features, featureType);
        const sourceId = 'features-source';

        if (map.getSource(sourceId)) {
            map.getSource(sourceId).setData({ type: 'FeatureCollection', features: [] });
            features.forEach(feature => {
                const layerId = `feature-layer-${feature.refid}`;
                if (map.getLayer(layerId)) map.removeLayer(layerId);
            });
        } else {
            map.addSource(sourceId, {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
        }

        const defaultLayerConfigs = {
            point: {
                type: 'circle', paint: {
                    'circle-radius': 5, 'circle-color': '#FF0000', 'circle-opacity': 0.8, 'circle-stroke-width': 1, 'circle-stroke-color': '#FFFFFF'
                },
            },

            linestring: { type: 'line', paint: { 'line-color': '#00FF00', 'line-width': 2 } },
            polygon: { type: 'fill', paint: { 'fill-color': '#0000FF', 'fill-opacity': 0.5 } }
        };

        const geojsonFeatures = features.map(feature => {
            let geometry;
            try {
                geometry = feature.geojson ? JSON.parse(feature.geojson) : { type: 'Point', coordinates: [0, 0] };
            } catch (error) {
                console.error(`Invalid geojson for feature ${feature.refid}:`, error);
                geometry = { type: 'Point', coordinates: [0, 0] };
            }
            return {
                type: 'Feature',
                geometry,
                properties: { ...feature, refid: feature.refid }
            };
        });

        map.getSource(sourceId).setData({
            type: 'FeatureCollection',
            features: geojsonFeatures
        });

        features.forEach(feature => {
            let geometry;
            try {
                geometry = feature.geojson ? JSON.parse(feature.geojson) : { type: 'Point', coordinates: [0, 0] };
            } catch (error) {
                console.error(`Invalid geojson for feature ${feature.refid}:`, error);
                geometry = { type: 'Point', coordinates: [0, 0] };
            }

            const layerId = `feature-layer-${feature.refid}`;
            let layerConfig;

            let customStyles = [];
            if (feature.style) {
                try {
                    const parsedStyles = JSON.parse(feature.style);
                    customStyles = Array.isArray(parsedStyles) ? parsedStyles : [];
                } catch (error) {
                    console.error(`Error parsing style for feature ${feature.refid}:`, error);
                }
            }

            const geometryType = geometry.type.toLowerCase();
            const styleMap = { 'point': 'gl-draw-point', 'linestring': 'gl-draw-line', 'polygon': 'gl-draw-polygon' };
            const styleId = styleMap[geometryType] || '';
            const customStyle = customStyles.find(style => style.id === styleId) || {};

            if (customStyle.type && customStyle.paint) {
                layerConfig = {
                    id: layerId,
                    source: sourceId,
                    type: customStyle.type,
                    paint: customStyle.paint,
                    filter: ['==', 'refid', feature.refid]
                };
            } else {
                console.warn(`No valid custom style found for feature ${feature.refid}. Using default.`);
                const defaultType = geometryType === 'point' ? 'point' : geometryType === 'linestring' ? 'linestring' : 'polygon';
                layerConfig = {
                    id: layerId,
                    source: sourceId,
                    ...defaultLayerConfigs[defaultType],
                    filter: ['==', 'refid', feature.refid]
                };
            }

            try {
                if (!map.getLayer(layerId)) map.addLayer(layerConfig);
            } catch (error) {
                console.error(`Error adding layer for feature ${feature.refid}:`, error);
            }
        });
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

            if (features && features.length > 0 && featureType) {
                addLayerToMap(features, featureType);
            } else {
                console.warn('No features or featureType available to re-add layers');
            }
        }, 50);
    };

    function isISODate(str) {
        const isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
        if (!isoDatePattern.test(str)) return false;
        const date = new Date(str);
        return date instanceof Date && !isNaN(date);
    }

    const formatThaiDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        const day = date.getDate();
        const month = THAI_MONTHS[date.getMonth()];
        const year = date.getFullYear() + 543;
        return `${day} ${month} ${year}`;
    };

    const initializeDataTable = (data, columnsData) => {
        const nonEditableColumns = ['refid', 'id', 'ts', 'geojson', 'style', 'type'];

        const columns = [{
            title: 'Actions',
            data: null,
            orderable: false,
            searchable: false,
            render: (data, type, row) => {
                let geojson;
                try {
                    geojson = row.geojson ? JSON.parse(row.geojson) : { type: 'Point', coordinates: [0, 0] };
                } catch (error) {
                    console.error(`Invalid GeoJSON for refid ${row.refid}:`, error);
                    geojson = { type: 'Point', coordinates: [0, 0] };
                }
                const _geojson = JSON.stringify(geojson);
                const _type = geojson.type || '';
                return `<div class="btn-group">
                    <button class="btn btn-success center map-btn" data-refid="${row.refid}" data-geojson='${_geojson}'>
                        <em class="icon ni ni-zoom-in"></em>
                    </button>
                    <button class="btn btn-info center edit-btn" data-refid="${row.refid}" data-type="${_type}">
                        <em class="icon ni ni-color-palette"></em>
                    </button>
                    <button class="btn btn-info center attr-btn" data-refid="${row.refid}" data-type="${_type}">
                        <em class="icon ni ni-chat"></em>
                    </button>
                    <button class="btn btn-info center detail-btn" data-refid="${row.refid}" data-type="${_type}">
                        <em class="icon ni ni-text-rich"></em>
                    </button>
                    <button class="btn btn-danger center delete-btn" data-refid="${row.refid}">
                        <em class="icon ni ni-trash-alt"></em>
                    </button>
                </div>`;
            }
        }, ...Object.keys(data[0]).filter(key => !['geojson', 'style'].includes(key)).map(key => {
            const isHidden = key === 'refid' || key === 'ts';
            return {
                title: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
                data: key,
                className: nonEditableColumns.includes(key) ? '' : 'editable',
                visible: !isHidden,
                render: (data, type, row) => {
                    if (isISODate(data)) {
                        if (type === 'display') return formatThaiDate(data);
                        return data;
                    }
                    if (type === 'display' && !nonEditableColumns.includes(key)) {
                        return `<div class="editable-cell">${data !== null && data !== undefined ? data : ''}</div>`;
                    }
                    return data;
                }
            };
        })];

        if ($.fn.DataTable.isDataTable('#dataTable')) $('#dataTable').DataTable().destroy();
        $('#dataTable').empty();

        columns.forEach(col => {
            if (col.data === null) return;
            const match = columnsData.find(i => col.data === i.col_id);
            if (match) {
                col.title = match.col_name;
                col.type = match.col_type;
            }
        });

        const headerHtml = columns.map(col => `<th>${col.title}</th>`).join('');
        $('#dataTable').html(`<thead><tr>${headerHtml}</tr></thead><tbody></tbody>`);

        const table = $('#dataTable').DataTable({
            data,
            columns,
            autoWidth: true,
            scrollX: true,
            dom: '<"top"Bf>rt<"bottom"lip><"clear">',
            buttons: [{
                extend: 'excel',
                text: '<i class="fas fa-download"></i> Export to Excel',
                className: 'btn-primary',
                title: 'Data Export',
                exportOptions: { modifier: { page: 'all' } }
            }],
            language: {
                search: "_INPUT_",
                searchPlaceholder: "Search records...",
                lengthMenu: "Show _MENU_ entries",
                info: "Showing _START_ to _END_ of _TOTAL_ entries",
                infoEmpty: "Showing 0 to 0 of 0 entries",
                infoFiltered: "(filtered from _MAX_ total entries)"
            },
            initComplete: function () {
                $('.dataTables_filter input')
                    .before('<i class="fas fa-search" style="position: relative; left: 25px;"></i>')
                    .css('text-indent', '20px');
                $('.dataTables_length select').addClass('custom-select custom-select-sm');
            },
            responsive: false
        });

        table.on('draw', () => {
            const filteredData = table.rows({ filter: 'applied' }).data().toArray();
            addLayerToMap(filteredData, featureType);
        });

        $('#dataTable').on('click', '.detail-btn', function (e) {
            e.stopPropagation();
            const refid = $(this).data('refid');
            const type = $(this).data('type');
            window.open(`/v5/detail/index.html?formid=${formid}&refid=${refid}&type=${type}`, '_blank');
        });

        return table;
    };

    const fetchAPI = async (url, options = {}) => {
        try {
            const response = await fetch(url, {
                ...options,
                headers: { 'Content-Type': 'application/json', ...options.headers }
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}: ${errorText}`);
            }
            return response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            return { error: true, message: error.message };
        }
    };

    const urlParams = new URLSearchParams(window.location.search);
    const formid = urlParams.get('formid');
    let featureType = urlParams.get('type')?.toLowerCase();
    let features = [];

    if (!formid || !featureType) {
        console.error('Missing formid or feature type in URL');
        return;
    }

    try {
        const [columnsData, featuresData] = await Promise.all([
            fetchAPI(`/api/v2/load_layer_description/${formid}`),
            fetchAPI(`/api/v2/load_layer/`, { method: 'POST', body: JSON.stringify({ formid }) })
        ]);

        if (columnsData.error || featuresData.error) {
            console.error('API fetch failed:', columnsData.message || featuresData.message);
            return;
        }

        const table = initializeDataTable(featuresData, columnsData);
        features = table.rows().data().toArray();

        addLayerToMap(features, featureType);
        zoomToLayerExtent(features);

        console.log('Features:', features);


        document.getElementById('baseMapSelector').addEventListener('change', (e) => {
            updateBaseMap(e.target.value);
        });

        map.on('style.load', () => {
            console.log('Style loaded event fired');
        });

        map.on('error', (e) => {
            console.error('MapLibre error:', e.error);
        });
    } catch (error) {
        console.error('Initialization error:', error);
    }
});