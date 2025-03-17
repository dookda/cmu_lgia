document.addEventListener("DOMContentLoaded", function () {
    const table = $('#userTable').DataTable({
        ajax: {
            url: "http://localhost:3000/api/v2/users",
            dataSrc: "",
        },
        columns: [
            {
                data: "id",
                render: function (data) {
                    return `
                        <button class="btn btn-primary edit-btn" data-id="${data}">แก้ไข</button>
                        <button class="btn btn-danger delete-btn" data-id="${data}">ลบ</button>
                    `;
                },
            },
            { data: "id" },
            { data: "username" },
            { data: "email" },
            {
                data: "ts",
                render: function (data) {
                    const date = new Date(data);
                    const options = { year: 'numeric', month: 'long', day: 'numeric' };
                    return date.toLocaleDateString('th-TH', options);
                },
            },
            { data: "auth" },
            { data: "division" }
        ],
        scrollX: true,
    });

    $('#userTable').on('click', '.delete-btn', function () {
        const id = $(this).data('id');
        if (confirm('ยืนยันการลบรายการนี้?')) {
            fetch(`/api/v2/users/${id}`, {
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

    $('#userTable').on('click', '.edit-btn', function (event) {
        const row = table.row(event.target.closest("tr")).data();
        document.getElementById("editUserId").value = row.id;
        document.getElementById("editUsername").value = row.username;
        document.getElementById("editEmail").value = row.email;
        document.getElementById("editAuth").value = row.auth;
        document.getElementById("editDivision").value = row.division;

        const editModal = new bootstrap.Modal(document.getElementById("editModal"));
        editModal.show();

        document.addEventListener('hide.bs.modal', function (event) {
            if (document.activeElement) {
                document.activeElement.blur();
            }
        });
    });

    window.saveEdit = async function () {
        const userId = document.getElementById("editUserId").value;
        const updatedData = {
            username: document.getElementById("editUsername").value,
            email: document.getElementById("editEmail").value,
            auth: document.getElementById("editAuth").value,
            division: document.getElementById("editDivision").value,
        };

        await fetch(`/api/v2/users/${userId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedData),
        });

        table.ajax.reload();
        bootstrap.Modal.getInstance(document.getElementById("editModal")).hide();
    };
});