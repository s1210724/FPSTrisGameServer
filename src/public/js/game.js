// Reuse one shared socket across all page scripts to avoid duplicate connections.
const socket = io();

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Grid settings for a classic 10x20 Tetris board.
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = canvas.width / COLS;

// Piece definitions: each matrix cell with value > 0 is a visible block.
const PIECES = [
    [[1, 1, 1, 1]],
    [[1, 1], [1, 1]],
    [[0, 1, 0], [1, 1, 1]],
    [[1, 1, 0], [0, 1, 1]],
    [[0, 1, 1], [1, 1, 0]],
    [[1, 0, 0], [1, 1, 1]],
    [[0, 0, 1], [1, 1, 1]]
];

const COLORS = [
    "#00B8D4",
    "#FDD835",
    "#AB47BC",
    "#66BB6A",
    "#EF5350",
    "#42A5F5",
    "#FFA726"
];

// Board stores locked blocks only; the active piece is drawn separately.
const board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

let activePiece = null;
let dropIntervalMs = 500;
let dropAccumulatorMs = 0;
let lastTime = 0;
let score = 0;
let isGameOver = false;
let pieceBag = [];

function createPieceFromType(type) {
    const shape = PIECES[type].map(row => [...row]);
    return {
        shape,
        color: COLORS[type],
        x: Math.floor(COLS / 2) - Math.ceil(shape[0].length / 2),
        y: -1
    };
}

// 7-bag randomizer gives one of each piece per bag, reducing streaks and droughts.
function refillBag() {
    pieceBag = [0, 1, 2, 3, 4, 5, 6];
    for (let i = pieceBag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pieceBag[i], pieceBag[j]] = [pieceBag[j], pieceBag[i]];
    }
}

function getNextPiece() {
    if (pieceBag.length === 0) {
        refillBag();
    }

    const nextType = pieceBag.pop();
    return createPieceFromType(nextType);
}

// Collision checks only the piece cells, which keeps each test very fast.
function collides(piece, nextX, nextY, nextShape = piece.shape) {
    for (let row = 0; row < nextShape.length; row++) {
        for (let col = 0; col < nextShape[row].length; col++) {
            if (!nextShape[row][col]) {
                continue;
            }

            const boardX = nextX + col;
            const boardY = nextY + row;

            if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
                return true;
            }

            if (boardY >= 0 && board[boardY][boardX] !== 0) {
                return true;
            }
        }
    }
    return false;
}

// Merge writes the active piece into the locked board grid.
function lockPiece(piece) {
    for (let row = 0; row < piece.shape.length; row++) {
        for (let col = 0; col < piece.shape[row].length; col++) {
            if (!piece.shape[row][col]) {
                continue;
            }

            const boardY = piece.y + row;
            const boardX = piece.x + col;
            if (boardY >= 0) {
                board[boardY][boardX] = piece.color;
            }
        }
    }
}

// Clear full lines and shift the above rows downward.
function clearLines() {
    let cleared = 0;
    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row].every(cell => cell !== 0)) {
            board.splice(row, 1);
            board.unshift(Array(COLS).fill(0));
            cleared++;
            row++;
        }
    }

    if (cleared > 0) {
        score += [0, 100, 300, 500, 800][cleared] || cleared * 200;
        if (score % 1000 === 0) {
            dropIntervalMs = Math.max(100, dropIntervalMs - 50);
        }
    }
}

function rotateClockwise(shape) {
    const rows = shape.length;
    const cols = shape[0].length;
    const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            rotated[c][rows - 1 - r] = shape[r][c];
        }
    }

    return rotated;
}

function spawnNextPiece() {
    activePiece = getNextPiece();
    if (collides(activePiece, activePiece.x, activePiece.y)) {
        isGameOver = true;
    }
}

function movePiece(deltaX) {
    const newX = activePiece.x + deltaX;
    if (!collides(activePiece, newX, activePiece.y)) {
        activePiece.x = newX;
    }
}

function rotatePiece() {
    const rotated = rotateClockwise(activePiece.shape);
    if (!collides(activePiece, activePiece.x, activePiece.y, rotated)) {
        activePiece.shape = rotated;
        return;
    }

    // Small wall-kick allows rotation near side walls.
    if (!collides(activePiece, activePiece.x - 1, activePiece.y, rotated)) {
        activePiece.x -= 1;
        activePiece.shape = rotated;
    } else if (!collides(activePiece, activePiece.x + 1, activePiece.y, rotated)) {
        activePiece.x += 1;
        activePiece.shape = rotated;
    }
}

function stepDown() {
    const newY = activePiece.y + 1;
    if (!collides(activePiece, activePiece.x, newY)) {
        activePiece.y = newY;
        return;
    }

    lockPiece(activePiece);
    clearLines();
    spawnNextPiece();
}

function hardDrop() {
    while (!collides(activePiece, activePiece.x, activePiece.y + 1)) {
        activePiece.y += 1;
    }
    stepDown();
}

function drawCell(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    ctx.strokeStyle = "#1C1C1C";
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

function drawBoard() {
    ctx.fillStyle = "#0F172A";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = board[r][c];
            if (cell !== 0) {
                drawCell(c, r, cell);
            }
        }
    }
}

function drawPiece(piece) {
    for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
            if (!piece.shape[r][c]) {
                continue;
            }

            const drawX = piece.x + c;
            const drawY = piece.y + r;
            if (drawY >= 0) {
                drawCell(drawX, drawY, piece.color);
            }
        }
    }
}

function drawHud() {
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "16px Arial";
    ctx.fillText(`Score: ${score}`, 10, 22);

    if (isGameOver) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, canvas.height / 2 - 45, canvas.width, 90);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 26px Arial";
        ctx.fillText("GAME OVER", 70, canvas.height / 2 - 5);
        ctx.font = "14px Arial";
        ctx.fillText("Refresh page to play again", 75, canvas.height / 2 + 24);
    }
}

// Keyboard controls: arrows move, up rotates, and space performs hard drop.
document.addEventListener("keydown", event => {
    if (isGameOver || !activePiece) {
        return;
    }

    if (event.code === "ArrowLeft") {
        movePiece(-1);
    } else if (event.code === "ArrowRight") {
        movePiece(1);
    } else if (event.code === "ArrowDown") {
        stepDown();
    } else if (event.code === "ArrowUp") {
        rotatePiece();
    } else if (event.code === "Space") {
        hardDrop();
    }
});

// Main loop updates falling timing and redraws every animation frame.
function gameLoop(timestamp) {
    if (!lastTime) {
        lastTime = timestamp;
    }

    const delta = timestamp - lastTime;
    lastTime = timestamp;

    if (!isGameOver) {
        dropAccumulatorMs += delta;
        if (dropAccumulatorMs >= dropIntervalMs) {
            dropAccumulatorMs = 0;
            stepDown();
        }
    }

    drawBoard();
    if (activePiece && !isGameOver) {
        drawPiece(activePiece);
    }
    drawHud();

    requestAnimationFrame(gameLoop);
}

spawnNextPiece();
requestAnimationFrame(gameLoop);