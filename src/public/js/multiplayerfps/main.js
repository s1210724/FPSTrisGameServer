import { createRenderingContext, startRenderLoop } from "./rendering.js";
import { buildWorldOctree, createArena } from "./arena.js";
import { createPlayer, setupPlayerActions, setupPlayerInput, updatePlayer } from "./player.js";
import { buildObstaclesFromData } from "./obstacles.js";
import { initializeRemotePlayers, setRemotePlayerTarget, updateRemotePlayers, removeRemotePlayer } from "./remotePlayers.js";

const socket = io({ withCredentials: true });
const POSITION_UPDATE_MS = 50;

let playerId = "";

window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin) {
        return;
    }

    const data = event.data;
    if (!data || data.type !== "duelData") {
        return;
    }

    const { duelId, password, obstacles } = data;
    if (!duelId || !password) {
        return;
    }

    if (Array.isArray(obstacles)) {
        buildObstaclesFromData(scene, obstacleBoxes, hittableObjects, obstacles);
    }

    socket.emit("joinDuel", { duelId, password }, (response) => {
        if (response?.error) {
            console.warn("Multiplayer FPS duel join failed:", response.error);
            return;
        }

        console.log("Joined duel successfully:", response);
        playerId = response.playerId;
    });
});

socket.on("duelReady", (data) => {
    console.log("Duel ready:", data);
});

socket.on("updatePlayerPos", (data) => {
    if (!data || data.playerId === socket.id) return;

    const x = Number(data.x);
    const y = Number(data.y);
    const z = Number(data.z);
    const yaw = Number(data.yaw);
    if (![x, y, z, yaw].every(Number.isFinite)) {
        return;
    }

    setRemotePlayerTarget(data.playerId, x, y, z, yaw);
});

socket.on("playerLeft", (playerId) => {
    if (!playerId) return;
    removeRemotePlayer(playerId);
});

function emitPlayerPos(player, camera) {
    if (!player?.collider?.end) return;

    socket.emit("updatePlayerPos", {
        x: player.collider.end.x,
        y: player.collider.end.y,
        z: player.collider.end.z,
        yaw: player.yaw,
        pitch: player.pitch,
    });
}

const { scene, camera, renderer } = createRenderingContext();
const arena = createArena(scene);
const worldOctree = buildWorldOctree(arena.collisionNodes);
const obstacleBoxes = [];
const hittableObjects = [];

initializeRemotePlayers(scene);

const player = createPlayer(camera);
setupPlayerInput(camera, player);
setupPlayerActions(camera, hittableObjects);

setInterval(() => {
    emitPlayerPos(player, camera);
}, POSITION_UPDATE_MS);

startRenderLoop((delta) => {
    updatePlayer(player, camera, worldOctree, delta, obstacleBoxes);
    updateRemotePlayers(delta);
}, renderer, scene, camera);