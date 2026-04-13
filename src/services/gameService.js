const gameModel = require("../models/gameModel");

exports.getCounter = () => {
    return gameModel.getState().clicks;
};

exports.incrementCounter = () => {
    const nextState = gameModel.increment();
    return nextState.clicks;
};
