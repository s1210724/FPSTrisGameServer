const socket = io();
const playerListElement = document.getElementById("playerList");
const playerList = [];

socket.emit("joinLobby", {}, (response) => {
    response.forEach((player) => {
        playerList.push(player);
    });
    console.log(response);
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

function updatePlayerList() {
    playerListElement.innerHTML = "";
    playerList.forEach((player) => {
        const listItem = document.createElement("li");
        listItem.textContent = player;
        playerListElement.appendChild(listItem);
    });
}

