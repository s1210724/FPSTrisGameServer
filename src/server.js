require('dotenv').config();
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

server.listen(process.env.PORT, () => {
    console.log(`Server + Socket.IO draait op http://localhost:${process.env.PORT}`);
});