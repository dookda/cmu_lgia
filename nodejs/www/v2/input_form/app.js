// Function to delete a row from the table
const deleteRow = (button) => {
    const row = button.parentElement.parentElement;
    row.remove();
};

document.getElementById('btn_create').addEventListener('click', function (event) {
    const division = document.getElementById('division').value;
    const layername = document.getElementById('layername').value;
    const layertype = document.getElementById('layertype').value;

    const columns = [];
    const rows = document.querySelectorAll('#tbody tr');
    rows.forEach(row => {
        const columnName = row.children[1].textContent;
        const columnType = row.children[2].textContent;
        const columnDesc = row.children[3].textContent;

        columns.push({
            column_name: columnName,
            column_type: columnType,
            column_desc: columnDesc
        });
    });

    const data = {
        division,
        layername,
        layertype,
        columns
    };
    console.log(data);

    fetch('/api/v2/create_table', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            document.getElementById('_formid').value = data.formid;
            const myModal = new bootstrap.Modal(document.getElementById('update_modal'));
            myModal.show();
        })
        .catch(error => {
            console.error('Error creating layer:', error);
            alert('Error creating layer. Please try again.');
        });
});

const loadUserProfile = async () => {
    try {
        const response = await fetch('/auth/profile');
        const data = await response.json();

        let userAvatarS = document.getElementById('userAvatarS');
        let userAvatarL = document.getElementById('userAvatarL');
        let displayName = document.getElementById('displayName');
        if (!data.success) {
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

document.addEventListener('DOMContentLoaded', async () => {
    await loadUserProfile();
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

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('layerForm');
    form.addEventListener('submit', function (event) {
        event.preventDefault();
        event.stopPropagation();

        if (form.checkValidity()) {
            const division = document.getElementById('division').value;
            const layername = document.getElementById('layername').value;
            const layertype = document.getElementById('layertype').value;
            document.getElementById('nameLayername').innerHTML = layername;
            document.getElementById('nameLayertype').innerHTML = layertype;
            document.getElementById('nameDivision').innerHTML = division;
            document.getElementById('tableForm').style.display = 'block';
        }

        // form.classList.add('was-validated');
    }, false);
});

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('columnForm');
    form.addEventListener('submit', function (event) {
        event.preventDefault();
        event.stopPropagation();

        if (form.checkValidity()) {
            const columnName = document.getElementById('columnname').value;
            const columnType = document.getElementById('columntype').value;
            const columnDesc = document.getElementById('columndesc').value;

            if (columnName && columnType) {
                const tbody = document.getElementById('tbody');
                const newRow = document.createElement('tr');

                newRow.innerHTML = `
                    <td>${tbody.children.length + 1}</td>
                    <td>${columnName}</td>
                    <td>${columnType}</td>
                    <td>${columnDesc}</td>
                    <td><button class="btn btn-danger btn-sm" onclick="deleteRow(this)">Delete</button></td>
                `;

                tbody.appendChild(newRow);
                document.getElementById('columnname').value = '';
                document.getElementById('columntype').value = '';
                document.getElementById('columndesc').value = '';
            } else {
                alert('Please fill in all required fields.');
            }
        }

        // form.classList.add('was-validated');
    }, false);
});