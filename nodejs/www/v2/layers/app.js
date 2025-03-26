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
                                <button class="btn btn-primary btn-edit" data-formid="${row.formid}" data-type="${row.layertype}">เปิด</button>
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
                responsive: false,
                autoWidth: true,
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

            $('#dataTable').on('click', '.btn-edit', function () {
                const formid = this.getAttribute('data-formid');
                const type = this.getAttribute('data-type');

                window.location.href = `/v2/input_edit/index.html?formid=${formid}&type=${type}`;
            });
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
});

const loadUserProfile = async () => {
    try {
        const response = await fetch('/auth/profile');
        const data = await response.json();

        let userAvatarS = document.getElementById('userAvatarS');
        let userAvatarL = document.getElementById('userAvatarL');
        let displayName = document.getElementById('displayName');
        if (!data.success) {
            console.log('User not logged in');

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

document.addEventListener('DOMContentLoaded', async () => {
    await loadUserProfile();
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