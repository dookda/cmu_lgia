
const loadUserProfile = async () => {
    try {
        const response = await fetch('/auth/profile');
        const data = await response.json();
        console.log(data);

        let userAvatarS = document.getElementById('userAvatarS');
        let displayName = document.getElementById('displayName');
        let userName = document.getElementById('userName');
        let userEmail = document.getElementById('userEmail');
        let userRole = document.getElementById('userRole');

        if (!data.success) {
            console.log('User not logged in');
            userAvatarS.innerHTML += '<em class="icon ni ni-user-alt"></em>';
            window.location.href = '/auth/login';
            return null
        }

        userAvatarS.innerHTML += `<img src="${data.user.pictureUrl}" class="avatar" width=200 alt="Profile Picture">`;
        displayName.value = `${data.user.displayName}`;
        userName.value = `${data.user.userName}`;
        userEmail.value = `${data.user.email}`;
        userRole.value = `${data.user.roles}`;

    } catch (error) {
        console.error('Error loading profile:', error);
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    await loadUserProfile();
});

