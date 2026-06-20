import * as THREE from 'three';

export class Forest {
  scene!: THREE.Scene;
  ground!: THREE.Mesh;
  trees: THREE.Group[] = [];
  ambientLight!: THREE.AmbientLight;
  fog!: THREE.FogExp2;

  private readonly GROUND_RADIUS = 20;
  private readonly TREE_COUNT = 30;
  private readonly TREE_SPREAD_RADIUS = 15;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.setupBackground();
    this.createGround();
    this.createTrees(this.TREE_COUNT);
    this.setupLighting();
    this.setupFog();
  }

  private setupBackground(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#0F0A2E');
    gradient.addColorStop(1, '#1A1443');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 512);
    const texture = new THREE.CanvasTexture(canvas);
    this.scene.background = texture;
  }

  private createGround(): void {
    const geometry = new THREE.PlaneGeometry(
      this.GROUND_RADIUS * 2,
      this.GROUND_RADIUS * 2,
      64,
      64
    );

    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const dist = Math.sqrt(x * x + y * y);
      if (dist < this.GROUND_RADIUS) {
        const noise = (Math.sin(x * 0.3) + Math.cos(y * 0.3)) * 0.15 + Math.random() * 0.1;
        positions.setZ(i, noise);
      } else {
        positions.setZ(i, -1);
      }
    }
    geometry.computeVertexNormals();

    const material = new THREE.MeshLambertMaterial({
      color: 0x1d3b1a,
      flatShading: true
    });

    this.ground = new THREE.Mesh(geometry, material);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
  }

  private createTrees(count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * this.TREE_SPREAD_RADIUS;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const height = 1.5 + Math.random() * 1.5;
      const tree = this.createTree(new THREE.Vector3(x, 0, z), height);
      this.trees.push(tree);
      this.scene.add(tree);
    }
  }

  private createTree(position: THREE.Vector3, height: number): THREE.Group {
    const group = new THREE.Group();

    const trunkHeight = height * 0.4;
    const trunkGeometry = new THREE.CylinderGeometry(0.08, 0.12, trunkHeight, 6);
    const trunkMaterial = new THREE.MeshLambertMaterial({
      color: 0x4a3525,
      flatShading: true
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = trunkHeight / 2;
    trunk.castShadow = true;
    group.add(trunk);

    const crownLayers = 3 + Math.floor(Math.random() * 2);
    const crownColors = [0x2d5e2a, 0x3a7a35, 0x4a9a45];

    for (let i = 0; i < crownLayers; i++) {
      const layerHeight = (height - trunkHeight) / crownLayers;
      const radius = (1 - i / crownLayers) * 0.8 + 0.2;
      const coneGeometry = new THREE.ConeGeometry(radius, layerHeight * 1.2, 7);
      const crownMaterial = new THREE.MeshLambertMaterial({
        color: crownColors[i % crownColors.length],
        flatShading: true
      });
      const cone = new THREE.Mesh(coneGeometry, crownMaterial);
      cone.position.y = trunkHeight + layerHeight * i + layerHeight * 0.5;
      cone.castShadow = true;
      group.add(cone);
    }

    group.position.copy(position);
    group.rotation.y = Math.random() * Math.PI * 2;

    return group;
  }

  private setupLighting(): void {
    this.ambientLight = new THREE.AmbientLight(0x4466aa, 0.5);
    this.scene.add(this.ambientLight);

    const moonLight = new THREE.DirectionalLight(0xaabbff, 0.3);
    moonLight.position.set(10, 15, 10);
    moonLight.castShadow = false;
    this.scene.add(moonLight);
  }

  private setupFog(): void {
    this.fog = new THREE.FogExp2(0x0f0a2e, 0.025);
    this.scene.fog = this.fog;
  }

  setMoonlightIntensity(intensity: number): void {
    this.ambientLight.intensity = intensity;
  }

  dispose(): void {
    this.scene.remove(this.ground);
    this.ground.geometry.dispose();
    (this.ground.material as THREE.Material).dispose();

    this.trees.forEach(tree => {
      this.scene.remove(tree);
      tree.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
    });

    this.scene.remove(this.ambientLight);
  }
}
