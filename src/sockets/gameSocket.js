module.exports = (io) => {
    let counter = 0;

    io.on("connection", (socket) => {
        console.log("Gebruiker verbonden:", socket.id);

        // stuur huidige state
        socket.emit("counterUpdate", counter);

        // klik event
        socket.on("click", () => {
            counter++;

            // stuur naar iedereen
            io.emit("counterUpdate", counter);
        });

        socket.on("disconnect", () => {
            console.log("Gebruiker weg:", socket.id);
        });
    });
};