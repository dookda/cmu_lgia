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

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const response = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData))
    });

    const result = await response.json();

    if (result.success) {
        showMessage('ลงทะเบียนสำเร็จ กำลังนำไปยังหน้า login', 'success');
        setTimeout(() => window.location.href = '/login', 2000);
    } else {
        console.log(result);

        showMessage(result.message, 'error');
    }
});