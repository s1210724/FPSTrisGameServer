// Reuse one shared socket across all page scripts to avoid duplicate connections.
const socket = io({
    withCredentials: true,
});

const playerListElement = document.getElementById("playerList");
const playerList = [];

socket.emit("joinLobby", {}, (response) => {
    response.forEach((player) => {
        playerList.push(player);
    });
    updatePlayerList();
});

socket.on("newConnection", (playerName) => {
    playerList.push(playerName);
    updatePlayerList();
});

socket.on("playerLeft", (playerName) => {
    const index = playerList.indexOf(playerName);
    if (index !== -1) {
        playerList.splice(index, 1);
        updatePlayerList();
    }
});

socket.on("sessionMigrated", (data) => {
    localStorage.setItem("sessionData", JSON.stringify(data));
    window.location.href = "/game"; // Navigate to game page
});

function migrateToSession() {
    socket.emit("migrateToSession");
}

function updatePlayerList() {
    playerListElement.innerHTML = "";
    playerList.forEach((player) => {
        const listItem = document.createElement("li");
        const nameP = document.createElement("p");
        nameP.textContent = player;
        const readyP = document.createElement("p");
        readyP.textContent = "ready";
        listItem.appendChild(nameP);
        listItem.appendChild(readyP);
        playerListElement.appendChild(listItem);
    });
}

