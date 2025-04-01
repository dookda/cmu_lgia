// DOM Elements Cache
const domElements = {
    userTable: $('#userTable'),
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
    message: document.getElementById('message')
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

// Initialize DataTable
const initDataTable = () => {
    return domElements.userTable.DataTable({
        ajax: {
            url: config.apiEndpoints.users,
            dataSrc: '',
            error: (error) => showMessage('Failed to load user data', 'danger')
        },
        columns: [
            {
                data: 'id',
                render: (data) => `
                    <button class="btn btn-primary edit-btn" data-id="${data}">แก้ไข</button>
                    <button class="btn btn-danger delete-btn" data-id="${data}">ลบ</button>
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
        scrollX: true
    });
};

// Event Handlers
const handleDelete = (table) => {
    domElements.userTable.on('click', '.delete-btn', async function () {
        const id = $(this).data('id');

        if (!confirm('คุณต้องการลบข้อมูลนี้ใช่หรือไม่?')) return;

        try {
            const response = await fetch(`${config.apiEndpoints.users}/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            }

            table.row($(this).parents('tr')).remove().draw();
            showMessage('ลบข้อมูลสำเร็จ', 'success');
        } catch (error) {
            showMessage(`เกิดข้อผิดพลาด: ${error.message}`, 'danger');
        }
    });
};

const handleEdit = (table) => {
    domElements.userTable.on('click', '.edit-btn', function () {
        const rowData = table.row($(this).parents('tr')).data();
        domElements.editUserId.value = rowData.id;
        domElements.editUsername.value = rowData.username;
        domElements.editEmail.value = rowData.email;
        domElements.editAuth.value = rowData.auth;
        domElements.editDivision.value = rowData.division;
        domElements.editModal.show();
    });
};

const handleSave = async () => {
    try {
        const updatedData = {
            username: domElements.editUsername.value.trim(),
            email: domElements.editEmail.value.trim(),
            auth: domElements.editAuth.value,
            division: domElements.editDivision.value
        };

        const id = domElements.editUserId.value;
        const response = await fetch(`${config.apiEndpoints.users}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
        }

        domElements.userTable.DataTable().ajax.reload();
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

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const table = initDataTable();

        // Event Listeners
        document.getElementById('editModal').addEventListener('hide.bs.modal', () => {
            if (document.activeElement) document.activeElement.blur();
        });

        document.querySelector('#editModal .btn-primary').addEventListener('click', handleSave);
        domElements.logoutBtn.addEventListener('click', handleLogout);

        handleDelete(table);
        handleEdit(table);

        // Load initial data
        await Promise.all([loadUserProfile(), loadTasabanInfo()]);

    } catch (error) {
        showMessage('เกิดข้อผิดพลาดในการเริ่มต้นแอปพลิเคชัน', 'danger');
    }
});
