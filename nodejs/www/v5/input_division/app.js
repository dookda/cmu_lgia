
document.addEventListener("DOMContentLoaded", function () {
    const table = $('#divisionTable').DataTable({
        ajax: {
            url: '/api/v2/divisions',
            dataSrc: '',
        },
        columns: [
            {
                data: 'id',
                render: function (data) {
                    // console.log(data);

                    return `<button class="btn btn-warning edit-btn" data-id="${data}">แก้ไข</button>
                            <button class="btn btn-danger delete-btn" data-id="${data}">ลบ</button>`;
                },
            },
            { data: 'id' },
            { data: 'division_name' },
            {
                data: "created_at",
                render: function (data) {
                    const date = new Date(data);
                    const options = { year: 'numeric', month: 'long', day: 'numeric' };
                    return date.toLocaleDateString('th-TH', options);
                },
            },
        ],
    });

    // Handle form submission
    document.getElementById('addDivisionName').addEventListener('submit', async function (e) {
        e.preventDefault();

        const divisionName = $('#division').val();

        if (!divisionName) {
            alert('Please enter a division name.');
            return;
        }

        try {
            const response = await fetch('/api/v2/divisions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ division_name: divisionName }),
            });

            if (response.ok) {
                $('#division').val(''); // Clear input
                table.ajax.reload(); // Refresh datatable
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.error}`);
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred while adding the division.');
        }
    });

    // Handle edit button click
    $('#divisionTable').on('click', '.edit-btn', function (event) {
        const row = table.row(event.target.closest("tr")).data();
        document.getElementById("division_id").value = row.id;
        document.getElementById("division_name").value = row.division_name;

        const editModal = new bootstrap.Modal(document.getElementById("editModal"));
        editModal.show();

        document.addEventListener('hide.bs.modal', function (event) {
            if (document.activeElement) {
                document.activeElement.blur();
            }
        });
    });

    window.saveEdit = async function () {
        const id = document.getElementById("division_id").value;
        const updatedData = {
            division_name: document.getElementById("division_name").value,
        };

        await fetch(`/api/v2/divisions/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedData),
        });

        table.ajax.reload();
        bootstrap.Modal.getInstance(document.getElementById("editModal")).hide();
    };

    // Handle delete button click
    document.querySelector("#divisionTable tbody").addEventListener("click", async function (event) {
        if (event.target.classList.contains("delete-btn")) {
            const divisionId = event.target.dataset.id;

            if (!confirm("คุณต้องการลบข้อมูลนี้ใช่หรือไม่?")) return;

            try {
                const response = await fetch(`/api/v2/divisions/${divisionId}`, {
                    method: "DELETE",
                });

                if (response.ok) {
                    table.ajax.reload();
                } else {
                    const errorData = await response.json();
                    alert(`Error: ${errorData.error}`);
                }
            } catch (error) {
                console.error(error);
                alert("An error occurred while deleting the division.");
            }
        }
    });
});