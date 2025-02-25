
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
                    return `<button class="btn btn-danger btn-sm delete-btn" data-id="${data}">ลบ</button>`;
                },
            },
            { data: 'id' },
            { data: 'division_name' },
            {
                data: "created_at",
                render: function (data) {
                    return new Intl.DateTimeFormat("th-TH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false, // Ensures 24-hour format
                    }).format(new Date(data));
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