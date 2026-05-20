const ARENA_HALF_SIZE = 40;
const SHAPE_HEIGHT = 0.5;

const TETROMINO_DEFINITIONS = {
    z: { color: 0xff3333, cubes: [[0, 0], [1, 0], [1, 1], [2, 1]] },
    s: { color: 0x33cc66, cubes: [[1, 0], [2, 0], [0, 1], [1, 1]] },
    t: { color: 0xaa55ff, cubes: [[0, 0], [1, 0], [2, 0], [1, 1]] },
    l: { color: 0xff9933, cubes: [[0, 0], [0, 1], [0, 2], [1, 2]] },
    j: { color: 0x3366ff, cubes: [[1, 0], [1, 1], [1, 2], [0, 2]] },
    o: { color: 0xffdd33, cubes: [[0, 0], [1, 0], [0, 1], [1, 1]] },
    i: { color: 0x33ddff, cubes: [[0, 0], [0, 1], [0, 2], [0, 3]] }
};

const TETROMINO_KEYS = Object.keys(TETROMINO_DEFINITIONS);

function getRandomTetrominoDefinition() {
    const key = TETROMINO_KEYS[Math.floor(Math.random() * TETROMINO_KEYS.length)];
    return TETROMINO_DEFINITIONS[key];
}

function getTetrominoFootprint(cubes) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    for (const [cubeX, cubeY, cubeZ] of cubes) {
        minX = Math.min(minX, cubeX);
        maxX = Math.max(maxX, cubeX);
        minY = Math.min(minY, cubeY);
        maxY = Math.max(maxY, cubeY);
        minZ = Math.min(minZ, cubeZ);
        maxZ = Math.max(maxZ, cubeZ);
    }

    return { minX, maxX, minY, maxY, minZ, maxZ };
}

function rotateTetrominoCubes(cubes, xTurns, yTurns) {
    let rotatedCubes = cubes.map(([cubeX, cubeY, cubeZ]) => [cubeX, cubeY, cubeZ]);

    for (let turn = 0; turn < xTurns; turn++) {
        rotatedCubes = rotatedCubes.map(([cubeX, cubeY, cubeZ]) => [cubeX, cubeZ, -cubeY]);
    }

    for (let turn = 0; turn < yTurns; turn++) {
        rotatedCubes = rotatedCubes.map(([cubeX, cubeY, cubeZ]) => [cubeZ, cubeY, -cubeX]);
    }

    const footprint = getTetrominoFootprint(rotatedCubes);
    return rotatedCubes.map(([cubeX, cubeY, cubeZ]) => [cubeX - footprint.minX, cubeY - footprint.minY, cubeZ - footprint.minZ]);
}

function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function createObstaclePiece(index) {
    const definition = getRandomTetrominoDefinition();
    const xTurns = Math.floor(Math.random() * 4);
    const yTurns = Math.floor(Math.random() * 4);
    const cubes = rotateTetrominoCubes(definition.cubes.map(([cubeX, cubeZ]) => [cubeX, 0, cubeZ]), xTurns, yTurns);
    const footprint = getTetrominoFootprint(cubes);
    const spawnMargin = 2;
    const minSpawnX = -ARENA_HALF_SIZE + spawnMargin - footprint.minX;
    const maxSpawnX = ARENA_HALF_SIZE - spawnMargin - footprint.maxX;
    const minSpawnZ = -ARENA_HALF_SIZE + spawnMargin - footprint.minZ;
    const maxSpawnZ = ARENA_HALF_SIZE - spawnMargin - footprint.maxZ;
    const originX = getRandomFloat(minSpawnX, maxSpawnX);
    const originZ = getRandomFloat(minSpawnZ, maxSpawnZ);

    const blocks = cubes.map(([cubeX, cubeY, cubeZ]) => ({
        x: originX + cubeX,
        y: SHAPE_HEIGHT + cubeY,
        z: originZ + cubeZ
    }));

    return {
        id: `obstacle-${index}`,
        color: definition.color,
        blocks
    };
}

function createObstacleLayout(pieceCount = 8) {
    const obstacles = [];
    for (let index = 0; index < pieceCount; index++) {
        obstacles.push(createObstaclePiece(index));
    }
    return obstacles;
}

module.exports = {
    createObstacleLayout
};
