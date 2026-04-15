const gameService = require("../services/gameService");

module.exports = (io) => {
    io.on("connection", (socket) => {
        console.log("Gebruiker verbonden:", socket.id);

        // // stuur huidige state
        // socket.emit("counterUpdate", gameService.getCounter());

        // // klik event
        // socket.on("click", () => {
        //     const nextCounter = gameService.incrementCounter();

        //     // stuur naar iedereen
        //     io.emit("counterUpdate", nextCounter);
        // });

        io.emit("playerJoined", { id: socket.id });

        socket.on("disconnect", () => {
            io.emit("playerLeft", { id: socket.id });
            console.log("Gebruiker weg:", socket.id);
        });
    });
};