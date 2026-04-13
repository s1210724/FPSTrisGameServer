let gameState = {
    clicks: 0
};

exports.getState = () => gameState;

exports.increment = () => {
    gameState.clicks++;
    return gameState;
};