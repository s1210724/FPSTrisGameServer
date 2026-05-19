import { THREE } from "./deps.js";

export function createRenderingContext() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1));

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 5);
    scene.add(light);

    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    return { scene, camera, renderer };
}

export function startRenderLoop(update, renderer, scene, camera) {
    let lastTime = performance.now();

    function animate() {
        const now = performance.now();
        let delta = (now - lastTime) / 1000;
        lastTime = now;
        delta = Math.min(delta, 0.05);

        update(delta);
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }

    animate();
}