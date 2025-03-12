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

    const THAI_MONTHS = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    // Initialize Map
    const map = new maplibregl.Map(MAP_CONFIG);
    map.addControl(new maplibregl.NavigationControl());

    // Helper Functions
    const calculateBoundingBox = (features) => {
        const bounds = new maplibregl.LngLatBounds();

        features.forEach(feature => {
            const geometry = JSON.parse(feature.geojson);
            if (geometry.type === 'Point') {
                const [lng, lat] = geometry.coordinates;
                bounds.extend([lng, lat]);
            } else if (geometry.type === 'LineString' || geometry.type === 'MultiPoint') {
                geometry.coordinates.forEach(coord => {
                    bounds.extend(coord);
                });
            } else if (geometry.type === 'Polygon' || geometry.type === 'MultiLineString') {
                geometry.coordinates.flat().forEach(coord => {
                    bounds.extend(coord);
                });
            } else if (geometry.type === 'MultiPolygon') {
                geometry.coordinates.flat(2).forEach(coord => {
                    bounds.extend(coord);
                });
            }
        });

        return bounds;
    };


    const zoomToLayerExtent = (features) => {
        const boundingBox = calculateBoundingBox(features);
        map.fitBounds(boundingBox, { padding: 50, maxZoom: 15 });
    };

    const addLayerToMap = (features, featureType) => {
        console.log('Adding layers to map:', features, featureType);

        const sourceId = 'features-source';

        // Remove existing source and layers if they exist
        if (map.getSource(sourceId)) {
            map.getSource(sourceId).setData({ type: 'FeatureCollection', features: [] });
            features.forEach(feature => {
                const layerId = `feature-layer-${feature.refid}`;
                if (map.getLayer(layerId)) {
                    map.removeLayer(layerId);
                }
            });
        } else {
            map.addSource(sourceId, {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
        }

        // Default layer configurations
        const defaultLayerConfigs = {
            point: {
                type: 'circle',
                paint: {
                    'circle-radius': 5,
                    'circle-color': '#FF0000',
                    'circle-opacity': 0.8
                }
            },
            linestring: {
                type: 'line',
                paint: {
                    'line-color': '#00FF00',
                    'line-width': 2
                }
            },
            polygon: {
                type: 'fill',
                paint: {
                    'fill-color': '#0000FF',
                    'fill-opacity': 0.5
                }
            }
        };

        // Prepare GeoJSON FeatureCollection
        const geojsonFeatures = features.map(feature => ({
            type: 'Feature',
            geometry: JSON.parse(feature.geojson),
            properties: { ...feature, refid: feature.refid }
        }));

        // Update source with all features
        map.getSource(sourceId).setData({
            type: 'FeatureCollection',
            features: geojsonFeatures
        });

        // Add individual layers for each feature
        features.forEach(feature => {
            const geometry = JSON.parse(feature.geojson);
            const layerId = `feature-layer-${feature.refid}`;
            let layerConfig;

            // Parse and validate the feature's style
            let customStyles = [];
            if (feature.style) {
                try {
                    const parsedStyles = JSON.parse(feature.style);
                    // Ensure parsedStyles is an array
                    customStyles = Array.isArray(parsedStyles) ? parsedStyles : [];
                } catch (error) {
                    console.error(`Error parsing style for feature ${feature.refid}:`, error);
                }
            }

            // Map geometry type to style ID
            const geometryType = geometry.type.toLowerCase();
            const styleMap = {
                'point': 'gl-draw-point',
                'linestring': 'gl-draw-line',
                'polygon': 'gl-draw-polygon'
            };
            const styleId = styleMap[geometryType] || '';

            // Find matching style or use default
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
                const defaultType = geometryType === 'point' ? 'point' :
                    geometryType === 'linestring' ? 'linestring' : 'polygon';
                layerConfig = {
                    id: layerId,
                    source: sourceId,
                    ...defaultLayerConfigs[defaultType],
                    filter: ['==', 'refid', feature.refid]
                };
            }

            // Add the layer
            try {
                if (!map.getLayer(layerId)) {
                    map.addLayer(layerConfig);
                }
            } catch (error) {
                console.error(`Error adding layer for feature ${feature.refid}:`, error);
            }
        });

        zoomToLayerExtent(features);
    };

    const updateBaseMap = (baseMapValue) => {
        let newStyle;
        if (baseMapValue === 'maptiler') {
            newStyle = `https://api.maptiler.com/maps/streets/style.json?key=${API_KEYS.MAPTILER}`;
        } else {
            const tileUrl = BASE_MAPS[baseMapValue];
            newStyle = {
                version: 8,
                sources: {
                    'raster-tiles': {
                        type: 'raster',
                        tiles: [tileUrl],
                        tileSize: 256,
                    }
                },
                layers: [{
                    id: 'raster-layer',
                    type: 'raster',
                    source: 'raster-tiles',
                    minzoom: 0,
                    maxzoom: 22
                }]
            };
        }

        const { center, zoom, bearing, pitch } = map.getState();
        map.setStyle(newStyle);
        map.once('style.load', () => {
            map.setCenter(center);
            map.setZoom(zoom);
            map.setBearing(bearing);
            map.setPitch(pitch);

            if (map.getSource('features-source')) {
                addLayerToMap(features, featureType);
            }
        });
    };

    const formatThaiDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        const day = date.getDate();
        const month = THAI_MONTHS[date.getMonth()];
        const year = date.getFullYear() + 543; // Convert to Buddhist Era (BE)
        return `${day} ${month} ${year}`;
    };

    const initializeDataTable = (data, columnsData) => {
        const nonEditableColumns = ['refid', 'id', 'ts', 'geojson', 'style', 'type'];

        const columns = [
            {
                title: 'Actions',
                data: null,
                orderable: false,
                searchable: false,
                render: (data, type, row) => {
                    const geometry = row.geojson ? JSON.parse(row.geojson) : { type: 'Point', coordinates: [0, 0] };
                    const geojson = JSON.stringify(geometry);
                    return `
                        <div class="btn-group">
                            <button class="btn btn-success center map-btn" data-refid="${row.refid}" data-geojson='${geojson}'>
                                <em class="icon ni ni-zoom-in"></em>
                            </button>
                            <button class="btn btn-info center edit-btn" data-refid="${row.refid}" data-type="${geometry.type}">
                                <em class="icon ni ni-color-palette"></em>
                            </button>
                            <button class="btn btn-info center attr-btn" data-refid="${row.refid}" data-type="${geometry.type}">
                                <em class="icon ni ni-chat"></em>
                            </button>
                            <button class="btn btn-info center detail-btn" data-refid="${row.refid}" data-type="${geometry.type}">
                                <em class="icon ni ni-text-rich"></em>
                            </button>
                            <button class="btn btn-danger center delete-btn" data-refid="${row.refid}">
                                <em class="icon ni ni-trash-alt"></em>
                            </button>
                        </div>`;
                }
            },
            ...Object.keys(data[0])
                .filter(key => !['geojson', 'style'].includes(key))
                .map(key => ({
                    title: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
                    data: key,
                    className: nonEditableColumns.includes(key) ? '' : 'editable',
                    visible: !['refid', 'ts'].includes(key),
                    render: (data, type, row) => {
                        if (type === 'display' && !nonEditableColumns.includes(key)) {
                            return `<div class="editable-cell">${data !== null && data !== undefined ? data : ''}</div>`;
                        }
                        return data;
                    }
                }))
        ];

        if ($.fn.DataTable.isDataTable('#dataTable')) {
            $('#dataTable').DataTable().destroy();
        }

        $('#dataTable').empty().html(`<thead><tr>${columns.map(col => `<th>${col.title}</th>`).join('')}</tr></thead><tbody></tbody>`);

        const table = $('#dataTable').DataTable({
            data,
            columns,
            autoWidth: true,
            scrollX: true,
            orderable: false,
            searchable: false,
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

        return table;
    };

    const fetchAPI = async (url, options = {}) => {
        try {
            const response = await fetch(url, {
                ...options,
                headers: { 'Content-Type': 'application/json', ...options.headers }
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    };

    // Main Execution
    const urlParams = new URLSearchParams(window.location.search);
    const formid = urlParams.get('formid');
    const featureType = urlParams.get('type')?.toLowerCase();

    if (!formid || !featureType) {
        console.error('Missing formid or feature type in URL');
        return;
    }

    try {
        const [columnsData, featuresData] = await Promise.all([
            fetchAPI(`/api/v2/load_layer_description/${formid}`),
            fetchAPI(`/api/v2/load_layer/`, { method: 'POST', body: JSON.stringify({ formid }) })
        ]);

        const table = initializeDataTable(featuresData, columnsData);

        // add promise to fetch data from DataTable
        const features = table.rows().data().toArray();
        await addLayerToMap(features, featureType);




        // Maplibre load from DataTable
        map.on('load', () => {
            // const dataTableData = table.rows().data().toArray();
            // console.log('DataTable data:', dataTableData);

            // 
        })

        document.getElementById('baseMapSelector').addEventListener('change', (e) => {
            updateBaseMap(e.target.value);
        });
    } catch (error) {
        console.error('Initialization error:', error);
    }
});