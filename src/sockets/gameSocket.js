const { verifyToken } = require('../auth/jwtValidator');
const generalEventHandling = require("./generalEventHandling");
const lobbyEventHandling = require("./lobbyEventHandling");
const sessionEventHandling = require("./sessionEventHandling");
const duelEventHandling = require("./duelEventHandling");

// Globale variabelen
const lobbys = {};
const sessions = {};
const duels = {};
const snapshotIntervalMs = 5000;

module.exports = (io) => {
    // Middleware voor token verificatie
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token ||
                generalEventHandling.getCookieValue(socket.request.headers.cookie, "token");

            if (token) {
                const payload = await verifyToken(token);
                console.log('Token verified successfully:', payload);
                socket.user = payload;
            } else {
                console.log("No token provided, allowing guest connection");
            }
            next();
        } catch (error) {
            console.error('Token verification failed:', error);
            console.log("Allowing guest connection instead");
            next();
        }
    });

    // Interval voor session state updates
    setInterval(() => {
        Object.values(sessions).forEach((session) => {
            const allPlayerFields = require("../services/sessionService").getPlayerFields(session);
            if (!session || !allPlayerFields) return;
            io.to(session.id).emit("sessionState", allPlayerFields);
        });
    }, snapshotIntervalMs);

    io.on("connection", (socket) => {
        // Log connection
        if (socket.user) {
            console.log(`Player connected: ${socket.user}`);
        } else {
            console.log(`Guest player connected: ${socket.id} (guest)`);
        }

        // Registreer alle event handlers
        generalEventHandling.registerEvents(socket, io, lobbys, sessions, duels);
        lobbyEventHandling.registerEvents(socket, io, lobbys, sessions);
        sessionEventHandling.registerEvents(socket, io, sessions, lobbys, duels);
        duelEventHandling.registerEvents(socket, io, duels, sessions);
    });

    // Maak globale variabelen beschikbaar voor andere modules
    global.lobbys = lobbys;
    global.sessions = sessions;
    global.duels = duels;
};