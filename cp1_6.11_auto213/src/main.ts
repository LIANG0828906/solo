import * as THREE from 'three';
import { WaterWheel } from './waterwheel';
import { AqueductSystem, GateInfo } from './aqueduct';
import { IrrigationSystem } from './irrigation';

class WaterwheelSimulation {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private waterWheel: WaterWheel;
    private aqueductSystem: AqueductSystem;
    private irrigationSystem: IrrigationSystem;
    private raycaster: THREE.Raycaster;
    private mouse: THREE.Vector2;
    private clock: THREE.Clock;
    private isDraggingWheel: boolean = false;
    private activeSliderPopup: HTMLElement | null = null;
    private activeGateId: number | null = null;

    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.clock = new THREE.Clock();

        this.waterWheel = new WaterWheel();
        this.aqueductSystem = new AqueductSystem();
        this.irrigationSystem = new IrrigationSystem();

        this.init();
    }

    private init(): void {
        this.setupRenderer();
        this.setupCamera();
        this.setupLights();
        this.setupScene();
        this.setupEventListeners();
        this.animate();
        this.setupFadeIn();
    }

    private setupRenderer(): void {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setClearColor(0x4A3728);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        const container = document.getElementById('canvas-container');
        if (container) {
            container.appendChild(this.renderer.domElement);
        }
    }

    private setupCamera(): void {
        this.camera.position.set(0, 12, 20);
        this.camera.lookAt(5, 3, 0);
    }

    private setupLights(): void {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xFFF5E6, 1.0);
        mainLight.position.set(-10, 15, 8);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 1024;
        mainLight.shadow.mapSize.height = 1024;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 50;
        mainLight.shadow.camera.left = -20;
        mainLight.shadow.camera.right = 20;
        mainLight.shadow.camera.top = 20;
        mainLight.shadow.camera.bottom = -20;
        mainLight.shadow.bias = -0.0001;
        this.scene.add(mainLight);

        const fillLight = new THREE.DirectionalLight(0xB0C4DE, 0.4);
        fillLight.position.set(10, 5, -8);
        this.scene.add(fillLight);

        const backLight = new THREE.DirectionalLight(0x87CEEB, 0.3);
        backLight.position.set(0, 18, 0);
        this.scene.add(backLight);
    }

    private setupScene(): void {
        this.scene.background = new THREE.Color(0x4A3728);
        this.scene.add(this.waterWheel.group);
        this.scene.add(this.aqueductSystem.group);
        this.scene.add(this.irrigationSystem.group);

        this.addAtmosphere();
    }

    private addAtmosphere(): void {
        const fogColor = new THREE.Color(0x4A3728);
        this.scene.fog = new THREE.Fog(fogColor, 25, 60);
    }

    private setupEventListeners(): void {
        window.addEventListener('resize', () => this.onWindowResize());

        this.renderer.domElement.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.renderer.domElement.addEventListener('mouseup', () => this.onMouseUp());
        this.renderer.domElement.addEventListener('mouseleave', () => this.onMouseUp());

        this.renderer.domElement.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        this.renderer.domElement.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        this.renderer.domElement.addEventListener('touchend', () => this.onTouchEnd());

        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetSimulation());
        }

        const fullscreenBtn = document.getElementById('fullscreen-btn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        }

        document.addEventListener('click', (e) => {
            if (this.activeSliderPopup && !(e.target as HTMLElement).closest('.slider-popup')) {
                this.closeSliderPopup();
            }
        });
    }

    private onWindowResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    private updateMouse(event: MouseEvent | Touch): void {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    private getMouseAngle(): number {
        const wheelPos = this.waterWheel.getWorldPosition();
        const mouseWorldPos = this.getMouseWorldPosition();
        if (mouseWorldPos) {
            const dx = mouseWorldPos.x - wheelPos.x;
            const dy = mouseWorldPos.y - wheelPos.y;
            return Math.atan2(dy, dx);
        }
        return 0;
    }

    private getMouseWorldPosition(): THREE.Vector3 | null {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const intersectPoint = new THREE.Vector3();
        this.raycaster.ray.intersectPlane(plane, intersectPoint);
        return intersectPoint;
    }

    private onMouseDown(event: MouseEvent): void {
        this.updateMouse(event);
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const gateHandles = this.aqueductSystem.gates.map(g => g.handle);
        const gateIntersects = this.raycaster.intersectObjects(gateHandles);

        if (gateIntersects.length > 0) {
            const clickedHandle = gateIntersects[0].object;
            const gate = this.aqueductSystem.gates.find(g => g.handle === clickedHandle);
            if (gate) {
                this.showSliderPopup(gate.id, event.clientX, event.clientY);
                return;
            }
        }

        const wheelObjects: THREE.Object3D[] = [];
        this.waterWheel.group.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                wheelObjects.push(child);
            }
        });

        const wheelIntersects = this.raycaster.intersectObjects(wheelObjects);
        if (wheelIntersects.length > 0) {
            this.isDraggingWheel = true;
            this.waterWheel.startDrag(this.getMouseAngle());
        }
    }

    private onMouseMove(event: MouseEvent): void {
        this.updateMouse(event);

        if (this.isDraggingWheel) {
            this.waterWheel.updateDrag(this.getMouseAngle());
        }
    }

    private onMouseUp(): void {
        if (this.isDraggingWheel) {
            this.waterWheel.endDrag();
            this.isDraggingWheel = false;
        }
    }

    private onTouchStart(event: TouchEvent): void {
        event.preventDefault();
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.updateMouse(touch);
            this.raycaster.setFromCamera(this.mouse, this.camera);

            const wheelObjects: THREE.Object3D[] = [];
            this.waterWheel.group.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    wheelObjects.push(child);
                }
            });

            const wheelIntersects = this.raycaster.intersectObjects(wheelObjects);
            if (wheelIntersects.length > 0) {
                this.isDraggingWheel = true;
                this.waterWheel.startDrag(this.getMouseAngle());
            }
        }
    }

    private onTouchMove(event: TouchEvent): void {
        event.preventDefault();
        if (event.touches.length === 1 && this.isDraggingWheel) {
            const touch = event.touches[0];
            this.updateMouse(touch);
            this.waterWheel.updateDrag(this.getMouseAngle());
        }
    }

    private onTouchEnd(): void {
        if (this.isDraggingWheel) {
            this.waterWheel.endDrag();
            this.isDraggingWheel = false;
        }
    }

    private showSliderPopup(gateId: number, x: number, y: number): void {
        this.closeSliderPopup();
        this.activeGateId = gateId;

        const popup = document.createElement('div');
        popup.className = 'slider-popup';
        popup.style.left = `${x + 10}px`;
        popup.style.top = `${y + 10}px`;

        const currentOpenness = this.aqueductSystem.getGateOpenness(gateId);

        popup.innerHTML = `
            <button class="close-btn">&times;</button>
            <label>闸门 ${gateId + 1} 开合度</label>
            <input type="range" min="0" max="100" value="${currentOpenness * 100}" id="gate-slider">
            <div class="slider-value" id="slider-value">${Math.round(currentOpenness * 100)}%</div>
        `;

        document.body.appendChild(popup);
        this.activeSliderPopup = popup;

        const slider = popup.querySelector('#gate-slider') as HTMLInputElement;
        const valueDisplay = popup.querySelector('#slider-value') as HTMLElement;
        const closeBtn = popup.querySelector('.close-btn') as HTMLButtonElement;

        slider.addEventListener('input', (e) => {
            const value = parseInt((e.target as HTMLInputElement).value);
            valueDisplay.textContent = `${value}%`;
            this.aqueductSystem.setGateOpenness(gateId, value / 100);
        });

        closeBtn.addEventListener('click', () => {
            this.closeSliderPopup();
        });
    }

    private closeSliderPopup(): void {
        if (this.activeSliderPopup) {
            this.activeSliderPopup.remove();
            this.activeSliderPopup = null;
            this.activeGateId = null;
        }
    }

    private resetSimulation(): void {
        this.waterWheel.reset();
        this.aqueductSystem.reset();
        this.irrigationSystem.reset();
        this.closeSliderPopup();
    }

    private toggleFullscreen(): void {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error('全屏错误:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    private setupFadeIn(): void {
        const overlay = document.getElementById('fade-overlay');
        if (overlay) {
            setTimeout(() => {
                overlay.classList.add('fade-out');
                setTimeout(() => {
                    overlay.style.display = 'none';
                }, 1500);
            }, 100);
        }
    }

    private updateUI(): void {
        const rpmValue = document.getElementById('rpm-value');
        const irrigationValue = document.getElementById('irrigation-value');
        const flowValue = document.getElementById('flow-value');

        if (rpmValue) {
            const rpm = Math.abs(this.waterWheel.getRPM());
            rpmValue.textContent = `${rpm.toFixed(1)} RPM`;
        }

        if (irrigationValue) {
            const irrigated = this.irrigationSystem.getIrrigatedCount();
            const total = this.irrigationSystem.getTotalFields();
            const percentage = this.irrigationSystem.getIrrigatedPercentage();
            irrigationValue.textContent = `${irrigated}/${total} (${percentage.toFixed(1)}%)`;
        }

        if (flowValue) {
            const flow = this.aqueductSystem.getTotalFlow();
            flowValue.textContent = `${flow.toFixed(2)} m³/s`;
        }
    }

    private animate(): void {
        requestAnimationFrame(() => this.animate());

        const deltaTime = Math.min(this.clock.getDelta(), 0.1);

        this.waterWheel.update(deltaTime, true);
        this.aqueductSystem.update(
            deltaTime,
            this.waterWheel.getWorldPosition(),
            this.waterWheel.getWheelRadius()
        );

        const gateFlows = new Map<number, number>();
        this.aqueductSystem.gates.forEach(gate => {
            gateFlows.set(gate.id, this.aqueductSystem.getGateFlow(gate.id));
        });
        this.irrigationSystem.update(deltaTime, gateFlows);

        this.updateUI();

        this.renderer.render(this.scene, this.camera);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new WaterwheelSimulation();
});
