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
                        <button class="btn btn-warning edit-btn" data-id="${data}">แก้ไข</button>
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
                    return new Intl.DateTimeFormat("th-TH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false,
                    }).format(new Date(data));
                },
            },
            { data: "auth" },
            { data: "division" }
        ],
        scrollX: true,
    });

    // Handle delete button click
    document.querySelector("#userTable tbody").addEventListener("click", async function (event) {
        if (event.target.classList.contains("delete-btn")) {
            const userId = event.target.dataset.id;
            if (!confirm("คุณต้องการลบข้อมูลนี้ใช่หรือไม่?")) return;

            try {
                const response = await fetch(`http://localhost:3000/api/v2/users/${userId}`, {
                    method: "DELETE",
                });

                if (response.ok) {
                    table.ajax.reload();
                } else {
                    alert("Error deleting user.");
                }
            } catch (error) {
                console.error(error);
            }
        }
    });

    document.querySelector("#userTable tbody").addEventListener("click", function (event) {
        if (event.target.classList.contains("edit-btn")) {
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
        }
    });

    window.saveEdit = async function () {
        const userId = document.getElementById("editUserId").value;
        const updatedData = {
            username: document.getElementById("editUsername").value,
            email: document.getElementById("editEmail").value,
            auth: document.getElementById("editAuth").value,
            division: document.getElementById("editDivision").value,
        };

        await fetch(`http://localhost:3000/api/v2/users/${userId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedData),
        });

        table.ajax.reload();
        bootstrap.Modal.getInstance(document.getElementById("editModal")).hide();
    };
});