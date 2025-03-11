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

    // Function to add a layer to the map
    const calculateBoundingBox = (features) => {
        let minLng = Infinity;
        let minLat = Infinity;
        let maxLng = -Infinity;
        let maxLat = -Infinity;

        features.forEach(feature => {
            const geometry = JSON.parse(feature.geojson);
            if (geometry.type === 'Point') {
                const [lng, lat] = geometry.coordinates;
                minLng = Math.min(minLng, lng);
                minLat = Math.min(minLat, lat);
                maxLng = Math.max(maxLng, lng);
                maxLat = Math.max(maxLat, lat);
            } else if (geometry.type === 'LineString' || geometry.type === 'Polygon') {
                geometry.coordinates.flat().forEach(([lng, lat]) => {
                    minLng = Math.min(minLng, lng);
                    minLat = Math.min(minLat, lat);
                    maxLng = Math.max(maxLng, lng);
                    maxLat = Math.max(maxLat, lat);
                });
            }
        });

        return [[minLng, minLat], [maxLng, maxLat]];
    };


    const zoomToLayerExtent = (features) => {
        const boundingBox = calculateBoundingBox(features);
        map.fitBounds(boundingBox, {
            padding: 50,
            maxZoom: 15
        });
    };

    const addLayerToMap = (features, featureType) => {
        // Add the features as a GeoJSON source
        map.addSource('features-source', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: features.map(feature => ({
                    type: 'Feature',
                    geometry: JSON.parse(feature.geojson),
                    properties: feature
                }))
            }
        });

        // Add a layer based on the feature type
        switch (featureType) {
            case 'Point':
                map.addLayer({
                    id: 'features-layer',
                    type: 'circle',
                    source: 'features-source',
                    paint: {
                        'circle-radius': 5,
                        'circle-color': '#FF0000',
                        'circle-opacity': 0.8
                    }
                });
                break;

            case 'LineString':
                map.addLayer({
                    id: 'features-layer',
                    type: 'line',
                    source: 'features-source',
                    paint: {
                        'line-color': '#00FF00',
                        'line-width': 2
                    }
                });
                break;

            case 'Polygon':
                map.addLayer({
                    id: 'features-layer',
                    type: 'fill',
                    source: 'features-source',
                    paint: {
                        'fill-color': '#0000FF',
                        'fill-opacity': 0.5
                    }
                });
                break;

            default:
                console.warn(`Unsupported feature type: ${featureType}`);
                return;
        }

        // Zoom to the layer's extent
        zoomToLayerExtent(features);
    };

    const getCustomStyles = () => {
        const selectedIcon = document.getElementById('marker-icon').value;
        return [
            {
                id: 'gl-draw-point',
                type: 'circle',
                filter: ['all', ['==', '$type', 'Point']],
                paint: {
                    'circle-radius': parseInt(document.getElementById('point-radius').value),
                    'circle-color': document.getElementById('point-color').value,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#FFFFFF'
                },
                metadata: { 'marker-icon': selectedIcon }
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
    };

    const getMarkerIconFromStyles = (styles) => {
        if (!Array.isArray(styles)) return 'map-marker';
        const pointStyle = styles.find(s => s.id === 'gl-draw-point');
        return pointStyle?.metadata?.['marker-icon'] || 'map-marker';
    };

    // Function to update the base map
    const updateBaseMap = (baseMapValue) => {
        let newStyle;
        if (baseMapValue === 'maptiler') {
            newStyle = `https://api.maptiler.com/maps/streets/style.json?key=${API_KEYS.MAPTILER}`;
        } else {
            let tileUrl;
            switch (baseMapValue) {
                case 'osm': tileUrl = BASE_MAPS.osm; break;
                case 'grod': tileUrl = BASE_MAPS.grod; break;
                case 'gsat': tileUrl = BASE_MAPS.gsat; break;
                case 'ghyb': tileUrl = BASE_MAPS.ghyb; break;
            }
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

        const center = map.getCenter();
        const zoom = map.getZoom();
        const bearing = map.getBearing();
        const pitch = map.getPitch();

        map.setStyle(newStyle);
        map.once('style.load', () => {
            map.setCenter(center);
            map.setZoom(zoom);
            map.setBearing(bearing);
            map.setPitch(pitch);

            // Re-add the features layer if it exists
            if (map.getSource('features-source')) {
                addLayerToMap(features);
            }
        });
    };

    const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    function isISODate(str) {
        const isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;

        if (!isoDatePattern.test(str)) return false;

        const date = new Date(str);
        return date instanceof Date && !isNaN(date);
    }

    function formatThaiDate(dateString) {
        if (!dateString) return '';

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        const day = date.getDate();
        const month = thaiMonths[date.getMonth()];
        const year = date.getFullYear() + 543; // Convert to Buddhist Era (BE)

        return `${day} ${month} ${year}`;
    }

    const initializeDataTable = (data, columnsData) => {
        const nonEditableColumns = ['refid', 'id', 'ts', 'geojson', 'style', 'type'];

        const columns = [
            {
                title: 'Actions',
                data: null,
                orderable: false,
                searchable: false,
                render: function (data, type, row) {
                    let _type = row.geojson ? JSON.parse(row.geojson).type : '';
                    let geojson = row.geojson ? JSON.parse(row.geojson) : '';

                    if (geojson && geojson.type && geojson.coordinates) {
                        var _geojson = JSON.stringify(geojson);
                    } else {
                        // console.error('Invalid GeoJSON:', geojson);
                        geojson = { type: 'Point', coordinates: [0, 0] };
                    }

                    return `<div class="btn-group">
                        <button class="btn btn-success center map-btn" data-refid="${row.refid}" data-geojson='${_geojson}'>
                            <em class="icon ni ni-zoom-in"></em>
                        </button>
                        <button class="btn btn-info center edit-btn" data-refid="${row.refid}" data-type="${_type || ''}">
                            <em class="icon ni ni-color-palette"></em>
                        </button>
                        <button class="btn btn-info center attr-btn" data-refid="${row.refid}" data-type="${_type || ''}">
                            <em class="icon ni ni-chat"></em>
                        </button>
                        <button class="btn btn-info center detail-btn" data-refid="${row.refid}" data-type="${_type || ''}">
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
                .map(key => {
                    const isHidden = key === 'refid' || key === 'ts';
                    return {
                        title: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
                        data: key,
                        className: nonEditableColumns.includes(key) ? '' : 'editable',
                        visible: !isHidden,
                        render: function (data, type, row) {
                            if (isISODate(data)) {
                                if (type === 'display') {
                                    return formatThaiDate(data);
                                }
                                return data;
                            }

                            if (type === 'display' && !nonEditableColumns.includes(key)) {
                                return `<div class="editable-cell">${data !== null && data !== undefined ? data : ''}</div>`;
                            }
                            return data;
                        }
                    };
                })
        ];

        if ($.fn.DataTable.isDataTable('#dataTable')) {
            $('#dataTable').DataTable().destroy();
        }

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
            buttons: [
                {
                    extend: 'excel',
                    text: '<i class="fas fa-download"></i> Export to Excel',
                    className: 'btn-primary',
                    title: 'Data Export',
                    exportOptions: {
                        modifier: {
                            page: 'all'
                        }
                    }
                }
            ],
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
        const response = await fetch(url, {
            ...options,
            headers: { 'Content-Type': 'application/json', ...options.headers }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    };

    // Fetch data and initialize the map
    const urlParams = new URLSearchParams(window.location.search);
    const formid = urlParams.get('formid');
    const featureType = urlParams.get('type');

    console.log('formid:', formid);
    console.log('featureType:', featureType);


    const [columnsData, featuresData] = await Promise.all([
        fetchAPI(`/api/v2/load_layer_description/${formid}`),
        fetchAPI(`/api/v2/load_layer/`, { method: 'POST', body: JSON.stringify({ formid }) })
    ]);

    const columns = columnsData;
    const features = featuresData;

    // Initialize the DataTable
    const table = initializeDataTable(features, columns);

    // Add the features layer to the map
    map.on('load', () => {
        if (featureType) {
            addLayerToMap(features, featureType);
        } else {
            console.warn('No feature type specified in the URL.');
        }
    });

    // Handle base map selector change
    document.getElementById('baseMapSelector').addEventListener('change', (e) => {
        updateBaseMap(e.target.value);
    });
});