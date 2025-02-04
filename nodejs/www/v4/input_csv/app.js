// Function to handle file upload
const uploadFile = () => {
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



