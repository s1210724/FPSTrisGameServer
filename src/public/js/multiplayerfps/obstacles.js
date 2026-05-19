import { THREE } from "./deps.js";
import { ARENA_HALF_SIZE, SHAPE_HEIGHT, TETROMINO_DEFINITIONS } from "./config.js";

const TETROMINO_KEYS = Object.keys(TETROMINO_DEFINITIONS);

function getRandomTetrominoDefinition() {
    return TETROMINO_DEFINITIONS[TETROMINO_KEYS[THREE.MathUtils.randInt(0, TETROMINO_KEYS.length - 1)]];
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

export function addDemoObstacles(scene, obstacleBoxes, hittableObjects, pieceCount = 8) {
    for (let index = 0; index < pieceCount; index++) {
        createRandomTetromino(scene, obstacleBoxes, hittableObjects, index);
    }
}

function createRandomTetromino(scene, obstacleBoxes, hittableObjects, groupIndex) {
    const definition = getRandomTetrominoDefinition();
    const piece = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ color: definition.color });
    const xTurns = THREE.MathUtils.randInt(0, 3);
    const yTurns = THREE.MathUtils.randInt(0, 3);
    const cubes = rotateTetrominoCubes(definition.cubes.map(([cubeX, cubeZ]) => [cubeX, 0, cubeZ]), xTurns, yTurns);
    const footprint = getTetrominoFootprint(cubes);
    const spawnMargin = 2;
    const minSpawnX = -ARENA_HALF_SIZE + spawnMargin - footprint.minX;
    const maxSpawnX = ARENA_HALF_SIZE - spawnMargin - footprint.maxX;
    const minSpawnZ = -ARENA_HALF_SIZE + spawnMargin - footprint.minZ;
    const maxSpawnZ = ARENA_HALF_SIZE - spawnMargin - footprint.maxZ;
    const originX = THREE.MathUtils.randFloat(minSpawnX, maxSpawnX);
    const originZ = THREE.MathUtils.randFloat(minSpawnZ, maxSpawnZ);

    for (const [cubeX, cubeY, cubeZ] of cubes) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(originX + cubeX, SHAPE_HEIGHT + cubeY, originZ + cubeZ);
        piece.add(mesh);
        obstacleBoxes.push(new THREE.Box3(
            new THREE.Vector3(mesh.position.x - 0.5, mesh.position.y - 0.5, mesh.position.z - 0.5),
            new THREE.Vector3(mesh.position.x + 0.5, mesh.position.y + 0.5, mesh.position.z + 0.5)
        ));
    }

    piece.name = `tetromino-${groupIndex}-x${xTurns}-y${yTurns}`;
    scene.add(piece);
    hittableObjects.push(piece);
}