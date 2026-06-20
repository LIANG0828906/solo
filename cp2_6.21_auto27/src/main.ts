import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ForceFieldManager, GravityPoint } from './forceField';
import { ParticleSystem, ColorTheme } from './particleSystem';
import { UIControls } from './uiControls';

class NebulaApp {
    public scene!: THREE.Scene;
    public camera!: THREE.PerspectiveCamera;
    public renderer!: THREE.WebGLRenderer;
    public controls!: OrbitControls;
    public container: HTMLElement;

    public forceField!: ForceFieldManager;
    public particleSystem!: ParticleSystem;
    public uiControls!: UIControls;

    public backgroundStars!: THREE.Points;

    private _clock: THREE.Clock;
    private _raycaster: THREE.Raycaster;
    private _mouse: THREE.Vector2;
    private _draggingGravity: GravityPoint | null = null;
    private _dragPlane: THREE.Plane;
    private _dragOffset: THREE.Vector3;
    private _frameCount: number = 0;
    private _fps: number = 0;
    private _fpsAccum: number = 0;

    constructor() {
        this._clock = new THREE.Clock();
        this._raycaster = new THREE.Raycaster();
        this._mouse = new THREE.Vector2();
        this._dragPlane = new THREE.Plane();
        this._dragOffset = new THREE.Vector3();

        this.container = document.getElementById('canvas-container')!;

        this._initScene();
        this._initRenderer();
        this._initCamera();
        this._initControls();
        this._initBackgroundStars();

        this.forceField = new ForceFieldManager();
        this.scene.add(this.forceField.group);

        this.particleSystem = new ParticleSystem(this.scene, this.forceField);

        this.uiControls = new UIControls({
            onEmissionRateChange: (rate) => this.particleSystem.setEmissionRate(rate),
            onLifeChange: (life) => this.particleSystem.setLifeRange(5, life),
            onSpeedChange: (speed) => this.particleSystem.setSpeed(speed),
            onColorThemeChange: (theme: ColorTheme) => this.particleSystem.setColorTheme(theme),
            onGravityMassChange: (mass) => this.forceField.setAllGravityMass(mass),
            onVortexStrengthChange: (strength) => this.forceField.setAllVortexStrength(strength),
            onReset: () => this.particleSystem.reset(),
            onScreenshot: () => this._takeScreenshot()
        });

        this._bindInteractionEvents();
        this._onResize();
        window.addEventListener('resize', () => this._onResize());

        this._animate();
    }

    private _initRenderer(): void {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
        this.container.appendChild(this.renderer.domElement);
    }

    private _initScene(): void {
        this.scene = new THREE.Scene();
        this.scene.background = null;

        const ambient = new THREE.AmbientLight(0x404050, 0.6);
        this.scene.add(ambient);

        const hemi = new THREE.HemisphereLight(0x4a2a6e, 0x0a0514, 0.4);
        this.scene.add(hemi);
    }

    private _initCamera(): void {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 0, 25);
    }

    private _initControls(): void {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.rotateSpeed = 0.7;
        this.controls.zoomSpeed = 0.8;
        this.controls.panSpeed = 0.6;
        this.controls.minDistance = 8;
        this.controls.maxDistance = 80;
    }

    private _initBackgroundStars(): void {
        const count = 500;
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const opacities = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            const r = 40 + Math.random() * 60;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);
            sizes[i] = 0.5 + Math.random() * 1.5;
            opacities[i] = 0.15 + Math.random() * 0.35;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('aOpacity', new THREE.BufferAttribute(opacities, 1));

        const starCanvas = document.createElement('canvas');
        starCanvas.width = 32;
        starCanvas.height = 32;
        const sctx = starCanvas.getContext('2d')!;
        const grad = sctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.4, 'rgba(255,255,255,0.5)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        sctx.fillStyle = grad;
        sctx.fillRect(0, 0, 32, 32);
        const starTex = new THREE.CanvasTexture(starCanvas);

        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.3,
            map: starTex,
            transparent: true,
            opacity: 0.25,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });

        this.backgroundStars = new THREE.Points(geometry, material);
        this.scene.add(this.backgroundStars);
    }

    private _bindInteractionEvents(): void {
        const canvas = this.renderer.domElement;

        canvas.addEventListener('mousedown', (e) => this._onPointerDown(e));
        canvas.addEventListener('mousemove', (e) => this._onPointerMove(e));
        canvas.addEventListener('mouseup', () => this._onPointerUp());
        canvas.addEventListener('mouseleave', () => this._onPointerUp());
    }

    private _updateMouse(e: MouseEvent): void {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this._mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this._mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    private _onPointerDown(e: MouseEvent): void {
        this._updateMouse(e);
        this._raycaster.setFromCamera(this._mouse, this.camera);

        const draggables = this.forceField.getDraggableMeshes();
        const hits = this._raycaster.intersectObjects(draggables, false);

        if (hits.length > 0) {
            const hit = hits[0];
            const gp = (hit.object.userData.gravityPointRef as GravityPoint);
            if (gp) {
                this._draggingGravity = gp;
                this.controls.enabled = false;

                this._dragPlane.setFromNormalAndCoplanarPoint(
                    this.camera.getWorldDirection(new THREE.Vector3()).negate(),
                    gp.position
                );

                const intersectPoint = new THREE.Vector3();
                this._raycaster.ray.intersectPlane(this._dragPlane, intersectPoint);
                this._dragOffset.copy(gp.position).sub(intersectPoint);
            }
        }
    }

    private _onPointerMove(e: MouseEvent): void {
        if (!this._draggingGravity) return;

        this._updateMouse(e);
        this._raycaster.setFromCamera(this._mouse, this.camera);

        const intersectPoint = new THREE.Vector3();
        if (this._raycaster.ray.intersectPlane(this._dragPlane, intersectPoint)) {
            this._draggingGravity.position.copy(intersectPoint.add(this._dragOffset));
        }
    }

    private _onPointerUp(): void {
        if (this._draggingGravity) {
            this._draggingGravity = null;
            this.controls.enabled = true;
        }
    }

    private _onResize(): void {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }

    private _takeScreenshot(): void {
        this.renderer.render(this.scene, this.camera);
        const dataUrl = this.renderer.domElement.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `nebula-screenshot-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
    }

    private _updateStars(time: number): void {
        if (!this.backgroundStars) return;
        this.backgroundStars.rotation.y = time * 0.01;
        this.backgroundStars.rotation.x = Math.sin(time * 0.005) * 0.1;
        const mat = this.backgroundStars.material as THREE.PointsMaterial;
        mat.opacity = 0.2 + Math.sin(time * 1.5) * 0.08;
    }

    private _updateFPS(dt: number): void {
        this._frameCount++;
        this._fpsAccum += dt;
        if (this._fpsAccum >= 0.5) {
            this._fps = this._frameCount / this._fpsAccum;
            this._frameCount = 0;
            this._fpsAccum = 0;
            this.uiControls.updateStats(this._fps, this.particleSystem.getActiveCount());
        }
    }

    private _animate(): void {
        requestAnimationFrame(() => this._animate());

        const dt = Math.min(this._clock.getDelta(), 0.05);
        const elapsed = this._clock.elapsedTime;

        this._updateFPS(dt);

        this.controls.update();
        this.forceField.update(dt, elapsed);
        this.particleSystem.update(dt);
        this._updateStars(elapsed);

        this.renderer.render(this.scene, this.camera);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new NebulaApp();
});
