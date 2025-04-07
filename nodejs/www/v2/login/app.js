// DOM Elements Cache
const domElements = {
    message: document.getElementById('message')
};

const showMessage = (text, type) => {
    domElements.message.textContent = text;
    domElements.message.classList.add(type);
    domElements.message.classList.add('mt-2');
    domElements.message.classList.add('mb-2');
    domElements.message.style.display = 'block';
    setTimeout(() => {
        domElements.message.style.display = 'none';
        domElements.message.classList.remove(type);
        domElements.message.textContent = '';
    }, 1500);
};

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const response = await fetch('/auth/local/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData))
    });

    const result = await response.json();

    if (result.success) {
        showMessage('ลงทะเบียนสำเร็จ กำลังนำไปยังหน้า login', 'success');
        setTimeout(() => window.location.href = '/v2/dashboard', 1000);
    } else {
        showMessage('username หรือ password ผิด', 'error');
    }
});

// Handle URL parameters for error messages
const urlParams = new URLSearchParams(window.location.search);
const error = urlParams.get('error');
if (error) {
    document.getElementById('message').innerHTML =
        `<div class="error">Login failed. Please try again.</div>`;
}