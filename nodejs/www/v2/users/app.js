// DOM Elements Cache
const domElements = {
    dataTable: $('#dataTable'),
    editModal: new bootstrap.Modal('#editModal'),
    editUserId: document.getElementById('editUserId'),
    editUsername: document.getElementById('editUsername'),
    editEmail: document.getElementById('editEmail'),
    editAuth: document.getElementById('editAuth'),
    editDivision: document.getElementById('editDivision'),
    logoutBtn: document.getElementById('logout'),
    userAvatarS: document.getElementById('userAvatarS'),
    userAvatarL: document.getElementById('userAvatarL'),
    displayName: document.getElementById('displayName'),
    tasabanInfo: document.getElementById('tasabanInfo'),
    imgLogo1: document.getElementById('imgLogo1'),
    imgLogo2: document.getElementById('imgLogo2'),
    lineLogin: document.getElementById('lineLogin'),
    userDetail: document.getElementById('userDetail'),
    lineLogout: document.getElementById('lineLogout'),
    userProfile: document.getElementById('userProfile'),
    saveBtn: document.getElementById('btn-save'),
    userCount: document.getElementById('userCount'),
    message: document.getElementById('message')
};

const showMessage = (text, type) => {
    domElements.message.textContent = text;
    domElements.message.classList.add(type);
    domElements.message.style.display = 'block';
    setTimeout(() => {
        domElements.message.style.display = 'none';
        domElements.message.classList.remove(type);
        domElements.message.textContent = '';
    }, 1000);
};

// Configuration
const config = {
    apiEndpoints: {
        users: '/api/v2/users',
        info: '/api/v2/info',
        profile: '/auth/profile/admin',
        logout: '/auth/logout'
    },
    fallbackLogo: './../images/logo-dark2x.png'
};

const updateRowCount = () => {
    const table = $(domElements.dataTable).DataTable();
    domElements.userCount.textContent = `${table.rows().count()} คน`;
};

let dataTable;
const initDataTable = () => {
    try {
        if (dataTable) {
            dataTable.destroy();
            domElements.dataTable.innerHTML = '';
        }

        dataTable = $(domElements.dataTable).DataTable({
            ajax: {
                url: config.apiEndpoints.users,
                dataSrc: '',
            },
            columns: [
                {
                    data: 'id',
                    render: (data, type, row) => `
                        <button class="btn btn-primary btn-edit" 
                            data-id="${data}">
                            แก้ไข
                        </button>
                        <button class="btn btn-danger btn-delete" 
                            data-id="${row.id}">
                            ลบ
                        </button>
                    `
                },
                { data: 'id' },
                { data: 'username' },
                { data: 'displayname' },
                { data: 'email' },
                {
                    data: 'ts',
                    render: data => new Date(data).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })
                },
                { data: 'auth' },
                { data: 'division' }
            ],
            scrollX: true,
            responsive: false,
            autoWidth: true
        });

        dataTable.on('xhr', function () {
            const data = dataTable.ajax.json();
            domElements.userCount.textContent = `${data.length} คน`;
        });

        domElements.dataTable.on('click', '.btn-delete', async function () {
            const id = $(this).data('id');
            if (confirm('ยืนยันการลบรายการนี้?')) {
                try {
                    const response = await fetch(`${config.apiEndpoints.users}/${id}`, {
                        method: 'DELETE'
                    });
                    if (!response.ok) throw new Error('Delete failed');

                    const table = $(domElements.dataTable).DataTable();
                    table.row($(this).parents('tr')).remove().draw();
                    updateRowCount();
                    showMessage('ลบข้อมูลสำเร็จ', 'success');
                } catch (error) {
                    handleError(error, 'Delete operation');
                }
            }
        });

        domElements.dataTable.on('click', '.btn-edit', function () {
            const rowData = dataTable.row($(this).parents('tr')).data();
            console.log(rowData);

            domElements.editUserId.value = rowData.id;
            domElements.editUsername.value = rowData.username;
            domElements.editEmail.value = rowData.email;
            domElements.editAuth.value = rowData.auth;
            domElements.editDivision.value = rowData.division;
            domElements.editModal.show();
        });
    } catch (error) {
        console.error('Error initializing DataTable:', error);
        showMessage('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'danger');
    }
};

const handleSave = async () => {
    const id = domElements.editUserId.value;
    const updatedData = {
        username: domElements.editUsername.value.trim(),
        email: domElements.editEmail.value.trim(),
        auth: domElements.editAuth.value,
        division: domElements.editDivision.value
    };

    try {
        const response = await fetch(`${config.apiEndpoints.users}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
        }

        const table = $(domElements.dataTable).DataTable();
        table.rows().every(function () {
            const rowData = this.data();
            if (rowData.id == id) {
                rowData.username = updatedData.username;
                rowData.email = updatedData.email;
                rowData.auth = updatedData.auth;
                rowData.division = updatedData.division;
                this.data(rowData).draw(false);
            }
        });

        domElements.editModal.hide();
        showMessage('อัปเดตข้อมูลสำเร็จ', 'success');
    } catch (error) {
        showMessage(`เกิดข้อผิดพลาด: ${error.message}`, 'danger');
    }
};

// User Profile
const loadUserProfile = async () => {
    try {
        const response = await fetch(config.apiEndpoints.profile);
        const data = await response.json();

        if (!data?.success || !data?.auth) {
            window.location.href = '../dashboard/index.html';
            return;
        }

        const createAvatar = (url) => {
            const img = document.createElement('img');
            img.className = 'avatar';
            img.src = url;
            img.alt = 'Profile Picture';
            return img;
        };

        domElements.userAvatarS.replaceChildren(createAvatar(data.user.pictureUrl));
        domElements.userAvatarL.replaceChildren(createAvatar(data.user.pictureUrl));
        domElements.displayName.textContent = data.user.displayName;

        // Update UI states
        domElements.lineLogin.style.display = 'none';
        [domElements.userDetail, domElements.lineLogout, domElements.userProfile]
            .forEach(el => el.style.display = 'block');

    } catch (error) {
        showMessage('เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้', 'danger');
    }
};

// Tasaban Info
const updateLogo = (imgElement, url) => {
    imgElement.src = url || config.fallbackLogo;
    imgElement.onerror = () => {
        imgElement.src = config.fallbackLogo;
        imgElement.removeAttribute('srcset');
    };
};

const loadTasabanInfo = async () => {
    try {
        const response = await fetch(config.apiEndpoints.info);
        if (!response.ok) throw new Error('Failed to load info');

        const data = await response.json() || {};
        domElements.tasabanInfo.textContent = data.name || 'เทศบาลไม่ระบุชื่อ';
        updateLogo(domElements.imgLogo1, data.img);
        updateLogo(domElements.imgLogo2, data.img);

    } catch (error) {
        showMessage('เกิดข้อผิดพลาดในการโหลดข้อมูลเทศบาล', 'danger');
        updateLogo(domElements.imgLogo1);
        updateLogo(domElements.imgLogo2);
    }
};

// Logout Handler
const handleLogout = async () => {
    try {
        const response = await fetch(config.apiEndpoints.logout);
        if (!response.ok) throw new Error('Logout failed');

        domElements.userAvatarS.innerHTML = '<em class="icon ni ni-user-alt"></em>';
        domElements.lineLogin.style.display = 'block';
        [domElements.userDetail, domElements.lineLogout, domElements.userProfile]
            .forEach(el => el.style.display = 'none');

    } catch (error) {
        showMessage('เกิดข้อผิดพลาดในการออกจากระบบ', 'danger');
    }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
    try {
        initDataTable();

        domElements.saveBtn.addEventListener('click', handleSave);
        domElements.logoutBtn.addEventListener('click', handleLogout);
        document.getElementById('editModal').addEventListener('hide.bs.modal', () => {
            if (document.activeElement) document.activeElement.blur();
        });

        // Load initial data
        await Promise.all([loadUserProfile(), loadTasabanInfo()]);

    } catch (error) {
        showMessage('เกิดข้อผิดพลาดในการเริ่มต้นแอปพลิเคชัน', 'danger');
    }
});
