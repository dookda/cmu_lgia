document.getElementById("registerForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const division = document.getElementById("division").value;

    try {
        const response = await fetch("/api/v2/users", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, email, password, division }),
        });

        const result = await response.json();
        const messageDiv = document.getElementById("message");

        if (response.ok) {
            messageDiv.innerHTML = `<div class="alert alert-success">${result.message}</div>`;
            setTimeout(() => window.location.href = "login.html", 2000);
        } else {
            messageDiv.innerHTML = `<div class="alert alert-danger">${result.error}</div>`;
        }
    } catch (error) {
        console.error(error);
        document.getElementById("message").innerHTML = `<div class="alert alert-danger">Error registering user</div>`;
    }
});