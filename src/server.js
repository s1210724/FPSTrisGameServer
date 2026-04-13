const http = require("http");
const app = require("./app");
const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

// sockets koppelen
require("./sockets/gameSocket.js")(io);

server.listen(3000, () => {
    console.log("Server + Socket.IO draait op http://localhost:3000");
});