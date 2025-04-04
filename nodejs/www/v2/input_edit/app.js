document.addEventListener('DOMContentLoaded', async () => {
    try {
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
            center: [99.0173, 18.5762],
            zoom: 5,
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
            try {
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
            } catch (error) {
                console.error('Error in calculateBoundingBox:', error);
                return new maplibregl.LngLatBounds([-180, -90], [180, 90]);
            }
        };

        const zoomToLayerExtent = (features) => {
            try {
                const boundingBox = calculateBoundingBox(features);
                map.fitBounds(boundingBox, { padding: 50, maxZoom: 15 });
            } catch (error) {
                console.error('Error in zoomToLayerExtent:', error);
            }
        };

        const defaultLayerConfigs = {
            point: {
                type: 'circle',
                paint: {
                    'circle-radius': 5,
                    'circle-color': '#FF0000',
                    'circle-opacity': 0.8,
                    'circle-stroke-width': 1,
                    'circle-stroke-color': '#FFFFFF'
                }
            },
            linestring: {
                type: 'line',
                paint: { 'line-color': '#00FF00', 'line-width': 2 }
            },
            polygon: {
                type: 'fill',
                paint: { 'fill-color': '#0000FF', 'fill-opacity': 0.5 }
            }
        };

        const addLayerToMap = (features, featureType) => {
            try {
                const sourceId = 'features-source';
                if (map.getSource(sourceId)) {
                    clearSourceAndLayers(sourceId, features);
                } else {
                    map.addSource(sourceId, {
                        type: 'geojson',
                        data: { type: 'FeatureCollection', features: [] }
                    });
                }

                // Convert features to GeoJSON format
                const geojsonFeatures = features.map(feature => createGeoJSONFeature(feature));
                map.getSource(sourceId).setData({
                    type: 'FeatureCollection',
                    features: geojsonFeatures
                });

                features.forEach(feature => {
                    const geometry = parseGeometry(feature);
                    const layerId = `feature-layer-${feature.refid}`;
                    const customStyles = parseCustomStyles(feature);

                    if (geometry.type.toLowerCase() === 'polygon') {
                        addPolygonLayers(feature, sourceId, layerId, customStyles, defaultLayerConfigs);
                    } else if (geometry.type.toLowerCase() === 'linestring') {
                        addLineLayer(feature, sourceId, layerId, customStyles, defaultLayerConfigs, geometry);
                    } else {
                        addPointLayer(feature, sourceId, layerId, customStyles, defaultLayerConfigs, geometry);
                    }
                });
            } catch (error) {
                console.error('Error in addLayerToMap:', error);
            }
        };

        const clearSourceAndLayers = (sourceId, features) => {
            try {
                map.getSource(sourceId).setData({ type: 'FeatureCollection', features: [] });
                features.forEach(feature => {
                    const layerId = `feature-layer-${feature.refid}`;
                    if (map.getLayer(layerId)) map.removeLayer(layerId);
                });
            } catch (error) {
                console.error('Error in clearSourceAndLayers:', error);
            }
        };

        const createGeoJSONFeature = (feature) => {
            try {
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
            } catch (error) {
                console.error('Error in createGeoJSONFeature:', error);
                return {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [0, 0] },
                    properties: { refid: feature.refid }
                };
            }
        };

        const parseGeometry = (feature) => {
            try {
                return feature.geojson ? JSON.parse(feature.geojson) : { type: 'Point', coordinates: [0, 0] };
            } catch (error) {
                console.error(`Invalid geojson for feature ${feature.refid}:`, error);
                return { type: 'Point', coordinates: [0, 0] };
            }
        };

        const parseCustomStyles = (feature) => {
            try {
                if (!feature.style) return [];
                try {
                    const parsedStyles = JSON.parse(feature.style);
                    return Array.isArray(parsedStyles) ? parsedStyles : [];
                } catch (error) {
                    console.error(`Error parsing style for feature ${feature.refid}:`, error);
                    return [];
                }
            } catch (error) {
                console.error('Error in parseCustomStyles:', error);
                return [];
            }
        };

        const addPolygonLayers = (feature, sourceId, layerId, customStyles, defaultLayerConfigs) => {
            try {
                const fillStyle = customStyles.find(style => style.id === 'gl-draw-polygon') || {};
                const outlineStyle = customStyles.find(style => style.id === 'gl-draw-polygon-outline') || {};

                const fillLayerConfig = createLayerConfig(layerId, sourceId, fillStyle, defaultLayerConfigs.polygon, feature.refid);
                const outlineLayerConfig = createLayerConfig(`${layerId}-outline`, sourceId, outlineStyle, {
                    type: 'line',
                    paint: { 'line-color': '#000000', 'line-width': 1 }
                }, feature.refid);

                try {
                    if (!map.getLayer(fillLayerConfig.id)) map.addLayer(fillLayerConfig);
                    if (!map.getLayer(outlineLayerConfig.id)) map.addLayer(outlineLayerConfig);
                } catch (error) {
                    console.error(`Error adding polygon layers for feature ${feature.refid}:`, error);
                }
            } catch (error) {
                console.error('Error in addPolygonLayers:', error);
            }
        };

        const addLineLayer = (feature, sourceId, layerId, customStyles, defaultLayerConfigs, geometry) => {
            try {
                const styleMap = { 'linestring': 'gl-draw-line' };
                const styleId = styleMap[geometry.type.toLowerCase()] || '';
                const customStyle = customStyles.find(style => style.id === styleId) || {};

                const layerConfig = createLayerConfig(layerId, sourceId, customStyle, defaultLayerConfigs[geometry.type.toLowerCase()], feature.refid);

                try {
                    if (!map.getLayer(layerId)) map.addLayer(layerConfig);
                } catch (error) {
                    console.error(`Error adding layer for feature ${feature.refid}:`, error);
                }
            } catch (error) {
                console.error('Error in addLineLayer:', error);
            }
        };

        const addPointLayer = (feature, sourceId, layerId, customStyles, defaultLayerConfigs, geometry) => {
            try {
                const styleMap = { 'point': 'gl-draw-point' };
                const styleId = styleMap[geometry.type.toLowerCase()] || '';
                const customStyle = customStyles.find(style => style.id === styleId) || {};

                if (customStyle.metadata && customStyle.metadata['marker-icon'] !== 'none') {
                    addMarker(feature, customStyle.paint['circle-color'], customStyle.metadata['marker-icon']);
                } else {
                    const layerConfig = createLayerConfig(layerId, sourceId, customStyle, defaultLayerConfigs[geometry.type.toLowerCase()], feature.refid);

                    try {
                        if (!map.getLayer(layerId)) map.addLayer(layerConfig);
                    } catch (error) {
                        console.error(`Error adding layer for feature ${feature.refid}:`, error);
                    }
                }
            } catch (error) {
                console.error('Error in addPointLayer:', error);
            }
        };

        const createCustomMarkerIcon = (color, symbol) => {
            try {
                const img = document.createElement('img');
                img.src = `https://api.geoapify.com/v1/icon/?type=awesome&color=%23${color.slice(1)}&icon=${symbol}&size=small&scaleFactor=2&apiKey=${API_KEYS.GEOAPIFY}`;
                img.alt = 'Marker';
                img.style.width = '35px';
                img.style.height = '50px';
                return img;
            } catch (error) {
                console.error('Error in createCustomMarkerIcon:', error);
                return document.createElement('div'); // Fallback to a simple div
            }
        };

        const addMarker = (feature, color, symbol) => {
            try {
                const geometry = parseGeometry(feature);
                const coordinates = geometry.coordinates;
                const element = createCustomMarkerIcon(color, symbol);
                const offset = [0, -16];
                new maplibregl.Marker({ element, offset })
                    .setLngLat(coordinates)
                    .addTo(map);
            } catch (error) {
                console.error('Error in addMarker:', error);
            }
        };

        const createLayerConfig = (layerId, sourceId, customStyle, defaultConfig, refid) => {
            try {
                if (customStyle.type && customStyle.paint) {
                    return {
                        id: layerId,
                        source: sourceId,
                        type: customStyle.type,
                        paint: customStyle.paint,
                        filter: ['==', 'refid', refid]
                    };
                } else {
                    console.warn(`No valid custom style found for feature ${refid}. Using default.`);
                    return {
                        id: layerId,
                        source: sourceId,
                        ...defaultConfig,
                        filter: ['==', 'refid', refid]
                    };
                }
            } catch (error) {
                console.error('Error in createLayerConfig:', error);
                return {
                    id: layerId,
                    source: sourceId,
                    ...defaultConfig,
                    filter: ['==', 'refid', refid]
                };
            }
        };

        const updateBaseMap = (baseMapValue) => {
            try {
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
                    try {
                        if (features && features.length > 0 && featureType) {
                            addLayerToMap(features, featureType);
                        } else {
                            console.warn('No features or featureType available to re-add layers');
                        }
                    } catch (error) {
                        console.error('Error in setTimeout callback:', error);
                    }
                }, 50);
            } catch (error) {
                console.error('Error in updateBaseMap:', error);
            }
        };

        const isISODate = (str) => {
            try {
                const isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
                if (!isoDatePattern.test(str)) return false;
                const date = new Date(str);
                return date instanceof Date && !isNaN(date);
            } catch (error) {
                console.error('Error in isISODate:', error);
                return false;
            }
        }

        const formatThaiDate = (dateString) => {
            try {
                if (!dateString) return '';
                const date = new Date(dateString);
                if (isNaN(date.getTime())) return dateString;
                const day = date.getDate();
                const month = THAI_MONTHS[date.getMonth()];
                const year = date.getFullYear() + 543;
                return `${day} ${month} ${year}`;
            } catch (error) {
                console.error('Error in formatThaiDate:', error);
                return dateString;
            }
        };

        const generateFormFields = (columnsData, rowData) => {
            const formContainer = document.getElementById('formContainer');
            formContainer.innerHTML = '';
            console.log('columnsData', columnsData);

            columnsData.forEach(column => {
                const formGroup = document.createElement('div');
                formGroup.className = 'form-group';

                const label = document.createElement('label');
                label.textContent = column.col_name;
                label.setAttribute('for', column.col_id);

                let input;
                switch (column.col_type) {
                    case 'text':
                        input = document.createElement('input');
                        input.type = 'text';
                        input.className = 'form-control';
                        break;
                    case 'numeric':
                        input = document.createElement('input');
                        input.type = 'number';
                        input.className = 'form-control';
                        break;
                    case 'date':
                        input = document.createElement('input');
                        input.type = 'date';
                        input.className = 'form-control';
                        break;
                    case 'file':
                        input = document.createElement('image');
                        input.className = 'img-fluid';
                        break;
                    default:
                        input = document.createElement('input');
                        input.type = 'text';
                        input.className = 'form-control';
                        break;
                }

                input.id = column.col_id;
                input.name = column.col_id;
                input.placeholder = column.col_desc;

                if (rowData && rowData[column.col_id] !== undefined && column.col_type !== 'file') {
                    if (column.col_type === 'date' && isISODate(rowData[column.col_id])) {
                        input.value = formatThaiDate(rowData[column.col_id]);
                    } else {
                        input.value = rowData[column.col_id];
                    }

                    formGroup.appendChild(label);
                    formGroup.appendChild(input);
                    formContainer.appendChild(formGroup);
                } else if (column.col_type === 'file') {
                    formGroup.appendChild(label);
                    const fileUrl = rowData[column.col_id];
                    if (fileUrl) {
                        const img = document.createElement('img');
                        img.src = fileUrl;
                        img.alt = 'File';
                        img.className = 'img-fluid';
                        formGroup.appendChild(img);
                    } else {
                        const noFileText = document.createElement('p');
                        noFileText.textContent = 'ไม่มีไฟล์แนบ';
                        formGroup.appendChild(noFileText);
                    }

                    formGroup.appendChild(input);
                    formContainer.appendChild(formGroup);
                }
            });
        };

        const openAttrModal = (refid) => {
            document.getElementById('refid').value = refid;
            const modalEl = document.getElementById('attrModal');
            const attrModal = new bootstrap.Modal(modalEl);
            attrModal.show();
        };

        const deleteRow = async (formid, refid) => {
            try {
                const response = await fetch('/api/v2/delete_row', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ formid, refid })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
            } catch (error) {
                console.error('Failed to delete feature:', error);
            }
        };

        const loadColumnList = async (formid) => {
            try {
                if ($.fn.DataTable.isDataTable('#dataTable')) {
                    $('#dataTable').DataTable().destroy();
                    document.getElementById('table').innerHTML = '';
                }

                const response = await fetch('/api/v2/load_layer/' + formid);
                const responseData = await response.json();
                const structure = responseData.structure;
                const data = responseData.data;

                const buttonColumn = {
                    data: null,
                    title: 'จัดการข้อมูล',
                    orderable: true,
                    render: (data, type, row) => {
                        try {
                            let geojson;
                            try {
                                geojson = row.geojson ? JSON.parse(row.geojson) : { type: 'Point', coordinates: [0, 0] };
                            } catch (error) {
                                console.error(`Invalid GeoJSON for refid ${row.refid}:`, error);
                                geojson = { type: 'Point', coordinates: [0, 0] };
                            }
                            const _geojson = JSON.stringify(geojson);
                            const _type = geojson.type || '';

                            return `
                                <button class="btn btn-success map-btn" data-refid="${row.refid}" data-geojson='${_geojson}'>
                                    <em class="icon ni ni-zoom-in"></em>&nbsp;ซูม
                                </button>
                                <button class="btn btn-primary attr-btn" data-refid="${row.refid}" data-type='${_type}'>
                                    <em class="icon ni ni-chat"></em>&nbsp;รายละเอียด
                                </button>
                                <button class="btn btn-info detail-btn" data-refid="${row.refid}" data-type='${_type}'>
                                    <em class="icon ni ni-text-rich"></em>&nbsp;แก้ไข
                                </button>
                                <button class="btn btn-danger delete-btn" data-refid="${row.refid}">
                                    <em class="icon ni ni-trash-alt"></em>&nbsp;ลบ
                                </button>
                           `;
                        } catch (error) {
                            console.error('Error in render function:', error);
                            return '';
                        }
                    }
                };

                const dynamicColumns = structure.map(col => ({
                    data: col.col_id,
                    title: col.col_name
                }));

                const columns = [buttonColumn, ...dynamicColumns];

                const table = $('#dataTable').DataTable({
                    data: data,
                    columns: columns,
                    scrollX: true,
                    responsive: false,
                    autoWidth: true,
                });

                table.on('draw', () => {
                    try {
                        const filteredData = table.rows({ filter: 'applied' }).data().toArray();
                        addLayerToMap(filteredData, featureType);
                    } catch (error) {
                        console.error('Error in table draw event:', error);
                    }
                });

                $('#dataTable').on('click', '.map-btn', function (e) {
                    try {
                        e.stopPropagation();
                        const geojson = $(this).data('geojson');
                        const bbox = turf.bbox(geojson);
                        map.fitBounds(bbox, {
                            padding: 20,
                            duration: 1000
                        });
                    } catch (error) {
                        console.error('Failed to parse GeoJSON:', error);
                    }
                });

                $('#dataTable').on('click', '.attr-btn', function (e) {
                    e.stopPropagation();

                    const refid = $(this).data('refid');
                    const row = table.row($(this).closest('tr')).data();
                    if (row) {
                        generateFormFields(structure, row);
                        openAttrModal(refid);
                    } else {
                        console.error('Row data not found for refid:', refid);
                    }
                });

                $('#dataTable').on('click', '.detail-btn', function (e) {
                    try {
                        e.stopPropagation();
                        const refid = $(this).data('refid');
                        const type = $(this).data('type');
                        window.open(`/v2/detail/index.html?formid=${formid}&refid=${refid}&type=${type}`, '_blank');
                    } catch (error) {
                        console.error('Error in detail-btn click event:', error);
                    }
                });

                $('#dataTable').on('click', '.delete-btn', function (e) {
                    e.stopPropagation();
                    const refid = $(this).data('refid');
                    if (confirm('ยืนยันการลบ  ?')) {
                        console.log('Delete item:', refid);
                        deleteRow(formid, refid);
                        table.row($(this).closest('tr')).remove().draw(false);
                    }
                });

                return { table, structure };
            } catch (error) {
                console.error('Error fetching data:', error);
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

        const refidCreate = () => {
            const d = new Date();
            const n = d.getTime();
            return 'ref' + n;
        };

        document.getElementById('newFeature').addEventListener('click', async (e) => {
            const ref = refidCreate();
            console.log(ref);

            try {
                const response = await fetch('/api/v2/insert_row', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ formid, refid: ref })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                console.log(result);
                window.open(`/v2/detail/index.html?formid=${formid}&refid=${ref}&type=${featureType}`, '_blank');
            } catch (error) {
                console.error('Error in detail-btn click event:', error);
            }
        });

        try {
            const { table, structure } = await loadColumnList(formid);

            if (!table) {
                console.error('Failed to initialize DataTable');
                return;
            }

            features = table.rows().data().toArray();
            console.log(features);

            if (features.length === 0) {
                console.warn('No features found');
                // Optionally show a UI message
            }


            addLayerToMap(features, featureType);
            zoomToLayerExtent(features);

            document.getElementById('baseMapSelector').addEventListener('change', (e) => {
                try {
                    updateBaseMap(e.target.value);
                } catch (error) {
                    console.error('Error in baseMapSelector change event:', error);
                }
            });

            map.on('click', (e) => {
                try {
                    const features = map.queryRenderedFeatures(e.point, {
                        layers: map.getStyle().layers.map(layer => layer.id)
                    });

                    if (features.length > 0) {
                        const feature = features[0];
                        const properties = feature.properties;
                        const refid = properties.refid;
                        const row = features.find(f => f.properties.refid === refid)?.properties;
                        console.log(refid);

                        if (row) {
                            generateFormFields(structure, row);
                            openAttrModal(refid);
                        } else {
                            console.error('Row data not found for refid:', refid);
                        }
                        document.getElementById('refid').value = refid;
                        document.getElementById('type').value = featureType;
                        document.getElementById('formid').value = formid;
                    }
                } catch (error) {
                    console.error('Error in map click event:', error);
                }
            });

            map.on('mousemove', (e) => {
                try {
                    const features = map.queryRenderedFeatures(e.point, {
                        layers: map.getStyle().layers.map(layer => layer.id)
                    });

                    if (features.length > 0) {
                        map.getCanvas().style.cursor = 'pointer';
                    } else {
                        map.getCanvas().style.cursor = '';
                    }
                } catch (error) {
                    console.error('Error in mousemove event:', error);
                }
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
    } catch (error) {
        console.error('Error in DOMContentLoaded event:', error);
    }
});

const loadUserProfile = async () => {
    try {
        const response = await fetch('/auth/profile/editor');
        const data = await response.json();

        let userAvatarS = document.getElementById('userAvatarS');
        let userAvatarL = document.getElementById('userAvatarL');
        let displayName = document.getElementById('displayName');
        if (!data.success || !data.auth) {
            console.log('User not logged in');
            window.location.href = '../dashboard/index.html';
            userAvatarS.innerHTML += '<em class="icon ni ni-user-alt"></em>';
            document.getElementById('userDetail').style.display = "none";
            document.getElementById('lineLogout').style.display = "none";
            document.getElementById('userProfile').style.display = "none";
            return null
        }
        document.getElementById('lineLogin').style.display = "none";
        userAvatarS.innerHTML += `<img src="${data.user.pictureUrl}" class="avatar" alt="Profile Picture">`;
        userAvatarL.innerHTML += `<img src="${data.user.pictureUrl}" class="avatar" alt="Profile Picture">`;
        displayName.innerHTML = `${data.user.displayName}`;
    } catch (error) {
        console.error('Error loading profile:', error);
    }
};

const getTasabanInfo = async () => {
    try {
        const response = await fetch('/api/v2/info', { method: 'GET' });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();

        // Update text content
        // document.getElementById('tasabanInfo').textContent = data.name;

        // Update logo image
        const logoImg1 = document.getElementById('imgLogo1');
        const logoImg2 = document.getElementById('imgLogo2');
        if (data.img) {
            logoImg1.src = data.img;
            logoImg1.removeAttribute('srcset');
            logoImg1.onerror = () => {
                console.error('Failed to load logo image');
                logoImg1.src = './../images/logo-dark2x.png'; // Fallback
            };

            logoImg2.src = data.img;
            logoImg2.removeAttribute('srcset');
            logoImg2.onerror = () => {
                console.error('Failed to load logo image');
                logoImg2.src = './../images/logo-dark2x.png'; // Fallback
            };
        }

    } catch (error) {
        console.error('Error fetching tasaban info:', error);
        // Optional: Restore original logo on error
        document.getElementById('imgLogo').src = './../images/logo-dark2x.png';
    }
};

document.addEventListener('DOMContentLoaded', async () => {

    await loadUserProfile();
    await getTasabanInfo();
});

document.getElementById('logout').addEventListener('click', async () => {
    try {
        const response = await fetch('/auth/logout');
        const data = await response.json();
        console.log(data);

        if (!data.success) {
            throw new Error('Logout failed');
        }
        let userAvatarS = document.getElementById('userAvatarS');
        userAvatarS.innerHTML = '';
        userAvatarS.innerHTML += '<em class="icon ni ni-user-alt"></em>';

        document.getElementById('lineLogin').style.display = "block";
        document.getElementById('userDetail').style.display = "none";
        document.getElementById('lineLogout').style.display = "none";
        document.getElementById('userProfile').style.display = "none";
    } catch (error) {
        console.error('Error logging out:', error);
    }
});

