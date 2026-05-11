const registerForm = document.getElementById("registerForm");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const statusElement = document.getElementById("registerStatus");
const submitButton = document.getElementById("registerButton");

function setStatus(message) {
    if (!statusElement) {
        return;
    }

    statusElement.textContent = message;
}

async function register(username, email, password) {
    const response = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            username,
            email,
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
        throw new Error(data.message || "Registration failed");
    }

    window.location.href = "/login";
}

if (registerForm && usernameInput && emailInput && passwordInput && submitButton) {
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        let password = passwordInput.value;

        if (!username || !email || !password) {
            setStatus("Vul alle velden in.");
            return;
        }

        submitButton.disabled = true;
        setStatus("Account aanmaken...");

        try {
            await register(username, email, password);
        } catch (error) {
            setStatus(error.message || "Registratie mislukt.");
        } finally {
            password = "";
            passwordInput.value = "";
            submitButton.disabled = false;
        }
    });
}
