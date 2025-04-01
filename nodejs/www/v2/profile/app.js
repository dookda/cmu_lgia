// DOM Elements Cache
const domElements = {
    userId: document.getElementById('userId'),
    userAvatarS: document.getElementById('userAvatarS'),
    displayName: document.getElementById('displayName'),
    userName: document.getElementById('userName'),
    userEmail: document.getElementById('userEmail'),
    userDivision: document.getElementById('userDivision'),
    userRole: document.getElementById('userRole'),
    profileForm: document.getElementById('profileForm'),
    message: document.getElementById('message')
};

// Configuration
const config = {
    apiEndpoints: {
        profileDetail: '/auth/profiledetail',
        userData: (userId) => `/api/v2/user/${userId}`,
        updateProfile: (userId) => `/api/v2/profile/${userId}`
    },
    fallbackAvatar: '<em class="icon ni ni-user-alt"></em>'
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

// User Profile Handling
const loadUserProfile = async () => {
    try {
        const response = await fetch(config.apiEndpoints.profileDetail);

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();

        if (!data.success) {
            window.location.href = '../dashboard/index.html';
            return;
        }

        domElements.userId.value = data.user.userid;
        await loadUserData(data.user.userid);

    } catch (error) {
        showMessage('Failed to load user profile', 'danger');
        console.error('Profile load error:', error);
    }
};

const loadUserData = async (userId) => {
    try {
        const response = await fetch(config.apiEndpoints.userData(userId));

        if (!response.ok) {
            throw new Error('Failed to load user data');
        }

        const data = await response.json();
        const user = data[0];

        // Safe DOM updates
        domElements.userAvatarS.innerHTML = '';
        const img = document.createElement('img');
        img.className = 'img';
        img.src = user.picture_url;
        img.alt = 'Profile Picture';
        domElements.userAvatarS.appendChild(img);

        domElements.displayName.value = user.displayname;
        domElements.userName.value = user.username;
        domElements.userEmail.value = user.email;
        domElements.userDivision.value = user.division;
        domElements.userRole.value = user.auth;

    } catch (error) {
        showMessage('Failed to load user details', 'danger');
        console.error('User data error:', error);
    }
};

// Form Handling
const handleFormSubmit = async (e) => {
    e.preventDefault();

    const userData = {
        displayName: domElements.displayName.value.trim(),
        userName: domElements.userName.value.trim(),
        userEmail: domElements.userEmail.value.trim(),
        userDivision: domElements.userDivision.value.trim()
    };

    try {
        // Basic validation
        if (!Object.values(userData).every(field => field)) {
            throw new Error('All fields are required');
        }

        const response = await fetch(config.apiEndpoints.updateProfile(domElements.userId.value), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                // Uncomment if authentication is required
                // 'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Update failed');
        }

        showMessage('Profile updated successfully!', 'success');
        await loadUserData(domElements.userId.value); // Refresh data

    } catch (error) {
        showMessage(error.message, 'danger');
        console.error('Update error:', error);
    }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    // Load initial data
    loadUserProfile();

    // Event Listeners
    domElements.profileForm.addEventListener('submit', handleFormSubmit);
});
