document.addEventListener('DOMContentLoaded', function () {
    fetch('/api/v2/layer_names')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const table = $('#dataTable').DataTable({
                data: data,
                columns: [
                    {
                        data: null,
                        render: function (data, type, row) {
                            return `
                                <button class="btn btn-warning" data-formid="${row.formid}" data-type="${row.layertype}">แก้ไข</button>
                                <button class="btn btn-danger" data-id="${row.gid}">ลบ</button>
                            `;
                        },
                    },
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

            $('#dataTable').on('click', '.btn-danger', function () {
                const id = $(this).data('id');
                if (confirm('ยืนยันการลบรายการนี้?')) {
                    fetch(`/api/v2/layer_names/${id}`, {
                        method: 'DELETE'
                    })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`Failed to delete entry with id ${id}`);
                            }
                            return response.json();
                        })
                        .then(result => {
                            table
                                .row($(this).closest('tr'))
                                .remove()
                                .draw();
                            console.log(`Entry with id ${id} deleted successfully.`);
                        })
                        .catch(error => {
                            console.error('Error deleting data:', error);
                        });
                }
            });

            $('#dataTable').on('click', '.btn-warning', function () {
                const formid = this.getAttribute('data-formid');
                const type = this.getAttribute('data-type');

                window.location.href = `/v5/input_edit/index.html?formid=${formid}&type=${type}`;
            });
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
});
