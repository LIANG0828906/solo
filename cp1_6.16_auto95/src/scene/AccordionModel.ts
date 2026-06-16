import * as THREE from 'three';
import { useAppStore, getNoteInfo } from '../store/AppState';

interface KeyMesh {
  mesh: THREE.Mesh;
  noteIndex: number;
  row: number;
  basePosition: THREE.Vector3;
  ledMesh: THREE.Mesh;
  outlineMesh: THREE.LineSegments;
}

export class AccordionModel {
  public group = new THREE.Group();
  private keys: KeyMesh[] = [];
  private bellowsFolds: THREE.Mesh[] = [];
  private bellowsCount = 12;
  private leftBody!: THREE.Group;
  private rightBody!: THREE.Group;
  private bellowsGroup!: THREE.Group;
  private baseBellowsWidth = 3.2;
  private expandedBellowsWidth = 6.5;
  private keyPressDepth = 0.05;
  private woodTexture!: THREE.CanvasTexture;
  private goldMaterial!: THREE.MeshStandardMaterial;
  private keyMeshesMap = new Map<number, KeyMesh>();
  private melodyPathLine: THREE.Line | null = null;
  private melodyPathTubes: THREE.Mesh[] = [];

  constructor() {
    this.createMaterials();
    this.buildModel();
  }

  private createMaterials() {
    const woodCanvas = document.createElement('canvas');
    woodCanvas.width = 512;
    woodCanvas.height = 512;
    const wctx = woodCanvas.getContext('2d')!;
    const baseGrad = wctx.createLinearGradient(0, 0, 512, 512);
    baseGrad.addColorStop(0, '#5d4037');
    baseGrad.addColorStop(0.5, '#6d4c41');
    baseGrad.addColorStop(1, '#4e342e');
    wctx.fillStyle = baseGrad;
    wctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 120; i++) {
      const y = Math.random() * 512;
      const h = 1 + Math.random() * 3;
      wctx.strokeStyle = `rgba(${30 + Math.random() * 30}, ${20 + Math.random() * 20}, ${15 + Math.random() * 15}, ${0.2 + Math.random() * 0.3})`;
      wctx.lineWidth = h;
      wctx.beginPath();
      wctx.moveTo(0, y);
      for (let x = 0; x < 512; x += 20) {
        wctx.lineTo(x, y + Math.sin(x * 0.02 + i) * (3 + Math.random() * 5));
      }
      wctx.stroke();
    }
    wctx.fillStyle = 'rgba(180, 140, 80, 0.08)';
    for (let i = 0; i < 20; i++) {
      wctx.beginPath();
      wctx.ellipse(Math.random() * 512, Math.random() * 512, 10 + Math.random() * 25, 4 + Math.random() * 8, Math.random() * Math.PI, 0, Math.PI * 2);
      wctx.fill();
    }
    this.woodTexture = new THREE.CanvasTexture(woodCanvas);
    this.woodTexture.wrapS = THREE.RepeatWrapping;
    this.woodTexture.wrapT = THREE.RepeatWrapping;

    this.goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.9,
      roughness: 0.25,
      emissive: 0x3a2e0a,
      emissiveIntensity: 0.3,
    });
  }

  private buildModel() {
    this.leftBody = new THREE.Group();
    this.rightBody = new THREE.Group();
    this.bellowsGroup = new THREE.Group();
    this.group.add(this.leftBody, this.bellowsGroup, this.rightBody);

    this.buildBody(this.leftBody, 'left');
    this.buildBody(this.rightBody, 'right');
    this.buildBellows();
    this.buildKeys();

    this.group.position.y = -0.3;
  }

  private buildBody(bodyGroup: THREE.Group, side: 'left' | 'right') {
    const woodMat = new THREE.MeshStandardMaterial({
      map: this.woodTexture,
      roughness: 0.7,
      metalness: 0.1,
    });

    const bodyWidth = 1.8;
    const bodyHeight = 4.2;
    const bodyDepth = 0.8;

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyDepth),
      woodMat
    );
    bodyGroup.add(body);

    const frontInset = new THREE.Mesh(
      new THREE.BoxGeometry(bodyWidth * 0.85, bodyHeight * 0.92, bodyDepth * 0.6),
      new THREE.MeshStandardMaterial({
        map: this.woodTexture,
        roughness: 0.5,
        metalness: 0.2,
        color: 0x8b6f47,
      })
    );
    frontInset.position.z = bodyDepth * 0.5 + 0.01;
    bodyGroup.add(frontInset);

    const frameGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(bodyWidth * 0.88, bodyHeight * 0.95, bodyDepth * 0.7));
    const frameLine = new THREE.LineSegments(frameGeo, new THREE.LineBasicMaterial({ color: 0xd4af37, linewidth: 2 }));
    frameLine.position.z = bodyDepth * 0.5 + 0.02;
    bodyGroup.add(frameLine);

    const cornerGeo = new THREE.BoxGeometry(0.12, 0.12, 0.08);
    const cornerPositions = [
      [bodyWidth / 2 - 0.08, bodyHeight / 2 - 0.08],
      [-bodyWidth / 2 + 0.08, bodyHeight / 2 - 0.08],
      [bodyWidth / 2 - 0.08, -bodyHeight / 2 + 0.08],
      [-bodyWidth / 2 + 0.08, -bodyHeight / 2 + 0.08],
    ];
    cornerPositions.forEach(([cx, cy]) => {
      const corner = new THREE.Mesh(cornerGeo, this.goldMaterial);
      corner.position.set(cx, cy, bodyDepth * 0.5 + 0.04);
      bodyGroup.add(corner);
    });

    const decorativeBand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, bodyWidth * 0.75, 16),
      this.goldMaterial
    );
    decorativeBand.rotation.z = Math.PI / 2;
    decorativeBand.position.set(0, bodyHeight * 0.28, bodyDepth * 0.5 + 0.05);
    bodyGroup.add(decorativeBand);

    const decorativeBand2 = decorativeBand.clone();
    decorativeBand2.position.y = -bodyHeight * 0.28;
    bodyGroup.add(decorativeBand2);

    if (side === 'right') {
      bodyGroup.position.x = this.baseBellowsWidth / 2 + bodyWidth / 2;
    } else {
      bodyGroup.position.x = -this.baseBellowsWidth / 2 - bodyWidth / 2;
    }

    if (side === 'right') {
      const strapStudGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.08, 16);
      const studPositions = [
        [bodyWidth / 2 - 0.3, bodyHeight / 2 - 0.4],
        [bodyWidth / 2 - 0.3, -bodyHeight / 2 + 0.4],
      ];
      studPositions.forEach(([sx, sy]) => {
        const stud = new THREE.Mesh(strapStudGeo, this.goldMaterial);
        stud.rotation.z = Math.PI / 2;
        stud.position.set(sx, sy, -bodyDepth * 0.5 - 0.04);
        bodyGroup.add(stud);
      });
    }
  }

  private buildBellows() {
    const foldHeight = 4.0;
    const foldDepth = 0.08;
    const foldInnerW = 0.18;
    const foldOuterW = 0.32;

    const pleatMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8,
      side: THREE.DoubleSide,
    });
    const edgeMaterial = this.goldMaterial.clone();
    edgeMaterial.metalness = 0.95;

    for (let i = 0; i < this.bellowsCount; i++) {
      const foldGroup = new THREE.Group();
      const shape = new THREE.Shape();
      shape.moveTo(0, -foldHeight / 2);
      shape.lineTo(foldOuterW, -foldHeight / 2 + 0.05);
      shape.lineTo(foldOuterW, foldHeight / 2 - 0.05);
      shape.lineTo(0, foldHeight / 2);
      shape.lineTo(-foldOuterW, foldHeight / 2 - 0.05);
      shape.lineTo(-foldOuterW, -foldHeight / 2 + 0.05);
      shape.lineTo(0, -foldHeight / 2);

      const holePath = new THREE.Path();
      holePath.moveTo(0, -foldHeight / 2 + 0.25);
      holePath.lineTo(foldInnerW, -foldHeight / 2 + 0.3);
      holePath.lineTo(foldInnerW, foldHeight / 2 - 0.3);
      holePath.lineTo(0, foldHeight / 2 - 0.25);
      holePath.lineTo(-foldInnerW, foldHeight / 2 - 0.3);
      holePath.lineTo(-foldInnerW, -foldHeight / 2 + 0.3);
      holePath.lineTo(0, -foldHeight / 2 + 0.25);
      shape.holes.push(holePath);

      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: foldDepth,
        bevelEnabled: true,
        bevelThickness: 0.01,
        bevelSize: 0.01,
        bevelSegments: 2,
      });
      geo.center();

      const fold = new THREE.Mesh(geo, pleatMaterial);
      foldGroup.add(fold);

      const edgeGeo = new THREE.TorusGeometry(foldOuterW - 0.01, 0.015, 6, 60, Math.PI * 2);
      const topEdge = new THREE.Mesh(edgeGeo, edgeMaterial);
      topEdge.rotation.y = Math.PI / 2;
      topEdge.position.z = foldDepth / 2 + 0.005;
      foldGroup.add(topEdge);

      this.bellowsFolds.push(foldGroup);
      this.bellowsGroup.add(foldGroup);
    }

    this.updateBellowsFolds(0.3);
  }

  private buildKeys() {
    const keysPerRow = 12;
    const keyWidth = 0.19;
    const keyHeight = 0.5;
    const keyDepth = 0.1;
    const keyGap = 0.02;
    const rowGap = 0.08;

    const rightBody = this.rightBody;
    const bodyInfo = { w: 1.8, h: 4.2, d: 0.8 };

    const startY = -(keysPerRow * (keyWidth + keyGap)) / 2 + (keyWidth + keyGap) / 2;
    const frontZ = bodyInfo.d / 2 + 0.12;

    const whiteKeyMat = new THREE.MeshStandardMaterial({
      color: 0xfaf8f0,
      roughness: 0.4,
      metalness: 0.05,
    });

    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < keysPerRow; i++) {
        const noteIndex = row * keysPerRow + i;
        const noteInfo = getNoteInfo(noteIndex);
        const isBlackKey = noteInfo.midi % 12 === 1 || noteInfo.midi % 12 === 3 || noteInfo.midi % 12 === 6 || noteInfo.midi % 12 === 8 || noteInfo.midi % 12 === 10;

        let kw = keyWidth, kh = keyHeight, kd = keyDepth;
        let mat = whiteKeyMat;
        if (isBlackKey) {
          kw = keyWidth * 0.75;
          kh = keyHeight * 0.65;
          kd = keyDepth * 0.9;
          mat = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            roughness: 0.5,
            metalness: 0.1,
          });
        }

        const keyGeo = new THREE.BoxGeometry(kw, kh, kd);
        const keyMesh = new THREE.Mesh(keyGeo, mat);

        const xOffset = row === 0 ? -0.18 : 0.18;
        const y = startY + i * (keyWidth + keyGap);
        const zPos = frontZ + (isBlackKey ? 0.02 : 0);

        keyMesh.position.set(
          bodyInfo.w / 2 + xOffset,
          y,
          zPos
        );
        keyMesh.rotation.y = -0.35 + row * 0.08;

        const borderGeo = new THREE.EdgesGeometry(keyGeo);
        const borderColor = isBlackKey ? 0x111111 : 0x222222;
        const borderLine = new THREE.LineSegments(
          borderGeo,
          new THREE.LineBasicMaterial({ color: borderColor })
        );
        keyMesh.add(borderLine);

        const ledGeo = new THREE.BoxGeometry(kw * 0.6, 0.02, kd * 0.6);
        const ledMat = new THREE.MeshBasicMaterial({
          color: this.getNoteLedColor(noteIndex),
          transparent: true,
          opacity: 0,
        });
        const ledMesh = new THREE.Mesh(ledGeo, ledMat);
        ledMesh.position.set(0, 0, kd / 2 + 0.01);
        keyMesh.add(ledMesh);

        const basePos = keyMesh.position.clone();

        const keyData: KeyMesh = {
          mesh: keyMesh,
          noteIndex,
          row,
          basePosition: basePos,
          ledMesh,
          outlineMesh: borderLine,
        };

        this.keys.push(keyData);
        this.keyMeshesMap.set(noteIndex, keyData);
        rightBody.add(keyMesh);
      }
    }
  }

  private getNoteLedColor(noteIndex: number): number {
    const freq = getNoteInfo(noteIndex).frequency;
    if (freq < 330) return 0xff5533;
    if (freq < 660) return 0x44dd88;
    return 0xcc55ff;
  }

  updateBellowsFolds(expansion: number) {
    const totalWidth = this.baseBellowsWidth + (this.expandedBellowsWidth - this.baseBellowsWidth) * expansion;
    const foldSpacing = totalWidth / this.bellowsCount;
    const amplitude = 0.12 + expansion * 0.18;

    for (let i = 0; i < this.bellowsCount; i++) {
      const fold = this.bellowsFolds[i];
      const t = i / (this.bellowsCount - 1);
      fold.position.x = -totalWidth / 2 + t * totalWidth;
      const foldSkew = Math.sin(i * Math.PI) * amplitude * 0.3;
      fold.position.z = foldSkew;
      fold.scale.x = 0.6 + Math.sin(i * 1.3 + expansion * 2) * amplitude;
    }

    const bodyWidth = 1.8;
    this.rightBody.position.x = totalWidth / 2 + bodyWidth / 2;
    this.leftBody.position.x = -totalWidth / 2 - bodyWidth / 2;
  }

  updateKeyStates(hoveredKey: number | null) {
    const state = useAppStore.getState();
    const pressed = state.pressedKeys;

    for (const key of this.keys) {
      const isPressed = pressed.has(key.noteIndex);
      const isHovered = hoveredKey === key.noteIndex;
      const targetZ = isPressed ? this.keyPressDepth : 0;
      const pressSmth = 1 - Math.exp(-1 / 8);
      key.mesh.position.z = key.basePosition.z - targetZ + (key.mesh.position.z - (key.basePosition.z - targetZ)) * (1 - pressSmth);

      const ledMat = key.ledMesh.material as THREE.MeshBasicMaterial;
      const targetOpacity = isPressed ? 0.9 : (isHovered ? 0.3 : 0);
      ledMat.opacity += (targetOpacity - ledMat.opacity) * 0.3;

      const meshMat = key.mesh.material as THREE.MeshStandardMaterial;
      const origColor = (key.noteIndex === 1 || key.noteIndex === 3 || key.noteIndex === 6 || key.noteIndex === 8 || key.noteIndex === 10 ||
        key.noteIndex === 13 || key.noteIndex === 15 || key.noteIndex === 18 || key.noteIndex === 20 || key.noteIndex === 22) ? 0x2a2a2a : 0xfaf8f0;
      const targetEmissive = isHovered && !isPressed ? this.getNoteLedColor(key.noteIndex) : (isPressed ? this.getNoteLedColor(key.noteIndex) : 0x000000);
      meshMat.emissive = new THREE.Color(targetEmissive);
      meshMat.emissiveIntensity = isPressed ? 0.6 : (isHovered ? 0.2 : 0);
      meshMat.color = new THREE.Color(origColor);
    }
  }

  getKeyMeshAt(noteIndex: number): THREE.Mesh | null {
    return this.keyMeshesMap.get(noteIndex)?.mesh || null;
  }

  getAllKeyMeshes(): THREE.Mesh[] {
    return this.keys.map((k) => k.mesh);
  }

  getKeyWorldPosition(noteIndex: number): THREE.Vector3 | null {
    const k = this.keyMeshesMap.get(noteIndex);
    if (!k) return null;
    const pos = new THREE.Vector3();
    k.mesh.getWorldPosition(pos);
    return pos;
  }

  setMelodyPath(points: { x: number; y: number; z: number }[]) {
    this.clearMelodyPath();
    if (points.length < 2) return;

    const v3Points = points.map((p) => new THREE.Vector3(p.x, p.y + 0.5, p.z - 2));
    const curve = new THREE.CatmullRomCurve3(v3Points);
    const curvePoints = curve.getPoints(150);
    const geo = new THREE.BufferGeometry().setFromPoints(curvePoints);

    const colors = new Float32Array(curvePoints.length * 3);
    for (let i = 0; i < curvePoints.length; i++) {
      const t = i / curvePoints.length;
      const color = new THREE.Color().setHSL(0.05 + t * 0.8, 0.9, 0.6);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      linewidth: 2,
    });
    this.melodyPathLine = new THREE.Line(geo, mat);
    this.group.add(this.melodyPathLine);

    const tubeGeo = new THREE.TubeGeometry(curve, 150, 0.035, 8, false);
    const tubeMat = new THREE.MeshBasicMaterial({
      color: 0xffdd66,
      transparent: true,
      opacity: 0.25,
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    this.melodyPathTubes.push(tube);
    this.group.add(tube);
  }

  updateMelodyPathProgress(progress: number) {
    if (this.melodyPathLine) {
      const mat = this.melodyPathLine.material as THREE.LineBasicMaterial;
      mat.opacity = 0.5 + Math.sin(performance.now() * 0.004) * 0.3;
    }
    if (this.melodyPathTubes.length > 0) {
      const tube = this.melodyPathTubes[0];
      (tube.material as THREE.MeshBasicMaterial).opacity = 0.15 + 0.25 * progress;
    }
  }

  clearMelodyPath() {
    if (this.melodyPathLine) {
      this.group.remove(this.melodyPathLine);
      this.melodyPathLine.geometry.dispose();
      (this.melodyPathLine.material as THREE.Material).dispose();
      this.melodyPathLine = null;
    }
    this.melodyPathTubes.forEach((t) => {
      this.group.remove(t);
      t.geometry.dispose();
      (t.material as THREE.Material).dispose();
    });
    this.melodyPathTubes = [];
  }
}
