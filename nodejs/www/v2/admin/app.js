// DOM Elements Cache
const domElements = {
    userAvatarS: document.getElementById('userAvatarS'),
    userAvatarL: document.getElementById('userAvatarL'),
    displayName: document.getElementById('displayName'),
    imgLogo1: document.getElementById('imgLogo1'),
    imgLogo2: document.getElementById('imgLogo2'),
    logoutBtn: document.getElementById('logout'),
    userDetail: document.getElementById('userDetail'),
    lineLogin: document.getElementById('lineLogin'),
    lineLogout: document.getElementById('lineLogout'),
    userProfile: document.getElementById('userProfile'),
    uploadForm: document.getElementById('uploadForm'),
    idInput: document.getElementById('idInput'),
    nameInput: document.getElementById('nameInput'),
    imageInput: document.getElementById('imageInput'),
    imagePreview: document.getElementById('imagePreview'),
    message: document.getElementById('message')
};

// Error Handler
const handleError = (error, message) => {
    console.error(`${message}:`, error);
    alert(`${message}. Please try again.`);
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

const clearMessage = () => {
    domElements.message.innerHTML = '';
    domElements.message.style.display = 'none';
};

// Image Handling
const handleImagePreview = (dataURL) => {
    domElements.imagePreview.innerHTML = `<img src="${dataURL}" class="img-fluid mt-2">`;
};

const resizeImage = (file) => new Promise((resolve, reject) => {
    if (!file.type.match('image.*')) {
        reject(new Error('กรุณาเลือกรูปภาพ'));
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const scale = 260 / img.width;
            canvas.width = 260;
            canvas.height = img.height * scale;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            handleImagePreview(canvas.toDataURL('image/png'));
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

// User Profile
const loadUserProfile = async () => {
    try {
        const response = await fetch('/auth/profile/admin');
        const data = await response.json();

        if (!data.success || !data.auth) {
            window.location.href = '../dashboard/index.html';
            return;
        }

        domElements.userAvatarS.innerHTML = `<img src="${data.user.pictureUrl}" class="avatar" alt="Profile">`;
        domElements.userAvatarL.innerHTML = `<img src="${data.user.pictureUrl}" class="avatar" alt="Profile">`;
        domElements.displayName.textContent = data.user.displayName;
        domElements.lineLogin.style.display = "none";
        [domElements.userDetail, domElements.lineLogout, domElements.userProfile].forEach(el => {
            el.style.display = "block";
        });
    } catch (error) {
        handleError(error, 'Failed to load profile');
    }
};

// Tasaban Info Handling
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

const getTasabanInfo = async () => {
    try {
        const response = await fetch('/api/v2/info');
        if (!response.ok) throw new Error('Failed to fetch info');

        const data = (await response.json()) || {};

        // Safe property access
        domElements.idInput.value = data?.id || '';
        domElements.nameInput.value = data?.name || '';

        // Handle image
        const img = data?.img || null;
        updateLogos(img);
        if (img) handleImagePreview(img);

    } catch (error) {
        showMessage(`Error loading information: ${error.message}`, 'danger');
        updateLogos();
    }
};

// Form Handling
const handleFormSubmit = async (e) => {
    e.preventDefault();
    // clearMessage();

    const formData = {
        id: domElements.idInput.value || undefined,
        name: domElements.nameInput.value,
        img: domElements.imageInput.files[0] ? await resizeImage(domElements.imageInput.files[0]) : null
    };

    // console.log(formData);

    try {
        if (!formData.name) throw new Error('กรุณากรอกชื่อเทศบาล');
        if (!formData.id && !formData.img) throw new Error('กรุณาเลือกรูปภาพโลโก้');

        // console.log(formData);

        const response = await fetch('/api/v2/info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Server error');
        }

        showMessage(`Data ${formData.id ? 'updated' : 'saved'} successfully!`, 'success');
        if (!formData.id) domElements.uploadForm.reset();
        await getTasabanInfo();

    } catch (error) {
        showMessage(`Operation failed: ${error.message}`, 'danger');
    }
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

// Initialize App
const initApp = async () => {
    try {
        await loadUserProfile();
        await getTasabanInfo();
        domElements.uploadForm.addEventListener('submit', handleFormSubmit);
        domElements.logoutBtn.addEventListener('click', handleLogout);
    } catch (error) {
        // handleError(error, 'Initialization failed');
        showMessage(error.message, 'danger');
    }
};

// Start Application
document.addEventListener('DOMContentLoaded', initApp);

// const loadUserProfile = async () => {
//     try {
//         const response = await fetch('/auth/profile/admin');
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

// async function resizeImage(file) {
//     return new Promise((resolve) => {
//         const reader = new FileReader();
//         reader.onload = (e) => {
//             const img = new Image();
//             img.onload = () => {
//                 const canvas = document.createElement('canvas');
//                 const scale = 260 / img.width;
//                 canvas.width = 260;
//                 canvas.height = img.height * scale;

//                 const ctx = canvas.getContext('2d');
//                 ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

//                 const preview = document.getElementById('imagePreview');
//                 preview.innerHTML = `<img src="${canvas.toDataURL('image/png')}" class="img-fluid mt-2">`;

//                 resolve(canvas.toDataURL('image/png'));
//             };
//             img.src = e.target.result;
//         };
//         reader.readAsDataURL(file);
//     });
// }

// const getTasabanInfo = async () => {
//     try {
//         const response = await fetch('/api/v2/info', { method: 'GET' });
//         if (!response.ok) {
//             throw new Error('Network response was not ok');
//         }
//         const data = await response.json();

//         const logoImg1 = document.getElementById('imgLogo1');
//         const logoImg2 = document.getElementById('imgLogo2');
//         if (data.img) {
//             logoImg1.src = data.img;
//             logoImg1.removeAttribute('srcset');
//             logoImg1.onerror = () => {
//                 console.error('Failed to load logo image');
//                 logoImg1.src = './../images/logo-dark2x.png';
//             };

//             logoImg2.src = data.img;
//             logoImg2.removeAttribute('srcset');
//             logoImg2.onerror = () => {
//                 console.error('Failed to load logo image');
//                 logoImg2.src = './../images/logo-dark2x.png';
//             };
//         }

//     } catch (error) {
//         console.error('Error fetching tasaban info:', error);
//         document.getElementById('imgLogo').src = './../images/logo-dark2x.png';
//     }
// };

// let existingImg = null;

// document.addEventListener('DOMContentLoaded', async () => {
//     try {
//         await loadUserProfile();
//         await getTasabanInfo();
//         const response = await fetch(`/api/v2/info`);
//         if (!response.ok) throw new Error('Record not found');

//         const data = await response.json();
//         existingImg = data.img;

//         document.getElementById('idInput').value = data.id;
//         document.getElementById('nameInput').value = data.name;
//         document.getElementById('imagePreview').innerHTML =
//             `<img src="${data.img}" class="img-fluid mt-2">`;

//     } catch (error) {
//         console.error('Error loading data:', error);
//     }

//     document.getElementById('uploadForm').addEventListener('submit', async (e) => {
//         e.preventDefault();
//         const id = document.getElementById('idInput').value;
//         const name = document.getElementById('nameInput').value;
//         const file = document.getElementById('imageInput').files[0];

//         if (!name) {
//             alert('Please enter a name');
//             return;
//         }

//         try {
//             let base64Image = null;

//             if (file) {
//                 console.log('Resizing image...');
//                 base64Image = await resizeImage(file);
//             } else if (id) {
//                 base64Image = existingImg;
//             }

//             if (!id && !base64Image) {
//                 alert('กรุณาเลือกรูปภาพโลโก้');
//                 return;
//             }

//             const response = await fetch('/api/v2/info', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({
//                     id: id || undefined,
//                     name: name,
//                     img: base64Image
//                 })
//             });

//             if (!response.ok) {
//                 const error = await response.json();
//                 throw new Error(error.message || 'Server error');
//             }

//             const result = await response.json();
//             alert(`Data ${id ? 'updated' : 'saved'}!`);

//             if (id && file) {
//                 existingImg = base64Image;
//                 document.getElementById('imagePreview').innerHTML =
//                     `<img src="${base64Image}" class="img-fluid mt-2">`;
//             }

//             if (!id) {
//                 document.getElementById('uploadForm').reset();
//                 document.getElementById('imagePreview').innerHTML = '';
//             }

//         } catch (error) {
//             console.error('Error:', error);
//             alert(error.message || 'Error saving data');
//         }
//     });
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