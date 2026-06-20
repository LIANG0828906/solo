import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type {
  AppState,
  TypeChar,
  CharFont,
  TypePlate,
  InkParams,
  Position3D
} from './types';
import {
  TRAY_ROWS,
  TRAY_COLS,
  CHAR_SIZE,
  CHAR_GAP,
  PLATE_ROWS,
  PLATE_COLS,
  COLORS
} from './types';
import { InteractionManager } from './interaction';
import { PrintEngine } from './printEngine';

class HuoziYinyunApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private container: HTMLElement;

  private interactionManager: InteractionManager;
  private printEngine: PrintEngine;

  private appState: AppState;

  private clock: THREE.Clock;
  private animationFrameId: number = 0;

  private charMeshes: Map<string, THREE.Mesh> = new Map();
  private trayGroup: THREE.Group;
  private plateGroup: THREE.Group;
  private inkStandGroup: THREE.Group;
  private paperGroup: THREE.Group;

  private rippleMesh: THREE.Mesh | null = null;
  private rippleTime: number = 0;

  private paperShakeOffset: number = 0;
  private paperShakeTime: number = 0;

  private charTextures: Map<string, THREE.CanvasTexture> = new Map();

  constructor() {
    this.clock = new THREE.Clock();

    this.container = document.getElementById('canvas-container')!;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.PAPER_BG);

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    );
    this.camera.position.set(0, 12, 15);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 30;
    this.controls.maxPolarAngle = Math.PI / 2.2;
    this.controls.target.set(0, 0, 0);

    this.printEngine = new PrintEngine();

    this.trayGroup = new THREE.Group();
    this.plateGroup = new THREE.Group();
    this.inkStandGroup = new THREE.Group();
    this.paperGroup = new THREE.Group();

    this.appState = this.initializeState();

    this.interactionManager = new InteractionManager(
      this.scene,
      this.camera,
      this.renderer,
      this.appState,
      this.printEngine,
      this.onStateChange.bind(this)
    );

    this.init();
  }

  private initializeState(): AppState {
    const trayChars = this.generateTrayChars();

    return {
      mode: 'typeset',
      selectedCharId: null,
      draggingCharId: null,
      plate: {
        rows: PLATE_ROWS,
        cols: PLATE_COLS,
        isHorizontal: true,
        characters: []
      },
      trayChars,
      inkParams: {
        inkLevel: 0,
        inkQuality: 'medium',
        bleed: 0.5
      },
      isPrinting: false,
      scrollProgress: 0,
      cropPosition: 0.5,
      showingResult: false,
      inkingStartTime: 0,
      pressStartTime: 0
    };
  }

  private generateTrayChars(): TypeChar[] {
    const chars: TypeChar[] = [];
    const commonChars = '天地玄黄宇宙洪荒日月盈昃辰宿列张寒来暑往秋收冬藏闰余成岁律吕调阳云腾致雨露结为霜金生丽水玉出昆冈剑号巨阙珠称夜光果珍李柰菜重芥姜海咸河淡鳞潜羽翔龙师火帝鸟官人皇始制文字乃服衣裳推位让国有虞陶唐吊民伐罪周发殷汤坐朝问道垂拱平章爱育黎首臣伏戎羌遐迩壹体率宾归王鸣凤在竹白驹食场化被草木赖及万方盖此身发四大五常恭惟鞠养岂敢毁伤女慕贞洁男效才良知过必改得能莫忘罔谈彼短靡恃己长信使可覆器欲难量墨悲丝染诗赞羔羊景行维贤克念作圣德建名立形端表正空谷传声虚堂习听祸因恶积福缘善庆尺璧非宝寸阴是竞资父事君曰严与敬孝当竭力忠则尽命临深履薄夙兴温凊似兰斯馨如松之盛川流不息渊澄取映容止若思言辞安定笃初诚美慎终宜令荣业所基籍甚无竟学优登仕摄职从政存以甘棠去而益咏';
    const fonts: CharFont[] = ['songti', 'kaiti', 'lishu'];

    let charIndex = 0;
    for (let row = 0; row < TRAY_ROWS; row++) {
      for (let col = 0; col < TRAY_COLS; col++) {
        if (charIndex >= commonChars.length) break;

        const fontIndex = (row + col) % 3;
        const char = commonChars[charIndex];

        const trayX = (col - TRAY_COLS / 2 + 0.5) * (CHAR_SIZE + CHAR_GAP) - 6;
        const trayZ = (row - TRAY_ROWS / 2 + 0.5) * (CHAR_SIZE + CHAR_GAP) - 2;

        chars.push({
          id: `char_${row}_${col}`,
          char,
          font: fonts[fontIndex],
          trayRow: row,
          trayCol: col,
          trayPosition: { x: trayX, y: 0.25, z: trayZ },
          currentPosition: { x: trayX, y: 0.25, z: trayZ },
          targetPosition: { x: trayX, y: 0.25, z: trayZ },
          inkLevel: 0,
          status: 'in-tray'
        });

        charIndex++;
      }
    }

    return chars;
  }

  private init(): void {
    this.setupLighting();
    this.createWorkbench();
    this.createTray();
    this.createPlate();
    this.createInkStand();
    this.createPaper();
    this.createChars();

    this.scene.add(this.trayGroup);
    this.scene.add(this.plateGroup);
    this.scene.add(this.inkStandGroup);
    this.scene.add(this.paperGroup);

    this.setupUIBindings();
    this.setupResizeHandler();

    this.animate();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -15;
    directionalLight.shadow.camera.right = 15;
    directionalLight.shadow.camera.top = 15;
    directionalLight.shadow.camera.bottom = -15;
    this.scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0xffeedd, 0.3);
    fillLight.position.set(-5, 5, -5);
    this.scene.add(fillLight);
  }

  private createWorkbench(): void {
    const workbenchGeometry = new THREE.BoxGeometry(20, 0.5, 12);
    const woodTexture = this.createWoodTexture();
    const workbenchMaterial = new THREE.MeshStandardMaterial({
      map: woodTexture,
      roughness: 0.8,
      metalness: 0.1
    });
    const workbench = new THREE.Mesh(workbenchGeometry, workbenchMaterial);
    workbench.position.y = -0.25;
    workbench.receiveShadow = true;
    workbench.name = 'workbench';
    this.scene.add(workbench);

    const legGeometry = new THREE.BoxGeometry(0.8, 4, 0.8);
    const legPositions = [
      [-9, -2.5, -5.6],
      [9, -2.5, -5.6],
      [-9, -2.5, 5.6],
      [9, -2.5, 5.6]
    ];

    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, workbenchMaterial);
      leg.position.set(pos[0], pos[1], pos[2]);
      leg.castShadow = true;
      leg.receiveShadow = true;
      this.scene.add(leg);
    });
  }

  private createWoodTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#7a4d2d');
    gradient.addColorStop(0.3, '#6B4226');
    gradient.addColorStop(0.7, '#5C4033');
    gradient.addColorStop(1, '#4a3528');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 30; i++) {
      const y = Math.random() * 512;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x < 512; x += 10) {
        ctx.lineTo(x, y + Math.sin(x * 0.02 + i) * 3);
      }
      ctx.strokeStyle = `rgba(${60 + Math.random() * 30}, ${30 + Math.random() * 20}, ${10 + Math.random() * 10}, 0.5)`;
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.stroke();
    }

    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 512;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 20, 512);
      ctx.strokeStyle = '#3d2817';
      ctx.lineWidth = 0.5 + Math.random();
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 2);

    return texture;
  }

  private createTray(): void {
    const trayWidth = TRAY_COLS * (CHAR_SIZE + CHAR_GAP);
    const trayDepth = TRAY_ROWS * (CHAR_SIZE + CHAR_GAP);

    const trayBaseGeometry = new THREE.BoxGeometry(trayWidth + 0.4, 0.15, trayDepth + 0.4);
    const trayMaterial = new THREE.MeshStandardMaterial({
      color: 0x5C4033,
      roughness: 0.7,
      metalness: 0.1
    });
    const trayBase = new THREE.Mesh(trayBaseGeometry, trayMaterial);
    trayBase.position.set(-6, 0.075, -2);
    trayBase.receiveShadow = true;
    trayBase.castShadow = true;
    this.trayGroup.add(trayBase);

    const cellMaterial = new THREE.MeshStandardMaterial({
      color: 0xD2B48C,
      roughness: 0.9
    });

    for (let row = 0; row < TRAY_ROWS; row++) {
      for (let col = 0; col < TRAY_COLS; col++) {
        const cellGeometry = new THREE.BoxGeometry(
          CHAR_SIZE * 0.95,
          0.05,
          CHAR_SIZE * 0.95
        );
        const cell = new THREE.Mesh(cellGeometry, cellMaterial);
        const x = (col - TRAY_COLS / 2 + 0.5) * (CHAR_SIZE + CHAR_GAP) - 6;
        const z = (row - TRAY_ROWS / 2 + 0.5) * (CHAR_SIZE + CHAR_GAP) - 2;
        cell.position.set(x, 0.175, z);
        cell.receiveShadow = true;
        this.trayGroup.add(cell);
      }
    }

    const rimGeometry = new THREE.BoxGeometry(trayWidth + 0.6, 0.2, 0.1);
    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a3528,
      roughness: 0.6
    });

    const rimPositions = [
      { x: -6, z: -2 - trayDepth / 2 - 0.15, ry: 0 },
      { x: -6, z: -2 + trayDepth / 2 + 0.15, ry: 0 },
      { x: -6 - trayWidth / 2 - 0.15, z: -2, ry: Math.PI / 2 },
      { x: -6 + trayWidth / 2 + 0.15, z: -2, ry: Math.PI / 2 }
    ];

    rimPositions.forEach(pos => {
      const rim = new THREE.Mesh(rimGeometry, rimMaterial);
      rim.position.set(pos.x, 0.2, pos.z);
      rim.rotation.y = pos.ry;
      rim.scale.x = (trayWidth + 0.6) / (trayWidth + 0.1);
      this.trayGroup.add(rim);
    });
  }

  private createPlate(): void {
    const plateWidth = PLATE_COLS * (CHAR_SIZE + CHAR_GAP);
    const plateDepth = PLATE_ROWS * (CHAR_SIZE + CHAR_GAP);

    const plateBaseGeometry = new THREE.BoxGeometry(plateWidth + 0.6, 0.2, plateDepth + 0.6);
    const plateMaterial = new THREE.MeshStandardMaterial({
      color: 0x6B4226,
      roughness: 0.7,
      metalness: 0.1
    });
    const plateBase = new THREE.Mesh(plateBaseGeometry, plateMaterial);
    plateBase.position.set(0, 0.1, 2);
    plateBase.receiveShadow = true;
    plateBase.castShadow = true;
    plateBase.name = 'type-plate';
    this.plateGroup.add(plateBase);

    const innerGeometry = new THREE.BoxGeometry(plateWidth, 0.05, plateDepth);
    const innerMaterial = new THREE.MeshStandardMaterial({
      color: 0xAAAAAA,
      transparent: true,
      opacity: 0.3,
      roughness: 0.5
    });
    const inner = new THREE.Mesh(innerGeometry, innerMaterial);
    inner.position.set(0, 0.225, 2);
    this.plateGroup.add(inner);

    const frameGeometry = new THREE.BoxGeometry(plateWidth + 0.3, 0.02, plateDepth + 0.3);
    const frameMaterial = new THREE.MeshBasicMaterial({
      color: 0xAAAAAA,
      transparent: true,
      opacity: 0.8
    });
    const frameTop = new THREE.Mesh(frameGeometry, frameMaterial);
    frameTop.position.set(0, 0.25, 2);
    this.plateGroup.add(frameTop);
  }

  private createInkStand(): void {
    const baseGeometry = new THREE.CylinderGeometry(1.2, 1.4, 0.3, 32);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d3d3d,
      roughness: 0.3,
      metalness: 0.8
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(6, 0.15, -1);
    base.receiveShadow = true;
    base.castShadow = true;
    this.inkStandGroup.add(base);

    const inkGeometry = new THREE.CircleGeometry(1, 32);
    const inkMaterial = new THREE.MeshStandardMaterial({
      color: 0x0A0A0A,
      roughness: 0.1,
      metalness: 0.9,
      side: THREE.DoubleSide
    });
    const ink = new THREE.Mesh(inkGeometry, inkMaterial);
    ink.rotation.x = -Math.PI / 2;
    ink.position.set(6, 0.31, -1);
    ink.name = 'ink-pool';
    this.inkStandGroup.add(ink);

    const rippleGeometry = new THREE.CircleGeometry(0.8, 32);
    const rippleMaterial = new THREE.MeshBasicMaterial({
      color: 0x333333,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    this.rippleMesh = new THREE.Mesh(rippleGeometry, rippleMaterial);
    this.rippleMesh.rotation.x = -Math.PI / 2;
    this.rippleMesh.position.set(6, 0.32, -1);
    this.rippleMesh.name = 'ink-ripple';
    this.inkStandGroup.add(this.rippleMesh);

    const highlightGeometry = new THREE.CircleGeometry(0.3, 32);
    const highlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide
    });
    const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    highlight.rotation.x = -Math.PI / 2;
    highlight.position.set(6.2, 0.315, -0.3);
    highlight.scale.set(1, 0.5, 1);
    this.inkStandGroup.add(highlight);
  }

  private createPaper(): void {
    const paperGeometry = new THREE.PlaneGeometry(6, 4.5);
    const paperTexture = this.createPaperTexture();
    const paperMaterial = new THREE.MeshStandardMaterial({
      map: paperTexture,
      roughness: 0.9,
      side: THREE.DoubleSide
    });
    const paper = new THREE.Mesh(paperGeometry, paperMaterial);
    paper.rotation.x = -Math.PI / 2;
    paper.position.set(6, 0.01, 3);
    paper.receiveShadow = true;
    paper.name = 'paper';
    this.paperGroup.add(paper);

    const paperEdgeGeometry = new THREE.BoxGeometry(6.1, 0.02, 4.6);
    const paperEdgeMaterial = new THREE.MeshStandardMaterial({
      color: 0xE0D5C0,
      roughness: 0.95
    });
    const paperEdge = new THREE.Mesh(paperEdgeGeometry, paperEdgeMaterial);
    paperEdge.position.set(6, -0.01, 3);
    this.paperGroup.add(paperEdge);
  }

  private createPaperTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#F5F0E1';
    ctx.fillRect(0, 0, 512, 512);

    ctx.globalAlpha = 0.05;
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 2 + 0.5;
      ctx.fillStyle = Math.random() > 0.5 ? '#D4C4A8' : '#F8F4E8';
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 0.03;
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.moveTo(0, Math.random() * 512);
      ctx.lineTo(512, Math.random() * 512 + 20);
      ctx.strokeStyle = '#C0B090';
      ctx.lineWidth = Math.random() * 2 + 0.5;
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    return texture;
  }

  private createChars(): void {
    this.appState.trayChars.forEach(char => {
      const mesh = this.createCharMesh(char);
      mesh.position.set(char.trayPosition.x, char.trayPosition.y, char.trayPosition.z);
      this.charMeshes.set(char.id, mesh);
      this.interactionManager.registerCharMesh(char.id, mesh);
      this.trayGroup.add(mesh);
    });
  }

  private createCharMesh(char: TypeChar): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(CHAR_SIZE, CHAR_SIZE * 0.8, CHAR_SIZE);

    const faceTexture = this.createCharFaceTexture(char.char, char.font);

    const materials = [
      new THREE.MeshStandardMaterial({ color: 0xD2B48C, roughness: 0.8 }),
      new THREE.MeshStandardMaterial({ color: 0xD2B48C, roughness: 0.8 }),
      new THREE.MeshStandardMaterial({ map: faceTexture, roughness: 0.7 }),
      new THREE.MeshStandardMaterial({ color: 0xC4A67C, roughness: 0.8 }),
      new THREE.MeshStandardMaterial({ color: 0xD2B48C, roughness: 0.8 }),
      new THREE.MeshStandardMaterial({ color: 0xD2B48C, roughness: 0.8 })
    ];

    const mesh = new THREE.Mesh(geometry, materials);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.charId = char.id;
    mesh.name = `char-${char.id}`;

    return mesh;
  }

  private createCharFaceTexture(char: string, font: CharFont): THREE.CanvasTexture {
    const cacheKey = `${char}_${font}`;
    if (this.charTextures.has(cacheKey)) {
      return this.charTextures.get(cacheKey)!;
    }

    const canvas = document.createElement('canvas');
    const size = 128;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#D2B48C';
    ctx.fillRect(0, 0, size, size);

    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.scale(-1, 1);
    ctx.translate(-size / 2, -size / 2);

    const fontMap: Record<CharFont, string> = {
      songti: 'bold 80px "Noto Serif SC", SimSun, serif',
      kaiti: '80px "Ma Shan Zheng", KaiTi, STKaiti, cursive',
      lishu: '80px "ZCOOL XiaoWei", LiSu, serif'
    };

    ctx.font = fontMap[font];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1A1A1A';
    ctx.fillText(char, size / 2, size / 2 + 4);

    ctx.restore();

    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.fillStyle = '#8B7355';
      ctx.fillRect(x, y, 2, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    this.charTextures.set(cacheKey, texture);
    return texture;
  }

  private setupUIBindings(): void {
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.interactionManager.clearPlate();
      });
    }

    const toggleDirBtn = document.getElementById('toggleDirBtn');
    if (toggleDirBtn) {
      toggleDirBtn.addEventListener('click', () => {
        this.interactionManager.togglePlateDirection();
      });
    }

    const printBtn = document.getElementById('printBtn');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        this.switchMode();
      });
    }

    const modeBtns = document.querySelectorAll('.mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = (e.target as HTMLElement).dataset.mode as 'typeset' | 'print';
        this.interactionManager.switchMode(mode);
        modeBtns.forEach(b => b.classList.remove('active'));
        (e.target as HTMLElement).classList.add('active');
      });
    });

    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportImage();
      });
    }

    this.setupCropLines();
  }

  private setupCropLines(): void {
    const cropTop = document.getElementById('cropTop');
    const cropBottom = document.getElementById('cropBottom');
    const printCanvas = document.getElementById('printCanvas') as HTMLCanvasElement;

    if (!cropTop || !cropBottom || !printCanvas) return;

    let isDragging = false;
    let currentLine: HTMLElement | null = null;

    const onMouseDown = (e: MouseEvent, line: HTMLElement) => {
      isDragging = true;
      currentLine = line;
      e.preventDefault();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !currentLine || !printCanvas) return;

      const rect = printCanvas.getBoundingClientRect();
      const y = e.clientY - rect.top;

      if (currentLine === cropTop) {
        const minTop = 10;
        const maxTop = (cropBottom.offsetTop || 200) - 20;
        const newTop = Math.max(minTop, Math.min(maxTop, y));
        cropTop.style.top = newTop + 'px';
      } else if (currentLine === cropBottom) {
        const minBottom = (cropTop.offsetTop || 0) + 20;
        const maxBottom = rect.height - 10;
        const newBottom = rect.height - Math.max(minBottom, Math.min(maxBottom, y));
        cropBottom.style.bottom = newBottom + 'px';
      }

      this.updatePagePreviewFromCanvas();
    };

    const onMouseUp = () => {
      isDragging = false;
      currentLine = null;
    };

    cropTop.addEventListener('mousedown', (e) => onMouseDown(e, cropTop));
    cropBottom.addEventListener('mousedown', (e) => onMouseDown(e, cropBottom));
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  private updatePagePreviewFromCanvas(): void {
    const printCanvas = document.getElementById('printCanvas') as HTMLCanvasElement;
    const pagePreview = document.getElementById('pagePreview') as HTMLCanvasElement;
    const cropTop = document.getElementById('cropTop');
    const cropBottom = document.getElementById('cropBottom');

    if (!printCanvas || !pagePreview || !cropTop || !cropBottom) return;

    const ctx = pagePreview.getContext('2d');
    if (!ctx) return;

    const topY = cropTop.offsetTop;
    const bottomY = printCanvas.offsetHeight - (cropBottom as HTMLElement).offsetTop;
    const cropHeight = bottomY - topY;

    if (cropHeight <= 0) return;

    const targetWidth = 128;
    const targetHeight = 180;

    ctx.fillStyle = '#F5F0E1';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    const scale = targetWidth / printCanvas.width;
    const drawHeight = cropHeight * scale;
    const drawY = (targetHeight - drawHeight) / 2;

    ctx.drawImage(
      printCanvas,
      0, topY, printCanvas.width, cropHeight,
      0, drawY, targetWidth, drawHeight
    );
  }

  private switchMode(): void {
    const currentMode = this.appState.mode;
    const newMode = currentMode === 'typeset' ? 'print' : 'typeset';
    this.interactionManager.switchMode(newMode);

    const modeBtns = document.querySelectorAll('.mode-btn');
    modeBtns.forEach(btn => {
      btn.classList.toggle('active', (btn as HTMLElement).dataset.mode === newMode);
    });
  }

  private exportImage(): void {
    const printCanvas = document.getElementById('printCanvas') as HTMLCanvasElement;
    if (!printCanvas) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 1600;
    exportCanvas.height = 1200;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#F5F0E1';
    ctx.fillRect(0, 0, 1600, 1200);

    const scale = Math.min(1400 / printCanvas.width, 1000 / printCanvas.height);
    const drawW = printCanvas.width * scale;
    const drawH = printCanvas.height * scale;
    const offsetX = (1600 - drawW) / 2;
    const offsetY = (1200 - drawH) / 2;

    ctx.drawImage(printCanvas, offsetX, offsetY, drawW, drawH);

    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 4;
    ctx.strokeRect(offsetX - 10, offsetY - 10, drawW + 20, drawH + 20);

    ctx.font = '48px "Ma Shan Zheng", "KaiTi", serif';
    ctx.fillStyle = '#5C4033';
    ctx.textAlign = 'center';
    ctx.fillText('活字印韵', 800, 1150);

    const link = document.createElement('a');
    link.download = 'huozi-print.png';
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  }

  private setupResizeHandler(): void {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  private onStateChange(state: AppState): void {
    this.appState = state;

    if (state.inkingStartTime > 0) {
      this.triggerRipple();
    }
  }

  private triggerRipple(): void {
    this.rippleTime = performance.now();
  }

  private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();

    this.controls.update();
    this.interactionManager.updateAnimations(delta);
    this.updateRippleEffect();
    this.updatePaperShake();
    this.updateCharInkLevels();

    this.renderer.render(this.scene, this.camera);
  }

  private updateRippleEffect(): void {
    if (!this.rippleMesh) return;

    const elapsed = (performance.now() - this.rippleTime) / 1000;
    const material = this.rippleMesh.material as THREE.MeshBasicMaterial;

    if (this.appState.inkingStartTime > 0) {
      const pulse = 0.3 + Math.sin(performance.now() * 0.01) * 0.1;
      material.opacity = pulse;
      const scale = 1 + Math.sin(performance.now() * 0.005) * 0.1;
      this.rippleMesh.scale.set(scale, scale, 1);
    } else {
      material.opacity = Math.max(0, 0.5 - elapsed * 2);
    }
  }

  private updatePaperShake(): void {
    const animState = this.interactionManager.getAnimationState();
    const elapsed = (performance.now() - animState.paperShakeTime) / 1000;

    if (elapsed < 0.2) {
      const shake = Math.sin(elapsed * Math.PI * 20) * 0.03 * (1 - elapsed / 0.2);
      this.paperGroup.position.x = shake;
    } else {
      this.paperGroup.position.x = 0;
    }
  }

  private updateCharInkLevels(): void {
    const allChars = [
      ...this.appState.trayChars,
      ...this.appState.plate.characters
    ];

    allChars.forEach(char => {
      const mesh = this.charMeshes.get(char.id);
      if (!mesh) return;

      const materials = mesh.material as THREE.MeshStandardMaterial[];
      if (materials[2] && char.inkLevel > 0) {
        const inkColor = new THREE.Color().lerpColors(
          new THREE.Color(0xD2B48C),
          new THREE.Color(0x111111),
          char.inkLevel
        );
        materials[2].color.copy(inkColor);
        materials[2].roughness = 0.3 + char.inkLevel * 0.4;
      }
    });
  }

  public dispose(): void {
    cancelAnimationFrame(this.animationFrameId);
    this.interactionManager.dispose();
    this.renderer.dispose();
    this.controls.dispose();
  }
}

let app: HuoziYinyunApp | null = null;

window.addEventListener('DOMContentLoaded', () => {
  app = new HuoziYinyunApp();
});

export default HuoziYinyunApp;
