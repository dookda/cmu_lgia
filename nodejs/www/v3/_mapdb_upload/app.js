
let getLayerName = () => {
    if (document.getElementById('lyrname') !== null)
        document.getElementById('lyrname').innerText = document.getElementById('layername').value;
}

let addRow = () => {
    let columnName = document.getElementById('columnname').value;
    let columnType = document.getElementById('columntype').value;
    let columnDesc = document.getElementById('columndesc').value;
    let tbody = document.getElementById('tbody');
    let rowCount = tbody.getElementsByTagName('tr').length + 1;

    tbody.innerHTML += `
      <tr>
        <th scope="row">${rowCount}</th>
        <td>${columnName}</td>
        <td>${columnType}</td>
        <td>${columnDesc}</td>
        <td><button class="btn btn-warning" onclick="deleteRow(this)">Delete</button></td>
      </tr>
    `;
}

let deleteRow = (button) => {
    let row = button.closest('tr');
    row.parentNode.removeChild(row);

    let tbody = document.getElementById('tbody');
    let rows = tbody.getElementsByTagName('tr');
    for (let i = 0; i < rows.length; i++) {
        rows[i].getElementsByTagName('th')[0].innerText = i + 1;
    }
}

let gotoCreatePage = () => {
    let formid = document.getElementById('_formid').value;
    window.location.href = '/_create/index.html?formid=' + formid + '&mode=edit'
}

let getTableData = () => {
    let division = document.getElementById('division').value;
    let layername = document.getElementById('layername').value;
    let layertype = document.getElementById('layertype').value;
    let columes = [];
    let tbody = document.getElementById('tbody');
    let rows = tbody.getElementsByTagName('tr');
    for (let i = 0; i < rows.length; i++) {
        let row = rows[i];
        let cells = row.getElementsByTagName('td');
        let column_name = cells[0].textContent;
        let column_type = cells[1].textContent;
        let column_desc = cells[2].textContent;
        columes.push({ column_name, column_type, column_desc });
    }

    console.log(columes);
    axios.post('/api/create_table', {
        division,
        layername,
        layertype,
        columes
    }).then(res => {
        document.getElementById('_formid').value = res.data.formid;
        var myModal = new bootstrap.Modal(document.getElementById('update_modal'));
        myModal.show();
    });
}

let resetForm = () => {
    var form = document.querySelector('.needs-validation');
    form.reset();

    var inputs = form.querySelectorAll('input, select');
    inputs.forEach(function (input) {
        input.classList.remove('is-valid', 'is-invalid');
    });

    var feedbacks = form.querySelectorAll('.valid-feedback, .invalid-feedback');
    feedbacks.forEach(function (feedback) {
        feedback.innerHTML = '';
    });
}

// reload page
let btn_reload = document.getElementById('btn_reload');
btn_reload.addEventListener('click', () => {
    location.reload();
});

// go to create page
let btn_add_data = document.getElementById('btn_add_data');
btn_add_data.addEventListener('click', gotoCreatePage);

// get buton 
let btn = document.getElementById('btn_getdata');
// btn.addEventListener('click', getTableData);

// validate form
var forms = document.querySelectorAll('.needs-validation');
Array.from(forms).forEach(function (form) {
    form.addEventListener('submit', function (event) {
        if (!form.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
        } else {
            event.preventDefault();
            event.stopPropagation();
            // getTableData();
        }

        form.classList.add('was-validated');
    }, false);
});


// const token = 'eyJhbGciOiJIUzI1NiJ9.JDJhJDEwJDVHTkZ1eE9SbDguMG4yaC5yV3JmVy44TlJ2NXI3MEllUjZESC9EUFdsTEU1RWhPN3pYZHBx.HHXaiN3gWV68ekPDxQ9nxAJHmckB9ivzxQpgWvTEKsw'
// axios.get('/protected', {
//     headers: {
//         'Authorization': `Bearer ${token}` 
//     }
// })
//     .then(response => console.log(response.data))
//     .catch(error => console.error('Error:', error));


function uploadFile() {

    const fileInput = document.getElementById('fileInput');
    const division = document.getElementById('division').value;
    const layername = document.getElementById('layername').value;
    const layertype = document.getElementById('layertype').value;
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select a file.');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('division', division);
    formData.append('layername', layername);
    formData.append('layertype', layertype);

    fetch('/api/upload', {
        method: 'POST',
        body: formData,
    })
        .then(response => {
            if (response.ok) {
                return response.text();
            }
            throw new Error('Network response was not ok.');
        })
        .then(data => {
            console.log(data);
            alert('File uploaded successfully.');
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
            alert('Error uploading file.');
        });
}
