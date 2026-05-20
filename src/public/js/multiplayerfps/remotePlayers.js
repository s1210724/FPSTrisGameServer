import { THREE } from "./deps.js";

const REMOTE_LERP_SPEED = 20;
const remotePlayers = new Map();
let sceneRef = null;

export function initializeRemotePlayers(scene) {
    sceneRef = scene;
}

function createRemotePlayerMesh() {
    const geometry = new THREE.CylinderGeometry(0.25, 0.25, 1.4, 12);
    const material = new THREE.MeshStandardMaterial({ color: 0xff5555 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    return mesh;
}

function getRemotePlayer(playerId) {
    if (remotePlayers.has(playerId)) {
        return remotePlayers.get(playerId);
    }

    if (!sceneRef) {
        throw new Error("Remote player scene not initialized");
    }

    const mesh = createRemotePlayerMesh();
    sceneRef.add(mesh);

    const state = {
        mesh,
        targetPosition: new THREE.Vector3(),
        targetYaw: 0
    };

    remotePlayers.set(playerId, state);
    return state;
}

export function setRemotePlayerTarget(playerId, x, y, z, yaw) {
    const state = getRemotePlayer(playerId);
    const target = new THREE.Vector3(x, y - 0.7, z);
    state.targetPosition.copy(target);
    state.targetYaw = yaw;

    if (state.mesh.position.lengthSq() === 0) {
        state.mesh.position.copy(target);
        state.mesh.rotation.y = yaw;
        return;
    }
}

function lerpAngle(a, b, t) {
    const diff = ((b - a + Math.PI) % (2 * Math.PI)) - Math.PI;
    return a + diff * t;
}

export function updateRemotePlayers(delta) {
    const alpha = Math.min(1, delta * REMOTE_LERP_SPEED);
    remotePlayers.forEach((state) => {
        state.mesh.position.lerp(state.targetPosition, alpha);
        state.mesh.rotation.y = lerpAngle(state.mesh.rotation.y, state.targetYaw, alpha);
    });
}

export function removeRemotePlayer(playerId) {
    const state = remotePlayers.get(playerId);
    if (!state) {
        return;
    }

    if (sceneRef && state.mesh) {
        sceneRef.remove(state.mesh);
        if (state.mesh.geometry) {
            state.mesh.geometry.dispose();
        }
        if (state.mesh.material) {
            state.mesh.material.dispose();
        }
    }

    remotePlayers.delete(playerId);
}
