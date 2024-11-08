
document.getElementById('myForm').addEventListener('submit', function (event) {
    if (!this.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
    } else {
        const password1 = document.getElementById('password1').value;
        const password2 = document.getElementById('password2').value;

        if (password1 !== password2) {
            document.getElementById('password2').setCustomValidity('Passwords do not match');
        } else {
            document.getElementById('password2').setCustomValidity('');
            const modal = new bootstrap.Modal(document.getElementById('modal'));

            let username = document.getElementById('username').value;
            let email = document.getElementById('email').value;
            let password = document.getElementById('password1').value;
            let division = document.getElementById('division').value;

            axios.post("/api/register", { username, email, password, division }).then(r => {
                console.log(r);
                if (r.status == 201) {
                    document.getElementById('result').innerHTML = 'ลงทะเบียนสำเร็จ';
                    document.getElementById('resultCheck').value = 'yes';
                    modal.show();
                } else if (r.status == 200) {
                    document.getElementById('result').innerHTML = 'ชื่อผู้ใช้งานนี้มีอยู่แล้ว <br>กรุณาเปลี่ยนชื่อผู้ใช้งานแล้วลองอีกครั้ง';
                    document.getElementById('resultCheck').value = 'no';
                    modal.show();
                }
            }).catch(e => {
                console.log(e);
            })
        }
        event.preventDefault();
        event.stopPropagation();
    }

    this.querySelectorAll('input').forEach(input => {
        input.classList.add('touched');
    });

    // this.classList.add('was-validated');
});

const gotoLogin = () => {
    document.getElementById('resultCheck').value == 'yes' ? window.location.href = "./../_login/index.html" : '';
}