document.addEventListener("DOMContentLoaded", function () {
    const table = $('#userTable').DataTable({
        ajax: {
            url: "/api/v2/users",
            dataSrc: "",
        },
        columns: [
            {
                data: "id",
                render: function (data, type, row) {
                    return `
                        <button class="btn btn-primary edit-btn" data-id="${data}">แก้ไข</button>
                        <button class="btn btn-danger delete-btn" data-id="${data}">ลบ</button>
                    `;
                },
            },
            { data: "id" },
            { data: "username" },
            { data: "displayname" },
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
        const id = document.getElementById("editUserId").value;
        const updatedData = {
            username: document.getElementById("editUsername").value,
            email: document.getElementById("editEmail").value,
            auth: document.getElementById("editAuth").value,
            division: document.getElementById("editDivision").value,
        };

        const response = await fetch(`/api/v2/users/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update profile');
        }

        const result = await response.json();

        table.ajax.reload();
        bootstrap.Modal.getInstance(document.getElementById("editModal")).hide();
    };
});

const loadUserProfile = async () => {
    try {
        const response = await fetch('/auth/profile/admin');
        const data = await response.json();

        let userAvatarS = document.getElementById('userAvatarS');
        let userAvatarL = document.getElementById('userAvatarL');
        let displayName = document.getElementById('displayName');
        if (!data.success || !data.auth) {
            console.log('User not logged in');
            window.location.href = '../dashboard/index.html';
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

        // Update text content
        document.getElementById('tasabanInfo').textContent = data.name;

        // Update logo image
        const logoImg1 = document.getElementById('imgLogo1');
        const logoImg2 = document.getElementById('imgLogo2');
        if (data.img) {
            logoImg1.src = data.img;
            logoImg1.removeAttribute('srcset');
            logoImg1.onerror = () => {
                console.error('Failed to load logo image');
                logoImg1.src = './../images/logo-dark2x.png'; // Fallback
            };

            logoImg2.src = data.img;
            logoImg2.removeAttribute('srcset');
            logoImg2.onerror = () => {
                console.error('Failed to load logo image');
                logoImg2.src = './../images/logo-dark2x.png'; // Fallback
            };
        }

    } catch (error) {
        console.error('Error fetching tasaban info:', error);
        // Optional: Restore original logo on error
        document.getElementById('imgLogo').src = './../images/logo-dark2x.png';
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    await loadUserProfile();
    await getTasabanInfo();
});

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