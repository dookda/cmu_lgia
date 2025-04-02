const loadUserProfile = async () => {
    try {
        const response = await fetch('/auth/profile/user');
        const data = await response.json();

        let userAvatarS = document.getElementById('userAvatarS');
        let userAvatarL = document.getElementById('userAvatarL');
        let displayName = document.getElementById('displayName');
        if (!data.success || !data.auth) {
            console.log('User not logged in');
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
        // document.getElementById('tasabanInfo').textContent = data.name;

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

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadUserProfile();
        await getTasabanInfo();

    } catch (error) {
        console.error('Error loading data:', error);
        // alert('Error loading record');
    }
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