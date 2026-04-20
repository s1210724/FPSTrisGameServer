const path = require("path");

const viewsPath = path.join(__dirname, "../public/views");

exports.getViewPath = (viewFileName) => {
    return path.join(viewsPath, viewFileName);
};

exports.getGameData = () => {
    return {
        title: "Clicker Game"
    };
};