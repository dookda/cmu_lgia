const domElements = {
    division: document.getElementById('division'),
    layername: document.getElementById('layername'),
    layertype: document.getElementById('layertype'),
    tbody: document.getElementById('tbody'),
    columnForm: document.getElementById('columnForm'),
    layerForm: document.getElementById('layerForm'),
    btnCreate: document.getElementById('btn_create'),
    userAvatarS: document.getElementById('userAvatarS'),
    userAvatarL: document.getElementById('userAvatarL'),
    displayName: document.getElementById('displayName'),
    tasabanInfo: document.getElementById('tasabanInfo'),
    imgLogo1: document.getElementById('imgLogo1'),
    imgLogo2: document.getElementById('imgLogo2'),
    tableForm: document.getElementById('tableForm'),
    message: document.getElementById('message'),
};

const deleteRow = (button) => {
    const row = button.closest('tr');
    row.remove();
    updateRowNumbers();
};

const updateRowNumbers = () => {
    const rows = domElements.tbody.querySelectorAll('tr');
    rows.forEach((row, index) => {
        row.cells[0].textContent = index + 1;
    });
};

const handleError = (error, message) => {
    console.error(`${message}:`, error);
    alert(`${message}. Please try again.`);
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

const setupModalHandlers = () => {
    document.getElementById('btn_add_data').addEventListener('click', () => {
        const layertype = domElements.layertype.value
        window.location.href = `../input_edit/index.html?formid=${document.getElementById('_formid').value}&type=${layertype}`;
    });

    document.getElementById('btn_reload').addEventListener('click', () => {
        window.location.reload();
    });
};

const handleFormValidation = (form, callback) => {
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (form.checkValidity()) {
            form.classList.remove('was-validated');
            callback();
        } else {
            form.classList.add('was-validated');
        }
    }, false);
};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await Promise.all([loadUserProfile(), getTasabanInfo(), loadDivisions()]);

        handleFormValidation(domElements.layerForm, handleLayerFormSubmit);
        handleFormValidation(domElements.columnForm, handleColumnFormSubmit);

        domElements.btnCreate.addEventListener('click', handleCreateLayer);

        setupModalHandlers();
    } catch (error) {
        handleError(error, 'Initialization error');
    }
});

const handleLayerFormSubmit = () => {
    const division = domElements.division.querySelector('option:checked')?.textContent;
    const layername = domElements.layername.value;
    const layertype = domElements.layertype.value;

    document.getElementById('nameLayername').textContent = layername;
    document.getElementById('nameLayertype').textContent = layertype;
    document.getElementById('nameDivision').textContent = division;
    document.getElementById('tableForm').style.display = 'block';
};

const handleColumnFormSubmit = () => {
    const columnName = document.getElementById('columnname').value;
    const columnType = document.getElementById('columntype').value;
    const columnDesc = document.getElementById('columndesc').value;

    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${domElements.tbody.children.length + 1}</td>
        <td>${columnName}</td>
        <td>${columnType}</td>
        <td>${columnDesc}</td>
        <td><button class="btn btn-danger btn-sm" onclick="deleteRow(this)">Delete</button></td>
    `;

    domElements.tbody.appendChild(newRow);
    document.getElementById('columnname').value = '';
    document.getElementById('columntype').value = '';
    document.getElementById('columndesc').value = '';
};

const handleCreateLayer = async (event) => {
    const data = {
        division: domElements.division.value,
        layername: domElements.layername.value,
        layertype: domElements.layertype.value,
        columns: Array.from(domElements.tbody.rows).map(row => ({
            column_name: row.cells[1].textContent,
            column_type: row.cells[2].textContent,
            column_desc: row.cells[3].textContent
        }))
    };

    try {
        const response = await fetch('/api/v2/create_table', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Network response error');

        const result = await response.json();
        document.getElementById('_formid').value = result.formid;
        // new bootstrap.Modal(document.getElementById('update_modal')).show();
        showMessage('สร้างข้อมูลสำเร็จ โปรดตรวจสอบที่หน้ารายการข้อมูล', 'success');
    } catch (error) {
        handleError(error, 'creating layer');
    }
};

const loadDivisions = async () => {
    try {
        const response = await fetch('/api/v2/divisions');
        if (!response.ok) throw new Error('Network response error');
        const divisions = await response.json();

        const defaultOption = domElements.division.querySelector('option[disabled][selected]');
        domElements.division.innerHTML = defaultOption ? defaultOption.outerHTML : '';

        divisions.forEach(division => {
            const option = new Option(division.division_name, division.id);
            domElements.division.add(option);
        });
    } catch (error) {
        handleError(error, 'loading divisions');
    }
};

const loadUserProfile = async () => {
    try {
        const response = await fetch('/auth/profile/editor');
        const data = await response.json();

        if (!data.success || !data.auth) {
            window.location.href = '../dashboard/index.html';
            return;
        }

        domElements.userAvatarS.innerHTML = `<img src="${data.user.pictureUrl}" class="avatar" alt="Profile Picture">`;
        domElements.userAvatarL.innerHTML = `<img src="${data.user.pictureUrl}" class="avatar" alt="Profile Picture">`;
        domElements.displayName.textContent = data.user.displayName;

        document.getElementById('lineLogin').style.display = "none";
        document.getElementById('userDetail').style.display = "block";
        document.getElementById('lineLogout').style.display = "block";
        document.getElementById('userProfile').style.display = "block";
    } catch (error) {
        handleError(error, 'retrieving user profile');
    }
};

const getTasabanInfo = async () => {
    try {
        const response = await fetch('/api/v2/info');
        if (!response.ok) throw new Error('Network response error');
        const data = await response.json();

        domElements.tasabanInfo.textContent = data.name;
        updateLogoImages(data.img);
    } catch (error) {
        handleError(error, 'loading Tasaban info');
        updateLogoImages();
    }
};

const updateLogoImages = (imgSrc) => {
    const fallback = './../images/logo-dark2x.png';
    [domElements.imgLogo1, domElements.imgLogo2].forEach(img => {
        img.src = imgSrc || fallback;
        img.onerror = () => {
            img.src = fallback;
            img.removeAttribute('srcset');
        };
    });
};

document.getElementById('logout').addEventListener('click', async () => {
    try {
        const response = await fetch('/auth/logout');
        if (!response.ok) throw new Error('Network response error');

        domElements.userAvatarS.innerHTML = '<em class="icon ni ni-user-alt"></em>';
        document.getElementById('lineLogin').style.display = "block";
        document.getElementById('userDetail').style.display = "none";
        document.getElementById('lineLogout').style.display = "none";
        document.getElementById('userProfile').style.display = "none";
    } catch (error) {
        handleError(error, 'retrieving user profile');
    }
});