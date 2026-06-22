import * as THREE from 'three';

export type BaseType = 'A' | 'T' | 'G' | 'C';

export interface BasePairData {
  left: BaseType;
  right: BaseType;
  layer: number;
  index: number;
}

export interface BasePairMeshInfo {
  group: THREE.Group;
  data: BasePairData;
  highlightMeshes: THREE.Mesh[];
  originalMaterials: THREE.Material[];
  clickTargets: THREE.Object3D[];
}

const BASE_COLORS: Record<BaseType, number> = {
  A: 0xFF5252,
  T: 0xFFD740,
  G: 0x69F0AE,
  C: 0x40C4FF,
};

const BASE_NAMES: Record<BaseType, string> = {
  A: '腺嘌呤 (Adenine)',
  T: '胸腺嘧啶 (Thymine)',
  G: '鸟嘌呤 (Guanine)',
  C: '胞嘧啶 (Cytosine)',
};

const HELIX_RADIUS = 3.2;
const TOTAL_BASE_PAIRS = 20;
const BASE_PAIRS_PER_TURN = 10;
const ANGLE_PER_PAIR = (Math.PI * 2) / BASE_PAIRS_PER_TURN;
const HEIGHT_PER_PAIR = 0.9;
const BACKBONE_SPHERE_RADIUS = 0.28;
const BACKBONE_CYLINDER_RADIUS = 0.14;
const BASE_BOX_WIDTH = 0.6;
const BASE_BOX_HEIGHT = 0.35;
const BASE_BOX_DEPTH = 0.35;
const CONNECTOR_RADIUS = 0.08;
const BACKBONE_START_COLOR = new THREE.Color(0x4FC3F7);
const BACKBONE_END_COLOR = new THREE.Color(0xE040FB);

function getRandomBase(): BaseType {
  const bases: BaseType[] = ['A', 'T', 'G', 'C'];
  return bases[Math.floor(Math.random() * bases.length)];
}

function getComplementaryBase(base: BaseType): BaseType {
  switch (base) {
    case 'A': return 'T';
    case 'T': return 'A';
    case 'G': return 'C';
    case 'C': return 'G';
  }
}

function lerpColor(color1: THREE.Color, color2: THREE.Color, t: number): THREE.Color {
  return new THREE.Color(
    color1.r + (color2.r - color1.r) * t,
    color1.g + (color2.g - color1.g) * t,
    color1.b + (color2.b - color1.b) * t
  );
}

export class DNAHelix {
  public group: THREE.Group;
  public basePairs: BasePairMeshInfo[] = [];
  public dnaGroup: THREE.Group;
  private totalHeight: number = 0;

  constructor() {
    this.group = new THREE.Group();
    this.dnaGroup = new THREE.Group();
    this.group.add(this.dnaGroup);

    this.totalHeight = (TOTAL_BASE_PAIRS - 1) * HEIGHT_PER_PAIR;
    
    this.buildBackbone();
    this.buildBasePairs();
    
    this.dnaGroup.position.y = -this.totalHeight / 2;
  }

  private buildBackbone(): void {
    const sphereGeometry = new THREE.SphereGeometry(BACKBONE_SPHERE_RADIUS, 24, 24);
    const cylinderGeometry = new THREE.CylinderGeometry(
      BACKBONE_CYLINDER_RADIUS, BACKBONE_CYLINDER_RADIUS, HEIGHT_PER_PAIR, 16
    );

    for (let strand = 0; strand < 2; strand++) {
      const angleOffset = strand * Math.PI;
      
      for (let i = 0; i < TOTAL_BASE_PAIRS; i++) {
        const t = i / (TOTAL_BASE_PAIRS - 1);
        const color = lerpColor(BACKBONE_START_COLOR, BACKBONE_END_COLOR, t);
        const material = new THREE.MeshStandardMaterial({
          color: color,
          transparent: true,
          opacity: 0.75,
          metalness: 0.3,
          roughness: 0.4,
          emissive: color,
          emissiveIntensity: 0.15,
        });

        const angle = i * ANGLE_PER_PAIR + angleOffset;
        const x = Math.cos(angle) * HELIX_RADIUS;
        const z = Math.sin(angle) * HELIX_RADIUS;
        const y = i * HEIGHT_PER_PAIR;

        const sphere = new THREE.Mesh(sphereGeometry, material);
        sphere.position.set(x, y, z);
        this.dnaGroup.add(sphere);

        if (i < TOTAL_BASE_PAIRS - 1) {
          const nextT = (i + 1) / (TOTAL_BASE_PAIRS - 1);
          const nextColor = lerpColor(BACKBONE_START_COLOR, BACKBONE_END_COLOR, nextT);
          const midT = (t + nextT) / 2;
          const midColor = lerpColor(BACKBONE_START_COLOR, BACKBONE_END_COLOR, midT);
          
          const cylMaterial = new THREE.MeshStandardMaterial({
            color: midColor,
            transparent: true,
            opacity: 0.65,
            metalness: 0.3,
            roughness: 0.4,
            emissive: midColor,
            emissiveIntensity: 0.1,
          });

          const nextAngle = (i + 1) * ANGLE_PER_PAIR + angleOffset;
          const nextX = Math.cos(nextAngle) * HELIX_RADIUS;
          const nextZ = Math.sin(nextAngle) * HELIX_RADIUS;
          const nextY = (i + 1) * HEIGHT_PER_PAIR;

          const start = new THREE.Vector3(x, y, z);
          const end = new THREE.Vector3(nextX, nextY, nextZ);
          const direction = new THREE.Vector3().subVectors(end, start);
          const length = direction.length();
          const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

          const cylGeo = new THREE.CylinderGeometry(
            BACKBONE_CYLINDER_RADIUS, BACKBONE_CYLINDER_RADIUS, length, 16
          );
          const cylinder = new THREE.Mesh(cylGeo, cylMaterial);
          cylinder.position.copy(mid);
          cylinder.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            direction.normalize()
          );
          this.dnaGroup.add(cylinder);
        }
      }
    }
  }

  private buildBasePairs(): void {
    for (let i = 0; i < TOTAL_BASE_PAIRS; i++) {
      const leftBase = getRandomBase();
      const rightBase = getComplementaryBase(leftBase);
      const layer = Math.floor(i / BASE_PAIRS_PER_TURN) + 1;

      const data: BasePairData = {
        left: leftBase,
        right: rightBase,
        layer: layer,
        index: i,
      };

      const basePairGroup = new THREE.Group();
      const angle = i * ANGLE_PER_PAIR;
      const y = i * HEIGHT_PER_PAIR;

      const leftX = Math.cos(angle) * HELIX_RADIUS;
      const leftZ = Math.sin(angle) * HELIX_RADIUS;
      const rightX = Math.cos(angle + Math.PI) * HELIX_RADIUS;
      const rightZ = Math.sin(angle + Math.PI) * HELIX_RADIUS;

      const highlightMeshes: THREE.Mesh[] = [];
      const originalMaterials: THREE.Material[] = [];
      const clickTargets: THREE.Object3D[] = [];

      const leftBoxGeo = new THREE.BoxGeometry(BASE_BOX_WIDTH, BASE_BOX_HEIGHT, BASE_BOX_DEPTH);
      const leftMat = new THREE.MeshStandardMaterial({
        color: BASE_COLORS[leftBase],
        metalness: 0.2,
        roughness: 0.5,
        emissive: BASE_COLORS[leftBase],
        emissiveIntensity: 0.2,
      });
      const leftBox = new THREE.Mesh(leftBoxGeo, leftMat);
      leftBox.position.set(
        (leftX + rightX) / 2 - BASE_BOX_WIDTH * 0.6,
        y,
        (leftZ + rightZ) / 2
      );
      leftBox.rotation.y = angle;
      basePairGroup.add(leftBox);
      highlightMeshes.push(leftBox);
      originalMaterials.push(leftMat);
      clickTargets.push(leftBox);

      const rightBoxGeo = new THREE.BoxGeometry(BASE_BOX_WIDTH, BASE_BOX_HEIGHT, BASE_BOX_DEPTH);
      const rightMat = new THREE.MeshStandardMaterial({
        color: BASE_COLORS[rightBase],
        metalness: 0.2,
        roughness: 0.5,
        emissive: BASE_COLORS[rightBase],
        emissiveIntensity: 0.2,
      });
      const rightBox = new THREE.Mesh(rightBoxGeo, rightMat);
      rightBox.position.set(
        (leftX + rightX) / 2 + BASE_BOX_WIDTH * 0.6,
        y,
        (leftZ + rightZ) / 2
      );
      rightBox.rotation.y = angle;
      basePairGroup.add(rightBox);
      highlightMeshes.push(rightBox);
      originalMaterials.push(rightMat);
      clickTargets.push(rightBox);

      const connectorStart = new THREE.Vector3(
        (leftX + rightX) / 2 - BASE_BOX_WIDTH * 0.3,
        y,
        (leftZ + rightZ) / 2
      );
      const connectorEnd = new THREE.Vector3(
        (leftX + rightX) / 2 + BASE_BOX_WIDTH * 0.3,
        y,
        (leftZ + rightZ) / 2
      );
      const connectorDir = new THREE.Vector3().subVectors(connectorEnd, connectorStart);
      const connectorLen = connectorDir.length();
      
      const connectorColor1 = new THREE.Color(BASE_COLORS[leftBase]);
      const connectorColor2 = new THREE.Color(BASE_COLORS[rightBase]);
      
      for (let seg = 0; seg < 5; seg++) {
        const segT = seg / 5;
        const segColor = lerpColor(connectorColor1, connectorColor2, segT + 0.1);
        const connectorMat = new THREE.MeshStandardMaterial({
          color: segColor,
          transparent: true,
          opacity: 0.7,
          metalness: 0.4,
          roughness: 0.3,
          emissive: segColor,
          emissiveIntensity: 0.15,
        });
        
        const segStart = new THREE.Vector3().lerpVectors(connectorStart, connectorEnd, segT);
        const segEnd = new THREE.Vector3().lerpVectors(connectorStart, connectorEnd, segT + 0.22);
        const segMid = new THREE.Vector3().addVectors(segStart, segEnd).multiplyScalar(0.5);
        const segLength = segEnd.distanceTo(segStart);
        
        const connectorGeo = new THREE.CylinderGeometry(CONNECTOR_RADIUS, CONNECTOR_RADIUS, segLength, 8);
        const connector = new THREE.Mesh(connectorGeo, connectorMat);
        connector.position.copy(segMid);
        connector.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3().subVectors(segEnd, segStart).normalize()
        );
        basePairGroup.add(connector);
      }

      this.dnaGroup.add(basePairGroup);

      this.basePairs.push({
        group: basePairGroup,
        data: data,
        highlightMeshes: highlightMeshes,
        originalMaterials: originalMaterials,
        clickTargets: clickTargets,
      });
    }
  }

  public highlight(index: number): void {
    this.clearAllHighlights();
    const bp = this.basePairs[index];
    if (!bp) return;

    bp.highlightMeshes.forEach((mesh) => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.emissive.set(0xFFD700);
      mat.emissiveIntensity = 0.5;
    });
  }

  public clearAllHighlights(): void {
    this.basePairs.forEach((bp) => {
      bp.highlightMeshes.forEach((mesh, idx) => {
        const origMat = bp.originalMaterials[idx] as THREE.MeshStandardMaterial;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.emissive.copy(origMat.emissive);
        mat.emissiveIntensity = 0.2;
      });
    });
  }

  public getLabelText(index: number): { title: string; detail: string } {
    const bp = this.basePairs[index];
    if (!bp) return { title: '', detail: '' };
    
    const posInLayer = (bp.data.index % BASE_PAIRS_PER_TURN) + 1;
    return {
      title: `${bp.data.left}-${bp.data.right} 碱基对`,
      detail: `位置: 第${bp.data.layer}层 · 第${posInLayer}位\n${BASE_NAMES[bp.data.left]} ↔ ${BASE_NAMES[bp.data.right]}`,
    };
  }

  public getAllClickTargets(): Map<THREE.Object3D, number> {
    const map = new Map<THREE.Object3D, number>();
    this.basePairs.forEach((bp, idx) => {
      bp.clickTargets.forEach((obj) => {
        map.set(obj, idx);
      });
    });
    return map;
  }

  public getBasePairWorldPosition(index: number): THREE.Vector3 {
    const bp = this.basePairs[index];
    if (!bp) return new THREE.Vector3();
    const pos = new THREE.Vector3();
    bp.group.getWorldPosition(pos);
    pos.y += BASE_BOX_HEIGHT;
    return pos;
  }

  public getPairCount(): number {
    return this.basePairs.length;
  }
}
