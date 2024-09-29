
var map = L.map('map').setView([18.5761825900007, 99.01730749096882], 15);
const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
})
const grod = L.tileLayer('https://{s}.google.com/vt/lyrs=r&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    lyr: 'basemap'
});

const ghyb = L.tileLayer('https://{s}.google.com/vt/lyrs=y,m&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    lyr: 'basemap'
});

var baseMaps = {
    "แผนที่ OSM": osm,
    "แผนที่ถนน": grod.addTo(map),
    "แผนที่ภาพถ่าย": ghyb
    // "Mapbox Streets": streets
};



var apiData = {};
var mapFrames = [];
var lastPastFramePosition = -1;
var radarLayers = [];

var optionKind = 'radar'; // can be 'radar' or 'satellite'

var optionTileSize = 256; // can be 256 or 512.
var optionColorScheme = 2; // from 0 to 8. Check the https://rainviewer.com/api/color-schemes.html for additional information
var optionSmoothData = 1; // 0 - not smooth, 1 - smooth
var optionSnowColors = 1; // 0 - do not show snow colors, 1 - show snow colors

var animationPosition = 0;
var animationTimer = false;

var loadingTilesCount = 0;
var loadedTilesCount = 0;

function startLoadingTile() {
    loadingTilesCount++;
}
function finishLoadingTile() {
    setTimeout(function () { loadedTilesCount++; }, 250);
}
function isTilesLoading() {
    return loadingTilesCount > loadedTilesCount;
}

var apiRequest = new XMLHttpRequest();
apiRequest.open("GET", "https://api.rainviewer.com/public/weather-maps.json", true);
apiRequest.onload = function (e) {
    apiData = JSON.parse(apiRequest.response);
    initialize(apiData, optionKind);
};
apiRequest.send();

function initialize(api, kind) {
    for (var i in radarLayers) {
        map.removeLayer(radarLayers[i]);
    }
    mapFrames = [];
    radarLayers = [];
    animationPosition = 0;

    if (!api) {
        return;
    }
    if (kind == 'satellite' && api.satellite && api.satellite.infrared) {
        mapFrames = api.satellite.infrared;

        lastPastFramePosition = api.satellite.infrared.length - 1;
        showFrame(lastPastFramePosition, true);
    }
    else if (api.radar && api.radar.past) {
        mapFrames = api.radar.past;
        if (api.radar.nowcast) {
            mapFrames = mapFrames.concat(api.radar.nowcast);
        }

        lastPastFramePosition = api.radar.past.length - 1;
        showFrame(lastPastFramePosition, true);
    }
}

function showFrame(nextPosition, force) {
    var preloadingDirection = nextPosition - animationPosition > 0 ? 1 : -1;

    changeRadarPosition(nextPosition, false, force);
    changeRadarPosition(nextPosition + preloadingDirection, true);
}

function changeRadarPosition(position, preloadOnly, force) {
    while (position >= mapFrames.length) {
        position -= mapFrames.length;
    }
    while (position < 0) {
        position += mapFrames.length;
    }

    var currentFrame = mapFrames[animationPosition];
    var nextFrame = mapFrames[position];

    addLayer(nextFrame);
    if (preloadOnly || (isTilesLoading() && !force)) {
        return;
    }

    animationPosition = position;

    if (radarLayers[currentFrame.path]) {
        radarLayers[currentFrame.path].setOpacity(0);
    }
    radarLayers[nextFrame.path].setOpacity(100);
    var pastOrForecast = nextFrame.time > Date.now() / 1000 ? 'FORECAST' : 'PAST';

}

function stop() {
    if (animationTimer) {
        clearTimeout(animationTimer);
        animationTimer = false;
        return true;
    }
    return false;
}

function play() {
    showFrame(animationPosition + 1);
    animationTimer = setTimeout(play, 500);
}

function playStop() {
    if (!stop()) {
        play();
    }
}

function setKind(kind) {
    optionKind = kind;
    initialize(apiData, optionKind);
}

function setColors() {
    var e = document.getElementById('colors');
    optionColorScheme = e.options[e.selectedIndex].value;
    initialize(apiData, optionKind);
}

var radarLayerGroup = L.layerGroup();

function addLayer(frame) {
    if (!radarLayers[frame.path]) {
        var colorScheme = optionKind === 'satellite' ? 0 : optionColorScheme;
        var source = L.tileLayer(apiData.host + frame.path + '/' + optionTileSize + '/{z}/{x}/{y}/' + colorScheme + '/' + optionSmoothData + '_' + optionSnowColors + '.png', {
            tileSize: 256,
            opacity: 0, // Initially hidden
            zIndex: frame.time
        });

        source.on('loading', startLoadingTile);
        source.on('load', finishLoadingTile);

        radarLayers[frame.path] = source;
        radarLayerGroup.addLayer(source);
    } else if (!map.hasLayer(radarLayers[frame.path])) {
        radarLayerGroup.addLayer(radarLayers[frame.path]);
    }
}

let hpData = axios.get("https://firms.modaps.eosdis.nasa.gov/mapserver/wfs/SouthEast_Asia/c56f7d70bc06160e3c443a592fd9c87e/?SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0&TYPENAME=ms:fires_snpp_24hrs&STARTINDEX=0&COUNT=5000&SRSNAME=urn:ogc:def:crs:EPSG::4326&BBOX=5,96,22,107,urn:ogc:def:crs:EPSG::4326&outputformat=geojson");
let onEachFeatureHotspot = (feature, layer) => {
    if (feature.properties) {
        layer.bindPopup(
            `<span class="kanit"><b>ตำแหน่งจุดความร้อน</b>
            <br/>ข้อมูลจาก VIIRS
            <br/>ตำแหน่งที่พบ : ${feature.properties.latitude}, ${feature.properties.longitude} 
            <br/>ค่า Brightness temperature: ${feature.properties.brightness} Kelvin
            <br/>วันที่: ${feature.properties.acq_datetime} UTC`
        );
    }
}
var fc = L.featureGroup()
let loadHotspot = async () => {
    let hp = await hpData;
    const fs = hp.data.features;
    var geojsonMarkerOptions = {
        radius: 5,
        fillColor: "#ff5100",
        color: "#a60b00",
        weight: 0,
        opacity: 1,
        fillOpacity: 0.7
    };

    await L.geoJSON(fs, {
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, geojsonMarkerOptions);
        },
        name: "lyr",
        onEachFeature: onEachFeatureHotspot
    }).addTo(fc)
}


const token = '2b9b7d19f47c41ab2f58a00c0f61315f7a0c5926';
const aqiData = L.featureGroup();
const aqiIcons = {
    good: L.icon({
        iconUrl: './../dist/img/blue-icon.png', // Replace with your blue icon path
        iconSize: [32, 32], // Adjust icon size
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    }),
    moderate: L.icon({
        iconUrl: './../dist/img/green-icon.png', // Replace with your green icon path
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    }),
    unhealthy: L.icon({
        iconUrl: './../dist/img/yellow-icon.png', // Replace with your yellow icon path
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    }),
    very_unhealthy: L.icon({
        iconUrl: './../dist/img/orange-icon.png', // Replace with your orange icon path
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    }),
    hazardous: L.icon({
        iconUrl: './../dist/img/red-icon.png', // Replace with your red icon path
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    })
};

// Fetch AQI data
axios.get(`https://api.waqi.info/v2/map/bounds?latlng=5.5,96.5,21,106&networks=all&token=${token}`)
    .then(response => {
        const data = response.data;
        console.log(data);

        // Check if the response is successful and contains data
        if (data.status === "ok") {
            // Iterate over the AQI data
            data.data.forEach(station => {
                const { lat, lon, aqi, station: { name } } = station;

                // Determine the icon based on the AQI value
                let icon;
                if (aqi <= 25) {
                    icon = aqiIcons.good;
                } else if (aqi <= 50) {
                    icon = aqiIcons.moderate;
                } else if (aqi <= 100) {
                    icon = aqiIcons.unhealthy;
                } else if (aqi <= 200) {
                    icon = aqiIcons.very_unhealthy;
                } else {
                    icon = aqiIcons.hazardous;
                }

                const marker = L.marker([lat, lon], { icon }).addTo(aqiData);
                marker.bindPopup(`<b>${name}</b><br>AQI: ${aqi}`);
            });
        } else {
            console.error('Error fetching AQI data:', data.status);
        }
    })
    .catch(error => {
        console.error('Error fetching data from API:', error);
    });

var overlayMaps = {
    "เมฆฝน": radarLayerGroup.addTo(map),
    "จุดความร้อนปัจจุบัน": fc.addTo(map),
    "คุณภาพอากาศ": aqiData.addTo(map)
};

L.control.layers(baseMaps, overlayMaps).addTo(map);

let showAttribute = (formid, dat) => {
    var myModal = new bootstrap.Modal(document.getElementById('update_modal'));
    myModal.show();
    let desc = document.getElementById('desc');
    desc.innerHTML = '';
    axios.post('/api/load_column_description', { formid }).then(r => {
        r.data.forEach(i => {
            let data = dat[`${i.col_id}`];
            desc.innerHTML += `${i.col_name} ${data} (${i.col_desc}) <br>`;
        });
    })
}

let openAttributeByMap = async (formid, id) => {
    try {
        const colResp = await axios.post('/api/load_column_description', { formid });
        if (colResp.data.length > 0) {
            let input_update = document.getElementById('input_update');
            input_update.innerHTML = "";

            const datResp = await axios.post('/api/load_layer_by_id', { formid, id });
            colResp.data.forEach(c => {
                datResp.data.forEach(d => {
                    let data = c.col_type === 'date' ? d[`${c.col_id}`] != null ? d[`${c.col_id}`].split('T')[0] : '2024-01-01' : d[`${c.col_id}`];
                    input_update.innerHTML += `
                            <label class="form-label mb-1">${c.col_name}</label>
                            <input type="${c.col_type === 'numeric' ? 'number' : c.col_type}" class="form-control mb-1 update" name="${c.col_id}" value="${data}">`;
                });
            });
            modalUpdate.show();
        }
    } catch (error) {
        console.error('Failed to load data:', error);
    }
};

let removeLayer = () => {
    map.eachLayer(function (layer) {
        if (!(layer instanceof L.TileLayer)) {
            map.removeLayer(layer);
        }
    });
}

let listLayer = async () => {
    try {
        let layers = await axios.post('/api/list_layer')
        if (layers.data.length > 0)
            layers.data.forEach(i => {
                document.getElementById('layerList').innerHTML += `<option value="${i.formid}">${i.layername}</option>`;
            });
    } catch (error) {
        console.log('Failed to load layer:', error);
    }
}

const zoomToLayer = async (formid, id) => {
    try {
        let data = await axios.post('/api/load_layer_by_id', { formid, id });
        let geojson = JSON.parse(data.data[0].geojson);
        const geoObject = L.geoJSON(geojson);
        map.fitBounds(geoObject.getBounds());
    } catch (error) {
        console.error('Failed to zoom to layer:', error);
    }
};

const loadColumnList = async () => {
    try {
        let formid = document.getElementById('layerList').value;
        // console.log(formid);
        const layerDescription = await axios.post('/api/get_layer_description', { formid });
        const columnsResponse = await axios.post('/api/load_column_description', { formid });

        const tb = columnsResponse.data.map(i => `<th>${i.col_name}</th>`).join('');
        // const col = columnsResponse.data.map(i => ({ 'data': i.col_id, "className": "text-center" }));

        if ($.fn.DataTable.isDataTable('#table')) {
            $('#table').DataTable().clear().destroy();
        }

        document.getElementById('table').innerHTML = `<thead><tr><th>Zoom</th>${tb}</tr></thead><tbody></tbody>`;

        const table = $('#table').DataTable({
            columns: [
                {
                    "data": null,
                    "className": "text-left",
                    "defaultContent": "",
                    "render": function (data, type, row, meta) {
                        return `<button class="btn btn-primary" onclick="zoomToLayer('${formid}', '${data.id}')"><i class="bi bi-search"></i></button>`;
                    }
                },
                ...columnsResponse.data.map((i) => {
                    if (i.col_type == 'file') {
                        return {
                            'data': i.col_id,
                            "className": "text-center",
                            "render": function (data, type, row, meta) {
                                return `<img src="${data == null || data == 0 ? data = 'https://via.placeholder.com/80' : data}" height="80">`
                            }
                        }
                    } else {
                        return {
                            'data': i.col_id,
                            "className": "text-center"
                        }
                    }
                })
            ],
            scrollX: true,
            responsive: true,
            dom: '<"top"P>frtip',
            searchPanes: {
                cascadePanes: true,
                viewTotal: true,
            },
        });

        table.on('search.dt', function () {
            let resp = table.rows({ search: 'applied' }).data().toArray();
            removeLayer();
            drawSelectedLayer(resp, formid, layerDescription.data[0].layertype);
        });

        axios.post('/api/load_layer', { formid }).then(async (response) => {
            await table.clear().rows.add(response.data).draw();
            await table.searchPanes.rebuildPane();
        });

        // table.on('draw', async () => {
        //     let elements = document.getElementsByClassName('dtsp-paneInputButton dtsp-search');
        //     let columnNameToIndexMap = {};
        //     let cols = [];

        //     table.columns().header().each((value, index) => {
        //         let columnName = $(value).text();
        //         columnNameToIndexMap[columnName] = index;
        //     });

        //     for (let element of elements) {
        //         let columnName = element.getAttribute('placeholder');
        //         if (columnName && columnNameToIndexMap.hasOwnProperty(columnName)) {
        //             let index = columnNameToIndexMap[columnName];
        //             let counts = {};
        //             table.column(index).data().each((value) => {
        //                 counts[value] = (counts[value] || 0) + 1;
        //             });
        //             cols.push({ index, columnName, counts });
        //         }
        //     }
        //     removeChart();
        //     createPieCharts(cols);
        // });

    } catch (error) {
        console.error('Failed to load column list:', error);
    }
};

const removeChart = () => {
    let chartsContainer = document.getElementById('chartsContainer');
    while (chartsContainer.firstChild) {
        chartsContainer.removeChild(chartsContainer.firstChild);
    }
}

google.charts.load('current', { 'packages': ['corechart'] });
const createPieCharts = async (dataArray) => {
    await google.charts.setOnLoadCallback(() => {
        dataArray.forEach((item, index) => {
            const data = new google.visualization.DataTable();
            data.addColumn('string', 'Category');
            data.addColumn('number', 'Count');
            Object.entries(item.counts).forEach(([key, value]) => {
                data.addRow([key, value]);
            });

            const options = {
                title: item.columnName,
                height: 400,
                width: 400,
                is3D: true,
            };

            const chartContainer = document.createElement('div');

            const existingChart = document.getElementById(`chart-${index}`);
            if (existingChart) {
                existingChart.remove();
            }
            chartContainer.id = `chart-${index}`;
            chartContainer.classList.add('col');
            document.getElementById('chartsContainer').appendChild(chartContainer);

            // Draw the chart
            const chart = new google.visualization.PieChart(document.getElementById(chartContainer.id));
            chart.draw(data, options);
        });
    });
};

const pointToLayer = (feature, latlng) => {
    if (feature.properties && feature.properties.markerType == "markerIcon") {
        return L.marker(latlng, {
            icon: L.ExtraMarkers.icon({
                icon: feature.properties.style.icon,
                markerColor: feature.properties.style.markerColor,
                shape: feature.properties.style.shape,
            })
        });
    } else if (feature.properties && feature.properties.markerType == "markercircle") {
        return L.circleMarker(latlng, {
            radius: feature.properties.style.radius,
            color: feature.properties.style.color,
            fillColor: feature.properties.style.fillColor,
            fillOpacity: feature.properties.style.fillOpacity,
            weight: feature.properties.style.weight,
            dashArray: feature.properties.style.dashArray
        });
    } else {
        return L.marker(latlng);
    }
}

const onEachFeature = (feature, layer) => {
    layer.on('click', function () {
        openAttributeByMap(feature.properties.id);
    });
}

const drawSelectedLayer = async (data, formid, layerType) => {
    try {
        if (data.length > 0) {
            // let layerType = document.getElementById("layer_type").value;
            let featureGroup = L.featureGroup();
            data.forEach(async (i) => {
                try {
                    let geojsonLayer = null;
                    if (layerType == "point") {
                        let geojson = JSON.parse(i.geojson)
                        let style = JSON.parse(i.style);
                        var geojsonData = {
                            "type": "Feature",
                            "properties": {
                                "id": i.id,
                                "markerType": style && style.markerType == "markerIcon" ? "markerIcon" : style && style.markerType == "markercircle" ? "markercircle" : "marker",
                                "style": style
                            },
                            "geometry": geojson
                        };
                        geojsonLayer = await L.geoJSON(geojsonData, {
                            pointToLayer: pointToLayer,
                            onEachFeature: (feature, layer) => {
                                layer.on('click', function () {
                                    openAttributeByMap(formid, i.id);
                                });
                            }
                        });
                    } else {
                        geojsonLayer = await L.geoJSON(JSON.parse(i.geojson), {
                            id: i.id,
                            style: () => {
                                try {
                                    let style = JSON.parse(i.style);
                                    if (layerType == "linestring") {
                                        if (style) {
                                            return {
                                                weight: parseInt(style.weight, 10),
                                                color: style.color,
                                                dashArray: style.dashArray,
                                                opacity: parseFloat(style.opacity),
                                            }
                                        } else {
                                            return {
                                                weight: 3,
                                                color: '#3388ff',
                                                dashArray: '',
                                                opacity: 1
                                            }
                                        }
                                    } else {
                                        if (style) {
                                            return {
                                                dashArray: style.dashArray,
                                                weight: parseInt(style.weight, 10),
                                                color: style.color,
                                                fillColor: style.fillColor,
                                                fillOpacity: parseFloat(style.fillOpacity),
                                            }
                                        } else {
                                            return {
                                                dashArray: '',
                                                weight: 2,
                                                color: '#3388ff',
                                                fillColor: '#3388ff',
                                                fillOpacity: 0.5
                                            }
                                        }
                                    }
                                } catch (error) {
                                    console.error('Error applying style:', error);
                                }
                            },
                            onEachFeature: (feature, layer) => {
                                layer.on('click', function () {
                                    openAttributeByMap(formid, i.id);
                                });
                            }
                        });
                    }
                    featureGroup.addLayer(geojsonLayer);
                } catch (innerError) {
                    console.error('Error processing geoJSON or adding it to the map:', innerError);
                }
            });

            featureGroup.addTo(map);
            // map.fitBounds(featureGroup.getBounds());
        }
    } catch (error) {
        console.error('Error drawing selected layer:', error);
    }
};

var modalUpdate = new bootstrap.Modal(document.getElementById('modalUpdate'));

window.onload = async () => {
    listLayer();
    loadHotspot();
}



