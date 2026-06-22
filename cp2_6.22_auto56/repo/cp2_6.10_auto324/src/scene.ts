import * as THREE from 'three';

export interface WeaveNode {
  id: string;
  position: THREE.Vector3;
  color: THREE.Color;
  connections: string[];
  mesh: THREE.Mesh;
  pulsePhase: number;
}

export interface WeaveThread {
  id: string;
  startNodeId: string;
  endNodeId: string;
  color: THREE.Color;
  length: number;
  curve: THREE.CatmullRomCurve3;
  flowParticles: FlowParticle[];
  line: THREE.Line;
  progress: number;
}

export interface FlowParticle {
  id: string;
  progress: number;
  speed: number;
  offset: number;
}

export interface WeaveLogEntry {
  id: string;
  timestamp: number;
  threadLength: number;
  color: string;
  startNode: { x: number; y: number; z: number };
  endNode: { x: number; y: number; z: number };
}

const COLOR_PALETTE = [
  new THREE.Color(0xb300ff),
  new THREE.Color(0x00e5ff),
  new THREE.Color(0xff00aa),
  new THREE.Color(0x00ffaa),
  new THREE.Color(0xaa00ff),
];

export class SceneManager {
  private scene: THREE.Scene;
  private nodes: Map<string, WeaveNode> = new Map();
  private threads: Map<string, WeaveThread> = new Map();
  private nodeGeometry: THREE.SphereGeometry;
  private nodeMaterial: THREE.MeshBasicMaterial;
  private particleMesh: THREE.InstancedMesh;
  private particleDummy: THREE.Object3D;
  private maxParticles: number = 1000;
  private starField: THREE.Points;
  private gridHelper: THREE.GridHelper;
  private threadGeometry: THREE.BufferGeometry;
  private threadPositions: Float32Array;
  private threadColors: Float32Array;
  private threadLine: THREE.Line;
  private nodesGroup: THREE.Group;
  private weaveSpeed: number = 1;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.nodeGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    this.nodeMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.9,
    });

    this.particleDummy = new THREE.Object3D();
    const particleGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const particleMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.8,
      vertexColors: false,
    });
    this.particleMesh = new THREE.InstancedMesh(particleGeo, particleMat, this.maxParticles);
    this.particleMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(this.maxParticles * 3), 3);
    this.scene.add(this.particleMesh);

    this.nodesGroup = new THREE.Group();
    this.scene.add(this.nodesGroup);

    this.initStarField();
    this.initGrid();
    this.initThreadGeometry();
  }

  private initStarField(): void {
    const starCount = 2000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      const radius = 50 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      const color = Math.random() > 0.5 ? new THREE.Color(0xb300ff) : new THREE.Color(0x00e5ff);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      sizes[i] = Math.random() * 0.5 + 0.1;
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const starMat = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });

    this.starField = new THREE.Points(starGeo, starMat);
    this.scene.add(this.starField);
  }

  private initGrid(): void {
    this.gridHelper = new THREE.GridHelper(30, 30, 0x333366, 0x222244);
    this.gridHelper.position.y = -5;
    this.gridHelper.material.transparent = true;
    this.gridHelper.material.opacity = 0.15;
    this.scene.add(this.gridHelper);
  }

  private initThreadGeometry(): void {
    const maxPoints = 10000;
    this.threadPositions = new Float32Array(maxPoints * 3);
    this.threadColors = new Float32Array(maxPoints * 3);

    this.threadGeometry = new THREE.BufferGeometry();
    this.threadGeometry.setAttribute('position', new THREE.BufferAttribute(this.threadPositions, 3));
    this.threadGeometry.setAttribute('color', new THREE.BufferAttribute(this.threadColors, 3));

    const threadMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      linewidth: 2,
    });

    this.threadLine = new THREE.LineSegments(this.threadGeometry, threadMaterial);
    this.scene.add(this.threadLine);
  }

  public createNode(position: THREE.Vector3, colorIndex?: number): WeaveNode {
    const id = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const color = COLOR_PALETTE[colorIndex ?? Math.floor(Math.random() * COLOR_PALETTE.length)];

    const material = this.nodeMaterial.clone();
    material.color = color.clone();
    (material as THREE.MeshBasicMaterial).color.multiplyScalar(1.5);

    const mesh = new THREE.Mesh(this.nodeGeometry, material);
    mesh.position.copy(position);
    mesh.scale.set(0, 0, 0);
    this.nodesGroup.add(mesh);

    const node: WeaveNode = {
      id,
      position: position.clone(),
      color: color.clone(),
      connections: [],
      mesh,
      pulsePhase: 0,
    };

    this.nodes.set(id, node);

    this.animateNodeIn(mesh);

    return node;
  }

  private animateNodeIn(mesh: THREE.Mesh): void {
    const startTime = performance.now();
    const duration = 500;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const scale = eased * 1.2 + (1 - eased) * 0;

      mesh.scale.setScalar(scale);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        mesh.scale.setScalar(1);
      }
    };

    animate();
  }

  public createThread(startNodeId: string, endNodeId: string): WeaveThread | null {
    const startNode = this.nodes.get(startNodeId);
    const endNode = this.nodes.get(endNodeId);

    if (!startNode || !endNode) return null;

    const id = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const midPoint = new THREE.Vector3()
      .addVectors(startNode.position, endNode.position)
      .multiplyScalar(0.5);
    midPoint.y += (Math.random() - 0.5) * 2;

    const curve = new THREE.CatmullRomCurve3([
      startNode.position.clone(),
      midPoint,
      endNode.position.clone(),
    ]);

    const length = curve.getLength();
    const color = startNode.color.clone().lerp(endNode.color, 0.5);

    const particles: FlowParticle[] = [];
    const particleCount = Math.max(3, Math.floor(length / 2));
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        id: `particle_${id}_${i}`,
        progress: i / particleCount,
        speed: 0.0005 + Math.random() * 0.0005,
        offset: Math.random() * Math.PI * 2,
      });
    }

    const points = curve.getPoints(Math.floor(length * 5));
    const positions = new Float32Array(points.length * 3);
    const colors = new Float32Array(points.length * 3);

    for (let i = 0; i < points.length; i++) {
      positions[i * 3] = points[i].x;
      positions[i * 3 + 1] = points[i].y;
      positions[i * 3 + 2] = points[i].z;

      const t = i / (points.length - 1);
      const c = startNode.color.clone().lerp(endNode.color, t);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    lineGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0,
    });

    const line = new THREE.Line(lineGeo, lineMat);
    this.scene.add(line);

    const thread: WeaveThread = {
      id,
      startNodeId,
      endNodeId,
      color,
      length,
      curve,
      flowParticles: particles,
      line,
      progress: 0,
    };

    this.threads.set(id, thread);

    startNode.connections.push(endNodeId);
    endNode.connections.push(startNodeId);

    this.animateThreadIn(line, thread);

    return thread;
  }

  private animateThreadIn(line: THREE.Line, thread: WeaveThread): void {
    const startTime = performance.now();
    const duration = 800;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      (line.material as THREE.LineBasicMaterial).opacity = eased * 0.8;

      const positionAttr = line.geometry.getAttribute('position') as THREE.BufferAttribute;
      const drawRange = Math.floor(positionAttr.count * eased);
      line.geometry.setDrawRange(0, drawRange);

      thread.progress = eased;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        (line.material as THREE.LineBasicMaterial).opacity = 0.8;
      }
    };

    animate();
  }

  public getNodeAtPosition(position: THREE.Vector3, threshold: number = 0.5): WeaveNode | null {
    for (const node of this.nodes.values()) {
      if (node.position.distanceTo(position) < threshold) {
        return node;
      }
    }
    return null;
  }

  public getNodeById(id: string): WeaveNode | undefined {
    return this.nodes.get(id);
  }

  public getNodes(): WeaveNode[] {
    return Array.from(this.nodes.values());
  }

  public getNodeCount(): number {
    return this.nodes.size;
  }

  public setWeaveSpeed(speed: number): void {
    this.weaveSpeed = speed;
  }

  public update(deltaTime: number, time: number): void {
    this.starField.rotation.y += 0.0001 * deltaTime;
    this.gridHelper.rotation.y += 0.00005 * deltaTime;

    let particleIndex = 0;

    for (const thread of this.threads.values()) {
      if (thread.progress < 1) continue;

      for (const particle of thread.flowParticles) {
        if (particleIndex >= this.maxParticles) break;

        particle.progress += particle.speed * deltaTime * this.weaveSpeed;
        if (particle.progress > 1) {
          particle.progress = 0;
        }

        const position = thread.curve.getPoint(particle.progress);
        const pulseOffset = Math.sin(time * 0.003 + particle.offset) * 0.1 + 1;

        this.particleDummy.position.copy(position);
        this.particleDummy.scale.setScalar(pulseOffset);
        this.particleDummy.updateMatrix();

        this.particleMesh.setMatrixAt(particleIndex, this.particleDummy.matrix);

        const color = thread.color.clone();
        const brightness = 0.7 + Math.sin(time * 0.005 + particle.offset) * 0.3;
        color.multiplyScalar(brightness);
        this.particleMesh.setColorAt(particleIndex, color);

        particleIndex++;
      }
    }

    for (let i = particleIndex; i < this.maxParticles; i++) {
      this.particleDummy.position.set(0, -1000, 0);
      this.particleDummy.updateMatrix();
      this.particleMesh.setMatrixAt(i, this.particleDummy.matrix);
    }

    this.particleMesh.instanceMatrix.needsUpdate = true;
    if (this.particleMesh.instanceColor) {
      this.particleMesh.instanceColor.needsUpdate = true;
    }

    for (const node of this.nodes.values()) {
      node.pulsePhase += deltaTime * 0.002;
      const pulse = 1 + Math.sin(node.pulsePhase) * 0.15;
      node.mesh.scale.setScalar(pulse);
    }
  }

  public triggerNodePulse(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    node.pulsePhase = 0;

    const startTime = performance.now();
    const duration = 600;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      const scale = 1 + Math.sin(progress * Math.PI) * 2;
      node.mesh.scale.setScalar(scale);

      const material = node.mesh.material as THREE.MeshBasicMaterial;
      material.opacity = 0.9 + (1 - progress) * 0.1;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        node.mesh.scale.setScalar(1);
        material.opacity = 0.9;
      }
    };

    animate();
  }

  public clearAll(): void {
    for (const node of this.nodes.values()) {
      this.nodesGroup.remove(node.mesh);
      node.mesh.geometry?.dispose();
      (node.mesh.material as THREE.Material)?.dispose();
    }
    this.nodes.clear();

    for (const thread of this.threads.values()) {
      this.scene.remove(thread.line);
      thread.line.geometry?.dispose();
      (thread.line.material as THREE.Material)?.dispose();
    }
    this.threads.clear();
  }

  public dispose(): void {
    this.clearAll();
    this.nodeGeometry.dispose();
    this.nodeMaterial.dispose();
    this.particleMesh.geometry?.dispose();
    (this.particleMesh.material as THREE.Material)?.dispose();
    this.starField.geometry?.dispose();
    (this.starField.material as THREE.Material)?.dispose();
    this.gridHelper.geometry?.dispose();
    (this.gridHelper.material as THREE.Material)?.dispose();
    this.threadGeometry.dispose();
  }
}
