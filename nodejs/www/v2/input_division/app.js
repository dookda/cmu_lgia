// DOM Elements Cache
const domElements = {
    divisionTable: $('#divisionTable'),
    addForm: document.getElementById('addDivisionName'),
    divisionInput: document.getElementById('division'),
    divisionCount: document.getElementById('divisionCount'),
    editModal: new bootstrap.Modal('#editModal'),
    editDivisionId: document.getElementById('division_id'),
    editDivisionName: document.getElementById('division_name'),
    saveBtn: document.querySelector('#editModal .btn-primary'),
    logoutBtn: document.getElementById('logout'),
    userAvatarS: document.getElementById('userAvatarS'),
    userAvatarL: document.getElementById('userAvatarL'),
    displayName: document.getElementById('displayName'),
    imgLogo1: document.getElementById('imgLogo1'),
    imgLogo2: document.getElementById('imgLogo2'),
    message: document.getElementById('message')
};

// Configuration
const config = {
    apiEndpoints: {
        divisions: '/api/v2/divisions',
        info: '/api/v2/info',
        profile: '/auth/profile/admin',
        logout: '/auth/logout'
    },
    fallbackLogo: './../images/logo-dark2x.png'
};

// Initialize DataTable
const initDataTable = () => {
    return domElements.divisionTable.DataTable({
        ajax: {
            url: config.apiEndpoints.divisions,
            dataSrc: data => {
                domElements.divisionCount.textContent = `${data.length} หน่วยงาน`;
                return data;
            }
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
            { data: 'division_name' },
            {
                data: 'created_at',
                render: data => new Date(data).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })
            }
        ]
    });
};

// Event Handlers
const handleFormSubmit = async (e) => {
    e.preventDefault();
    const divisionName = domElements.divisionInput.value.trim();

    if (!divisionName) {
        showMessage('กรุณากรอกชื่อหน่วยงาน', 'warning');
        return;
    }

    try {
        const response = await fetch(config.apiEndpoints.divisions, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ division_name: divisionName })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
        }

        domElements.divisionInput.value = '';
        domElements.divisionTable.DataTable().ajax.reload(null, false);
        showMessage('เพิ่มหน่วยงานสำเร็จ', 'success');
    } catch (error) {
        showMessage(`เกิดข้อผิดพลาด: ${error.message}`, 'danger');
    }
};

const handleEdit = (table) => {
    domElements.divisionTable.on('click', '.edit-btn', function () {
        const rowData = table.row($(this).parents('tr')).data();
        domElements.editDivisionId.value = rowData.id;
        domElements.editDivisionName.value = rowData.division_name;
        domElements.editModal.show();
    });
};

const handleSave = async () => {
    const id = domElements.editDivisionId.value;
    const newName = domElements.editDivisionName.value.trim();

    if (!newName) {
        showMessage('กรุณากรอกชื่อหน่วยงาน', 'warning');
        return;
    }

    try {
        const response = await fetch(`${config.apiEndpoints.divisions}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ division_name: newName })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
        }

        domElements.divisionTable.DataTable().ajax.reload(null, false);
        domElements.editModal.hide();
        showMessage('อัปเดตข้อมูลสำเร็จ', 'success');
    } catch (error) {
        showMessage(`เกิดข้อผิดพลาด: ${error.message}`, 'danger');
    }
};

const handleDelete = () => {
    domElements.divisionTable.on('click', '.delete-btn', async function () {
        const id = $(this).data('id');

        if (!confirm('คุณต้องการลบข้อมูลนี้ใช่หรือไม่?')) return;

        try {
            const response = await fetch(`${config.apiEndpoints.divisions}/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            }

            domElements.divisionTable.DataTable().ajax.reload(null, false);
            showMessage('ลบข้อมูลสำเร็จ', 'success');
        } catch (error) {
            showMessage(`เกิดข้อผิดพลาด: ${error.message}`, 'danger');
        }
    });
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
        document.getElementById('lineLogin').style.display = 'none';
        ['userDetail', 'lineLogout', 'userProfile'].forEach(id => {
            document.getElementById(id).style.display = 'block';
        });

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
        document.getElementById('lineLogin').style.display = 'block';
        ['userDetail', 'lineLogout', 'userProfile'].forEach(id => {
            document.getElementById(id).style.display = 'none';
        });

    } catch (error) {
        showMessage('เกิดข้อผิดพลาดในการออกจากระบบ', 'danger');
    }
};

// Message Handling
const showMessage = (text, type = 'info') => {
    domElements.message.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${text}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    domElements.message.style.display = 'block';
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const table = initDataTable();

        // Event Listeners
        domElements.addForm.addEventListener('submit', handleFormSubmit);
        domElements.saveBtn.addEventListener('click', handleSave);
        domElements.logoutBtn.addEventListener('click', handleLogout);
        handleEdit(table);
        handleDelete();

        // Load initial data
        await Promise.all([loadUserProfile(), loadTasabanInfo()]);

    } catch (error) {
        showMessage('เกิดข้อผิดพลาดในการเริ่มต้นแอปพลิเคชัน', 'danger');
    }
});