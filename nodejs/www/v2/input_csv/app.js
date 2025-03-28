document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const division = document.getElementById('division').value;
    const layername = document.getElementById('layername').value;
    const layertype = document.getElementById('layertype').value;
    const fileInput = document.getElementById('file');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select a file to upload.');
        return;
    }

    const formData = new FormData();
    formData.append('division', division);
    formData.append('layername', layername);
    formData.append('layertype', layertype);
    formData.append('file', file);

    const messageDiv = document.getElementById('message');
    messageDiv.textContent = '';
    messageDiv.classList.remove('success', 'error');

    try {
        const response = await fetch('/api/v2/upload', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            messageDiv.textContent = 'File uploaded and is being processed.';
            messageDiv.classList.add('success');
        } else {
            const errorData = await response.json(); // Assuming the server returns JSON error messages
            messageDiv.textContent = `Error: ${errorData.message || 'An error occurred during upload.'}`;
            messageDiv.classList.add('error');
        }
    } catch (error) {
        messageDiv.textContent = `Error: ${error.message}`;
        messageDiv.classList.add('error');
    }
});

const loadUserProfile = async () => {
    try {
        const response = await fetch('/auth/profile/editor');
        const data = await response.json();

        let userAvatarS = document.getElementById('userAvatarS');
        let userAvatarL = document.getElementById('userAvatarL');
        let displayName = document.getElementById('displayName');
        if (!data.success || !data.auth) {
            console.log('User not logged in');
            window.location.href = '../dashboard/index.html';
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

const getTasabanInfo = async () => {
    try {
        const response = await fetch('/api/v2/info', { method: 'GET' });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();

        // Update text content
        document.getElementById('tasabanInfo').textContent = data.name;

        // Update logo image
        const logoImg1 = document.getElementById('imgLogo1');
        const logoImg2 = document.getElementById('imgLogo2');
        if (data.img) {
            logoImg1.src = data.img;
            logoImg1.removeAttribute('srcset');
            logoImg1.onerror = () => {
                console.error('Failed to load logo image');
                logoImg1.src = './../images/logo-dark2x.png'; // Fallback
            };

            logoImg2.src = data.img;
            logoImg2.removeAttribute('srcset');
            logoImg2.onerror = () => {
                console.error('Failed to load logo image');
                logoImg2.src = './../images/logo-dark2x.png'; // Fallback
            };
        }

    } catch (error) {
        console.error('Error fetching tasaban info:', error);
        // Optional: Restore original logo on error
        document.getElementById('imgLogo').src = './../images/logo-dark2x.png';
    }
};

document.addEventListener('DOMContentLoaded', async () => {

    await loadUserProfile();
    await getTasabanInfo();
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