import { Capsule, THREE } from "./deps.js";

export function createPlayer(camera) {
    const player = {
        collider: new Capsule(new THREE.Vector3(0, 0.35, 0), new THREE.Vector3(0, 1.7, 0), 0.35),
        velocity: new THREE.Vector3(),
        onFloor: false,
        keys: {},
        yaw: 0,
        pitch: 0,
        moveSpeed: 20,
        airControl: 3,
        groundAcceleration: 9,
        groundDeceleration: 9,
        gravity: 30,
        jumpVelocity: 10
    };
    camera.position.copy(player.collider.end);
    return player;
}

export function setupPlayerInput(camera, player) {
    document.addEventListener("keydown", (event) => {
        player.keys[event.code] = true;
        if (event.code === "Space" && player.onFloor) {
            player.velocity.y = player.jumpVelocity;
        }
    });

    document.addEventListener("keyup", (event) => {
        player.keys[event.code] = false;
    });

    document.body.addEventListener("click", () => {
        document.body.requestPointerLock();
    });

    document.addEventListener("mousemove", (event) => {
        if (document.pointerLockElement !== document.body) return;
        player.yaw -= event.movementX * 0.002;
        player.pitch -= event.movementY * 0.002;
        player.pitch = Math.max(-1.5, Math.min(1.5, player.pitch));
        camera.rotation.order = "YXZ";
        camera.rotation.y = player.yaw;
        camera.rotation.x = player.pitch;
    });
}

export function setupPlayerActions(camera, hittableObjects) {
    const raycaster = new THREE.Raycaster();
    document.addEventListener("mousedown", () => {
        raycaster.setFromCamera({ x: 0, y: 0 }, camera);
        const hits = raycaster.intersectObjects(hittableObjects, true);
        if (!hits.length) return;
        const hitMaterial = hits[0].object.material;
        if (Array.isArray(hitMaterial)) {
            hitMaterial.forEach((material) => material.color?.set(0x0000ff));
            return;
        }
        hitMaterial?.color?.set(0x0000ff);
    });
}

export function updatePlayer(player, camera, worldOctree, delta, obstacleBoxes) {
    applyMovement(player, camera, delta);
    if (!player.onFloor) player.velocity.y -= player.gravity * delta;
    const deltaPosition = player.velocity.clone().multiplyScalar(delta);
    player.collider.translate(deltaPosition);
    const onShapeFloor = resolveShapeCollisions(player, obstacleBoxes);
    player.onFloor = resolvePlayerCollisions(player, worldOctree);
    player.onFloor = player.onFloor || onShapeFloor;
    if (player.onFloor && player.velocity.y < 0) player.velocity.y = 0;
    camera.position.copy(player.collider.end);
}

function applyMovement(player, camera, delta) {
    let forward = 0, side = 0;
    if (player.keys.KeyW) forward += 1;
    if (player.keys.KeyS) forward -= 1;
    if (player.keys.KeyA) side -= 1;
    if (player.keys.KeyD) side += 1;
    const forwardVector = getForwardVector(camera);
    const sideVector = getSideVector(camera);
    const desiredVelocity = new THREE.Vector3();
    desiredVelocity.add(forwardVector.multiplyScalar(forward * player.moveSpeed));
    desiredVelocity.add(sideVector.multiplyScalar(side * player.moveSpeed));
    if (desiredVelocity.length() > player.moveSpeed) {
        desiredVelocity.setLength(player.moveSpeed);
    }
    if (player.onFloor) {
        const groundControl = desiredVelocity.lengthSq() > 0 ? player.groundAcceleration : player.groundDeceleration;
        player.velocity.x += (desiredVelocity.x - player.velocity.x) * groundControl * delta;
        player.velocity.z += (desiredVelocity.z - player.velocity.z) * groundControl * delta;
        return;
    }
    player.velocity.x += (desiredVelocity.x - player.velocity.x) * player.airControl * delta;
    player.velocity.z += (desiredVelocity.z - player.velocity.z) * player.airControl * delta;
}

function resolvePlayerCollisions(player, worldOctree) {
    let onFloor = false;
    const result = worldOctree.capsuleIntersect(player.collider);
    if (result) {
        const correction = result.normal.clone();
        if (correction.y > 0.5) {
            onFloor = true;
            player.collider.translate(correction.multiplyScalar(result.depth));
        } else {
            correction.y = 0;
            if (correction.lengthSq() > 0) {
                correction.normalize();
                player.collider.translate(correction.multiplyScalar(result.depth));
            }
        }
    }
    if (!onFloor) {
        const down = new THREE.Vector3(0, -0.1, 0);
        const colliderProbe = player.collider.clone();
        colliderProbe.translate(down);
        const floorProbe = worldOctree.capsuleIntersect(colliderProbe);
        if (floorProbe && floorProbe.normal.y > 0.5) {
            onFloor = true;
        }
    }
    return onFloor;
}

function resolveShapeCollisions(player, obstacleBoxes) {
    let onFloor = false;
    const radius = player.collider.radius;
    const skin = 0.01;
    const topBand = 0.2;

    for (const box of obstacleBoxes) {
        const playerX = player.collider.start.x;
        const playerZ = player.collider.start.z;
        const playerBottom = player.collider.start.y - radius;
        const playerTop = player.collider.end.y + radius;
        const boxCenterX = (box.min.x + box.max.x) / 2;
        const boxCenterZ = (box.min.z + box.max.z) / 2;
        const boxHalfWidthX = (box.max.x - box.min.x) / 2;
        const boxHalfWidthZ = (box.max.z - box.min.z) / 2;
        const overlapX = boxHalfWidthX + radius - Math.abs(playerX - boxCenterX);
        const overlapZ = boxHalfWidthZ + radius - Math.abs(playerZ - boxCenterZ);
        const verticalOverlap = playerTop > box.min.y + skin && playerBottom < box.max.y - skin;

        if (overlapX <= 0 || overlapZ <= 0) {
            continue;
        }

        if (player.velocity.y <= 0 && playerBottom <= box.max.y + topBand && playerBottom >= box.max.y - topBand) {
            const lift = box.max.y - playerBottom;
            if (lift > 0) {
                player.collider.translate(new THREE.Vector3(0, lift + skin, 0));
            }
            player.velocity.y = 0;
            onFloor = true;
            continue;
        }

        if (!verticalOverlap) {
            continue;
        }

        const useX = overlapX < overlapZ * 0.92 || (Math.abs(overlapX - overlapZ) <= 0.05 && Math.abs(player.velocity.x) >= Math.abs(player.velocity.z));

        if (useX) {
            const pushX = (playerX < boxCenterX ? -overlapX : overlapX) + (playerX < boxCenterX ? -skin : skin);
            player.collider.translate(new THREE.Vector3(pushX, 0, 0));
            player.velocity.x = 0;
        } else {
            const pushZ = (playerZ < boxCenterZ ? -overlapZ : overlapZ) + (playerZ < boxCenterZ ? -skin : skin);
            player.collider.translate(new THREE.Vector3(0, 0, pushZ));
            player.velocity.z = 0;
        }
    }

    return onFloor;
}

function getForwardVector(camera) {
    const vector = new THREE.Vector3();
    camera.getWorldDirection(vector);
    vector.y = 0;
    vector.normalize();
    return vector;
}

function getSideVector(camera) {
    const vector = getForwardVector(camera);
    vector.cross(camera.up);
    return vector;
}