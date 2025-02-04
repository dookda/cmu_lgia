$(document).ready(function () {
    $('#layerTable').DataTable({
        ajax: {
            url: '/api/v2/layer_names',
            dataSrc: '',
        },
        columns: [
            { data: 'gid' },
            { data: 'formid' },
            { data: 'division' },
            { data: 'layername' },
            { data: 'layertype' },
            {
                data: 'ts',
                render: function (data) {
                    const date = new Date(data);
                    const options = { year: 'numeric', month: 'long', day: 'numeric' };
                    return date.toLocaleDateString('th-TH', options);
                },
            },
        ],
        scrollX: true,
    });
});