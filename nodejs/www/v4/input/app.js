// app.js

// Function to handle file upload
function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (file) {
        const formData = new FormData();
        formData.append('file', file);

        axios.post('/api/v2/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(response => {
                alert('File uploaded successfully!');
                console.log(response.data);
            })
            .catch(error => {
                console.error('Error uploading file:', error);
                alert('Error uploading file.');
            });
    } else {
        alert('Please select a file to upload.');
    }
}

// Function to add a new column to the table
function addRow() {
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

        // Clear input fields
        document.getElementById('columnname').value = '';
        document.getElementById('columntype').value = '';
        document.getElementById('columndesc').value = '';
    } else {
        alert('Please fill in all required fields.');
    }
}

// Function to delete a row from the table
function deleteRow(button) {
    const row = button.parentElement.parentElement;
    row.remove();
}

// Function to handle form submission for creating a new layer
document.getElementById('btn_getdata').addEventListener('click', function (event) {
    event.preventDefault();

    const division = document.getElementById('division').value;
    const layerName = document.getElementById('layername').value;
    const layerType = document.getElementById('layertype').value;

    const columns = [];
    const rows = document.querySelectorAll('#tbody tr');
    rows.forEach(row => {
        const columnName = row.children[1].textContent;
        const columnType = row.children[2].textContent;
        const columnDesc = row.children[3].textContent;

        columns.push({
            name: columnName,
            type: columnType,
            description: columnDesc
        });
    });

    const data = {
        division,
        layerName,
        layerType,
        columns
    };

    axios.post('/api/v2/create-layer', data)
        .then(response => {
            alert('Layer created successfully!');
            console.log(response.data);
        })
        .catch(error => {
            console.error('Error creating layer:', error);
            alert('Error creating layer.');
        });
});

// Initialize the map
function initMap() {
    const MAPTILER_KEY = 'QcH5sAeCUv5rMXKrnJms';
    const map = new maplibregl.Map({
        container: 'map',
        style: 'https://api.maptiler.com/maps/streets/style.json?key=' + MAPTILER_KEY,
        center: [100.523186, 13.736717], // Bangkok coordinates
        zoom: 10
    });

    // Add map controls
    map.addControl(new maplibregl.NavigationControl());

    // Handle base map selection
    document.getElementById('baseMapSelector').addEventListener('change', function (event) {
        const selectedStyle = event.target.value;
        let styleUrl = '';

        switch (selectedStyle) {
            case 'maptiler':
                styleUrl = 'https://api.maptiler.com/maps/streets/style.json?key=' + MAPTILER_KEY;
                break;
            case 'osm':
                styleUrl = 'https://api.maptiler.com/maps/openstreetmap/style.json?key=' + MAPTILER_KEY;
                break;
            case 'grod':
                styleUrl = 'https://api.maptiler.com/maps/streets/style.json?key=' + MAPTILER_KEY;
                break;
            case 'gsat':
                styleUrl = 'https://api.maptiler.com/maps/satellite/style.json?key=' + MAPTILER_KEY;
                break;
            case 'ghyb':
                styleUrl = 'https://api.maptiler.com/maps/hybrid/style.json?key=' + MAPTILER_KEY;
                break;
        }

        map.setStyle(styleUrl);
    });
}

// Initialize the map when the page loads
document.addEventListener('DOMContentLoaded', initMap);