MapboxDraw.constants.classes.CONTROL_BASE = 'maplibregl-ctrl';
MapboxDraw.constants.classes.CONTROL_PREFIX = 'maplibregl-ctrl-';
MapboxDraw.constants.classes.CONTROL_GROUP = 'maplibregl-ctrl-group';

const map = new maplibregl.Map({
    container: 'map', // container id
    style:
        'https://api.maptiler.com/maps/streets/style.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL', //hosted style id
    center: [-91.874, 42.76], // starting position
    zoom: 12 // starting zoom
});

const draw = new MapboxDraw({
    displayControlsDefault: false,
    controls: {
        polygon: true,
        point: true,
        line_string: true,
        trash: true
    },

});
// map.addControl(draw);
map.addControl(draw, "top-right");

map.on('draw.create', updateArea);
// map.on('draw.delete', updateArea);
// map.on('draw.update', updateArea);


map.on('draw.create', onCreate);
map.on('draw.update', onUpdate);
map.on('draw.delete', onDelete);
map.on('draw.selectionchange', onselectionchange);
// map.on('draw.actionable', onActionable);

function onCreate(e) {
    console.log(e.features);
    // myModal.show();
};

function onUpdate(e) {
    console.log(e.features);
}

function onDelete(e) {
    console.log(e.features);
}

function onselectionchange(e) {
    // if (e.features.length > 0) {
    //     openModal();
    // }
    console.log(e.features);
}

function onActionable(e) {
    console.log(e);
}

function updateArea(e) {
    const data = draw.getAll();

    const answer = document.getElementById('calculated-area');
    if (data.features.length > 0) {
        const area = turf.area(data);
        // restrict to area to 2 decimal points
        const roundedArea = Math.round(area * 100) / 100;
        answer.innerHTML =
            `<p><strong>${roundedArea
            }</strong></p><p>square meters</p>`;
    } else {
        answer.innerHTML = '';
        if (e.type !== 'draw.delete')
            alert('Use the draw tools to draw a polygon!');
    }
}

// open modal boostrap 5  
var myModal = new bootstrap.Modal(document.getElementById('modal'), {
    keyboard: false
});

// open modal
function openModal() {
    myModal.show();
}

