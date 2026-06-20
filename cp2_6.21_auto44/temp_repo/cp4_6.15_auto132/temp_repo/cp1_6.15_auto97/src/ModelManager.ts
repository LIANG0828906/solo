import * as THREE from 'three';
import { BoneAnnotation } from './AnnotationSystem';
import { GeologicalPeriod, GEOLOGICAL_PERIODS } from './GeologicalTimeline';
import {
  easeOutCubic,
  easeOutQuad,
  lerp,
  modelCache,
  disposeObject3D,
  createEventDispatcher,
  EventDispatcher
} from './utils';

export interface FossilInfo {
  id: string;
  name: string;
  scientificName: string;
  periodId: string;
  ageRange: string;
  size: string;
  discoveryLocation: string;
  description: string;
}

export interface FossilModelData {
  fossilInfo: FossilInfo;
  annotations: BoneAnnotation[];
  modelType: ModelType;
}

type ModelType = 'trilobite' | 'cephalopod' | 'eurypterid' | 'placoderm' | 'meganeura' | 'dimetrodon';

interface ModelManagerEvents {
  modelReady: { model: THREE.Group; data: FossilModelData };
  modelRemoved: void;
  loadingStart: void;
  loadingEnd: void;
  infoUpdate: FossilInfo;
}

const FOSSIL_DATA: Record<string, FossilModelData> = {
  cambrian: {
    fossilInfo: {
      id: 'trilobite',
      name: '三叶虫',
      scientificName: 'Trilobita',
      periodId: 'cambrian',
      ageRange: '5.41-4.85亿年前',
      size: '2-70厘米',
      discoveryLocation: '全球各地',
      description: '寒武纪最具代表性的节肢动物'
    },
    annotations: [
      { id: 't1', boneName: 'Cephalon', boneNameCn: '头甲', function: '包含眼睛和口器，保护头部', localPosition: [0, 0.3, 0.8] },
      { id: 't2', boneName: 'Glabella', boneNameCn: '头鞍', function: '头部中央隆起，容纳内脏', localPosition: [0, 0.4, 0.5] },
      { id: 't3', boneName: 'Thorax', boneNameCn: '胸节', function: '分节的躯干，可弯曲运动', localPosition: [0, 0.25, 0] },
      { id: 't4', boneName: 'Pygidium', boneNameCn: '尾甲', function: '愈合的尾部体节，保护后部', localPosition: [0, 0.2, -0.8] },
      { id: 't5', boneName: 'Compound Eye', boneNameCn: '复眼', function: '由数千个透镜组成，视觉敏锐', localPosition: [0.4, 0.35, 0.7] },
      { id: 't6', boneName: 'Axial Ring', boneNameCn: '轴环', function: '体节中央部分，支撑肌肉附着', localPosition: [0, 0.3, -0.2] }
    ],
    modelType: 'trilobite'
  },
  ordovician: {
    fossilInfo: {
      id: 'cephalopod',
      name: '直角石',
      scientificName: 'Orthoceras',
      periodId: 'ordovician',
      ageRange: '4.85-4.44亿年前',
      size: '10-300厘米',
      discoveryLocation: '欧洲、北美、亚洲',
      description: '奥陶纪海洋中的顶级掠食者'
    },
    annotations: [
      { id: 'c1', boneName: 'Shell', boneNameCn: '外壳', function: '长锥形钙质外壳，保护软体', localPosition: [0, 0.3, 0] },
      { id: 'c2', boneName: 'Siphuncle', boneNameCn: '体管', function: '调节壳内气体，控制浮力', localPosition: [0, 0.3, 0.3] },
      { id: 'c3', boneName: 'Septum', boneNameCn: '隔壁', function: '分隔气室，支撑外壳结构', localPosition: [0, 0.3, 0.1] },
      { id: 'c4', boneName: 'Camerae', boneNameCn: '气室', function: '空室储存气体，提供浮力', localPosition: [0, 0.3, -0.4] },
      { id: 'c5', boneName: 'Aperture', boneNameCn: '壳口', function: '软体伸出的开口', localPosition: [0, 0.3, 0.8] },
      { id: 'c6', boneName: 'Tentacles', boneNameCn: '触手', function: '捕食和感知周围环境', localPosition: [0, 0.2, 1.0] }
    ],
    modelType: 'cephalopod'
  },
  silurian: {
    fossilInfo: {
      id: 'eurypterid',
      name: '板足鲎',
      scientificName: 'Eurypterida',
      periodId: 'silurian',
      ageRange: '4.44-4.19亿年前',
      size: '20-250厘米',
      discoveryLocation: '北美、欧洲、澳洲',
      description: '志留纪最大的节肢动物，俗称海蝎子'
    },
    annotations: [
      { id: 'e1', boneName: 'Prosoma', boneNameCn: '头胸部', function: '头部和胸部愈合，附肢着生处', localPosition: [0, 0.3, 0.6] },
      { id: 'e2', boneName: 'Compound Eye', boneNameCn: '复眼', function: '位于头甲两侧，感知运动', localPosition: [0.4, 0.35, 0.6] },
      { id: 'e3', boneName: 'Chelate', boneNameCn: '螯肢', function: '大型捕食附肢，捕捉猎物', localPosition: [0.5, 0.2, 0.9] },
      { id: 'e4', boneName: 'Mesosoma', boneNameCn: '中体', function: '腹部前六节，含呼吸器官', localPosition: [0, 0.25, 0] },
      { id: 'e5', boneName: 'Metasoma', boneNameCn: '后体', function: '腹部后六节，可弯曲', localPosition: [0, 0.2, -0.6] },
      { id: 'e6', boneName: 'Telson', boneNameCn: '尾刺', function: '尾部尖刺，防御武器', localPosition: [0, 0.15, -1.1] },
      { id: 'e7', boneName: 'Paddle', boneNameCn: '游泳足', function: '最后一对附肢特化为桨状', localPosition: [0.6, 0.1, -0.1] }
    ],
    modelType: 'eurypterid'
  },
  devonian: {
    fossilInfo: {
      id: 'placoderm',
      name: '盾皮鱼',
      scientificName: 'Placodermi',
      periodId: 'devonian',
      ageRange: '4.19-3.59亿年前',
      size: '30-600厘米',
      discoveryLocation: '全球各地',
      description: '泥盆纪最成功的有颌鱼类'
    },
    annotations: [
      { id: 'p1', boneName: 'Head Shield', boneNameCn: '头甲', function: '保护头部和鳃部的骨板', localPosition: [0, 0.4, 0.5] },
      { id: 'p2', boneName: 'Jaw', boneNameCn: '颌骨', function: '原始有颌结构，增强捕食能力', localPosition: [0, 0.25, 0.8] },
      { id: 'p3', boneName: 'Orbit', boneNameCn: '眼眶', function: '容纳眼睛，视觉器官', localPosition: [0.35, 0.45, 0.4] },
      { id: 'p4', boneName: 'Trunk Shield', boneNameCn: '躯干甲', function: '保护躯干的骨质甲板', localPosition: [0, 0.3, 0] },
      { id: 'p5', boneName: 'Dorsal Spine', boneNameCn: '背棘', function: '背部突起，防御和稳定', localPosition: [0, 0.6, -0.1] },
      { id: 'p6', boneName: 'Pectoral Fin', boneNameCn: '胸鳍', function: '控制方向和平衡', localPosition: [0.4, 0.15, 0.2] },
      { id: 'p7', boneName: 'Caudal Fin', boneNameCn: '尾鳍', function: '提供主要推进力', localPosition: [0, 0.15, -0.9] }
    ],
    modelType: 'placoderm'
  },
  carboniferous: {
    fossilInfo: {
      id: 'meganeura',
      name: '巨脉蜻蜓',
      scientificName: 'Meganeura',
      periodId: 'carboniferous',
      ageRange: '3.59-2.99亿年前',
      size: '翼展65-75厘米',
      discoveryLocation: '法国、美国、俄罗斯',
      description: '石炭纪巨型昆虫，有史以来最大的飞虫'
    },
    annotations: [
      { id: 'm1', boneName: 'Head', boneNameCn: '头部', function: '感觉和取食中心，具复眼', localPosition: [0, 0.3, 0.5] },
      { id: 'm2', boneName: 'Compound Eye', boneNameCn: '复眼', function: '大而发达，敏锐的飞行视觉', localPosition: [0.15, 0.35, 0.55] },
      { id: 'm3', boneName: 'Thorax', boneNameCn: '胸部', function: '三对足和两对翅的着生处', localPosition: [0, 0.25, 0] },
      { id: 'm4', boneName: 'Forewing', boneNameCn: '前翅', function: '大型膜质翅，提供升力', localPosition: [0.8, 0.3, 0.1] },
      { id: 'm5', boneName: 'Hindwing', boneNameCn: '后翅', function: '略大于前翅，辅助飞行', localPosition: [0.9, 0.25, -0.2] },
      { id: 'm6', boneName: 'Abdomen', boneNameCn: '腹部', function: '分节的腹部，容纳内脏', localPosition: [0, 0.2, -0.5] },
      { id: 'm7', boneName: 'Leg', boneNameCn: '步足', function: '六足，用于爬行和抓握', localPosition: [0.2, 0.1, 0.3] },
      { id: 'm8', boneName: 'Wing Vein', boneNameCn: '翅脉', function: '翅膀的支撑结构', localPosition: [0.6, 0.3, 0] }
    ],
    modelType: 'meganeura'
  },
  permian: {
    fossilInfo: {
      id: 'dimetrodon',
      name: '异齿兽',
      scientificName: 'Dimetrodon',
      periodId: 'permian',
      ageRange: '2.99-2.52亿年前',
      size: '1.5-3.5米',
      discoveryLocation: '美国、加拿大、德国',
      description: '二叠纪最著名的似哺乳爬行动物'
    },
    annotations: [
      { id: 'd1', boneName: 'Skull', boneNameCn: '头骨', function: '特化的头骨，具两种牙齿', localPosition: [0, 0.5, 1.0] },
      { id: 'd2', boneName: 'Incisor', boneNameCn: '门齿', function: '前部牙齿，用于切割食物', localPosition: [0, 0.4, 1.2] },
      { id: 'd3', boneName: 'Canine', boneNameCn: '犬齿', function: '长而锋利的犬齿，刺杀猎物', localPosition: [0.15, 0.35, 1.1] },
      { id: 'd4', boneName: 'Neural Spine', boneNameCn: '神经棘', function: '背帆的骨质支撑', localPosition: [0, 1.0, 0.2] },
      { id: 'd5', boneName: 'Sail', boneNameCn: '背帆', function: '体温调节和展示', localPosition: [0, 0.8, 0] },
      { id: 'd6', boneName: 'Vertebra', boneNameCn: '脊椎', function: '支撑身体的中轴骨骼', localPosition: [0, 0.4, 0] },
      { id: 'd7', boneName: 'Forelimb', boneNameCn: '前肢', function: '强壮的四肢，支撑身体', localPosition: [0.35, 0.15, 0.5] },
      { id: 'd8', boneName: 'Hindlimb', boneNameCn: '后肢', function: '略长于前肢，推动前进', localPosition: [0.35, 0.15, -0.5] },
      { id: 'd9', boneName: 'Tail', boneNameCn: '尾部', function: '长而有力的尾，平衡身体', localPosition: [0, 0.2, -1.2] }
    ],
    modelType: 'dimetrodon'
  }
};

type AnimationState = 'idle' | 'exiting' | 'entering' | 'loading';

export class ModelManager {
  private scene: THREE.Scene;
  private currentModel: THREE.Group | null = null;
  private currentPeriodId: string | null = null;
  private currentData: FossilModelData | null = null;
  private dispatcher: EventDispatcher<ModelManagerEvents>;

  private animationState: AnimationState = 'idle';
  private animationProgress: number = 0;
  private exitStartScale: number = 1;
  private exitStartRotation: number = 0;

  private cutPlane: THREE.Plane | null = null;
  private cutPlaneMesh: THREE.Mesh | null = null;
  private cutPlaneEnabled: boolean = false;
  private cutPosition: number = 50;

  private modelBounds: { minZ: number; maxZ: number } = { minZ: -1, maxZ: 1 };

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.dispatcher = createEventDispatcher<ModelManagerEvents>();
  }

  async switchPeriod(periodId: string): Promise<void> {
    if (this.animationState !== 'idle') return;
    if (periodId === this.currentPeriodId) return;

    const period = GEOLOGICAL_PERIODS.find((p) => p.id === periodId);
    if (!period) return;

    if (this.currentModel) {
      await this.animateExit();
      this.removeCurrentModel();
    }

    this.dispatcher.dispatch('loadingStart', void 0);
    this.animationState = 'loading';

    await new Promise((resolve) => setTimeout(resolve, 300));

    const fossilData = FOSSIL_DATA[periodId];
    if (!fossilData) return;

    const model = this.generateModel(fossilData.modelType);

    this.currentModel = model;
    this.currentPeriodId = periodId;
    this.currentData = fossilData;

    this.calculateModelBounds(model);

    this.scene.add(model);
    this.dispatcher.dispatch('loadingEnd', void 0);

    await this.animateEnter(model);

    this.dispatcher.dispatch('infoUpdate', fossilData.fossilInfo);
    this.dispatcher.dispatch('modelReady', { model, data: fossilData });

    if (this.cutPlaneEnabled) {
      this.applyClippingPlanes();
      this.updateCutPlaneVisual();
    }

    this.animationState = 'idle';
  }

  private calculateModelBounds(model: THREE.Group): void {
    const box = new THREE.Box3().setFromObject(model);
    this.modelBounds = {
      minZ: box.min.z,
      maxZ: box.max.z
    };
  }

  private generateModel(type: ModelType): THREE.Group {
    const cacheKey = `model_${type}`;
    const cached = modelCache.get(cacheKey);

    if (cached) {
      const group = new THREE.Group();
      const mesh = new THREE.Mesh(cached.clone(), this.createFossilMaterial());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      return group;
    }

    const group = new THREE.Group();
    let geometry: THREE.BufferGeometry;

    switch (type) {
      case 'trilobite':
        geometry = this.createTrilobiteGeometry();
        break;
      case 'cephalopod':
        geometry = this.createCephalopodGeometry();
        break;
      case 'eurypterid':
        geometry = this.createEurypteridGeometry();
        break;
      case 'placoderm':
        geometry = this.createPlacodermGeometry();
        break;
      case 'meganeura':
        geometry = this.createMeganeuraGeometry();
        break;
      case 'dimetrodon':
        geometry = this.createDimetrodonGeometry();
        break;
      default:
        geometry = new THREE.SphereGeometry(1, 32, 32);
    }

    modelCache.set(cacheKey, geometry);

    const mesh = new THREE.Mesh(geometry, this.createFossilMaterial());
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    return group;
  }

  private createFossilMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      roughness: 0.85,
      metalness: 0.05,
      side: THREE.DoubleSide
    });
  }

  private createTrilobiteGeometry(): THREE.BufferGeometry {
    const group = new THREE.Group();

    const bodyShape = new THREE.Shape();
    const length = 2;
    const width = 1.2;

    bodyShape.moveTo(0, width / 2);
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const z = lerp(length / 2, -length / 2, t);
      const w = (width / 2) * Math.sin(Math.PI * t) * 0.9 + width * 0.1;
      bodyShape.lineTo(z, w);
    }
    for (let i = 20; i >= 0; i--) {
      const t = i / 20;
      const z = lerp(length / 2, -length / 2, t);
      const w = (width / 2) * Math.sin(Math.PI * t) * 0.9 + width * 0.1;
      bodyShape.lineTo(z, -w);
    }

    const bodyExtrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 0.4,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 3
    };

    const bodyGeom = new THREE.ExtrudeGeometry(bodyShape, bodyExtrudeSettings);
    bodyGeom.rotateX(-Math.PI / 2);
    bodyGeom.translate(0, 0, 0);

    const axialRidgeGeom = new THREE.BoxGeometry(0.3, 0.15, length * 0.9);
    const axialRidge = new THREE.Mesh(axialRidgeGeom);
    axialRidge.position.set(0, 0.3, 0);

    const eyeGeom = new THREE.SphereGeometry(0.12, 16, 16);
    const leftEye = new THREE.Mesh(eyeGeom);
    leftEye.position.set(-0.35, 0.35, 0.5);
    const rightEye = new THREE.Mesh(eyeGeom);
    rightEye.position.set(0.35, 0.35, 0.5);

    group.add(new THREE.Mesh(bodyGeom));
    group.add(axialRidge);
    group.add(leftEye);
    group.add(rightEye);

    for (let i = 0; i < 8; i++) {
      const segGeom = new THREE.BoxGeometry(width * 0.95, 0.05, 0.1);
      const seg = new THREE.Mesh(segGeom);
      const zPos = lerp(0.6, -0.8, i / 7);
      const segWidth = (width / 2) * Math.sin(Math.PI * ((i + 2) / 10)) * 0.9 + width * 0.1;
      seg.scale.x = (segWidth * 2) / width;
      seg.position.set(0, 0.32, zPos);
      group.add(seg);
    }

    return this.mergeGroupGeometry(group);
  }

  private createCephalopodGeometry(): THREE.BufferGeometry {
    const group = new THREE.Group();

    const shellPoints: THREE.Vector2[] = [];
    const length = 2.5;
    const maxRadius = 0.4;

    for (let i = 0; i <= 50; i++) {
      const t = i / 50;
      const radius = maxRadius * Math.pow(t, 0.7);
      const z = lerp(-length / 2, length / 2, t);
      shellPoints.push(new THREE.Vector2(radius, z));
    }

    const shellGeom = new THREE.LatheGeometry(shellPoints, 32);
    const shell = new THREE.Mesh(shellGeom);
    shell.rotateX(Math.PI / 2);
    shell.position.set(0, 0.3, 0);

    for (let i = 1; i < 8; i++) {
      const t = i / 8;
      const zPos = lerp(-length / 2 + 0.2, length / 2 - 0.2, t);
      const radius = maxRadius * Math.pow(t, 0.7) * 0.98;
      const septumGeom = new THREE.CircleGeometry(radius, 32);
      const septum = new THREE.Mesh(septumGeom);
      septum.rotateX(Math.PI / 2);
      septum.position.set(0, 0.3, zPos);
      group.add(septum);
    }

    const siphuncleGeom = new THREE.CylinderGeometry(0.03, 0.03, length * 0.9, 12);
    const siphuncle = new THREE.Mesh(siphuncleGeom);
    siphuncle.rotateX(Math.PI / 2);
    siphuncle.position.set(0, 0.3, 0);

    const tentacleGroup = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const tentacleGeom = new THREE.CylinderGeometry(0.02, 0.01, 0.5, 8);
      const tentacle = new THREE.Mesh(tentacleGeom);
      tentacle.rotateZ(Math.PI / 2 + Math.sin(angle) * 0.3);
      tentacle.position.set(
        Math.cos(angle) * 0.15,
        Math.sin(angle) * 0.15 + 0.3,
        length / 2 + 0.1
      );
      tentacleGroup.add(tentacle);
    }

    group.add(shell);
    group.add(siphuncle);
    group.add(tentacleGroup);

    return this.mergeGroupGeometry(group);
  }

  private createEurypteridGeometry(): THREE.BufferGeometry {
    const group = new THREE.Group();

    const bodyGeom = new THREE.CapsuleGeometry(0.35, 1.5, 8, 16);
    const body = new THREE.Mesh(bodyGeom);
    body.rotateZ(Math.PI / 2);
    body.position.set(0, 0.2, 0);
    body.scale.set(1, 0.7, 1);

    const headGeom = new THREE.SphereGeometry(0.3, 16, 16);
    const head = new THREE.Mesh(headGeom);
    head.position.set(0, 0.3, 0.8);
    head.scale.set(1, 0.7, 1.2);

    const eyeGeom = new THREE.SphereGeometry(0.08, 12, 12);
    const leftEye = new THREE.Mesh(eyeGeom);
    leftEye.position.set(-0.2, 0.4, 0.85);
    const rightEye = new THREE.Mesh(eyeGeom);
    rightEye.position.set(0.2, 0.4, 0.85);

    const clawGeom = new THREE.BoxGeometry(0.15, 0.15, 0.5);
    const leftClaw = new THREE.Mesh(clawGeom);
    leftClaw.position.set(-0.5, 0.2, 1.1);
    leftClaw.rotateY(0.3);
    const rightClaw = new THREE.Mesh(clawGeom);
    rightClaw.position.set(0.5, 0.2, 1.1);
    rightClaw.rotateY(-0.3);

    const clawTipGeom = new THREE.BoxGeometry(0.12, 0.08, 0.3);
    const leftClawTip = new THREE.Mesh(clawTipGeom);
    leftClawTip.position.set(-0.65, 0.25, 1.3);
    leftClawTip.rotateY(0.5);
    const rightClawTip = new THREE.Mesh(clawTipGeom);
    rightClawTip.position.set(0.65, 0.25, 1.3);
    rightClawTip.rotateY(-0.5);

    const paddleGeom = new THREE.BoxGeometry(0.4, 0.05, 0.3);
    const leftPaddle = new THREE.Mesh(paddleGeom);
    leftPaddle.position.set(-0.55, 0.1, -0.3);
    leftPaddle.rotateY(0.5);
    const rightPaddle = new THREE.Mesh(paddleGeom);
    rightPaddle.position.set(0.55, 0.1, -0.3);
    rightPaddle.rotateY(-0.5);

    const tailGeom = new THREE.ConeGeometry(0.12, 0.6, 8);
    const tail = new THREE.Mesh(tailGeom);
    tail.rotateX(Math.PI / 2);
    tail.position.set(0, 0.15, -1.3);

    for (let i = 0; i < 4; i++) {
      const legGeom = new THREE.CylinderGeometry(0.03, 0.02, 0.35, 8);
      const leg = new THREE.Mesh(legGeom);
      const zPos = lerp(0.5, -0.2, i / 3);
      leg.rotateZ(Math.PI / 4);
      leg.position.set(-0.45, 0.05, zPos);
      group.add(leg.clone().translateX(0.9));
      group.add(leg);
    }

    group.add(body);
    group.add(head);
    group.add(leftEye);
    group.add(rightEye);
    group.add(leftClaw);
    group.add(rightClaw);
    group.add(leftClawTip);
    group.add(rightClawTip);
    group.add(leftPaddle);
    group.add(rightPaddle);
    group.add(tail);

    return this.mergeGroupGeometry(group);
  }

  private createPlacodermGeometry(): THREE.BufferGeometry {
    const group = new THREE.Group();

    const bodyGeom = new THREE.CapsuleGeometry(0.4, 1.8, 8, 16);
    const body = new THREE.Mesh(bodyGeom);
    body.rotateZ(Math.PI / 2);
    body.position.set(0, 0.3, 0);
    body.scale.set(1, 0.9, 1);

    const headShieldGeom = new THREE.BoxGeometry(0.9, 0.5, 0.7);
    const headShield = new THREE.Mesh(headShieldGeom);
    headShield.position.set(0, 0.45, 0.55);

    const jawGeom = new THREE.BoxGeometry(0.6, 0.15, 0.4);
    const upperJaw = new THREE.Mesh(jawGeom);
    upperJaw.position.set(0, 0.25, 0.8);
    const lowerJaw = new THREE.Mesh(jawGeom);
    lowerJaw.position.set(0, 0.1, 0.8);

    const eyeGeom = new THREE.SphereGeometry(0.1, 12, 12);
    const leftEye = new THREE.Mesh(eyeGeom);
    leftEye.position.set(-0.3, 0.55, 0.5);
    const rightEye = new THREE.Mesh(eyeGeom);
    rightEye.position.set(0.3, 0.55, 0.5);

    const dorsalSpineGeom = new THREE.ConeGeometry(0.08, 0.4, 8);
    const dorsalSpine = new THREE.Mesh(dorsalSpineGeom);
    dorsalSpine.position.set(0, 0.85, -0.1);

    const pectoralFinGeom = new THREE.BoxGeometry(0.35, 0.05, 0.25);
    const leftPectoral = new THREE.Mesh(pectoralFinGeom);
    leftPectoral.position.set(-0.55, 0.2, 0.3);
    leftPectoral.rotateZ(0.3);
    const rightPectoral = new THREE.Mesh(pectoralFinGeom);
    rightPectoral.position.set(0.55, 0.2, 0.3);
    rightPectoral.rotateZ(-0.3);

    const pelvicFinGeom = new THREE.BoxGeometry(0.25, 0.04, 0.2);
    const leftPelvic = new THREE.Mesh(pelvicFinGeom);
    leftPelvic.position.set(-0.4, 0.15, -0.3);
    const rightPelvic = new THREE.Mesh(pelvicFinGeom);
    rightPelvic.position.set(0.4, 0.15, -0.3);

    const tailGeom = new THREE.ConeGeometry(0.25, 0.7, 8);
    const tail = new THREE.Mesh(tailGeom);
    tail.rotateX(-Math.PI / 2);
    tail.position.set(0, 0.2, -1.2);

    for (let i = 0; i < 5; i++) {
      const plateGeom = new THREE.BoxGeometry(0.85, 0.08, 0.2);
      const plate = new THREE.Mesh(plateGeom);
      const zPos = lerp(0.2, -0.5, i / 4);
      plate.position.set(0, 0.5, zPos);
      group.add(plate);
    }

    group.add(body);
    group.add(headShield);
    group.add(upperJaw);
    group.add(lowerJaw);
    group.add(leftEye);
    group.add(rightEye);
    group.add(dorsalSpine);
    group.add(leftPectoral);
    group.add(rightPectoral);
    group.add(leftPelvic);
    group.add(rightPelvic);
    group.add(tail);

    return this.mergeGroupGeometry(group);
  }

  private createMeganeuraGeometry(): THREE.BufferGeometry {
    const group = new THREE.Group();

    const bodyGeom = new THREE.CapsuleGeometry(0.12, 1.2, 8, 16);
    const body = new THREE.Mesh(bodyGeom);
    body.rotateZ(Math.PI / 2);
    body.position.set(0, 0.25, 0);
    body.scale.set(1, 0.9, 1);

    const headGeom = new THREE.SphereGeometry(0.15, 16, 16);
    const head = new THREE.Mesh(headGeom);
    head.position.set(0, 0.3, 0.6);

    const eyeGeom = new THREE.SphereGeometry(0.08, 12, 12);
    const leftEye = new THREE.Mesh(eyeGeom);
    leftEye.position.set(-0.1, 0.35, 0.68);
    const rightEye = new THREE.Mesh(eyeGeom);
    rightEye.position.set(0.1, 0.35, 0.68);

    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.quadraticCurveTo(0.5, 0.3, 1, 0.1);
    wingShape.quadraticCurveTo(0.8, -0.2, 0, 0);

    const wingExtrude: THREE.ExtrudeGeometryOptions = {
      depth: 0.01,
      bevelEnabled: false
    };

    const forewingGeom = new THREE.ExtrudeGeometry(wingShape, wingExtrude);
    forewingGeom.rotateX(-Math.PI / 2);

    const leftForewing = new THREE.Mesh(forewingGeom);
    leftForewing.position.set(-0.1, 0.3, 0.2);
    leftForewing.rotateZ(0.2);
    leftForewing.scale.set(1.1, 1, 1.1);

    const rightForewing = new THREE.Mesh(forewingGeom);
    rightForewing.position.set(0.1, 0.3, 0.2);
    rightForewing.rotateZ(-0.2);
    rightForewing.scale.set(-1.1, 1, 1.1);

    const hindwingGeom = new THREE.ExtrudeGeometry(wingShape, wingExtrude);
    hindwingGeom.rotateX(-Math.PI / 2);

    const leftHindwing = new THREE.Mesh(hindwingGeom);
    leftHindwing.position.set(-0.1, 0.28, -0.1);
    leftHindwing.rotateZ(0.15);
    leftHindwing.scale.set(1.2, 1, 1.2);

    const rightHindwing = new THREE.Mesh(hindwingGeom);
    rightHindwing.position.set(0.1, 0.28, -0.1);
    rightHindwing.rotateZ(-0.15);
    rightHindwing.scale.set(-1.2, 1, 1.2);

    const wingMaterial = new THREE.MeshStandardMaterial({
      color: 0x6b8e6b,
      roughness: 0.9,
      metalness: 0,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    leftForewing.material = wingMaterial;
    rightForewing.material = wingMaterial;
    leftHindwing.material = wingMaterial;
    rightHindwing.material = wingMaterial;

    for (let i = 0; i < 3; i++) {
      const legGeom = new THREE.CylinderGeometry(0.02, 0.015, 0.35, 8);
      const leg = new THREE.Mesh(legGeom);
      const zPos = lerp(0.4, 0, i / 2);
      leg.rotateZ(Math.PI / 3);
      leg.position.set(-0.15, 0.1, zPos);
      group.add(leg.clone().translateX(0.3));
      group.add(leg);
    }

    const abdomenGeom = new THREE.CylinderGeometry(0.08, 0.05, 0.7, 12);
    const abdomen = new THREE.Mesh(abdomenGeom);
    abdomen.rotateZ(Math.PI / 2);
    abdomen.position.set(0, 0.22, -0.55);

    group.add(body);
    group.add(head);
    group.add(leftEye);
    group.add(rightEye);
    group.add(leftForewing);
    group.add(rightForewing);
    group.add(leftHindwing);
    group.add(rightHindwing);
    group.add(abdomen);

    return this.mergeGroupGeometry(group);
  }

  private createDimetrodonGeometry(): THREE.BufferGeometry {
    const group = new THREE.Group();

    const bodyGeom = new THREE.CapsuleGeometry(0.35, 1.6, 8, 16);
    const body = new THREE.Mesh(bodyGeom);
    body.rotateZ(Math.PI / 2);
    body.position.set(0, 0.4, 0);
    body.scale.set(1, 1, 1);

    const skullGeom = new THREE.BoxGeometry(0.3, 0.35, 0.6);
    const skull = new THREE.Mesh(skullGeom);
    skull.position.set(0, 0.5, 1.1);
    skull.scale.set(0.9, 1, 1.2);

    const snoutGeom = new THREE.BoxGeometry(0.25, 0.2, 0.4);
    const snout = new THREE.Mesh(snoutGeom);
    snout.position.set(0, 0.4, 1.4);

    const jawGeom = new THREE.BoxGeometry(0.22, 0.12, 0.35);
    const lowerJaw = new THREE.Mesh(jawGeom);
    lowerJaw.position.set(0, 0.25, 1.4);

    const eyeGeom = new THREE.SphereGeometry(0.06, 12, 12);
    const leftEye = new THREE.Mesh(eyeGeom);
    leftEye.position.set(-0.12, 0.58, 1.15);
    const rightEye = new THREE.Mesh(eyeGeom);
    rightEye.position.set(0.12, 0.58, 1.15);

    const sailPoints: THREE.Vector2[] = [];
    const sailHeight = 0.7;
    const sailLength = 1.4;

    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const z = lerp(0.8, -0.6, t);
      const h = sailHeight * Math.sin(Math.PI * t);
      sailPoints.push(new THREE.Vector2(z, h + 0.5));
    }
    for (let i = 20; i >= 0; i--) {
      const t = i / 20;
      const z = lerp(0.8, -0.6, t);
      sailPoints.push(new THREE.Vector2(z, 0.55));
    }

    const sailShape = new THREE.Shape(sailPoints);
    const sailGeom = new THREE.ExtrudeGeometry(sailShape, {
      depth: 0.05,
      bevelEnabled: false
    });
    sailGeom.translate(0, 0, -0.025);

    const sailMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    const sail = new THREE.Mesh(sailGeom, sailMaterial);
    sail.position.set(0, 0, 0);

    for (let i = 0; i < 8; i++) {
      const t = i / 7;
      const z = lerp(0.7, -0.5, t);
      const h = sailHeight * Math.sin(Math.PI * t);
      const spineGeom = new THREE.CylinderGeometry(0.015, 0.025, h, 6);
      const spine = new THREE.Mesh(spineGeom);
      spine.position.set(0, 0.55 + h / 2, z);
      group.add(spine);
    }

    const limbGeom = new THREE.CylinderGeometry(0.06, 0.05, 0.5, 8);

    const frontLeft = new THREE.Mesh(limbGeom);
    frontLeft.position.set(-0.3, 0.1, 0.6);
    frontLeft.rotateZ(0.15);

    const frontRight = new THREE.Mesh(limbGeom);
    frontRight.position.set(0.3, 0.1, 0.6);
    frontRight.rotateZ(-0.15);

    const backLeft = new THREE.Mesh(limbGeom);
    backLeft.position.set(-0.3, 0.1, -0.3);
    backLeft.rotateZ(0.1);

    const backRight = new THREE.Mesh(limbGeom);
    backRight.position.set(0.3, 0.1, -0.3);
    backRight.rotateZ(-0.1);

    const tailGeom = new THREE.ConeGeometry(0.12, 0.8, 8);
    const tail = new THREE.Mesh(tailGeom);
    tail.rotateX(Math.PI / 2);
    tail.position.set(0, 0.35, -1.2);

    const neckGeom = new THREE.BoxGeometry(0.25, 0.25, 0.3);
    const neck = new THREE.Mesh(neckGeom);
    neck.position.set(0, 0.5, 0.85);

    group.add(body);
    group.add(skull);
    group.add(snout);
    group.add(lowerJaw);
    group.add(leftEye);
    group.add(rightEye);
    group.add(sail);
    group.add(frontLeft);
    group.add(frontRight);
    group.add(backLeft);
    group.add(backRight);
    group.add(tail);
    group.add(neck);

    return this.mergeGroupGeometry(group);
  }

  private mergeGroupGeometry(group: THREE.Group): THREE.BufferGeometry {
    const geometries: THREE.BufferGeometry[] = [];

    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.updateMatrixWorld(true);
        const clonedGeom = child.geometry.clone();
        clonedGeom.applyMatrix4(child.matrixWorld);
        geometries.push(clonedGeom);
      }
    });

    if (geometries.length === 0) {
      return new THREE.BufferGeometry();
    }

    if (geometries.length === 1) {
      return geometries[0];
    }

    return this.mergeGeometries(geometries);
  }

  private mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
    const merged = new THREE.BufferGeometry();
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    let indexOffset = 0;

    for (const geom of geometries) {
      const posAttr = geom.getAttribute('position');
      if (!posAttr) continue;

      const normalAttr = geom.getAttribute('normal');
      const uvAttr = geom.getAttribute('uv');
      const indexAttr = geom.index;

      if (indexAttr) {
        for (let i = 0; i < indexAttr.count; i++) {
          indices.push(indexAttr.getX(i) + indexOffset);
        }
      } else {
        for (let i = 0; i < posAttr.count; i++) {
          indices.push(i + indexOffset);
        }
      }

      for (let i = 0; i < posAttr.count; i++) {
        positions.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
        if (normalAttr) {
          normals.push(normalAttr.getX(i), normalAttr.getY(i), normalAttr.getZ(i));
        }
        if (uvAttr) {
          uvs.push(uvAttr.getX(i), uvAttr.getY(i));
        }
      }

      indexOffset += posAttr.count;
    }

    merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    if (normals.length > 0) {
      merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    }
    if (uvs.length > 0) {
      merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    }
    merged.setIndex(indices);
    merged.computeBoundingSphere();

    return merged;
  }

  private async animateExit(): Promise<void> {
    if (!this.currentModel) return;

    this.animationState = 'exiting';
    this.animationProgress = 0;
    this.exitStartScale = this.currentModel.scale.x;
    this.exitStartRotation = this.currentModel.rotation.y;

    return new Promise((resolve) => {
      const duration = 600;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutQuad(progress);

        if (this.currentModel) {
          this.currentModel.scale.setScalar(lerp(this.exitStartScale, 0, eased));
          this.currentModel.rotation.y = this.exitStartRotation + Math.PI * 2 * eased;
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  private async animateEnter(model: THREE.Group): Promise<void> {
    this.animationState = 'entering';
    model.scale.setScalar(0.2);
    model.position.z = -3;
    model.rotation.y = 0;

    return new Promise((resolve) => {
      const duration = 800;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutCubic(progress);

        model.scale.setScalar(lerp(0.2, 1, eased));
        model.position.z = lerp(-3, 0, eased);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  private removeCurrentModel(): void {
    if (this.currentModel) {
      this.scene.remove(this.currentModel);
      disposeObject3D(this.currentModel);
      this.dispatcher.dispatch('modelRemoved', void 0);
    }
    this.currentModel = null;
    this.currentPeriodId = null;
    this.currentData = null;
  }

  setCutPlaneEnabled(enabled: boolean): void {
    this.cutPlaneEnabled = enabled;

    if (enabled) {
      if (!this.cutPlane) {
        this.cutPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      }
      this.applyClippingPlanes();
      this.createCutPlaneVisual();
    } else {
      this.removeClippingPlanes();
      this.removeCutPlaneVisual();
    }
  }

  setCutPlanePosition(position: number): void {
    this.cutPosition = position;

    if (this.cutPlane && this.currentModel) {
      const zRange = this.modelBounds.maxZ - this.modelBounds.minZ;
      const zPos = lerp(this.modelBounds.maxZ, this.modelBounds.minZ, position / 100);
      this.cutPlane.constant = -zPos;

      this.updateCutPlaneVisual();
    }
  }

  private applyClippingPlanes(): void {
    if (!this.cutPlane || !this.currentModel) return;

    this.currentModel.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => {
            mat.clippingPlanes = [this.cutPlane!];
            mat.needsUpdate = true;
          });
        } else {
          child.material.clippingPlanes = [this.cutPlane];
          child.material.needsUpdate = true;
        }
      }
    });
  }

  private removeClippingPlanes(): void {
    if (!this.currentModel) return;

    this.currentModel.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => {
            mat.clippingPlanes = [];
            mat.needsUpdate = true;
          });
        } else {
          child.material.clippingPlanes = [];
          child.material.needsUpdate = true;
        }
      }
    });
  }

  private createCutPlaneVisual(): void {
    if (this.cutPlaneMesh || !this.currentModel) return;

    const box = new THREE.Box3().setFromObject(this.currentModel);
    const size = box.getSize(new THREE.Vector3());

    const planeGeom = new THREE.PlaneGeometry(size.x * 1.5, size.y * 1.5, 1, 1);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0xff4444,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.cutPlaneMesh = new THREE.Mesh(planeGeom, planeMat);
    this.cutPlaneMesh.rotation.x = -Math.PI / 2;
    this.scene.add(this.cutPlaneMesh);

    this.updateCutPlaneVisual();
  }

  private updateCutPlaneVisual(): void {
    if (!this.cutPlaneMesh || !this.currentModel || !this.cutPlane) return;

    const zPos = -this.cutPlane.constant;
    this.cutPlaneMesh.position.set(0, 0.3, zPos);
  }

  private removeCutPlaneVisual(): void {
    if (this.cutPlaneMesh) {
      const mesh = this.cutPlaneMesh;
      const startTime = performance.now();
      const duration = 300;

      const fadeOut = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        if (mesh.material instanceof THREE.MeshBasicMaterial) {
          mesh.material.opacity = 0.25 * (1 - progress);
        }

        if (progress < 1) {
          requestAnimationFrame(fadeOut);
        } else {
          this.scene.remove(mesh);
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m) => m.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        }
      };

      requestAnimationFrame(fadeOut);
      this.cutPlaneMesh = null;
    }
  }

  onModelReady(callback: (data: { model: THREE.Group; data: FossilModelData }) => void): () => void {
    return this.dispatcher.on('modelReady', callback);
  }

  onModelRemoved(callback: () => void): () => void {
    return this.dispatcher.on('modelRemoved', callback);
  }

  onLoadingStart(callback: () => void): () => void {
    return this.dispatcher.on('loadingStart', callback);
  }

  onLoadingEnd(callback: () => void): () => void {
    return this.dispatcher.on('loadingEnd', callback);
  }

  onInfoUpdate(callback: (info: FossilInfo) => void): () => void {
    return this.dispatcher.on('infoUpdate', callback);
  }

  getCurrentModel(): THREE.Group | null {
    return this.currentModel;
  }

  getCurrentPeriod(): GeologicalPeriod | undefined {
    if (!this.currentPeriodId) return undefined;
    return GEOLOGICAL_PERIODS.find((p) => p.id === this.currentPeriodId);
  }

  getCurrentData(): FossilModelData | null {
    return this.currentData;
  }

  isCutPlaneEnabled(): boolean {
    return this.cutPlaneEnabled;
  }

  dispose(): void {
    this.removeCurrentModel();
    this.removeCutPlaneVisual();
    this.cutPlane = null;
  }
}
