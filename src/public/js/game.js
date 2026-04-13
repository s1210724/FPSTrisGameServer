const socket = io();

const scoreElement = document.getElementById("score");
const clickButton = document.getElementById("click-button");

socket.on("counterUpdate", (value) => {
    scoreElement.innerText = value;
});

clickButton.addEventListener("click", () => {
    socket.emit("click");
});