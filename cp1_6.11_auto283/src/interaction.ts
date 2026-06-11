import * as THREE from 'three';
import type {
  AppState,
  TypeChar,
  Position3D,
  CharStatus,
  AnimationState
} from './types';
import { TRAY_ROWS, TRAY_COLS, CHAR_SIZE, CHAR_GAP } from './types';
import { PrintEngine } from './printEngine';

export class InteractionManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private state: AppState;
  private animationState: AnimationState;
  private charMeshes: Map<string, THREE.Mesh>;
  private printEngine: PrintEngine;
  private onStateChange: (state: AppState) => void;

  private dragPlane: THREE.Plane;
  private dragOffset: THREE.Vector3;
  private isDragging: boolean = false;

  private inkingStartPos: THREE.Vector3 | null = null;
  private inkingDistance: number = 0;
  private lastMousePos: THREE.Vector2 = new THREE.Vector2();

  private pressStartTime: number = 0;
  private isPressing: boolean = false;

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    initialState: AppState,
    printEngine: PrintEngine,
    onStateChange: (state: AppState) => void
  ) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.state = initialState;
    this.printEngine = printEngine;
    this.onStateChange = onStateChange;
    this.charMeshes = new Map();
    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.dragOffset = new THREE.Vector3();

    this.animationState = {
      activeAnimations: [],
      rippleTime: 0,
      paperShakeTime: 0,
      scrollRevealTime: 0
    };

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    canvas.addEventListener('mouseleave', this.onMouseUp.bind(this));

    document.addEventListener('keydown', this.onKeyDown.bind(this));

    canvas.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    canvas.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
  }

  private onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
    this.handleMouseDown();
  }

  private onTouchMove(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
    this.handleMouseMove();
  }

  private onTouchEnd(e: TouchEvent): void {
    e.preventDefault();
    this.handleMouseUp();
  }

  private onMouseDown(e: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.handleMouseDown();
  }

  private onMouseMove(e: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.handleMouseMove();
  }

  private onMouseUp(e: MouseEvent): void {
    this.handleMouseUp();
  }

  private handleMouseDown(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    if (this.state.mode === 'typeset') {
      this.handleTypesetMouseDown();
    } else if (this.state.mode === 'print') {
      this.handlePrintMouseDown();
    }
  }

  private handleTypesetMouseDown(): void {
    const trayChars = this.state.trayChars.filter(c => c.status === 'in-tray');
    const meshes = trayChars.map(c => this.charMeshes.get(c.id)).filter(m => m) as THREE.Mesh[];

    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh;
      const charId = mesh.userData.charId;
      const char = this.state.trayChars.find(c => c.id === charId);

      if (char && char.status === 'in-tray') {
        this.startDragChar(char, intersects[0].point);
      }
    } else {
      const plateMeshes = this.state.plate.characters
        .map(c => this.charMeshes.get(c.id))
        .filter(m => m) as THREE.Mesh[];
      const plateIntersects = this.raycaster.intersectObjects(plateMeshes);

      if (plateIntersects.length > 0) {
        const mesh = plateIntersects[0].object as THREE.Mesh;
        const charId = mesh.userData.charId;
        const char = this.state.plate.characters.find(c => c.id === charId);
        if (char) {
          this.selectPlateChar(char);
        }
      }
    }
  }

  private handlePrintMouseDown(): void {
    if (this.state.plate.characters.length === 0) return;

    const paperObject = this.scene.getObjectByName('paper');
    if (paperObject) {
      const intersects = this.raycaster.intersectObject(paperObject);
      if (intersects.length > 0) {
        this.startPressing();
      }
    }
  }

  private handleMouseMove(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    if (this.isDragging && this.state.draggingCharId) {
      this.updateDragPosition();
    } else if (this.state.mode === 'print' && this.state.inkingStartTime > 0) {
      this.updateInking();
    }

    this.updateHoverState();
  }

  private handleMouseUp(): void {
    if (this.isDragging && this.state.draggingCharId) {
      this.endDragChar();
    }

    if (this.isPressing) {
      this.endPressing();
    }

    if (this.state.mode === 'print' && this.state.inkingStartTime > 0) {
      this.endInking();
    }
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (this.state.selectedCharId) {
        this.removeSelectedChar();
      }
    }
  }

  private startDragChar(char: TypeChar, intersectPoint: THREE.Vector3): void {
    this.isDragging = true;
    this.state.draggingCharId = char.id;
    char.status = 'dragging';

    char.animationProgress = 0;
    this.animationState.activeAnimations.push({
      charId: char.id,
      type: 'rise',
      startTime: performance.now(),
      duration: 300
    });

    const mesh = this.charMeshes.get(char.id);
    if (mesh) {
      const planeIntersect = new THREE.Vector3();
      this.raycaster.ray.intersectPlane(this.dragPlane, planeIntersect);
      this.dragOffset.copy(mesh.position).sub(planeIntersect);
    }

    this.notifyStateChange();
  }

  private updateDragPosition(): void {
    if (!this.state.draggingCharId) return;

    const intersectPoint = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.dragPlane, intersectPoint);

    const mesh = this.charMeshes.get(this.state.draggingCharId);
    if (mesh) {
      mesh.position.copy(intersectPoint).add(this.dragOffset);
      mesh.position.y = Math.max(0.5, mesh.position.y + 0.3 * Math.sin(performance.now() * 0.01));

      const char = this.findCharById(this.state.draggingCharId);
      if (char) {
        char.currentPosition = {
          x: mesh.position.x,
          y: mesh.position.y,
          z: mesh.position.z
        };
      }
    }
  }

  private endDragChar(): void {
    if (!this.state.draggingCharId) return;

    const char = this.findCharById(this.state.draggingCharId);
    const mesh = this.charMeshes.get(this.state.draggingCharId);

    if (char && mesh) {
      const plateObject = this.scene.getObjectByName('type-plate');
      if (plateObject) {
        const plateBox = new THREE.Box3().setFromObject(plateObject);
        const charPos = mesh.position.clone();

        if (plateBox.containsPoint(new THREE.Vector3(charPos.x, 0, charPos.z))) {
          this.placeCharInPlate(char, charPos);
        } else {
          this.returnCharToTray(char);
        }
      } else {
        this.returnCharToTray(char);
      }
    }

    this.isDragging = false;
    this.state.draggingCharId = null;
    this.notifyStateChange();
  }

  private placeCharInPlate(char: TypeChar, position: THREE.Vector3): void {
    const plate = this.state.plate;
    const plateObject = this.scene.getObjectByName('type-plate');
    if (!plateObject) return;

    const plateBox = new THREE.Box3().setFromObject(plateObject);
    const plateSize = new THREE.Vector3();
    plateBox.getSize(plateSize);
    const plateCenter = new THREE.Vector3();
    plateBox.getCenter(plateCenter);

    const cellSize = CHAR_SIZE + CHAR_GAP;
    const cols = plate.isHorizontal ? plate.cols : plate.cols;
    const rows = plate.isHorizontal ? plate.rows : plate.rows;

    const relX = position.x - plateCenter.x + plateSize.x / 2;
    const relZ = position.z - plateCenter.z + plateSize.z / 2;

    let col = Math.floor(relX / cellSize);
    let row = Math.floor(relZ / cellSize);

    col = Math.max(0, Math.min(cols - 1, col));
    row = Math.max(0, Math.min(rows - 1, row));

    const existing = plate.characters.find(c => c.plateRow === row && c.plateCol === col);
    if (existing) {
      this.returnCharToTray(char);
      return;
    }

    char.plateRow = row;
    char.plateCol = col;
    char.status = 'in-plate';

    const startX = plateCenter.x - plateSize.x / 2 + cellSize / 2;
    const startZ = plateCenter.z - plateSize.z / 2 + cellSize / 2;

    char.targetPosition = {
      x: startX + col * cellSize,
      y: 0.25,
      z: startZ + row * cellSize
    };

    char.animationProgress = 0;
    this.animationState.activeAnimations.push({
      charId: char.id,
      type: 'place',
      startTime: performance.now(),
      duration: 250
    });

    plate.characters.push(char);

    const trayIndex = this.state.trayChars.findIndex(c => c.id === char.id);
    if (trayIndex > -1) {
      this.state.trayChars.splice(trayIndex, 1);
    }

    this.notifyStateChange();
  }

  private returnCharToTray(char: TypeChar): void {
    char.status = 'in-tray';
    char.plateRow = undefined;
    char.plateCol = undefined;
    char.targetPosition = { ...char.trayPosition };
    char.animationProgress = 0;

    this.animationState.activeAnimations.push({
      charId: char.id,
      type: 'return',
      startTime: performance.now(),
      duration: 250
    });

    const plateIndex = this.state.plate.characters.findIndex(c => c.id === char.id);
    if (plateIndex > -1) {
      this.state.plate.characters.splice(plateIndex, 1);
    }

    if (!this.state.trayChars.find(c => c.id === char.id)) {
      this.state.trayChars.push(char);
    }

    this.notifyStateChange();
  }

  private selectPlateChar(char: TypeChar): void {
    this.state.selectedCharId = char.id;
    this.notifyStateChange();
  }

  private removeSelectedChar(): void {
    if (!this.state.selectedCharId) return;

    const char = this.findCharById(this.state.selectedCharId);
    if (char && char.status === 'in-plate') {
      char.status = 'in-tray';
      char.animationProgress = 0;

      this.animationState.activeAnimations.push({
        charId: char.id,
        type: 'shrink',
        startTime: performance.now(),
        duration: 200
      });

      setTimeout(() => {
        this.returnCharToTray(char);
      }, 200);
    }

    this.state.selectedCharId = null;
    this.notifyStateChange();
  }

  clearPlate(): void {
    const chars = [...this.state.plate.characters];
    chars.forEach((char, index) => {
      setTimeout(() => {
        this.returnCharToTray(char);
      }, index * 100);
    });
  }

  togglePlateDirection(): void {
    this.state.plate.isHorizontal = !this.state.plate.isHorizontal;
    this.rearrangePlate();
    this.notifyStateChange();
  }

  private rearrangePlate(): void {
    const chars = [...this.state.plate.characters];
    chars.forEach((char, index) => {
      const row = Math.floor(index / this.state.plate.cols);
      const col = index % this.state.plate.cols;
      char.plateRow = row;
      char.plateCol = col;

      const plateObject = this.scene.getObjectByName('type-plate');
      if (plateObject) {
        const plateBox = new THREE.Box3().setFromObject(plateObject);
        const plateSize = new THREE.Vector3();
        plateBox.getSize(plateSize);
        const plateCenter = new THREE.Vector3();
        plateBox.getCenter(plateCenter);

        const cellSize = CHAR_SIZE + CHAR_GAP;
        const startX = plateCenter.x - plateSize.x / 2 + cellSize / 2;
        const startZ = plateCenter.z - plateSize.z / 2 + cellSize / 2;

        char.targetPosition = {
          x: startX + col * cellSize,
          y: 0.25,
          z: startZ + row * cellSize
        };

        char.animationProgress = 0;
        this.animationState.activeAnimations.push({
          charId: char.id,
          type: 'place',
          startTime: performance.now() + index * 30,
          duration: 250
        });
      }
    });
  }

  switchMode(mode: 'typeset' | 'print'): void {
    this.state.mode = mode;
    this.notifyStateChange();
  }

  startInking(): void {
    this.state.inkingStartTime = performance.now();
    this.inkingDistance = 0;
    this.inkingStartPos = this.mouse.clone();
    this.lastMousePos.copy(this.mouse);
    this.notifyStateChange();
  }

  private updateInking(): void {
    if (!this.state.inkingStartTime) return;

    const dx = this.mouse.x - this.lastMousePos.x;
    const dy = this.mouse.y - this.lastMousePos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    this.inkingDistance += dist;
    this.lastMousePos.copy(this.mouse);

    const inkLevel = Math.min(1, this.inkingDistance * 3);
    this.state.inkParams.inkLevel = inkLevel;

    this.state.plate.characters.forEach(char => {
      char.inkLevel = inkLevel;
      this.updateCharMaterial(char);
    });

    this.animationState.rippleTime = performance.now();
    this.notifyStateChange();
  }

  private endInking(): void {
    this.state.inkingStartTime = 0;
    this.notifyStateChange();
  }

  private startPressing(): void {
    this.isPressing = true;
    this.pressStartTime = performance.now();
    this.notifyStateChange();
  }

  private endPressing(): void {
    if (!this.isPressing) return;

    const pressDuration = performance.now() - this.pressStartTime;
    this.isPressing = false;

    let quality: 'light' | 'medium' | 'heavy';
    let bleed: number;

    if (pressDuration < 400) {
      quality = 'light';
      bleed = 0.2;
    } else if (pressDuration < 800) {
      quality = 'medium';
      bleed = 0.5;
    } else {
      quality = 'heavy';
      bleed = 0.8;
    }

    this.state.inkParams.inkQuality = quality;
    this.state.inkParams.bleed = bleed;

    this.animationState.paperShakeTime = performance.now();

    this.executePrint();

    this.notifyStateChange();
  }

  private executePrint(): void {
    const printResult = this.printEngine.generatePrint(
      this.state.plate.characters,
      this.state.inkParams,
      this.state.plate.isHorizontal
    );

    this.state.showingResult = true;
    this.animationState.scrollRevealTime = performance.now();

    const scrollPanel = document.getElementById('scrollPanel');
    if (scrollPanel) {
      setTimeout(() => {
        scrollPanel.classList.add('open');
      }, 100);
    }

    this.updatePrintCanvas(printResult);
    this.updatePagePreview(printResult);
  }

  private updatePrintCanvas(printResult: any): void {
    const canvas = document.getElementById('printCanvas') as HTMLCanvasElement;
    if (canvas && printResult.dataUrl) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const scale = canvas.width / img.width;
          const height = img.height * scale;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, canvas.width, height);
        };
        img.src = printResult.dataUrl;
      }
    }
  }

  private updatePagePreview(printResult: any): void {
    const canvas = document.getElementById('pagePreview') as HTMLCanvasElement;
    if (canvas && printResult.dataUrl) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          const x = (canvas.width - w) / 2;
          const y = (canvas.height - h) / 2;
          ctx.drawImage(img, x, y, w, h);
        };
        img.src = printResult.dataUrl;
      }
    }
  }

  private updateHoverState(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const allMeshes = Array.from(this.charMeshes.values());
    const intersects = this.raycaster.intersectObjects(allMeshes);

    allMeshes.forEach(mesh => {
      const charId = mesh.userData.charId;
      const char = this.findCharById(charId);
      if (char) {
        const material = mesh.material as THREE.MeshStandardMaterial;
        if (material.emissive) {
          material.emissive.setHex(0x000000);
        }
      }
    });

    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh;
      const material = mesh.material as THREE.MeshStandardMaterial;
      if (material.emissive) {
        material.emissive.setHex(0xFFBF00);
        material.emissiveIntensity = 0.3;
      }
    }
  }

  private findCharById(id: string): TypeChar | undefined {
    let char = this.state.trayChars.find(c => c.id === id);
    if (!char) {
      char = this.state.plate.characters.find(c => c.id === id);
    }
    return char;
  }

  updateCharMaterial(char: TypeChar): void {
    const mesh = this.charMeshes.get(char.id);
    if (!mesh) return;

    const material = mesh.material as THREE.MeshStandardMaterial;

    const inkColor = new THREE.Color().lerpColors(
      new THREE.Color(0xD2B48C),
      new THREE.Color(0x111111),
      char.inkLevel
    );

    material.color.copy(inkColor);
    material.roughness = 0.3 + char.inkLevel * 0.4;
    material.metalness = char.inkLevel * 0.3;
  }

  registerCharMesh(charId: string, mesh: THREE.Mesh): void {
    mesh.userData.charId = charId;
    this.charMeshes.set(charId, mesh);
  }

  getState(): AppState {
    return { ...this.state };
  }

  getAnimationState(): AnimationState {
    return { ...this.animationState };
  }

  updateAnimations(deltaTime: number): void {
    const now = performance.now();

    this.animationState.activeAnimations = this.animationState.activeAnimations.filter(anim => {
      const elapsed = now - anim.startTime;
      const progress = Math.min(1, elapsed / anim.duration);
      const eased = this.easeOutCubic(progress);

      const char = this.findCharById(anim.charId);
      const mesh = this.charMeshes.get(anim.charId);

      if (char && mesh) {
        switch (anim.type) {
          case 'rise':
            const riseHeight = 0.5 * Math.sin(eased * Math.PI);
            mesh.position.y = char.trayPosition.y + riseHeight;
            break;
          case 'place':
          case 'return':
            mesh.position.lerp(
              new THREE.Vector3(
                char.targetPosition.x,
                char.targetPosition.y,
                char.targetPosition.z
              ),
              eased
            );
            break;
          case 'shrink':
            mesh.scale.setScalar(1 - eased);
            break;
        }

        char.currentPosition = {
          x: mesh.position.x,
          y: mesh.position.y,
          z: mesh.position.z
        };
      }

      return progress < 1;
    });
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private notifyStateChange(): void {
    this.onStateChange({ ...this.state });
  }

  dispose(): void {
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('mousedown', this.onMouseDown.bind(this));
    canvas.removeEventListener('mousemove', this.onMouseMove.bind(this));
    canvas.removeEventListener('mouseup', this.onMouseUp.bind(this));
    canvas.removeEventListener('mouseleave', this.onMouseUp.bind(this));
    document.removeEventListener('keydown', this.onKeyDown.bind(this));
  }
}
