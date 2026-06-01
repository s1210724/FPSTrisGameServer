document.addEventListener("DOMContentLoaded", () => {
    const authTerminal = document.getElementById("authTerminal");
    if (!authTerminal) {
        return;
    }

    const username = authTerminal.dataset.username;
    if (!username) {
        return;
    }

    authTerminal.classList.add("clickable");

    authTerminal.addEventListener("click", async () => {
        const confirmed = window.confirm(`Logout ${username}?`);
        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Logout request failed");
            }

            location.reload();
        } catch (error) {
            console.error(error);
            alert("Logout failed. Please try again.");
        }
    });
});
