// DOM Elements Cache
const domElements = {
    dataTable: $('#dataTable'),
    addForm: document.getElementById('addDivisionName'),
    divisionInput: document.getElementById('division'),
    divisionCount: document.getElementById('divisionCount'),
    editModal: new bootstrap.Modal('#editModal'),
    editDivisionId: document.getElementById('division_id'),
    editDivisionName: document.getElementById('division_name'),
    saveBtn: document.getElementById('btn-save'),
    logoutBtn: document.getElementById('logout'),
    userAvatarS: document.getElementById('userAvatarS'),
    userAvatarL: document.getElementById('userAvatarL'),
    displayName: document.getElementById('displayName'),
    imgLogo1: document.getElementById('imgLogo1'),
    imgLogo2: document.getElementById('imgLogo2'),
    message: document.getElementById('message')
};

const handleError = (error, context) => {
    console.error(`[${context}]`, error);
    showMessage(`เกิดข้อผิดพลาด: ${error.message}`, 'danger');
};

const resetMessage = () => {
    domElements.message.style.display = 'none';
    domElements.message.classList.remove(type);
    domElements.message.textContent = '';
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
        divisions: '/api/v2/divisions',
        info: '/api/v2/info',
        profile: '/auth/profile/admin',
        logout: '/auth/logout'
    },
    fallbackLogo: './../images/logo-dark2x.png'
};

const updateRowCount = () => {
    const table = $(domElements.dataTable).DataTable();
    domElements.divisionCount.textContent = `${table.rows().count()} หน่วยงาน`;
};

let dataTable;
const initDataTable = async () => {
    try {
        if (dataTable) {
            dataTable.destroy();
            domElements.dataTable.innerHTML = '';
        }

        dataTable = $(domElements.dataTable).DataTable({
            ajax: {
                url: config.apiEndpoints.divisions,
                dataSrc: ''
            },
            columns: [
                {
                    data: null,
                    render: (data, type, row) => `
                        <button class="btn btn-primary btn-edit" 
                            data-id="${row.id}" 
                            data-division_name="${row.division_name}">
                            <em class="icon ni ni-text-rich"></em>&nbsp;แก้ไข
                        </button>
                        <button class="btn btn-danger btn-delete" 
                            data-id="${row.id}">
                            <em class="icon ni ni-trash-alt"></em>&nbsp;ลบ
                        </button>
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
            ],
            scrollX: true,
            responsive: false,
            autoWidth: true
        });

        dataTable.on('xhr', function () {
            const data = dataTable.ajax.json();
            domElements.divisionCount.textContent = `${data.length} หน่วยงาน`;
        });

        domElements.dataTable.on('click', '.btn-delete', async function () {
            const id = $(this).data('id');
            if (confirm('ยืนยันการลบรายการนี้?')) {
                try {
                    const response = await fetch(`${config.apiEndpoints.divisions}/${id}`, {
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
            domElements.editDivisionId.value = $(this).data('id');
            domElements.editDivisionName.value = $(this).data('division_name');
            domElements.editModal.show();
        });

    } catch (error) {
        console.error('Error initializing DataTable:', error);
        showMessage('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'danger');
    }
};

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

        const table = $(domElements.dataTable).DataTable();
        table.ajax.reload(() => {
            updateRowCount();
        }, false);

        showMessage('เพิ่มหน่วยงานสำเร็จ', 'success');
    } catch (error) {
        showMessage(`เกิดข้อผิดพลาด: ${error.message}`, 'danger');
    }
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

        const table = $(domElements.dataTable).DataTable();
        table.rows().every(function () {
            const rowData = this.data();
            if (rowData.id == id) {
                rowData.division_name = newName;
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

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
    try {
        initDataTable();
        domElements.addForm.addEventListener('submit', handleFormSubmit);
        domElements.saveBtn.addEventListener('click', handleSave);
        domElements.logoutBtn.addEventListener('click', handleLogout);
        await Promise.all([loadUserProfile(), loadTasabanInfo()]);

    } catch (error) {
        showMessage('เกิดข้อผิดพลาดในการเริ่มต้นแอปพลิเคชัน', 'danger');
    }
});