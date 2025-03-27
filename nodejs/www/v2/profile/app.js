
const loadUserProfile = async () => {
    try {
        const response = await fetch('/auth/profiledetail');
        const data = await response.json();
        // console.log(data);

        if (!data.success) {
            console.log('User not logged in');
            window.location.href = '../dashboard/index.html';
            userAvatarS.innerHTML += '<em class="icon ni ni-user-alt"></em>';
            return null
        }

        document.getElementById('userId').value = data.user.userid;
        await loadUserData(data.user.userid);

    } catch (error) {
        console.error('Error loading profile:', error);
    }
};

const loadUserData = async (userid) => {
    try {
        const response = await fetch(`/api/v2/user/${userid}`);
        const data = await response.json();
        // console.log(data);

        let userAvatarS = document.getElementById('userAvatarS');
        let displayName = document.getElementById('displayName');
        let userName = document.getElementById('userName');
        let userEmail = document.getElementById('userEmail');
        let userDivision = document.getElementById('userDivision');
        let userRole = document.getElementById('userRole');

        userAvatarS.innerHTML += `<img src="${await data[0].picture_url}" class="img" alt="Profile Picture">`;
        displayName.value = `${await data[0].displayname}`;
        userName.value = `${await data[0].username}`;
        userEmail.value = `${await data[0].email}`;
        userDivision.value = `${await data[0].division}`;
        userRole.value = `${await data[0].auth}`;

    } catch (error) {
        console.error('Error loading profile:', error);
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    await loadUserProfile();

    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const userId = document.getElementById('userId').value;
        const userData = {
            displayName: document.getElementById('displayName').value, // Added missing field
            userName: document.getElementById('userName').value,
            userEmail: document.getElementById('userEmail').value,
            userDivision: document.getElementById('userDivision').value,
        };

        try {
            // Corrected endpoint URL
            const response = await fetch(`/api/v2/profile/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    // Uncomment and add authorization if needed
                    // 'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update profile');
            }

            const result = await response.json();
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Error updating profile');
        }
    });
});

