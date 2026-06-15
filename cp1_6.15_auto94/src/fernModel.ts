import * as THREE from 'three';
import type { PlantConfig, StageMorphology, FrondShapeType } from './types.js';

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function lerpColor(a: THREE.Color, b: THREE.Color, t: number): THREE.Color {
  const result = a.clone();
  result.lerp(b, t);
  return result;
}

function hexToColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

interface FrondData {
  group: THREE.Group;
  baseScale: number;
  baseColor: THREE.Color;
  leaflets: { mesh: THREE.Mesh; basePositions: Float32Array }[];
  sporangia: THREE.Mesh[];
}

export class FernModel extends THREE.Group {
  plantConfig: PlantConfig;
  currentMorphology: StageMorphology;
  targetMorphology: StageMorphology;
  animationProgress: number;
  stemMesh: THREE.Mesh | null;
  fronds: FrondData[];
  sporangia: THREE.Mesh[];
  private transitionIn: boolean;
  private transitionProgress: number;

  constructor(config: PlantConfig) {
    super();
    this.plantConfig = config;
    this.currentMorphology = {
      stemScale: 0.2,
      frondUnfurl: 0.1,
      frondScale: 0.2,
      colorBlend: config.colors.sprout,
      hasSporangia: false,
      sporangiaDensity: 0
    };
    this.targetMorphology = { ...this.currentMorphology };
    this.animationProgress = 1;
    this.stemMesh = null;
    this.fronds = [];
    this.sporangia = [];
    this.transitionIn = false;
    this.transitionProgress = 1;

    this.build();
    this.applyMorphology(this.currentMorphology, 1);
  }

  private build(): void {
    this.clearChildren();
    this.buildStem();
    this.buildFronds();
  }

  private clearChildren(): void {
    while (this.children.length > 0) {
      const child = this.children[0];
      this.remove(child);
      if ((child as THREE.Mesh).geometry) {
        (child as THREE.Mesh).geometry.dispose();
      }
      const mat = (child as THREE.Mesh).material as THREE.Material | THREE.Material[];
      if (mat) {
        if (Array.isArray(mat)) {
          mat.forEach(m => m.dispose());
        } else {
          mat.dispose();
        }
      }
    }
    this.fronds = [];
    this.sporangia = [];
    this.stemMesh = null;
  }

  buildStem(): void {
    const { stem, colors } = this.plantConfig;
    const geometry = new THREE.CylinderGeometry(
      stem.thickness * 0.4,
      stem.thickness * 0.7,
      stem.height,
      8,
      1,
      false
    );

    const positions = geometry.attributes.position;
    const colorsAttr = new Float32Array(positions.count * 3);
    const baseColor = hexToColor(colors.mature);
    const rootColor = new THREE.Color(0x5D4037);

    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      const normalizedY = (y + stem.height / 2) / stem.height;
      const c = lerpColor(rootColor, baseColor, normalizedY);
      colorsAttr[i * 3] = c.r;
      colorsAttr[i * 3 + 1] = c.g;
      colorsAttr[i * 3 + 2] = c.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colorsAttr, 3));

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.05
    });

    this.stemMesh = new THREE.Mesh(geometry, material);
    this.stemMesh.castShadow = true;
    this.stemMesh.receiveShadow = true;
    this.stemMesh.position.y = stem.height / 2;
    this.add(this.stemMesh);
  }

  private createLeafletShape(width: number, length: number, tip: number = 0.6): THREE.Shape {
    const shape = new THREE.Shape();
    const w = width / 2;
    const segments = 12;

    shape.moveTo(0, 0);

    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const x = w * Math.sin(Math.PI * t) * (1 - tip * t * t);
      const y = length * t;
      shape.lineTo(-x, y);
    }

    for (let i = segments - 1; i >= 0; i--) {
      const t = i / segments;
      const x = w * Math.sin(Math.PI * t) * (1 - tip * t * t);
      const y = length * t;
      shape.lineTo(x, y);
    }

    return shape;
  }

  private createLeafletGeometry(
    width: number,
    length: number,
    curvature: number,
    segmentation: number
  ): THREE.BufferGeometry {
    const shape = this.createLeafletShape(width, length);
    const extrudeSettings = {
      depth: 0.015,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.01,
      bevelSegments: 1,
      curveSegments: Math.max(6, Math.floor(segmentation))
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, 0, length / 2);

    if (curvature !== 0) {
      const positions = geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const z = positions.getZ(i);
        const t = Math.max(0, Math.min(1, z / length));
        const bendAngle = curvature * t * Math.PI * 0.15;
        const newX = Math.sin(bendAngle) * z;
        const newZ = Math.cos(bendAngle) * z;
        positions.setX(i, newX);
        positions.setZ(i, newZ);
      }
      positions.needsUpdate = true;
      geometry.computeVertexNormals();
    }

    return geometry;
  }

  private applyCurlToLeaflet(mesh: THREE.Mesh, unfurl: number, length: number): void {
    const geometry = mesh.geometry;
    const positions = geometry.attributes.position;
    const baseAttr = geometry.getAttribute('basePosition') as THREE.BufferAttribute;
    if (!baseAttr) return;

    const curlT = 1 - unfurl;

    for (let i = 0; i < positions.count; i++) {
      const bx = baseAttr.getX(i);
      const by = baseAttr.getY(i);
      const bz = baseAttr.getZ(i);

      const zNorm = Math.max(0, Math.min(1, bz / length));
      const curlAngle = curlT * zNorm * Math.PI * 2.2;

      const cos = Math.cos(curlAngle);
      const sin = Math.sin(curlAngle);

      positions.setX(i, bx * cos - bz * sin * 0.6);
      positions.setY(i, by + sin * length * 0.25);
      positions.setZ(i, bx * sin * 0.6 + bz * cos);
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  buildFronds(): void {
    const { frondShape, stem, colors } = this.plantConfig;
    const baseColor = hexToColor(colors.mature);

    const frondCount = this.getFrondCountForShape(frondShape.type);
    const radialSpread = Math.PI * 2 / frondCount;

    for (let f = 0; f < frondCount; f++) {
      const frondGroup = new THREE.Group();
      const leaflets: { mesh: THREE.Mesh; basePositions: Float32Array }[] = [];
      const sporangia: THREE.Mesh[] = [];

      const angle = f * radialSpread + (f % 2) * (radialSpread * 0.3);
      const heightRatio = 0.5 + (f / frondCount) * 0.4;
      const yPos = stem.height * heightRatio;

      const tiltAngle = stem.branchingAngle * (0.7 + Math.random() * 0.6);
      const scaleVar = 0.85 + Math.random() * 0.3;

      frondGroup.rotation.y = angle;
      frondGroup.position.y = yPos;
      frondGroup.position.x = Math.sin(angle) * stem.thickness * 0.6;
      frondGroup.position.z = Math.cos(angle) * stem.thickness * 0.6;

      this.buildFrondByType(frondShape.type, frondShape, leaflets, baseColor, scaleVar);

      frondGroup.rotateX(-tiltAngle);

      this.fronds.push({
        group: frondGroup,
        baseScale: scaleVar,
        baseColor: baseColor.clone(),
        leaflets,
        sporangia
      });

      frondGroup.traverse(obj => {
        if ((obj as THREE.Mesh).isMesh) {
          (obj as THREE.Mesh).castShadow = true;
          (obj as THREE.Mesh).receiveShadow = true;
        }
      });

      this.add(frondGroup);
    }
  }

  private getFrondCountForShape(type: FrondShapeType): number {
    switch (type) {
      case 'dichotomous': return 5;
      case 'palmate': return 6;
      case 'pinnate': return 7;
      case 'bipinnate': return 6;
      default: return 6;
    }
  }

  private buildFrondByType(
    type: FrondShapeType,
    shape: { length: number; width: number; curvature: number; segmentation: number },
    leaflets: { mesh: THREE.Mesh; basePositions: Float32Array }[],
    color: THREE.Color,
    scaleVar: number
  ): void {
    switch (type) {
      case 'dichotomous':
        this.buildDichotomousFrond(shape, leaflets, color, scaleVar);
        break;
      case 'pinnate':
        this.buildPinnateFrond(shape, leaflets, color, scaleVar);
        break;
      case 'bipinnate':
        this.buildBipinnateFrond(shape, leaflets, color, scaleVar);
        break;
      case 'palmate':
        this.buildPalmateFrond(shape, leaflets, color, scaleVar);
        break;
    }
  }

  private createLeafletMesh(
    width: number,
    length: number,
    curvature: number,
    segmentation: number,
    color: THREE.Color
  ): { mesh: THREE.Mesh; basePositions: Float32Array } {
    const geometry = this.createLeafletGeometry(width, length, curvature, segmentation);
    const positions = geometry.attributes.position;
    const baseArr = new Float32Array(positions.count * 3);
    for (let i = 0; i < positions.count; i++) {
      baseArr[i * 3] = positions.getX(i);
      baseArr[i * 3 + 1] = positions.getY(i);
      baseArr[i * 3 + 2] = positions.getZ(i);
    }
    geometry.setAttribute('basePosition', new THREE.BufferAttribute(baseArr, 3));

    const material = new THREE.MeshStandardMaterial({
      color: color.clone(),
      roughness: 0.7,
      metalness: 0.02,
      side: THREE.DoubleSide,
      vertexColors: false
    });

    const mesh = new THREE.Mesh(geometry, material);
    this.applyCurlToLeaflet(mesh, 0.1, length);

    return { mesh, basePositions: baseArr };
  }

  private buildDichotomousFrond(
    shape: { length: number; width: number; curvature: number; segmentation: number },
    leaflets: { mesh: THREE.Mesh; basePositions: Float32Array }[],
    color: THREE.Color,
    _scaleVar: number
  ): void {
    const levels = 3;
    const buildLevel = (
      parent: THREE.Object3D,
      level: number,
      currentLength: number,
      currentWidth: number,
      angleOffset: number
    ) => {
      if (level > levels) return;

      const { mesh, basePositions } = this.createLeafletMesh(
        currentWidth,
        currentLength,
        shape.curvature,
        shape.segmentation,
        color
      );
      mesh.rotation.z = angleOffset;
      parent.add(mesh);
      leaflets.push({ mesh, basePositions });

      if (level < levels) {
        const childLen = currentLength * 0.55;
        const childW = currentWidth * 0.55;
        const branchAngle = 0.45;

        const leftGroup = new THREE.Group();
        leftGroup.position.y = currentLength * 0.6;
        leftGroup.rotation.z = -branchAngle;
        mesh.add(leftGroup);
        buildLevel(leftGroup, level + 1, childLen, childW, 0);

        const rightGroup = new THREE.Group();
        rightGroup.position.y = currentLength * 0.6;
        rightGroup.rotation.z = branchAngle;
        mesh.add(rightGroup);
        buildLevel(rightGroup, level + 1, childLen, childW, 0);
      }
    };

    const root = new THREE.Group();
    this.add(root);
    const mainGroup = this.fronds[this.fronds.length - 1].group;
    while (root.children.length > 0) {
      const c = root.children[0];
      root.remove(c);
      mainGroup.add(c);
    }
    buildLevel(mainGroup, 0, shape.length * 0.7, shape.width * 0.6, 0);
  }

  private buildPinnateFrond(
    shape: { length: number; width: number; curvature: number; segmentation: number },
    leaflets: { mesh: THREE.Mesh; basePositions: Float32Array }[],
    color: THREE.Color,
    _scaleVar: number
  ): void {
    const pairs = 7;
    const mainGroup = this.fronds[this.fronds.length - 1].group;

    const { mesh: rachis, basePositions: rbp } = this.createLeafletMesh(
      shape.width * 0.15,
      shape.length,
      shape.curvature,
      shape.segmentation,
      color
    );
    mainGroup.add(rachis);
    leaflets.push({ mesh: rachis, basePositions: rbp });

    for (let i = 0; i < pairs; i++) {
      const t = (i + 1) / (pairs + 1);
      const z = shape.length * (0.15 + t * 0.75);
      const scale = Math.sin(Math.PI * (t * 0.7 + 0.15));
      const leafLen = shape.length * 0.38 * scale;
      const leafW = shape.width * 0.42 * scale;
      const tilt = 0.2 + t * 0.3;

      const leftData = this.createLeafletMesh(leafW, leafLen, shape.curvature * 0.6, shape.segmentation, color);
      leftData.mesh.position.z = z;
      leftData.mesh.rotation.y = -tilt;
      leftData.mesh.rotation.x = -0.1;
      rachis.add(leftData.mesh);
      leaflets.push(leftData);

      const rightData = this.createLeafletMesh(leafW, leafLen, shape.curvature * 0.6, shape.segmentation, color);
      rightData.mesh.position.z = z;
      rightData.mesh.rotation.y = tilt;
      rightData.mesh.rotation.x = 0.1;
      rachis.add(rightData.mesh);
      leaflets.push(rightData);
    }
  }

  private buildBipinnateFrond(
    shape: { length: number; width: number; curvature: number; segmentation: number },
    leaflets: { mesh: THREE.Mesh; basePositions: Float32Array }[],
    color: THREE.Color,
    _scaleVar: number
  ): void {
    const pairs = 5;
    const mainGroup = this.fronds[this.fronds.length - 1].group;

    const { mesh: rachis, basePositions: rbp } = this.createLeafletMesh(
      shape.width * 0.1,
      shape.length,
      shape.curvature,
      shape.segmentation,
      color
    );
    mainGroup.add(rachis);
    leaflets.push({ mesh: rachis, basePositions: rbp });

    for (let i = 0; i < pairs; i++) {
      const t = (i + 1) / (pairs + 1);
      const z = shape.length * (0.1 + t * 0.8);
      const scale = Math.sin(Math.PI * (t * 0.6 + 0.2));
      const pinnaLen = shape.length * 0.42 * scale;
      const pinnaW = shape.width * 0.38 * scale;
      const tilt = 0.25 + t * 0.25;

      for (const side of [-1, 1]) {
        const pinnaGroup = new THREE.Group();
        pinnaGroup.position.z = z;
        pinnaGroup.rotation.y = side * tilt;
        rachis.add(pinnaGroup);

        const subPairs = 4;
        for (let j = 0; j < subPairs; j++) {
          const st = (j + 1) / (subPairs + 1);
          const sz = pinnaLen * (0.1 + st * 0.8);
          const sscale = Math.sin(Math.PI * (st * 0.7 + 0.15));
          const lfLen = pinnaLen * 0.45 * sscale;
          const lfW = pinnaW * 0.55 * sscale;

          const ld = this.createLeafletMesh(lfW, lfLen, shape.curvature * 0.4, shape.segmentation, color);
          ld.mesh.position.z = sz;
          ld.mesh.rotation.y = side * 0.3;
          pinnaGroup.add(ld.mesh);
          leaflets.push(ld);

          const rd = this.createLeafletMesh(lfW, lfLen, shape.curvature * 0.4, shape.segmentation, color);
          rd.mesh.position.z = sz;
          rd.mesh.rotation.y = -side * 0.3;
          pinnaGroup.add(rd.mesh);
          leaflets.push(rd);
        }
      }
    }
  }

  private buildPalmateFrond(
    shape: { length: number; width: number; curvature: number; segmentation: number },
    leaflets: { mesh: THREE.Mesh; basePositions: Float32Array }[],
    color: THREE.Color,
    _scaleVar: number
  ): void {
    const fingers = 5;
    const mainGroup = this.fronds[this.fronds.length - 1].group;
    const totalSpread = Math.PI * 0.7;

    for (let i = 0; i < fingers; i++) {
      const t = fingers === 1 ? 0.5 : i / (fingers - 1);
      const angle = -totalSpread / 2 + t * totalSpread;
      const lenVar = 1 - Math.abs(t - 0.5) * 0.3;
      const fingerLen = shape.length * lenVar;
      const fingerW = shape.width / fingers * 1.2;

      const fd = this.createLeafletMesh(fingerW, fingerLen, shape.curvature, shape.segmentation, color);
      fd.mesh.rotation.y = angle * 0.5;
      fd.mesh.rotation.z = angle * 0.8;
      mainGroup.add(fd.mesh);
      leaflets.push(fd);
    }
  }

  buildSporangia(frondIndex: number, count: number, _density: number): void {
    if (frondIndex < 0 || frondIndex >= this.fronds.length) return;

    const frond = this.fronds[frondIndex];
    const sporangiumColor = hexToColor(this.plantConfig.colors.sporangium);

    for (let i = 0; i < count; i++) {
      const geometry = new THREE.IcosahedronGeometry(0.05, 0);
      const material = new THREE.MeshStandardMaterial({
        color: sporangiumColor,
        roughness: 0.45,
        metalness: 0.4
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;

      const target = frond.group;
      mesh.position.set(
        (Math.random() - 0.5) * this.plantConfig.frondShape.width * 0.5,
        -0.02,
        this.plantConfig.frondShape.length * (0.3 + Math.random() * 0.6)
      );
      target.add(mesh);

      frond.sporangia.push(mesh);
      this.sporangia.push(mesh);
      mesh.visible = false;
    }
  }

  updateMorphology(newMorphology: StageMorphology, animate: boolean = true): void {
    this.targetMorphology = { ...newMorphology };
    if (animate) {
      this.animationProgress = 0;
    } else {
      this.animationProgress = 1;
      this.applyMorphology(this.targetMorphology, 1);
    }
  }

  private applyMorphology(morph: StageMorphology, t: number): void {
    const eased = easeOutCubic(t);

    if (this.stemMesh) {
      const targetScaleY = morph.stemScale;
      const curScale = this.currentMorphology.stemScale;
      const s = curScale + (targetScaleY - curScale) * eased;
      this.stemMesh.scale.y = s;
      this.stemMesh.scale.x = 0.8 + 0.2 * eased;
      this.stemMesh.scale.z = 0.8 + 0.2 * eased;
    }

    const targetColor = hexToColor(morph.colorBlend);

    for (const frond of this.fronds) {
      const targetScale = morph.frondScale * frond.baseScale;
      const curScale = this.currentMorphology.frondScale * frond.baseScale;
      const s = curScale + (targetScale - curScale) * eased;
      frond.group.scale.setScalar(s);

      for (const { mesh } of frond.leaflets) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat.color) {
          const curColor = frond.baseColor.clone();
          mat.color.copy(curColor.lerp(targetColor, eased));
        }
        this.applyCurlToLeaflet(
          mesh,
          this.currentMorphology.frondUnfurl +
          (morph.frondUnfurl - this.currentMorphology.frondUnfurl) * eased,
          this.plantConfig.frondShape.length
        );
      }

      for (const sp of frond.sporangia) {
        if (morph.hasSporangia) {
          sp.visible = true;
          sp.scale.setScalar(eased);
        } else {
          sp.scale.setScalar(1 - eased);
          if (eased >= 0.98) sp.visible = false;
        }
      }
    }
  }

  setPlant(newConfig: PlantConfig): void {
    this.transitionIn = true;
    this.transitionProgress = 0;
    this.plantConfig = newConfig;
    this.build();
  }

  tick(deltaTime: number): void {
    if (this.animationProgress < 1) {
      this.animationProgress = Math.min(1, this.animationProgress + deltaTime / 0.5);
      this.applyMorphology(this.targetMorphology, this.animationProgress);

      if (this.animationProgress >= 1) {
        this.currentMorphology = { ...this.targetMorphology };
      }
    }

    if (this.transitionIn) {
      this.transitionProgress = Math.min(1, this.transitionProgress + deltaTime / 0.6);
      const t = easeOutCubic(this.transitionProgress);
      this.scale.setScalar(t);
      if (this.transitionProgress >= 1) {
        this.transitionIn = false;
      }
    }
  }
}
