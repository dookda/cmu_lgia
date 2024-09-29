
document.getElementById('myForm').addEventListener('submit', function (event) {
    event.preventDefault();
    event.stopPropagation();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    document.getElementById('server_response').innerHTML = '';
    axios.post("/api/login", { username, password }).then(r => {
        if (r.data.status == "success") {
            const d = new Date();
            d.setTime(d.getTime() + (1 * 60 * 60 * 1000));
            const expires = "expires=" + d.toUTCString();
            document.cookie = `lgiatoken=${r.data.accessToken};${expires};path=/`;
            document.cookie = `lgiausername=${r.data.username};${expires};path=/`;
            document.cookie = `lgiaauth=${r.data.auth};${expires};path=/`;
            document.cookie = `lgiadivision=${r.data.division};${expires};path=/`;

            window.location.href = `./../_home/index.html`;
        }
    }).catch(error => {
        console.log(error);
        document.getElementById('server_response').innerHTML = 'ชื่อหรือรหัสผ่านไม่ถูกต้อง';
    });

    this.querySelectorAll('input').forEach(input => {
        input.classList.add('touched');
    });

    this.classList.add('was-validated');
});




