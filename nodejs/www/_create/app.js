
const searchParams = new URLSearchParams(window.location.search);
const formid = searchParams.get('formid');

// create map
var map = L.map('map').setView([18.564107, 99.018610], 15);
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

var layerControl = L.control.layers(baseMaps).addTo(map);

let addDrawControl = (layertype) => {
    try {
        map.pm.addControls({
            position: 'topleft',
            drawCircleMarker: false,
            drawCircle: false,
            drawText: false,
            drawRectangle: layertype !== 'polygon' ? false : true,
            drawPolygon: layertype !== 'polygon' ? false : true,
            drawPolyline: layertype !== 'linestring' ? false : true,
            drawMarker: layertype !== 'point' ? false : true,
            rotateMode: false,
            removalMode: false,
            cutPolygon: false,
            dragMode: false,
        });
    } catch (error) {
        console.log(error);
    }
}

var geojson = "";
map.on("pm:create", (e) => {
    try {
        getColume();
        geojson = e.layer.toGeoJSON();
        modalCreate.show();
    } catch (error) {
        console.log(error);
    }
});

let getColume = async () => {
    try {
        const res = await axios.post('/api/load_column_description', { formid });
        if (res.data.length > 0) {
            let input_save = document.getElementById('input_save');
            input_save.innerHTML = "";
            res.data.forEach(i => {
                let type = i.col_type == 'numeric' ? 'number' : i.col_type;
                let accept = i.col_type == 'file' ? `accept="image/png, image/gif, image/jpeg"` : null;
                input_save.innerHTML += `<label class="form-label">${i.col_name}</label>
                                         <input type="${type}" 
                                                class="form-control mb-1 create" 
                                                ${accept}
                                                name="${i.col_id}">`
            });
        }
    } catch (error) {
        console.error('Failed to load column description:', error);
    }
}

let openAttributeByMap = async (id) => {
    try {
        document.getElementById('layer_id').value = id;

        const colResp = await axios.post('/api/load_column_description', { formid });
        if (colResp.data.length > 0) {
            let input_update = document.getElementById('input_update');
            input_update.innerHTML = "";

            const datResp = await axios.post('/api/load_layer_by_id', { formid, id });
            colResp.data.forEach(c => {
                datResp.data.forEach(d => {
                    let data = c.col_type === 'date' ? d[`${c.col_id}`] != null ? d[`${c.col_id}`].split('T')[0] : '2024-01-01' : d[`${c.col_id}`];
                    let type = c.col_type == 'numeric' ? 'number' : c.col_type;
                    let accept = c.col_type == 'file' ? `accept="image/png, image/gif, image/jpeg"` : null;
                    input_update.innerHTML += `
                            <label class="form-label mb-1">${c.col_name}</label>
                            <input  type="${type}" 
                                    ${accept} 
                                    class="form-control mb-1 update" 
                                    name="${c.col_id}" 
                                    id="${c.col_id}"
                                    value="${data}">`;
                });
            });
            modalUpdate.show();
        }
    } catch (error) {
        console.error('Failed to load data:', error);
    }
};

let openAttributeByRow = async (id) => {
    document.getElementById('layer_id').value = id;
    try {
        const colResp = await axios.post('/api/load_column_description', { formid });
        if (colResp.data.length > 0) {
            let input_update = document.getElementById('input_update');
            input_update.innerHTML = "";

            const datResp = await axios.post('/api/load_layer_by_id', { formid, id });
            colResp.data.forEach(c => {
                datResp.data.forEach(d => {
                    let data = c.col_type === 'date' ? d[`${c.col_id}`] != null ? d[`${c.col_id}`].split('T')[0] : '2024-01-01' : d[`${c.col_id}`];
                    let type = c.col_type == 'numeric' ? 'number' : c.col_type;
                    let accept = c.col_type == 'file' ? `accept="image/png, image/gif, image/jpeg"` : null;
                    input_update.innerHTML += `
                            <label class="form-label mb-1">${c.col_name}</label>
                            <input  type="${type}" 
                                    ${accept} 
                                    class="form-control mb-1 update" 
                                    name="${c.col_id}" 
                                    id="${c.col_id}"
                                    value="${data}">`;
                });
            });
            modalUpdate.show();
        }
    } catch (error) {
        console.error('Failed to load data:', error);
    }
};

let openSymbolByRow = async (id) => {
    try {
        document.getElementById('layer_id').value = id;
        let layer_type = document.getElementById('layer_type').value;

        const datResp = await axios.post('/api/load_layer_by_id', { formid, id });
        if (layer_type == "point") {
            let style = JSON.parse(datResp.data[0].style);
            if (style != null) {
                if (style.markerType == "markerIcon") {
                    document.getElementById('marker_type').value = style.markerType;
                    document.getElementById('marker_icon_type').value = style.shape;
                    document.getElementById('marker_icon_color').value = style.markerColor;
                    document.getElementById('iconName').value = style.icon;

                    document.getElementById('circlemarker_section').style.display = 'none';
                    document.getElementById('marker_icon_section').style.display = 'block';
                } else if (style.markerType == "markercircle") {
                    document.getElementById('marker_type').value = style.markerType;
                    document.getElementById('marker_radius').value = style.radius;
                    document.getElementById('marker_line_type').value = style.dashArray;
                    document.getElementById('marker_border_width').value = style.weight;
                    document.getElementById('marker_border_color').value = style.color;
                    document.getElementById('marker_fill_color').value = style.fillColor;
                    document.getElementById('marker_opacity').value = style.fillOpacity;

                    document.getElementById('circlemarker_section').style.display = 'block';
                    document.getElementById('marker_icon_section').style.display = 'none';
                } else {
                    document.getElementById('marker_type').value = style.markerType;
                    document.getElementById('marker_icon_type').value = style.shape;
                    document.getElementById('circlemarker_section').style.display = 'none';
                    document.getElementById('marker_icon_section').style.display = 'none';
                }
            } else {
                document.getElementById('marker_type').value = 'marker';
                document.getElementById('circlemarker_section').style.display = 'none';
                document.getElementById('marker_icon_section').style.display = 'none';
            }
        } else if (layer_type == "linestring") {
            let style = JSON.parse(datResp.data[0].style);
            if (style != null) {
                document.getElementById('line_type').value = style.dashArray;
                document.getElementById('line_border_width').value = style.weight;
                document.getElementById('line_border_color').value = style.color;
                document.getElementById('line_opacity').value = style.opacity;
            } else {
                document.getElementById('line_type').value = '0';
                document.getElementById('line_border_width').value = 3;
                document.getElementById('line_border_color').value = '#3388ff';
                document.getElementById('line_opacity').value = 1;
            }
        } else {
            let style = JSON.parse(datResp.data[0].style);
            if (style != null) {
                document.getElementById('polygon_border_type').value = style.dashArray;
                document.getElementById('polygon_border_width').value = style.weight;
                document.getElementById('polygon_border_color').value = style.color;
                document.getElementById('polygon_fill_color').value = style.fillColor;
                document.getElementById('polygon_opacity').value = style.fillOpacity;
            } else {
                document.getElementById('polygon_border_type').value = '0';
                document.getElementById('polygon_border_width').value = 2;
                document.getElementById('polygon_border_color').value = '#3388ff';
                document.getElementById('polygon_fill_color').value = '#3388ff';
                document.getElementById('polygon_opacity').value = 0.5;
            }
        }
        modalEditSymbol.show();
    } catch (error) {
        console.error('Failed to open symbol by row:', error);
    }
};

const openSymbolByMap = async () => {
    openSymbolByRow(document.getElementById('layer_id').value);
}

let saveStyle = async () => {
    try {
        let layerType = document.getElementById("layer_type").value;
        let markerType = document.getElementById("marker_type").value;
        let layerid = document.getElementById("layer_id").value;

        let layerstyle = {};

        if (layerType == "point") {
            if (markerType == "markerIcon") {
                layerstyle = {
                    markerType: document.getElementById("marker_type").value,
                    icon: document.getElementById("iconName").value,
                    markerColor: document.getElementById("marker_icon_color").value,
                    shape: document.getElementById("marker_icon_type").value,
                }
            } else if (markerType == "markercircle") {
                layerstyle = {
                    markerType: document.getElementById("marker_type").value,
                    radius: document.getElementById("marker_radius").value,
                    dashArray: document.getElementById("marker_line_type").value,
                    weight: document.getElementById("marker_border_width").value,
                    color: document.getElementById("marker_border_color").value,
                    fillColor: document.getElementById("marker_fill_color").value,
                    fillOpacity: document.getElementById("marker_opacity").value,
                }
            } else {
                layerstyle = {
                    markerType: document.getElementById("marker_type").value,
                };
            }

        } else if (layerType == "linestring") {
            layerstyle = {
                dashArray: document.getElementById("line_type").value,
                weight: document.getElementById("line_border_width").value,
                color: document.getElementById("line_border_color").value,
                opacity: document.getElementById("line_opacity").value,
            }
        } else {
            layerstyle = {
                dashArray: document.getElementById("polygon_border_type").value,
                weight: document.getElementById("polygon_border_width").value,
                color: document.getElementById("polygon_border_color").value,
                fillColor: document.getElementById("polygon_fill_color").value,
                fillOpacity: document.getElementById("polygon_opacity").value
            }
        }

        console.log(formid, layerid, layerstyle);
        const res = await axios.post("/api/update_style", { formid, layerid, layerstyle: JSON.stringify(layerstyle) });

        document.getElementById('message').innerHTML = 'บันทึกข้อมูลเรียบร้อยแล้ว';
        modalNotify.show();
    } catch (error) {
        console.error('Failed to save style:', error);
    }
};

let polyStyle = (feature) => {
    console.log(feature);
    try {
        let layerType = document.getElementById("layer_type").value;

        if (layerType == "linestring") {
            let dashArray = document.getElementById("line_type").value;
            let weight = document.getElementById("line_border_width").value;
            let color = document.getElementById("line_border_color").value;
            let opacity = document.getElementById("line_opacity").value;

            return {
                weight: parseInt(weight, 10),
                color,
                dashArray,
                opacity: parseFloat(opacity),
            }
        } else {
            let dashArray = document.getElementById("polygon_border_type").value;
            let weight = document.getElementById("polygon_border_width").value;
            let color = document.getElementById("polygon_border_color").value;
            let fillColor = document.getElementById("polygon_fill_color").value;
            let fillOpacity = document.getElementById("polygon_opacity").value;
            return {
                dashArray,
                weight: parseInt(weight, 10),
                color,
                fillColor,
                fillOpacity: parseFloat(fillOpacity),
            }
        }
    } catch (error) {
        console.error('Error applying style:', error);
        return {};
    }
};

let getMarker = () => {
    let marker_type = document.getElementById('marker_type').value;
    map.eachLayer(async function (layer) {
        try {
            // console.log(layer);
            if (layer.feature.properties) {
                let layer_id = document.getElementById('layer_id').value;
                if (marker_type == "markerIcon") {
                    document.getElementById('circlemarker_section').style.display = 'none';
                    document.getElementById('marker_icon_section').style.display = 'block';
                    if (layer.feature.properties.id == Number(layer_id)) {
                        let icon = await document.getElementById("iconName").value
                        let markerColor = await document.getElementById("marker_icon_color").value
                        let shape = await document.getElementById("marker_icon_type").value

                        // console.log(icon, markerColor, shape);
                        layer.setIcon(L.ExtraMarkers.icon({
                            icon: icon,
                            markerColor: markerColor,
                            shape: shape,
                        }));
                    }
                } else if (marker_type == "markercircle") {
                    document.getElementById('circlemarker_section').style.display = 'block';
                    document.getElementById('marker_icon_section').style.display = 'none';

                    const marker_radius = document.getElementById('marker_radius');
                    const _marker_radius = document.getElementById('_marker_radius');
                    _marker_radius.textContent = marker_radius.value;

                    let marker_line_type = document.getElementById('marker_line_type').value;

                    const marker_border_width = document.getElementById('marker_border_width');
                    const _marker_border_width = document.getElementById('_marker_border_width');
                    _marker_border_width.textContent = marker_border_width.value;

                    const marker_border_color = document.getElementById('marker_border_color');
                    const _marker_border_color = document.getElementById('_marker_border_color');
                    _marker_border_color.textContent = marker_border_color.value;

                    const marker_fill_color = document.getElementById('marker_fill_color');
                    const _marker_fill_color = document.getElementById('_marker_fill_color');
                    _marker_fill_color.textContent = marker_fill_color.value;

                    const marker_opacity = document.getElementById('marker_opacity');
                    const _marker_opacity = document.getElementById('_marker_opacity');
                    _marker_opacity.textContent = marker_opacity.value;

                    if (layer.feature.properties.id == Number(layer_id) && !(layer instanceof L.CircleMarker)) {
                        map.removeLayer(layer);
                        let newLayer = L.circleMarker(layer.getLatLng(), {
                            radius: parseInt(document.getElementById("marker_radius").value, 10),
                            color: document.getElementById("marker_border_color").value,
                            fillColor: document.getElementById("marker_fill_color").value,
                            fillOpacity: parseFloat(document.getElementById("marker_opacity").value),
                            weight: parseInt(document.getElementById("marker_border_width").value, 10),
                            dashArray: document.getElementById("marker_line_type").value
                        }).addTo(map);
                        newLayer.feature = layer.feature;
                    } else if (layer.feature.properties.id == Number(layer_id) && layer instanceof L.CircleMarker) {
                        layer.setStyle({
                            radius: parseInt(document.getElementById("marker_radius").value, 10),
                            color: document.getElementById("marker_border_color").value,
                            fillColor: document.getElementById("marker_fill_color").value,
                            fillOpacity: parseFloat(document.getElementById("marker_opacity").value),
                            weight: parseInt(document.getElementById("marker_border_width").value, 10),
                            dashArray: document.getElementById("marker_line_type").value
                        });
                    }

                } else {
                    document.getElementById('circlemarker_section').style.display = 'none';
                    document.getElementById('marker_icon_section').style.display = 'none';
                    if (layer.feature.properties.id == Number(layer_id)) {
                        if (layer.setIcon && layer instanceof L.Marker) {
                            layer.setIcon(new L.Icon.Default());
                        }
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }
    });
};

const getLine = () => {
    map.eachLayer(async function (layer) {
        try {
            if (layer.options) {
                let layer_id = document.getElementById('layer_id').value;
                if (layer.options.id == Number(layer_id) && layer instanceof L.Polyline) {
                    layer.setStyle(polyStyle());
                }
            }
        } catch (error) {
            console.log(error);
        }
    });
}

const getPolygon = () => {
    map.eachLayer(async function (layer) {
        try {
            if (layer.options) {
                let layer_id = document.getElementById('layer_id').value;
                if (layer.options.id == Number(layer_id) && layer instanceof L.Polyline) {
                    layer.setStyle(polyStyle());
                }
            }
        } catch (error) {
            console.log(error);
        }
    });
}

let removeLayer = () => {
    try {
        map.eachLayer(function (layer) {
            if (!(layer instanceof L.TileLayer)) {
                map.removeLayer(layer);
            }
        });
    } catch (error) {
        console.log(error);
    }
}

let getLayerDescription = async () => {
    try {
        const response = await axios.post('/api/get_layer_description', { formid });
        if (response.data.length > 0) {
            let layerType = response.data[0].layertype;
            document.getElementById("layer_type").value = layerType;
            let marker_section = document.getElementById("marker_section");
            let line_section = document.getElementById("line_section");
            let polygon_section = document.getElementById("polygon_section");

            marker_section.style.display = 'none';
            line_section.style.display = 'none';
            polygon_section.style.display = 'none';

            switch (layerType) {
                case "point":
                    marker_section.style.display = 'block';
                    break;
                case "linestring":
                    line_section.style.display = 'block';
                    break;
                case "polygon":
                    polygon_section.style.display = 'block';
                    break;
                default:
                    console.log("Unknown layer type.");
            }

            addDrawControl(layerType);
            document.getElementById('_layername').innerHTML = response.data[0].layername;
        } else {
            console.log("No data found for the specified formid.");
        }
    } catch (error) {
        console.error('Failed to get layer description:', error);
    }
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

const drawSelectedLayer = async (data) => {
    try {
        if (data.length > 0) {
            let layerType = document.getElementById("layer_type").value;
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
                            onEachFeature: onEachFeature
                        });
                    } else {
                        geojsonLayer = await L.geoJSON(JSON.parse(i.geojson), {
                            id: i.id,
                            style: () => {
                                try {
                                    let style = JSON.parse(i.style);
                                    let layerType = document.getElementById("layer_type").value;

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
                                    openAttributeByMap(i.id);
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
}

const zoomToLayer = async (id) => {
    try {
        let data = await axios.post('/api/load_layer_by_id', { formid, id });
        let geojson = JSON.parse(data.data[0].geojson);
        const geoObject = L.geoJSON(geojson);
        map.fitBounds(geoObject.getBounds());
    } catch (error) {
        console.error('Failed to zoom to layer:', error);
    }
};

const getData = async () => {
    try {
        const columnsResponse = await axios.post('/api/load_column_description', { formid });

        const tb = `<th>ID</th>
                    <th>จัดการข้อมูล&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</th>` + columnsResponse.data.map(i => `<th>${i.col_name}</th>`).join('');
        const col = [
            {
                "data": null,
                "className": "text-center",
                "render": function (data, type, row, meta) {
                    return meta.row + 1;
                }
            }, {
                "data": null,
                "className": "text-left",
                "render": function (data, type, row, meta) {
                    return `<button class="btn btn-primary" onclick="zoomToLayer(${data.id})"><i class="bi bi-search"></i> </button>
                            <button class="btn btn-warning" onclick="openAttributeByRow(${data.id})"><i class="bi bi-tools"></i> </button>
                            <button class="btn btn-info" onclick="openSymbolByRow(${data.id})"><i class="bi bi-palette"></i> </button>
                            <button class="btn btn-danger" onclick="confirmDelete(${data.id})"><i class="bi bi-trash3-fill"></i> </button>`
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
        ];

        if ($.fn.DataTable.isDataTable('#table')) {
            $('#table').DataTable().destroy();
            document.getElementById('table').innerHTML = '';
        }

        const tableStructure = `<thead><tr>${tb}</tr></thead><tbody></tbody>`;
        document.getElementById('table').innerHTML = tableStructure;
        const response = await axios.post('/api/load_layer', { formid });
        const r = response.data;

        let table = $('#table').DataTable({
            data: r,
            columns: col,
            scrollX: true,
            colReorder: true
        });

        let resp = table.data().toArray();
        removeLayer();
        drawSelectedLayer(resp);

        table.on('search.dt', async function () {
            resp = table.rows({ search: 'applied' }).data().toArray();
            removeLayer();
            drawSelectedLayer(resp);
        });
    } catch (error) {
        console.error('Failed to load column list:', error);
    }
};

let editFromRow = (id) => {
    try {
        document.getElementById('layer_id').value = data.id;
    } catch (error) {
        console.error('Failed to edit row:', error);
    }
}

let saveData = async () => {
    try {
        let inputs = document.querySelectorAll('.create');
        let dataarr = [];
        let promises = [];

        inputs.forEach((input) => {
            if (input.type == 'file' && input.files.length > 0) {
                let promise = new Promise((resolve, reject) => {
                    let reader = new FileReader();
                    reader.onload = (e) => {
                        dataarr.push({ name: input.name, value: e.target.result, type: input.type });
                        resolve();
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(input.files[0]);
                });

                promises.push(promise);
            } else {
                dataarr.push({ name: input.name, value: input.value, type: input.type });
            }
        });

        await Promise.all(promises);

        await axios.post('/api/save_layer', {
            formid,
            geojson: JSON.stringify(geojson.geometry),
            dataarr: JSON.stringify(dataarr),
        });

        await getData();
    } catch (error) {
        console.error('Failed to update layer data:', error);
    }
};

let updateDataAtt = async () => {
    try {
        let id = document.getElementById('layer_id').value;
        let inputs = document.querySelectorAll('.update');
        let dataarr = [];
        let promises = [];

        inputs.forEach((input) => {
            if (input.type == 'file' && input.files.length > 0) {
                let promise = new Promise((resolve, reject) => {
                    let reader = new FileReader();
                    reader.onload = (e) => {
                        dataarr.push({ name: input.name, value: e.target.result, type: input.type });
                        resolve();
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(input.files[0]);
                });

                promises.push(promise);
            } else {
                dataarr.push({ name: input.name, value: input.value, type: input.type });
            }
        });

        await Promise.all(promises);

        await axios.post('/api/update_layer', {
            formid,
            id: id,
            geojson: JSON.stringify(geojson.geometry),
            dataarr: JSON.stringify(dataarr),
        });

        await getData();
    } catch (error) {
        console.error('Failed to update layer data:', error);
    }
};

const addColumn = async () => {
    try {
        let col_name = document.getElementById('col_name').value;
        let col_type = document.getElementById('col_type').value;
        let col_desc = document.getElementById('col_desc').value;

        await axios.post('/api/add_column', {
            formid, col_name, col_type, col_desc
        });

        document.getElementById('message').innerHTML = 'บันทึกข้อมูลเรียบร้อยแล้ว';
        modalNotify.show();
        await getData();
        await listColumn();
    } catch (error) {
        console.error('Failed to add column:', error);
    }
}

const updateColumn = async (col_id) => {
    try {
        let col_name = document.getElementById(`col_${col_id}`).value;
        await axios.post('/api/update_column', { col_id, col_name });
        document.getElementById('message').innerHTML = 'บันทึกข้อมูลเรียบร้อยแล้ว';
        modalNotify.show();
        await listColumn();
        await getData();
    } catch (error) {
        console.error('Failed to update column:', error);
    }
}

const sortable = Sortable.create(colListInfo, {
    handle: '.list-handle',
    animation: 150,
    onEnd: function (evt) {
        console.log(evt.oldIndex, evt.newIndex);
        $('#table').DataTable().colReorder.move(0, 1);
    }
});

const listColumn = async () => {
    try {
        const response = await axios.post('/api/load_column_description', { formid });
        let colList = document.querySelector('#colList');
        let colListInfo = document.querySelector('#colListInfo');

        colList.innerHTML = "";
        colListInfo.innerHTML = "";

        response.data.forEach(i => {
            colList.innerHTML += `<li class="list-group-item d-flex justify-content-between align-items-start">
                <div class="ms-2 me-auto">
                    <div class="fw-bold">${i.col_name}</div>
                    <span class="small">${i.col_desc} (${i.col_type})</span>
                </div>
                <span class="">
                    <button class="btn btn-danger" onclick="confirmDeleteColumn('${i.col_name}','${i.col_id}')">ลบ</button>
                </span>
            </li>`

            colListInfo.innerHTML += `<li class="list-group-item d-flex justify-content-between align-items-start list-handle">
                <div class="ms-2 me-auto">
                    <input type="text" class="form-control" id="col_${i.col_id}" value="${i.col_name}">
                </div> &nbsp;
                <button class="btn btn-warning ms-2 me-auto" onclick="updateColumn('${i.col_id}')">แก้ไข</button>
            </li>`
        });
    } catch (error) {
        console.error('Failed to load column description:', error);
    }
};

const confirmDeleteColumn = (col_name, col_id) => {
    document.getElementById('col_delete_name').innerHTML = col_name;
    document.getElementById('col_delete_id').value = col_id;
    modalDeleteColumn.show();
};

const deleteColumn = async () => {
    try {
        let col_id = document.getElementById('col_delete_id').value;
        const response = await axios.post('/api/delete_column', { formid, col_id });
        document.getElementById('message').innerHTML = 'ลบคอลัมน์เรียบร้อยแล้ว';
        modalNotify.show();
        await listColumn();
        await getData();
    } catch (error) {
        console.error('Failed to delete column:', error);
    }
}

const searchLocation = async () => {
    try {
        let search = document.getElementById('search').value;
        const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}`);
        if (response.data.length > 0) {
            map.setView([response.data[0].lat, response.data[0].lon], 18);
        } else {
            console.log("No results found.");
        }
    } catch (error) {
        console.error('Failed to search location:', error);
        alert("Error searching for the location. Please try again.");
    }
};

const searchLatlng = async () => {
    try {
        let lat = document.getElementById('lat').value;
        let lng = document.getElementById('lng').value;
        let marker = L.marker([lat, lng], { name: "poi" }).addTo(map);
        marker.bindPopup(`lat: ${lat}<br>lng: ${lng}`).openPopup();
        map.setView([lat, lng], 18);
    } catch (error) {
        console.error('Failed to search latlng:', error);
        alert("Error searching for the location. Please try again.");
    }
}

const searchUTM = async () => {
    try {
        let x = document.getElementById('utmx').value;
        let y = document.getElementById('utmy').value;
        const res = await axios.get(`/api/utm2latlng/${x}/${y}`);

        const lat = res.data.lat;
        const lng = res.data.lng;
        let marker = L.marker([lat, lng], { name: "poi" }).addTo(map);
        marker.bindPopup(`lat: ${lat}<br>lng: ${lng}`).openPopup();
        map.setView([lat, lng], 18);
    } catch (error) {
        console.error('Failed to search latlng:', error);
        alert("Error searching for the location. Please try again.");
    }
}

let removeMarker = () => {
    try {
        document.getElementById('lat').value = "";
        document.getElementById('lng').value = "";
        map.eachLayer(function (layer) {
            if (layer.options.name) {
                console.log(layer);
                map.removeLayer(layer);
            }
        });
    } catch (error) {
        console.log(error);
    }
}

const deleteRows = async () => {
    try {
        let id = document.getElementById('layer_id').value;
        console.log(id, formid);

        await axios.post('/api/delete_row', { id, formid });

        document.getElementById('message').innerHTML = 'ลบข้อมูลเรียบร้อยแล้ว';
        modalNotify.show();

        await getData();
    } catch (error) {
        console.error('Failed to delete layer:', error);
    }
};

const confirmDelete = (id) => {
    try {
        if (id != null) {
            document.getElementById('layer_id').value = id;
        }
        modalUpdate.hide();
        modalDelete.show();

    } catch (error) {
        console.error('Failed to confirm delete:', error);
    }
};

// search 
const getMoo = async () => {
    try {
        const response = await axios.post('/api/get_moo', {});
        moo.innerHTML = "<option selected disabled value=''>เลือก...</option>";
        response.data.forEach(i => {
            moo.innerHTML += `<option value="${i.hhmoo}">หมู่${i.hhmoo} ${i.hhban}</option>`;
        });
    } catch (error) {
        console.error('Failed to get moo:', error);
    }
};

const getHousehold = async (hhmoo) => {
    document.getElementById('hhmoo').value = hhmoo;
    try {
        const response = await axios.post('/api/get_household', { hhmoo });
        let options = "<option selected disabled value=''>เลือก...</option>";
        response.data.forEach(i => {
            options += `<option value="${i.hhno}">${i.hhno}</option>`;
        });
        $('#hh').html(options).select2({ theme: "bootstrap-5", });
    } catch (error) {
        console.error('Failed to get moo:', error);
    }
};

const assignHhno = async (hhno) => {
    document.getElementById('hhno').value = hhno;
}

const searchMooHousehold = async () => {
    let hhmoo = document.getElementById('hhmoo').value;
    let hhno = document.getElementById('hhno').value;
    try {
        const response = await axios.post('/api/searchmoohousehold', { hhmoo, hhno });
        if (response.data.length > 0) {
            removeLayer();
            let marker = L.marker([response.data[0].hhlat, response.data[0].hhlng], { name: "poi" }).addTo(map);
            marker.bindPopup(`<b>บ้านเลขที่:</b> ${response.data[0].hhno}<br>
           <b>หมู่:</b> ${response.data[0].hhmoo}<br>
           <b>ชื่อ:</b> ${response.data[0].hhban}<br>
           <b>ตำบล:</b> ${response.data[0].hhtamb}<br>`).openPopup();
            map.setView([response.data[0].hhlat, response.data[0].hhlng], 18);
        } else {
            removeLayer();
        }

    } catch (error) {
        console.error('Failed to get moo:', error);
    }
};

document.addEventListener("DOMContentLoaded", function () {
    const modalHeader = document.querySelector("#modalEditSymbol .modal-header");
    const modalDialog = document.querySelector("#modalEditSymbol .modal-dialog");

    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    modalHeader.addEventListener("mousedown", function (e) {
        isDragging = true;
        dragOffsetX = e.clientX - modalDialog.getBoundingClientRect().left;
        dragOffsetY = e.clientY - modalDialog.getBoundingClientRect().top;
        document.addEventListener("mousemove", mouseMoveHandler);
        document.addEventListener("mouseup", mouseUpHandler);
    });

    let mouseMoveHandler = (e) => {
        if (isDragging) {
            modalDialog.style.left = e.clientX - dragOffsetX + "px";
            modalDialog.style.top = e.clientY - dragOffsetY + "px";
            modalDialog.style.margin = "0";
        }
    }

    let mouseUpHandler = () => {
        isDragging = false;
        document.removeEventListener("mousemove", mouseMoveHandler);
        document.removeEventListener("mouseup", mouseUpHandler);
    }
});

let modalCreate = new bootstrap.Modal(document.getElementById('modalCreate'));
var modalUpdate = new bootstrap.Modal(document.getElementById('modalUpdate'));
var modalEditSymbol = new bootstrap.Modal(document.getElementById('modalEditSymbol'));
let modalNotify = new bootstrap.Modal(document.getElementById('modalNotify'));
let modalDelete = new bootstrap.Modal(document.getElementById('modalDelete'));
let modalDeleteColumn = new bootstrap.Modal(document.getElementById('modalDeleteColumn'));

let btn_delete_column = document.getElementById('btn_delete_column');
btn_delete_column.addEventListener('click', deleteColumn);

let btn_delete = document.getElementById('btn_delete');
btn_delete.addEventListener('click', deleteRows);

let btn_confirm = document.getElementById('btn_confirm');
btn_confirm.addEventListener('click', confirmDelete);

let btn_save = document.getElementById('btn_save');
btn_save.addEventListener('click', saveData)

let btn_update = document.getElementById('btn_update');
btn_update.addEventListener('click', updateDataAtt);

let btn_reload0 = document.getElementById('btn_reload0');
btn_reload0.addEventListener('click', getData);

let btn_reload1 = document.getElementById('btn_reload1');
btn_reload1.addEventListener('click', getData);

const handleIconClick = (event) => {
    var iconClass = event.currentTarget.querySelector('i').className;
    document.getElementById('iconName').value = iconClass;
    getMarker();
}

document.querySelectorAll('.icon-btn').forEach(button => {
    button.addEventListener('click', handleIconClick);
});

$(document).ready(async () => {
    try {
        await getLayerDescription();
        await getData();
        await getMoo();
        await listColumn();
    } catch (error) {
        console.log(error);
    }
});

