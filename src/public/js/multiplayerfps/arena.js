import { THREE, Octree } from "./deps.js";
import { ARENA_HALF_SIZE, ARENA_SIZE, WALL_HEIGHT } from "./config.js";

function createFloorTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;

    const context = canvas.getContext("2d");
    context.fillStyle = "#4a4a4a";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const tileSize = 32;
    for (let y = 0; y < canvas.height; y += tileSize) {
        for (let x = 0; x < canvas.width; x += tileSize) {
            context.fillStyle = (x / tileSize + y / tileSize) % 2 === 0 ? "#5c5c5c" : "#505050";
            context.fillRect(x, y, tileSize, tileSize);
        }
    }

    context.strokeStyle = "rgba(255, 255, 255, 0.08)";
    context.lineWidth = 2;
    for (let i = 0; i <= canvas.width; i += tileSize) {
        context.beginPath();
        context.moveTo(i, 0);
        context.lineTo(i, canvas.height);
        context.stroke();

        context.beginPath();
        context.moveTo(0, i);
        context.lineTo(canvas.width, i);
        context.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);
    texture.anisotropy = 8;
    return texture;
}

export function createArena(scene, worldOctree = null) {
    const floorGeo = new THREE.PlaneGeometry(ARENA_SIZE, ARENA_SIZE);
    const floorMat = new THREE.MeshStandardMaterial({ map: createFloorTexture(), roughness: 1, metalness: 0 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const walls = [
        createWall(scene, null, 0, -ARENA_HALF_SIZE, ARENA_SIZE, 1),
        createWall(scene, null, 0, ARENA_HALF_SIZE, ARENA_SIZE, 1),
        createWall(scene, null, -ARENA_HALF_SIZE, 0, 1, ARENA_SIZE),
        createWall(scene, null, ARENA_HALF_SIZE, 0, 1, ARENA_SIZE)
    ];
    const collisionNodes = [floor, ...walls];

    if (worldOctree) {
        populateOctree(worldOctree, collisionNodes);
    }

    return { floor, walls, collisionNodes };
}

function createWall(scene, worldOctree = null, x, z, width, depth) {
    const geometry = new THREE.BoxGeometry(width, WALL_HEIGHT, depth);
    const material = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const wall = new THREE.Mesh(geometry, material);
    wall.position.set(x, WALL_HEIGHT / 2, z);
    scene.add(wall);

    if (worldOctree) {
        worldOctree.fromGraphNode(wall);
    }
    return wall;
}

export function buildWorldOctree(collisionNodes = []) {
    const worldOctree = new Octree();
    populateOctree(worldOctree, collisionNodes);
    return worldOctree;
}

export function populateOctree(worldOctree, collisionNodes) {
    for (const node of collisionNodes) {
        if (node) worldOctree.fromGraphNode(node);
    }
}