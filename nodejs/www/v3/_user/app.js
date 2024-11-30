
// post user data to server with datatable
const listuser = async () => {
    try {
        let userlist = axios.post('/api/listuser', {})
        await userlist.then((response) => {
            let data = response.data;
            let table = $('#table').DataTable({
                data: data,
                columns: [
                    {
                        data: 'id',
                        render: function (data, type, row, meta) {
                            return meta.row + 1;
                        }
                    },
                    { data: 'username' },
                    { data: 'email' },
                    { data: 'division' },
                    { data: 'auth' },
                    { data: 'ts' },
                    {
                        data: '',
                        render: function (data, type, row, meta) {
                            return `<button class="btn btn-warning" onclick="openEditModal(${row.id},'${row.username}', '${row.email}', '${row.division}', '${row.auth}')"><i class="bi bi-tools"></i> แก้ไข</button>
                            <button class="btn btn-danger" onclick="openDeleteModal(${row.id}, '${row.username}')"><i class="bi bi-trash3"></i> ลบ</button>`;
                        }
                    }
                ],
                scrollX: true,
                responsive: true,
            });
        });

    } catch (error) {
        console.log(error);
    }
}

const editUser = () => {
    try {
        const id = document.getElementById('editId').value;
        const username = document.getElementById('editUsername').value;
        const email = document.getElementById('editEmail').value;
        const division = document.getElementById('editDivision').value;
        const auth = document.getElementById('editAuth').value;
        console.log(id, username, email, division, auth);
        axios.post('/api/edituser', { id, username, email, division, auth })
            .then(async (response) => {
                if (response.data.status === 'updated') {
                    document.getElementById('message').innerHTML = 'บันทึกข้อมูลผู้ใช้เรียบร้อยแล้ว';
                    $('#table').DataTable().clear().destroy();
                    await listuser();
                    modalEdit.hide();
                    modalNotify.show();
                }
            });
    } catch (error) {
        console.log(error);
    }
}

const openEditModal = (id, username, email, division, auth) => {
    console.log(id, username, email, division, auth);
    document.getElementById('editId').value = id;
    document.getElementById('editUsername').value = username;
    document.getElementById('editEmail').value = email;
    document.getElementById('editDivision').value = division;
    document.getElementById('editAuth').value = auth;
    modalEdit.show();
}

const deleteUser = () => {
    try {
        const id = document.getElementById('deleteId').value;
        axios.post('/api/deleteuser', { id })
            .then(async (response) => {
                if (response.data.status === 'deleted') {
                    document.getElementById('message').innerHTML = 'ลบผู้ใช้เรียบร้อยแล้ว';
                    $('#table').DataTable().clear().destroy();
                    await listuser();
                    modalDelete.hide();
                    modalNotify.show();
                }
            });
    } catch (error) {
        console.log(error);
    }
}

const openDeleteModal = (id, username) => {
    console.log(id, username);
    document.getElementById('deleteId').value = id;
    document.getElementById('deleteUsername').innerText = username;
    modalDelete.show();
}

let modalEdit = new bootstrap.Modal(document.getElementById('modalUpdate'));
let modalDelete = new bootstrap.Modal(document.getElementById('modalDelete'));
let modalNotify = new bootstrap.Modal(document.getElementById('modalNotify'));
// windows ready
$(document).ready(function () {
    listuser();
})


