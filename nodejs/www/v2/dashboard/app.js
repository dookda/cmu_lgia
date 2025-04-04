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

        let checkedLayers = [];
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

                checkedLayers.forEach(layer => {
                    getFeatures(layer.formid, layer.layerName, layer.layerType);
                });
            } catch (error) {
                console.error('Error in updateBaseMap:', error);
            }
        };

        const defaultLayerConfigs = {
            point: { type: 'circle', paint: { 'circle-radius': 5, 'circle-color': '#FF0000', 'circle-opacity': 0.8, 'circle-stroke-width': 1, 'circle-stroke-color': '#FFFFFF' } },
            linestring: { type: 'line', paint: { 'line-color': '#00FF00', 'line-width': 2 } },
            polygon: { type: 'fill', paint: { 'fill-color': '#0000FF', 'fill-opacity': 0.5 } }
        };

        const layerReferences = {};
        const markerInstances = [];

        const createCustomMarkerIcon = (color, symbol) => {
            const img = document.createElement('img');
            img.src = `https://api.geoapify.com/v1/icon/?type=awesome&color=%23${color.slice(1)}&icon=${symbol}&size=small&scaleFactor=2&apiKey=${API_KEYS.GEOAPIFY}`;
            img.alt = 'Marker';
            img.style.width = '35px';
            img.style.height = '50px';
            return img;
        };

        const addMarker = (feature, color, symbol) => {
            try {
                const geometry = parseGeometry(feature);
                const coordinates = geometry.coordinates;
                const element = createCustomMarkerIcon(color, symbol);
                const marker = new maplibregl.Marker({ element, offset: [0, -16] })
                    .setLngLat(coordinates)
                    .addTo(map);
                markerInstances.push({ ...feature, instance: marker });
            } catch (error) {
                console.error(`Error adding marker for feature ${feature.refid}:`, error);
            }
        };

        const removeMarkers = async (formid) => {
            try {
                markerInstances.forEach(marker => {
                    marker.instance.remove();
                });
            } catch (error) {
                console.error(`Error removing markers for formid ${formid}:`, error);
            }
        };

        const addPointLayer = (feature, sourceId, layerId, customStyles, defaultLayerConfigs, geometry) => {
            try {
                const styleId = 'gl-draw-point';
                const customStyle = customStyles.find(style => style.id === styleId) || {};

                if (customStyle.metadata?.['marker-icon'] && customStyle.metadata['marker-icon'] !== 'none') {
                    const color = customStyle.paint?.['circle-color'] || '#FF0000';
                    const symbol = customStyle.metadata['marker-icon'];
                    addMarker(feature, color, symbol);
                } else {
                    const layerConfig = createLayerConfig(layerId, sourceId, customStyle, defaultLayerConfigs.point, feature.refid);
                    if (!map.getLayer(layerId)) map.addLayer(layerConfig);
                }
            } catch (error) {
                console.error(`Error in addPointLayer for feature ${feature.refid}:`, error);
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

                if (!map.getLayer(fillLayerConfig.id)) map.addLayer(fillLayerConfig);
                if (!map.getLayer(outlineLayerConfig.id)) map.addLayer(outlineLayerConfig);

                if (!layerReferences[feature.formid]) {
                    layerReferences[feature.formid] = { sourceId, layerIds: [] };
                }
                layerReferences[feature.formid].layerIds.push(fillLayerConfig.id, outlineLayerConfig.id);
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

        const addLayerToMap = (features, featureType, formid) => {
            try {
                const sourceId = `features-source-${formid}`;
                if (!map.getSource(sourceId)) {
                    map.addSource(sourceId, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
                }

                const geojsonFeatures = features.map(feature => createGeoJSONFeature(feature));
                map.getSource(sourceId).setData({ type: 'FeatureCollection', features: geojsonFeatures });

                const layerIds = [];

                features.forEach(feature => {
                    const geometry = parseGeometry(feature);
                    const layerId = `feature-layer-${feature.refid}`;
                    const customStyles = parseCustomStyles(feature);

                    if (geometry.type.toLowerCase() === 'polygon') {
                        addPolygonLayers(feature, sourceId, layerId, customStyles, defaultLayerConfigs);
                        layerIds.push(layerId, `${layerId}-outline`);
                    } else if (geometry.type.toLowerCase() === 'linestring') {
                        addLineLayer(feature, sourceId, layerId, customStyles, defaultLayerConfigs, geometry);
                        layerIds.push(layerId);
                    } else {
                        addPointLayer(feature, sourceId, layerId, customStyles, defaultLayerConfigs, geometry);
                        layerIds.push(layerId);
                    }
                });

                layerReferences[formid] = { sourceId, layerIds };
            } catch (error) {
                console.error(`Error in addLayerToMap for formid ${formid}:`, error);
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

        const createLayerConfig = (layerId, sourceId, customStyle, defaultConfig, refid) => {
            const layerConfig = {
                id: layerId,
                source: sourceId,
                filter: ['==', 'refid', refid]
            };

            if (customStyle.type && customStyle.paint) {
                layerConfig.type = customStyle.type;
                layerConfig.paint = customStyle.paint;
            } else {
                console.warn(`No valid custom style found for feature ${refid}. Using default.`);
                Object.assign(layerConfig, defaultConfig);
            }

            return layerConfig;
        };

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

        const listLayer = async () => {
            try {
                const response_division = await fetch('/api/v2/divisions', { method: 'GET' });
                if (!response_division.ok) {
                    throw new Error('Network response was not ok');
                }
                const data_division = await response_division.json();
                document.getElementById('divisionCount').textContent = data_division.length + ' หน่วยงาน';

                const response_layer = await fetch('/api/list_layer', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response_layer.ok) {
                    throw new Error('Network response_layer was not ok');
                }

                const data_layer = await response_layer.json();
                document.getElementById('layerCount').textContent = data_layer.length + ' ชั้นข้อมูล';

                const layerList = document.getElementById('layerList');

                layerList.innerHTML = data_layer.map(layer => `
                    <li class="list-group-item d-flex align-items-center">
                        <input type="checkbox" id="${layer.formid}" layername="${layer.layername}" layertype="${layer.layertype}" class="form-check-input me-2 checkbox">
                        <label for="${layer.formid}" class="form-check-label stretched-link">${layer.layername}</label>
                    </li>`).join('');
            } catch (error) {
                console.error('Error fetching layer list:', error);
            }
        };

        const removeFeatures = (formid) => {
            try {
                const layerReference = layerReferences[formid];
                if (layerReference) {
                    const { sourceId, layerIds } = layerReference;
                    layerIds.forEach(layerId => {
                        if (map.getLayer(layerId)) map.removeLayer(layerId);
                    });
                    if (map.getSource(sourceId)) map.removeSource(sourceId);
                    delete layerReferences[formid];
                }
                removeMarkers(formid);
            } catch (error) {
                console.error(`Error removing features for formid ${formid}:`, error);
            }
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

        const getFeatures = async (formid, layerName, featureType) => {
            try {
                const [featuresData] = await Promise.all([
                    fetchAPI(`/api/v2/load_layer/`, { method: 'POST', body: JSON.stringify({ formid }) }),
                ]);

                addLayerToMap(featuresData, featureType, formid);
                zoomToLayerExtent(featuresData);
            } catch (error) {
                console.error(`Error fetching features for formid ${formid}:`, error);
            }
        };

        const addLayerSelect = (checkboxId, checkboxName) => {
            const layerSelect = document.getElementById('layerSelect');
            if (![...layerSelect.options].some(opt => opt.value === checkboxId)) {
                layerSelect.appendChild(new Option(checkboxName, checkboxId));
            }
        };

        const removeLayerSelect = (checkboxId) => {
            const layerSelect = document.getElementById('layerSelect');
            const option = [...layerSelect.options].find(opt => opt.value === checkboxId);
            if (option) layerSelect.removeChild(option);
        }

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

        const loadColumnList = async (formid) => {
            try {
                if ($.fn.DataTable.isDataTable('#dataTable')) {
                    $('#dataTable').DataTable().destroy();
                    document.getElementById('dataTable').innerHTML = '';
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
                                <button class="btn btn-success map-btn f" data-refid="${row.refid}" data-geojson='${_geojson}'>
                                    <em class="icon ni ni-zoom-in"></em>&nbsp;ซูม
                                </button>
                                <button class="btn btn-primary attr-btn f" data-refid="${row.refid}" data-type='${_type}'>
                                    <em class="icon ni ni-chat"></em>&nbsp;รายละเอียด
                                </button>`;
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
                    autoWidth: true,
                });

                $('#dataTable tbody').on('click', '.map-btn', function () {
                    const refid = $(this).data('refid');
                    zoomToFeature(refid, formid, data);
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

                currentFormId = formid;
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        let popup = null;

        const togglePopup = (data, popupContent) => {
            if (popup) {
                popup.remove();
                popup = null;
                // return; 
            }

            // Create and add a new popup
            if (data.type === 'Point') {
                map.flyTo({
                    center: data.coordinates,
                    zoom: 18,
                    essential: true
                });

                popup = new maplibregl.Popup({ offset: 10 })
                    .setLngLat(data.coordinates)
                    .setHTML(popupContent)
                    .addTo(map);

            } else if (data.type === 'Polygon' || data.type === 'LineString') {
                const bbox = turf.bbox(data);
                map.fitBounds(bbox, { padding: 50 });

                const center = turf.centerOfMass(data).geometry.coordinates;

                popup = new maplibregl.Popup({ offset: 10 })
                    .setLngLat(center)
                    .setHTML(popupContent)
                    .addTo(map);
            }
        };

        const zoomToFeature = (refid, formid, featureData) => {

            const feature = featureData.find(f => f.refid === refid);
            if (!feature || !feature.geojson) return;

            const data = JSON.parse(feature.geojson);
            let popupContent = `<strong>Reference ID:</strong> ${refid}<br>`;

            Object.entries(feature).forEach(([key, value]) => {
                if (key !== 'geojson' && key !== 'refid') {
                    popupContent += `<strong>${key}:</strong> ${value}<br>`;
                }
            });

            togglePopup(data, "popupContent")
        };

        const loadUserProfile = async () => {
            try {
                const response = await fetch('/auth/profile/user');
                const data = await response.json();

                let userAvatarS = document.getElementById('userAvatarS');
                let userAvatarL = document.getElementById('userAvatarL');
                let displayName = document.getElementById('displayName');
                if (!data.success) {
                    console.log('User not logged in');

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
                document.getElementById('tasabanInfo').textContent = data.name;

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

        await loadUserProfile();
        await getTasabanInfo();
        await listLayer();

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

        document.getElementById('baseMapSelector').addEventListener('change', (e) => {
            updateBaseMap(e.target.value);
        });

        document.getElementById('layerSelect').addEventListener('change', event => {
            loadColumnList(event.target.value);
        });

        document.getElementById('layerList').addEventListener('change', event => {
            const checkbox = event.target;
            if (!checkbox.matches('.checkbox')) return; // Ensure event is from checkbox

            const inputElement = document.getElementById(checkbox.id);
            const layerName = inputElement.getAttribute('layername');
            const layerType = inputElement.getAttribute('layertype');

            if (checkbox.checked) {
                checkedLayers.push({ formid: checkbox.id, layerName, layerType });
                getFeatures(checkbox.id, layerName, layerType);
                addLayerSelect(checkbox.id, layerName);
            } else {
                checkedLayers = checkedLayers.filter(layer => layer.formid !== checkbox.id);
                removeFeatures(checkbox.id);
                removeLayerSelect(checkbox.id);
            }
        });

    } catch (error) {
        console.error('Error in DOMContentLoaded event:', error);
    }
});