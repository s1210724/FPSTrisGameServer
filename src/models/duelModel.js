class duelModel {

    constructor(id, password) {
        this.id = id;
        this.password = password;
        this.players = {};
    }

    addplayer(socket) {
        if (Object.keys(this.players).length >= 2) {
            return false;
        }
        
        if (socket.user) {
            if (!this.checkIfAlreadyJoinded(socket.user.username)) {
                this.players[socket.user.username] = socket.id;
            }
        } else {
            if (!this.checkIfAlreadyJoinded(socket.id)) {
                this.players[socket.id] = socket.id;
            }
        }
    }

    checkIfAlreadyJoinded(identifier) {
        return this.players[identifier] !== undefined;
    }
}

module.exports = { duelModel };