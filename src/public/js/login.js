const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const statusElement = document.getElementById("loginStatus");
const submitButton = document.getElementById("loginButton");

function setStatus(message) {
    statusElement.textContent = message;
}

async function login(username, password) {
    const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            username,
            password,
        }),
    });

    const responseText = await response.text();
    let data = {};

    if (responseText) {
        try {
            data = JSON.parse(responseText);
        } catch (error) {
            data = { message: responseText };
        }
    }

    if (!response.ok) {
        throw new Error(data.message || "Login failed");
    }

    window.location.href = "/";
}

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = usernameInput.value.trim();
    let password = passwordInput.value;

    if (!username || !password) {
        setStatus("Vul beide velden in.");
        return;
    }

    submitButton.disabled = true;
    setStatus("Inloggen...");

    try {
        await login(username, password);
    } catch (error) {
        setStatus(error.message || "Inloggen mislukt.");
    } finally {
        password = "";
        passwordInput.value = "";
        submitButton.disabled = false;
    }
});