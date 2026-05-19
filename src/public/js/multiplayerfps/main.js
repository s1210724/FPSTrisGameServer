import { createRenderingContext, startRenderLoop } from "./rendering.js";
import { buildWorldOctree, createArena } from "./arena.js";
import { createPlayer, setupPlayerActions, setupPlayerInput, updatePlayer } from "./player.js";
import { addDemoObstacles } from "./obstacles.js";

const { scene, camera, renderer } = createRenderingContext();
const arena = createArena(scene);
const worldOctree = buildWorldOctree(arena.collisionNodes);
const obstacleBoxes = [];
const hittableObjects = [];

addDemoObstacles(scene, obstacleBoxes, hittableObjects);

const player = createPlayer(camera);
setupPlayerInput(camera, player);
setupPlayerActions(camera, hittableObjects);

startRenderLoop((delta) => {
    updatePlayer(player, camera, worldOctree, delta, obstacleBoxes);
}, renderer, scene, camera);