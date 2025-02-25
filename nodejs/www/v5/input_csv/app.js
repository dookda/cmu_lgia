document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const division = document.getElementById('division').value;
    const layername = document.getElementById('layername').value;
    const layertype = document.getElementById('layertype').value;
    const fileInput = document.getElementById('file');
    const file = fileInput.files[0];

    const formData = new FormData();
    formData.append('division', division);
    formData.append('layername', layername);
    formData.append('layertype', layertype);
    formData.append('file', file);

    const messageDiv = document.getElementById('message');
    messageDiv.textContent = '';
    messageDiv.classList.remove('success', 'error');

    try {
        const response = await fetch('/api/v2/upload', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            messageDiv.textContent = 'File uploaded and is being processed.';
            messageDiv.classList.add('success');
        } else {
            const errorData = await response.text();
            messageDiv.textContent = `Error: ${errorData}`;
            messageDiv.classList.add('error');
        }
    } catch (error) {
        messageDiv.textContent = `Error: ${error.message}`;
        messageDiv.classList.add('error');
    }
});