
const loadUserProfile = async () => {
    try {
        const response = await fetch('/auth/profiledetail');
        const data = await response.json();
        console.log(data);

        let userAvatarS = document.getElementById('userAvatarS');
        let displayName = document.getElementById('displayName');
        let userName = document.getElementById('userName');
        let userEmail = document.getElementById('userEmail');
        let userDivision = document.getElementById('userDivision');
        let userRole = document.getElementById('userRole');

        if (!data.success) {
            console.log('User not logged in');
            userAvatarS.innerHTML += '<em class="icon ni ni-user-alt"></em>';
            window.location.href = '/auth/login';
            return null
        }

        userAvatarS.innerHTML += `<img src="${await data.user.picture_url}" class="img" alt="Profile Picture">`;
        displayName.value = `${await data.user.displayname}`;
        userName.value = `${await data.user.username}`;
        userEmail.value = `${await data.user.email}`;
        userDivision.value = `${await data.user.division}`;
        userRole.value = `${await data.user.auth}`;

    } catch (error) {
        console.error('Error loading profile:', error);
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    await loadUserProfile();
});

