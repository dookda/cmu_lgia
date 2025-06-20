// DOM Elements Cache
const domElements = {
    uploadForm: document.getElementById('uploadForm'),
    division: document.getElementById('division'),
    layername: document.getElementById('layername'),
    layertype: document.getElementById('layertype'),
    fileInput: document.getElementById('file'),
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
    userProfile: document.getElementById('userProfile'),
    message: document.getElementById('message')
};

const handleError = (error, message) => {
    console.error(`${message}:`, error);
    domElements.message.textContent = `${message}. Please try again.`;
    domElements.message.classList.add('error');
};

const resetMessage = () => {
    domElements.message.style.display = 'none';
    // domElements.message.classList.remove(type);
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
// Initialize Application
const initApp = async () => {
    try {
        await Promise.all([
            loadUserProfile(),
            getTasabanInfo(),
            loadDivisions() // Add this line
        ]);
        setupEventListeners();
    } catch (error) {
        handleError(error, 'Initialization failed');
    }
};

// Event Listeners Setup
const setupEventListeners = () => {
    domElements.uploadForm.addEventListener('submit', handleFormSubmit);
    domElements.logoutBtn.addEventListener('click', handleLogout);
};

// Form Submission Handler
const handleFormSubmit = async (e) => {
    e.preventDefault();
    resetMessage();

    const formData = new FormData();
    formData.append('division', domElements.division.value);
    formData.append('layername', domElements.layername.value);
    formData.append('layertype', domElements.layertype.value);
    formData.append('file', domElements.fileInput.files[0]);

    try {
        const response = await fetch('/api/v2/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Upload failed');
        }

        showMessage('นำเข้าข้อมูลสำเร็จ โปรดตรวจสอบที่หน้ารายการข้อมูล', 'success');
    } catch (error) {
        handleError(error, 'Upload error');
    }
};

const loadDivisions = async () => {
    try {
        const response = await fetch('/api/v2/divisions');
        if (!response.ok) throw new Error('Network response error');
        const divisions = await response.json();

        // Preserve default option
        const defaultOption = domElements.division.querySelector('option[disabled][selected]');
        domElements.division.innerHTML = defaultOption ? defaultOption.outerHTML : '';

        // Add new options
        divisions.forEach(division => {
            const option = new Option(division.division_name, division.id);

            domElements.division.add(option);
        });
    } catch (error) {
        handleError(error, 'Loading divisions failed');
    }
};

// User Profile Loader
const loadUserProfile = async () => {
    try {
        const response = await fetch('/auth/profile/editor');
        const data = await response.json();

        if (!data.success || !data.auth) {
            handleUnauthenticated();
            return;
        }

        updateUserInterface(data.user);
    } catch (error) {
        handleError(error, 'Profile load failed');
    }
};

// Tasaban Info Loader
const getTasabanInfo = async () => {
    try {
        const response = await fetch('/api/v2/info');
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();

        domElements.tasabanInfo.textContent = data.name;
        updateLogos(data.img);
    } catch (error) {
        handleError(error, 'Tasaban info load failed');
        updateLogos();
    }
};

const handleUnauthenticated = () => {
    window.location.href = '../dashboard/index.html';
    domElements.userAvatarS.innerHTML = '<em class="icon ni ni-user-alt"></em>';
    [domElements.userDetail, domElements.lineLogout, domElements.userProfile].forEach(el => {
        el.style.display = "none";
    });
};

const updateUserInterface = (user) => {
    domElements.userAvatarS.innerHTML = `<img src="${user.pictureUrl}" class="avatar" alt="Profile">`;
    domElements.userAvatarL.innerHTML = `<img src="${user.pictureUrl}" class="avatar" alt="Profile">`;
    domElements.displayName.textContent = user.displayName;
    domElements.lineLogin.style.display = "none";
    [domElements.userDetail, domElements.lineLogout, domElements.userProfile].forEach(el => {
        el.style.display = "block";
    });
};

const updateLogos = (imgSrc) => {
    const fallback = './../images/logo-dark2x.png';
    [domElements.imgLogo1, domElements.imgLogo2].forEach(img => {
        img.src = imgSrc || fallback;
        img.onerror = () => {
            img.src = fallback;
            img.removeAttribute('srcset');
        };
    });
};

// Logout Handler
const handleLogout = async () => {
    try {
        const response = await fetch('/auth/logout');
        if (!response.ok) throw new Error('Logout failed');

        domElements.userAvatarS.innerHTML = '<em class="icon ni ni-user-alt"></em>';
        domElements.lineLogin.style.display = "block";
        [domElements.userDetail, domElements.lineLogout, domElements.userProfile].forEach(el => {
            el.style.display = "none";
        });
    } catch (error) {
        handleError(error, 'Logout failed');
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
