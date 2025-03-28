// DOM Elements Cache
const domElements = {
    uploadForm: document.getElementById('uploadForm'),
    division: document.getElementById('division'),
    layername: document.getElementById('layername'),
    layertype: document.getElementById('layertype'),
    fileInput: document.getElementById('file'),
    message: document.getElementById('message'),
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

// Error Handler
const handleError = (error, message) => {
    console.error(`${message}:`, error);
    domElements.message.textContent = `${message}. Please try again.`;
    domElements.message.classList.add('error');
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

// Helper Functions
const resetMessage = () => {
    domElements.message.textContent = '';
    domElements.message.className = '';
};

const showMessage = (text, type) => {
    domElements.message.textContent = text;
    domElements.message.classList.add(type);
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

// document.getElementById('uploadForm').addEventListener('submit', async (e) => {
//     e.preventDefault();

//     const division = document.getElementById('division').value;
//     const layername = document.getElementById('layername').value;
//     const layertype = document.getElementById('layertype').value;
//     const fileInput = document.getElementById('file');
//     const file = fileInput.files[0];

//     if (!file) {
//         alert('Please select a file to upload.');
//         return;
//     }

//     const formData = new FormData();
//     formData.append('division', division);
//     formData.append('layername', layername);
//     formData.append('layertype', layertype);
//     formData.append('file', file);

//     const messageDiv = document.getElementById('message');
//     messageDiv.textContent = '';
//     messageDiv.classList.remove('success', 'error');

//     try {
//         const response = await fetch('/api/v2/upload', {
//             method: 'POST',
//             body: formData,
//         });

//         if (response.ok) {
//             messageDiv.textContent = 'File uploaded and is being processed.';
//             messageDiv.classList.add('success');
//         } else {
//             const errorData = await response.json(); // Assuming the server returns JSON error messages
//             messageDiv.textContent = `Error: ${errorData.message || 'An error occurred during upload.'}`;
//             messageDiv.classList.add('error');
//         }
//     } catch (error) {
//         messageDiv.textContent = `Error: ${error.message}`;
//         messageDiv.classList.add('error');
//     }
// });

// const loadUserProfile = async () => {
//     try {
//         const response = await fetch('/auth/profile/editor');
//         const data = await response.json();

//         let userAvatarS = document.getElementById('userAvatarS');
//         let userAvatarL = document.getElementById('userAvatarL');
//         let displayName = document.getElementById('displayName');
//         if (!data.success || !data.auth) {
//             console.log('User not logged in');
//             window.location.href = '../dashboard/index.html';
//             userAvatarS.innerHTML += '<em class="icon ni ni-user-alt"></em>';
//             document.getElementById('userDetail').style.display = "none";
//             document.getElementById('lineLogout').style.display = "none";
//             document.getElementById('userProfile').style.display = "none";
//             return null
//         }
//         document.getElementById('lineLogin').style.display = "none";
//         userAvatarS.innerHTML += `<img src="${data.user.pictureUrl}" class="avatar" alt="Profile Picture">`;
//         userAvatarL.innerHTML += `<img src="${data.user.pictureUrl}" class="avatar" alt="Profile Picture">`;
//         displayName.innerHTML = `${data.user.displayName}`;
//     } catch (error) {
//         console.error('Error loading profile:', error);
//     }
// };

// const getTasabanInfo = async () => {
//     try {
//         const response = await fetch('/api/v2/info', { method: 'GET' });
//         if (!response.ok) {
//             throw new Error('Network response was not ok');
//         }
//         const data = await response.json();

//         document.getElementById('tasabanInfo').textContent = data.name;

//         const logoImg1 = document.getElementById('imgLogo1');
//         const logoImg2 = document.getElementById('imgLogo2');
//         if (data.img) {
//             logoImg1.src = data.img;
//             logoImg1.removeAttribute('srcset');
//             logoImg1.onerror = () => {
//                 console.error('Failed to load logo image');
//                 logoImg1.src = './../images/logo-dark2x.png'; // Fallback
//             };

//             logoImg2.src = data.img;
//             logoImg2.removeAttribute('srcset');
//             logoImg2.onerror = () => {
//                 console.error('Failed to load logo image');
//                 logoImg2.src = './../images/logo-dark2x.png'; // Fallback
//             };
//         }

//     } catch (error) {
//         console.error('Error fetching tasaban info:', error);
//         document.getElementById('imgLogo').src = './../images/logo-dark2x.png';
//     }
// };

// document.addEventListener('DOMContentLoaded', async () => {
//     await loadUserProfile();
//     await getTasabanInfo();
// });

// document.getElementById('logout').addEventListener('click', async () => {
//     try {
//         const response = await fetch('/auth/logout');
//         const data = await response.json();
//         console.log(data);

//         if (!data.success) {
//             throw new Error('Logout failed');
//         }
//         let userAvatarS = document.getElementById('userAvatarS');
//         userAvatarS.innerHTML = '';
//         userAvatarS.innerHTML += '<em class="icon ni ni-user-alt"></em>';

//         document.getElementById('lineLogin').style.display = "block";
//         document.getElementById('userDetail').style.display = "none";
//         document.getElementById('lineLogout').style.display = "none";
//         document.getElementById('userProfile').style.display = "none";
//     } catch (error) {
//         console.error('Error logging out:', error);
//     }
// });