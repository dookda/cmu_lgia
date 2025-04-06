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

            let selectedOption = layerSelect.value;
            if (selectedOption === 'เลือกชั้นข้อมูล') {
                document.getElementById('chartArea').style.display = 'none';
            }
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

        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        const loadColumnList = async (formid) => {

            let dataTable, columns, chart;

            try {
                if ($.fn.DataTable.isDataTable('#dataTable')) {
                    $('#dataTable').DataTable().destroy();
                    document.getElementById('dataTable').innerHTML = '';
                }

                const response = await fetch('/api/v2/load_layer/' + formid);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const { structure, data } = await response.json();

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
                                </button>
                                <button class="btn btn-info print-btn f" data-refid="${row.refid}" data-type='${_type}'>
                                    <em class="icon ni ni-printer"></em>&nbsp;รายงาน
                                </button>`;
                        } catch (error) {
                            console.error('Error in render function:', error);
                            return '';
                        }
                    }
                };

                columns = structure.map(col => ({
                    data: col.col_id,
                    title: col.col_name,
                    type: col.data_type
                }));

                const columnsWithBtn = [buttonColumn, ...columns];

                dataTable = $('#dataTable').DataTable({
                    data: data,
                    columns: columnsWithBtn,
                    dom: '<"export-title">B<"pane-title">Prtip',
                    pageLength: 25,
                    deferRender: true,
                    searchPanes: {
                        cascadePanes: true,
                        initCollapsed: true,
                        threshold: 0.5
                    },
                    buttons: [
                        {
                            extend: 'excelHtml5',
                            text: '<i class="bi bi-file-earmark-excel"></i> Excel',
                            titleAttr: 'Export to Excel',
                            className: 'btn btn-primary'
                        }, {
                            extend: 'csvHtml5',
                            text: '<i class="bi bi-file-earmark-spreadsheet"></i> CSV',
                            titleAttr: 'Export to CSV',
                            className: 'btn btn-success'
                        }, {
                            extend: 'pdfHtml5',
                            text: '<i class="bi bi-file-earmark-pdf"></i> PDF',
                            titleAttr: 'Export to PDF',
                            className: 'btn btn-danger'
                        }
                    ],
                    scrollX: true
                });

                function populateSelects() {
                    const selectIds = ['xAxisSelect', 'yAxisSelect', 'pieCategory', 'pieValue'];
                    selectIds.forEach(selectId => {
                        const select = document.getElementById(selectId);
                        select.innerHTML = columns.map(col =>
                            `<option value="${col.data}">${col.title}</option>`
                        ).join('');
                    });
                    document.getElementById('xAxisSelect').value = columns[0]?.data || '';
                    document.getElementById('yAxisSelect').value = columns[1]?.data || '';
                    document.getElementById('pieCategory').value = columns[0]?.data || '';
                    document.getElementById('pieValue').value = columns[1]?.data || '';
                }

                function toggleControls() {
                    const chartType = document.getElementById('chartType').value;
                    document.getElementById('columnControls').style.display = chartType === 'column' ? 'inline' : 'none';
                    document.getElementById('pieControls').style.display = chartType === 'pie' ? 'inline' : 'none';
                    const operation = document.getElementById('pieOperation').value;
                    document.getElementById('pieValueLabel').style.display = operation === 'sum' ? 'inline' : 'none';
                    document.getElementById('pieValue').style.display = operation === 'sum' ? 'inline' : 'none';
                }

                function updateChart() {
                    const chartType = document.getElementById('chartType').value;
                    const filteredData = dataTable.rows({ search: 'applied' }).data().toArray();

                    if (chart && typeof chart.destroy === 'function') {
                        chart.destroy();
                        chart = null;
                    }

                    if (chartType === 'column') {
                        const xCol = document.getElementById('xAxisSelect').value;
                        const yCol = document.getElementById('yAxisSelect').value;
                        if (!xCol || !yCol) return;

                        const aggregatedData = filteredData.reduce((acc, row) => {
                            const xVal = row[xCol]?.toString() || 'Unknown';
                            const yVal = parseFloat(row[yCol]) || 0;
                            acc[xVal] = (acc[xVal] || 0) + yVal;
                            return acc;
                        }, {});

                        const xColumn = columns.find(c => c.data === xCol);
                        const yColumn = columns.find(c => c.data === yCol);

                        chart = Highcharts.chart('chartContainer', {
                            chart: { type: 'column', style: { fontFamily: 'Noto Sans Thai' } },
                            title: { text: null, },
                            xAxis: {
                                categories: Object.keys(aggregatedData),
                                title: { text: xColumn.title },
                                labels: { rotation: -45 }
                            },
                            yAxis: { title: { text: yColumn.title } },
                            series: [{
                                name: yColumn.title,
                                data: Object.values(aggregatedData)
                            }],
                            plotOptions: {
                                column: { dataLabels: { enabled: true, format: '{y:,.2f}' } }
                            },
                            tooltip: { pointFormat: '{series.name}: <b>{point.y:,.2f}</b>' }
                        });
                    } else if (chartType === 'pie') {
                        const categoryCol = document.getElementById('pieCategory').value;
                        const operation = document.getElementById('pieOperation').value;
                        const valueCol = document.getElementById('pieValue').value;
                        const categoryColumn = columns.find(c => c.data === categoryCol);

                        let pieData;
                        if (operation === 'count') {
                            pieData = filteredData.reduce((acc, row) => {
                                const category = row[categoryCol]?.toString() || 'Unknown';
                                acc[category] = (acc[category] || 0) + 1;
                                return acc;
                            }, {});
                        } else { // sum
                            pieData = filteredData.reduce((acc, row) => {
                                const category = row[categoryCol]?.toString() || 'Unknown';
                                const value = parseFloat(row[valueCol]) || 0;
                                acc[category] = (acc[category] || 0) + value;
                                return acc;
                            }, {});
                        }

                        chart = Highcharts.chart('chartContainer', {
                            chart: { type: 'pie', style: { fontFamily: 'Noto Sans Thai' } },
                            title: {
                                text: `${operation === 'count' ? 'จำนวน' : 'ผลรวม'} ของ ${categoryColumn.title}`,
                                style: { fontFamily: 'Noto Sans Thai' }
                            },
                            series: [{
                                name: operation === 'count' ? 'Count' : columns.find(c => c.data === valueCol).title,
                                data: Object.entries(pieData).map(([name, y]) => ({ name, y }))
                            }],
                            plotOptions: {
                                pie: {
                                    allowPointSelect: true,
                                    cursor: 'pointer',
                                    dataLabels: {
                                        enabled: true,
                                        format: '<b>{point.name}</b>: {point.y:,.2f}',
                                        distance: 20
                                    },
                                    showInLegend: true
                                }
                            },
                            tooltip: {
                                pointFormat: '{series.name}: <b>{point.y:,.2f}</b>'
                            }
                        });
                    }
                }

                populateSelects();
                toggleControls();
                document.querySelectorAll('.chart-control').forEach(select => {
                    select.addEventListener('change', () => {
                        toggleControls();
                        updateChart();
                    });
                });

                dataTable.on('draw search', debounce(updateChart, 250));
                updateChart();

                document.getElementById('chartArea').style.display = 'block';
                document.getElementById('loading').style.display = 'none';

                $('div.export-title').html('<h6 class="f">ส่งออกข้อมูล</h6>');
                $('div.pane-title').html('<h6 class="mt-4 f">สืบค้นข้อมูล</h6>');

                $('#dataTable tbody').on('click', '.map-btn', function () {
                    const refid = $(this).data('refid');
                    zoomToFeature(refid, formid, data);
                });

                $('#dataTable').on('click', '.attr-btn', function (e) {
                    e.stopPropagation();

                    const refid = $(this).data('refid');
                    const row = dataTable.row($(this).closest('tr')).data();
                    if (row) {
                        generateFormFields(structure, row);
                        openAttrModal(refid);
                    } else {
                        console.error('Row data not found for refid:', refid);
                    }
                });

                $('#dataTable').on('click', '.print-btn', function (e) {
                    try {
                        e.stopPropagation();
                        const refid = $(this).data('refid');
                        const type = $(this).data('type');
                        window.open(`/v2/detailqr/index.html?formid=${formid}&refid=${refid}&type=${type}`, '_self');
                    } catch (error) {
                        console.error('Error in detail-btn click event:', error);
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

                document.getElementById('tasabanInfo').textContent = data.name;

                const logoImg1 = document.getElementById('imgLogo1');
                const logoImg2 = document.getElementById('imgLogo2');
                if (data.img) {
                    logoImg1.src = data.img;
                    logoImg1.removeAttribute('srcset');
                    logoImg1.onerror = () => {
                        console.error('Failed to load logo image');
                        logoImg1.src = './../images/logo-dark2x.png';
                    };

                    logoImg2.src = data.img;
                    logoImg2.removeAttribute('srcset');
                    logoImg2.onerror = () => {
                        console.error('Failed to load logo image');
                        logoImg2.src = './../images/logo-dark2x.png';
                    };
                }

            } catch (error) {
                console.error('Error fetching tasaban info:', error);
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

            document.getElementById('loading').style.display = 'block';
            document.getElementById('chartArea').style.display = 'none';
        });

        document.getElementById('layerList').addEventListener('change', event => {
            const checkbox = event.target;
            if (!checkbox.matches('.checkbox')) return;

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