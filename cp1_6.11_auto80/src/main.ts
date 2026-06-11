import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { NeuronNetwork } from './NeuronNetwork';
import { SignalPropagation } from './SignalPropagation';
import { SynapseEffect } from './SynapseEffect';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let composer: EffectComposer;

let neuronNetwork: NeuronNetwork;
let signalPropagation: SignalPropagation;
let synapseEffect: SynapseEffect;

let stars: THREE.Points;
let starGroup: THREE.Group;

let isPaused: boolean = false;
let lastTime: number = 0;
let time: number = 0;
let deltaTime: number = 0;

let fps: number = 0;
let fpsFrames: number = 0;
let fpsLastTime: number = 0;
let lowPerformanceMode: boolean = false;
let performanceCheckInterval: number = 2000;
let lastPerformanceCheck: number = 0;

let raycaster: THREE.Raycaster;
let mouse: THREE.Vector2;
let hoveredNeuron: number | null = null;

const fpsCounter = document.getElementById('fps-counter') as HTMLElement;
const infoLabel = document.getElementById('info-label') as HTMLElement;
const neuronIdEl = infoLabel.querySelector('.neuron-id') as HTMLElement;
const connectionCountEl = infoLabel.querySelector('.connection-count') as HTMLElement;

function init(): void {
    const container = document.getElementById('canvas-container') as HTMLElement;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(25, 20, 25);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0B0B1A, 1);
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.minDistance = 3;
    controls.maxDistance = 30;
    controls.enablePan = true;

    setupLights();
    createStars();
    setupPostProcessing();

    neuronNetwork = new NeuronNetwork(scene);
    signalPropagation = new SignalPropagation(scene, neuronNetwork);
    synapseEffect = new SynapseEffect(scene, neuronNetwork);

    signalPropagation.setOnMidpointCallback((connection) => {
        synapseEffect.triggerDiffusion(connection);
    });

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    setupEventListeners();
    animate();
}

function setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x4A90D9, 1, 100);
    pointLight1.position.set(20, 20, 20);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x7B3FA2, 0.8, 100);
    pointLight2.position.set(-20, -10, -20);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0x00FFCC, 0.5, 80);
    pointLight3.position.set(0, 25, 0);
    scene.add(pointLight3);
}

function createStars(): void {
    starGroup = new THREE.Group();
    const starCount = Math.floor(Math.random() * 31) + 50;

    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
        const radius = 40 + Math.random() * 20;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);

        const brightness = 0.3 + Math.random() * 0.7;
        colors[i * 3] = brightness;
        colors[i * 3 + 1] = brightness;
        colors[i * 3 + 2] = brightness + 0.1;

        sizes[i] = 0.02 + Math.random() * 0.04;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
        size: 0.05,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });

    stars = new THREE.Points(geometry, material);
    starGroup.add(stars);
    scene.add(starGroup);
}

function setupPostProcessing(): void {
    composer = new EffectComposer(renderer);
    
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.3,
        0.2,
        0.1
    );
    composer.addPass(bloomPass);
}

function setupEventListeners(): void {
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousemove', onMouseMove);
}

function onWindowResize(): void {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(event: KeyboardEvent): void {
    if (event.code === 'Space') {
        event.preventDefault();
        togglePause();
    }
}

function togglePause(): void {
    isPaused = !isPaused;
}

function onMouseMove(event: MouseEvent): void {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    updateHover(event.clientX, event.clientY);
}

function updateHover(clientX: number, clientY: number): void {
    raycaster.setFromCamera(mouse, camera);

    const neuronMeshes = neuronNetwork.nodes.map(n => n.mesh);
    const intersects = raycaster.intersectObjects(neuronMeshes);

    if (intersects.length > 0) {
        const intersected = intersects[0].object;
        const neuronId = intersected.userData.id;
        
        if (hoveredNeuron !== neuronId) {
            hoveredNeuron = neuronId;
            const node = neuronNetwork.getNodeById(neuronId);
            if (node) {
                neuronIdEl.textContent = `神经元 #${neuronId}`;
                connectionCountEl.textContent = `连接数: ${node.connections.length}`;
                infoLabel.classList.add('visible');
            }
        }

        infoLabel.style.left = `${clientX + 15}px`;
        infoLabel.style.top = `${clientY + 15}px`;
    } else {
        if (hoveredNeuron !== null) {
            hoveredNeuron = null;
            infoLabel.classList.remove('visible');
        }
    }
}

function updateFPS(currentTime: number): void {
    fpsFrames++;
    
    if (currentTime - fpsLastTime >= 1000) {
        fps = Math.round((fpsFrames * 1000) / (currentTime - fpsLastTime));
        fpsFrames = 0;
        fpsLastTime = currentTime;

        fpsCounter.textContent = `FPS: ${fps}`;
        
        if (fps < 40) {
            fpsCounter.classList.add('warning');
        } else {
            fpsCounter.classList.remove('warning');
        }
    }
}

function checkPerformance(currentTime: number): void {
    if (currentTime - lastPerformanceCheck < performanceCheckInterval) return;
    
    lastPerformanceCheck = currentTime;

    if (fps < 40 && !lowPerformanceMode) {
        lowPerformanceMode = true;
        signalPropagation.setPerformanceMode(true);
        synapseEffect.setPerformanceMode(true);
        console.log('[性能降级] FPS低于40，已降低特效数量');
    } else if (fps >= 50 && lowPerformanceMode) {
        lowPerformanceMode = false;
        signalPropagation.setPerformanceMode(false);
        synapseEffect.setPerformanceMode(false);
        console.log('[性能恢复] FPS回升至50以上，已恢复特效数量');
    }
}

function animate(): void {
    requestAnimationFrame(animate);

    const currentTime = performance.now();
    deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;

    if (!isPaused) {
        time += deltaTime;
    }

    updateFPS(currentTime);
    checkPerformance(currentTime);

    controls.update();

    if (!isPaused) {
        starGroup.rotation.y += 0.002;
        starGroup.rotation.x += 0.0005;
    }

    neuronNetwork.update(deltaTime, time, isPaused);
    signalPropagation.update(deltaTime, isPaused);
    synapseEffect.update(deltaTime, isPaused);

    composer.render();
}

init();
