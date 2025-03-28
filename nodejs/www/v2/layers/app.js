// DOM Elements Cache
const domElements = {
    dataTable: $('#dataTable'),
    userAvatarS: document.getElementById('userAvatarS'),
    userAvatarL: document.getElementById('userAvatarL'),
    displayName: document.getElementById('displayName'),
    tasabanInfo: document.getElementById('tasabanInfo'),
    imgLogo1: document.getElementById('imgLogo1'),
    imgLogo2: document.getElementById('imgLogo2'),
    logoutBtn: document.getElementById('logout'),
    userDetail: document.getElementById('userDetail'),
    lineLogin: document.getElementById('lineLogin'),
    lineLogout: document.getElementById('lineLogout'),
    userProfile: document.getElementById('userProfile')
};

// Configuration
const config = {
    apiEndpoints: {
        layers: '/api/v2/layer_names',
        info: '/api/v2/info',
        profile: '/auth/profile/editor',
        logout: '/auth/logout'
    },
    fallbackLogo: './../images/logo-dark2x.png'
};

// Error Handling
const handleError = (error, context) => {
    console.error(`[${context}]`, error);
    showMessage(`เกิดข้อผิดพลาด: ${error.message}`, 'danger');
};

const showMessage = (text, type = 'info') => {
    domElements.message.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${text}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    domElements.message.style.display = 'block';
};

// DataTable Handling
const initializeDataTable = async () => {
    try {
        const response = await fetch(config.apiEndpoints.layers);
        if (!response.ok) throw new Error('Failed to load data');
        const data = await response.json();

        const table = domElements.dataTable.DataTable({
            data: data,
            columns: [
                {
                    data: null,
                    render: (data, type, row) => `
                        <button class="btn btn-primary btn-edit" 
                            data-formid="${row.formid}" 
                            data-type="${row.layertype}">
                            เปิด
                        </button>
                        <button class="btn btn-danger btn-delete" 
                            data-id="${row.gid}">
                            ลบ
                        </button>
                    `
                },
                { data: 'gid' },
                { data: 'formid' },
                { data: 'division' },
                { data: 'layername' },
                { data: 'layertype' },
                {
                    data: 'ts',
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

        // Delete handler
        domElements.dataTable.on('click', '.btn-delete', async function () {
            const id = $(this).data('id');
            if (confirm('ยืนยันการลบรายการนี้?')) {
                try {
                    const response = await fetch(`${config.apiEndpoints.layers}/${id}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) throw new Error('Delete failed');

                    table.row($(this).parents('tr')).remove().draw();
                    showMessage('ลบข้อมูลสำเร็จ', 'success');
                } catch (error) {
                    handleError(error, 'Delete operation');
                }
            }
        });

        // Edit handler
        domElements.dataTable.on('click', '.btn-edit', function () {
            const formid = $(this).data('formid');
            const type = $(this).data('type');
            window.location.href = `/v2/input_edit/index.html?formid=${formid}&type=${type}`;
        });

    } catch (error) {
        handleError(error, 'DataTable initialization');
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

        // Safe DOM manipulation
        const setImageSafe = (element, url) => {
            element.innerHTML = '';
            const img = document.createElement('img');
            img.className = 'avatar';
            img.src = url;
            img.alt = 'Profile Picture';
            element.appendChild(img);
        };

        setImageSafe(domElements.userAvatarS, data.user.pictureUrl);
        setImageSafe(domElements.userAvatarL, data.user.pictureUrl);
        domElements.displayName.textContent = data.user.displayName;

        // Update UI states
        domElements.lineLogin.style.display = 'none';
        [domElements.userDetail, domElements.lineLogout, domElements.userProfile]
            .forEach(el => el.style.display = 'block');

    } catch (error) {
        handleError(error, 'Profile loading');
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

const getTasabanInfo = async () => {
    try {
        const response = await fetch(config.apiEndpoints.info);
        if (!response.ok) throw new Error('Failed to load info');

        const data = await response.json() || {};
        domElements.tasabanInfo.textContent = data.name || 'เทศบาลไม่ระบุชื่อ';

        // Update logos
        updateLogo(domElements.imgLogo1, data.img);
        updateLogo(domElements.imgLogo2, data.img);

    } catch (error) {
        handleError(error, 'Info loading');
        updateLogo(domElements.imgLogo1);
        updateLogo(domElements.imgLogo2);
    }
};

// Logout Handler
const handleLogout = async () => {
    try {
        const response = await fetch(config.apiEndpoints.logout);
        if (!response.ok) throw new Error('Logout failed');

        // Reset UI
        domElements.userAvatarS.innerHTML = '<em class="icon ni ni-user-alt"></em>';
        domElements.lineLogin.style.display = 'block';
        [domElements.userDetail, domElements.lineLogout, domElements.userProfile]
            .forEach(el => el.style.display = 'none');

    } catch (error) {
        handleError(error, 'Logout');
    }
};

// Event Listeners
const setupEventListeners = () => {
    domElements.logoutBtn.addEventListener('click', handleLogout);
};

// Initialization
const initializeApp = async () => {
    try {
        await loadUserProfile();
        await getTasabanInfo();
        await initializeDataTable();
        setupEventListeners();
    } catch (error) {
        handleError(error, 'Application initialization');
    }
};

// Start Application
document.addEventListener('DOMContentLoaded', initializeApp);
