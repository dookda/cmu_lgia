const loadUserProfile = async () => {
    try {
        const response = await fetch('/auth/profile/admin');
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

async function resizeImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = 260 / img.width;
                canvas.width = 260;
                canvas.height = img.height * scale;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Preview image
                const preview = document.getElementById('imagePreview');
                preview.innerHTML = `<img src="${canvas.toDataURL('image/jpeg')}" class="img-fluid mt-2">`;

                resolve(canvas.toDataURL('image/jpeg'));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

let existingImg = null;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadUserProfile();
        const response = await fetch(`/api/v2/info`);
        if (!response.ok) throw new Error('Record not found');

        const data = await response.json();
        existingImg = data.img;

        document.getElementById('idInput').value = data.id;
        document.getElementById('nameInput').value = data.name;
        document.getElementById('imagePreview').innerHTML =
            `<img src="${data.img}" class="img-fluid mt-2">`;

    } catch (error) {
        console.error('Error loading data:', error);
        // alert('Error loading record');
    }

    document.getElementById('uploadForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('idInput').value;
        const name = document.getElementById('nameInput').value;
        const file = document.getElementById('imageInput').files[0];

        if (!name) {
            alert('Please enter a name');
            return;
        }

        try {
            let base64Image = null;

            if (file) {
                console.log('Resizing image...');
                base64Image = await resizeImage(file);
            } else if (id) {
                base64Image = existingImg;
            }

            if (!id && !base64Image) {
                alert('กรุณาเลือกรูปภาพโลโก้');
                return;
            }

            const response = await fetch('/api/v2/info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: id || undefined,
                    name: name,
                    img: base64Image
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Server error');
            }

            const result = await response.json();
            alert(`Data ${id ? 'updated' : 'saved'}!`);

            if (id && file) {
                existingImg = base64Image;
                document.getElementById('imagePreview').innerHTML =
                    `<img src="${base64Image}" class="img-fluid mt-2">`;
            }

            if (!id) {
                document.getElementById('uploadForm').reset();
                document.getElementById('imagePreview').innerHTML = '';
            }

        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Error saving data');
        }
    });
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