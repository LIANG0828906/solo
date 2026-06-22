import * as THREE from 'three';
import { useSeasonStore } from '../store/seasonStore';
import { Season, PlantType, seasonThemeColors } from '../utils/colorPalette';

interface PollinatorPath {
  from: PlantType;
  to: PlantType;
  curve: THREE.CatmullRomCurve3;
}

interface Pollinator {
  mesh: THREE.Group;
  type: 'bee' | 'butterfly';
  pathIndex: number;
  progress: number;
  speed: number;
  wobbleOffset: number;
}

interface PollinatorPositions {
  position: THREE.Vector3;
  type: 'bee' | 'butterfly';
}

export class PollinatorModule {
  private scene: THREE.Scene;
  private plantPositions: Record<PlantType, THREE.Vector3>;
  private paths: PollinatorPath[] = [];
  private pollinators: Pollinator[] = [];
  private pollinatorPositions: PollinatorPositions[] = [];
  private pathLineMeshes: THREE.Line[] = [];

  private pollinationRelations: Array<{ from: PlantType; to: PlantType }> = [
    { from: PlantType.CHERRY_BLOSSOM, to: PlantType.SUNFLOWER },
    { from: PlantType.SUNFLOWER, to: PlantType.GINKGO },
    { from: PlantType.GINKGO, to: PlantType.MAPLE },
    { from: PlantType.MAPLE, to: PlantType.CHERRY_BLOSSOM },
    { from: PlantType.CHERRY_BLOSSOM, to: PlantType.GINKGO },
    { from: PlantType.SUNFLOWER, to: PlantType.MAPLE }
  ];

  constructor(scene: THREE.Scene, plantPositions: Record<PlantType, THREE.Vector3>) {
    this.scene = scene;
    this.plantPositions = plantPositions;
    this.createPaths();
    this.createPathLines();
  }

  private createPaths(): void {
    this.paths = this.pollinationRelations.map((relation) => {
      const fromPos = this.plantPositions[relation.from];
      const toPos = this.plantPositions[relation.to];
      
      const controlPoints: THREE.Vector3[] = [];
      const startPoint = fromPos.clone();
      const endPoint = toPos.clone();
      
      controlPoints.push(startPoint);
      
      const midPoint = new THREE.Vector3().addVectors(startPoint, endPoint).multiplyScalar(0.5);
      const heightOffset = Math.min(startPoint.distanceTo(endPoint) * 0.4, 3);
      midPoint.y += heightOffset;
      
      const direction = new THREE.Vector3().subVectors(endPoint, startPoint);
      const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
      
      for (let i = 1; i <= 10; i++) {
        const t = i / 11;
        const point = new THREE.Vector3().lerpVectors(startPoint, endPoint, t);
        
        const offset = Math.sin(t * Math.PI) * heightOffset * 0.8;
        point.y += offset;
        
        const wobble = perpendicular.clone().multiplyScalar(Math.sin(t * Math.PI * 2) * 0.5);
        point.add(wobble);
        
        controlPoints.push(point);
      }
      
      controlPoints.push(endPoint);
      
      const curve = new THREE.CatmullRomCurve3(controlPoints, false, 'catmullrom', 0.5);
      
      return {
        from: relation.from,
        to: relation.to,
        curve
      };
    });
  }

  private createPathLines(): void {
    this.paths.forEach((path) => {
      const points = path.curve.getPoints(50);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.15
      });
      const line = new THREE.Line(geometry, material);
      this.pathLineMeshes.push(line);
      this.scene.add(line);
    });
  }

  private createBee(): THREE.Group {
    const group = new THREE.Group();
    
    const bodyGeometry = new THREE.SphereGeometry(0.12, 8, 8);
    bodyGeometry.scale(1, 0.8, 1.5);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.5
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);
    
    const stripeGeometry = new THREE.TorusGeometry(0.12, 0.02, 8, 16);
    const stripeMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.7
    });
    
    for (let i = 0; i < 3; i++) {
      const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
      stripe.rotation.y = Math.PI / 2;
      stripe.position.z = -0.1 + i * 0.08;
      group.add(stripe);
    }
    
    const wingGeometry = new THREE.CircleGeometry(0.15, 12);
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-0.12, 0.1, 0);
    leftWing.rotation.y = -Math.PI / 4;
    group.add(leftWing);
    
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(0.12, 0.1, 0);
    rightWing.rotation.y = Math.PI / 4;
    group.add(rightWing);
    
    return group;
  }

  private createButterfly(): THREE.Group {
    const group = new THREE.Group();
    
    const colors = [0xff69b4, 0x87ceeb, 0x98fb98, 0xffa500];
    const bodyColor = colors[Math.floor(Math.random() * colors.length)];
    
    const bodyGeometry = new THREE.CapsuleGeometry(0.03, 0.15, 4, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.4
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI / 2;
    group.add(body);
    
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.quadraticCurveTo(0.15, 0.1, 0.2, 0);
    wingShape.quadraticCurveTo(0.15, -0.15, 0, -0.1);
    wingShape.lineTo(0, 0);
    
    const wingGeometry = new THREE.ShapeGeometry(wingShape);
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: bodyColor,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });
    
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-0.02, 0, 0);
    leftWing.rotation.y = Math.PI / 6;
    group.add(leftWing);
    
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(0.02, 0, 0);
    rightWing.rotation.y = -Math.PI / 6;
    rightWing.scale.x = -1;
    group.add(rightWing);
    
    const wingPatternGeometry = new THREE.CircleGeometry(0.03, 12);
    const patternMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8
    });
    
    for (let i = 0; i < 2; i++) {
      const leftPattern = new THREE.Mesh(wingPatternGeometry, patternMaterial);
      leftPattern.position.set(-0.1, 0.02 + i * 0.04, -0.01);
      group.add(leftPattern);
      
      const rightPattern = new THREE.Mesh(wingPatternGeometry, patternMaterial);
      rightPattern.position.set(0.1, 0.02 + i * 0.04, -0.01);
      group.add(rightPattern);
    }
    
    return group;
  }

  private getPollinatorConfig(): { type: 'bee' | 'butterfly'; count: number }[] {
    const { currentSeason } = useSeasonStore.getState();
    
    switch (currentSeason) {
      case Season.SPRING:
        return [{ type: 'butterfly', count: 3 }];
      case Season.SUMMER:
        return [
          { type: 'bee', count: 3 },
          { type: 'butterfly', count: 3 }
        ];
      case Season.AUTUMN:
        return [{ type: 'bee', count: 2 }];
      case Season.WINTER:
        return [];
    }
  }

  private updatePollinatorCount(): void {
    const config = this.getPollinatorConfig();
    const expectedCount = config.reduce((sum, c) => sum + c.count, 0);
    
    while (this.pollinators.length > expectedCount) {
      const pollinator = this.pollinators.pop()!;
      this.scene.remove(pollinator.mesh);
      this.disposeGroup(pollinator.mesh);
    }
    
    let index = 0;
    config.forEach(({ type, count }) => {
      for (let i = 0; i < count; i++) {
        if (index >= this.pollinators.length) {
          const mesh = type === 'bee' ? this.createBee() : this.createButterfly();
          mesh.scale.setScalar(10 / 100);
          
          this.pollinators.push({
            mesh,
            type,
            pathIndex: index % this.paths.length,
            progress: Math.random(),
            speed: 1 + Math.random() * 0.5,
            wobbleOffset: Math.random() * Math.PI * 2
          });
          
          this.scene.add(mesh);
        } else {
          const pollinator = this.pollinators[index];
          if (pollinator.type !== type) {
            this.scene.remove(pollinator.mesh);
            this.disposeGroup(pollinator.mesh);
            
            const newMesh = type === 'bee' ? this.createBee() : this.createButterfly();
            newMesh.scale.setScalar(10 / 100);
            
            pollinator.mesh = newMesh;
            pollinator.type = type;
            this.scene.add(newMesh);
          }
        }
        index++;
      }
    });
    
    this.pollinatorPositions = this.pollinators.map((p) => ({
      position: p.mesh.position.clone(),
      type: p.type
    }));
  }

  private disposeGroup(group: THREE.Group): void {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }

  public update(deltaTime: number): void {
    this.updatePollinatorCount();
    
    const { currentSeason } = useSeasonStore.getState();
    const pathOpacity = currentSeason === Season.WINTER ? 0 : 0.15;
    
    this.pathLineMeshes.forEach((line) => {
      const material = line.material as THREE.LineBasicMaterial;
      material.opacity = pathOpacity;
    });
    
    this.pollinators.forEach((pollinator) => {
      pollinator.progress += deltaTime * pollinator.speed * 0.1;
      
      if (pollinator.progress >= 1) {
        pollinator.progress = 0;
        pollinator.pathIndex = (pollinator.pathIndex + 1) % this.paths.length;
      }
      
      const path = this.paths[pollinator.pathIndex];
      const position = path.curve.getPoint(pollinator.progress);
      const tangent = path.curve.getTangent(pollinator.progress);
      
      pollinator.wobbleOffset += deltaTime * 8;
      const wobble = Math.sin(pollinator.wobbleOffset) * 0.1;
      
      pollinator.mesh.position.copy(position);
      pollinator.mesh.position.y += Math.sin(pollinator.wobbleOffset * 0.5) * 0.1;
      
      pollinator.mesh.lookAt(position.clone().add(tangent));
      pollinator.mesh.rotateZ(wobble * 0.1745);
      
      if (pollinator.type === 'butterfly') {
        const leftWing = pollinator.mesh.children[1] as THREE.Mesh;
        const rightWing = pollinator.mesh.children[2] as THREE.Mesh;
        const wingFlap = Math.sin(pollinator.wobbleOffset * 3) * 0.5;
        
        leftWing.rotation.y = Math.PI / 6 + wingFlap;
        rightWing.rotation.y = -Math.PI / 6 - wingFlap;
      }
    });
    
    this.pollinatorPositions = this.pollinators.map((p) => ({
      position: p.mesh.position.clone(),
      type: p.type
    }));
  }

  public getPollinatorPositions(): PollinatorPositions[] {
    return [...this.pollinatorPositions];
  }

  public updatePlantPositions(positions: Record<PlantType, THREE.Vector3>): void {
    this.plantPositions = positions;
    this.paths.forEach((path) => {
      const fromPos = positions[path.from];
      const toPos = positions[path.to];
      
      const controlPoints: THREE.Vector3[] = [];
      const startPoint = fromPos.clone();
      const endPoint = toPos.clone();
      
      controlPoints.push(startPoint);
      
      const heightOffset = Math.min(startPoint.distanceTo(endPoint) * 0.4, 3);
      
      const direction = new THREE.Vector3().subVectors(endPoint, startPoint);
      const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
      
      for (let i = 1; i <= 10; i++) {
        const t = i / 11;
        const point = new THREE.Vector3().lerpVectors(startPoint, endPoint, t);
        
        const offset = Math.sin(t * Math.PI) * heightOffset * 0.8;
        point.y += offset;
        
        const wobble = perpendicular.clone().multiplyScalar(Math.sin(t * Math.PI * 2) * 0.5);
        point.add(wobble);
        
        controlPoints.push(point);
      }
      
      controlPoints.push(endPoint);
      
      path.curve = new THREE.CatmullRomCurve3(controlPoints, false, 'catmullrom', 0.5);
    });
    
    this.pathLineMeshes.forEach((line, index) => {
      const points = this.paths[index].curve.getPoints(50);
      line.geometry.dispose();
      line.geometry = new THREE.BufferGeometry().setFromPoints(points);
    });
  }

  public dispose(): void {
    this.pollinators.forEach((pollinator) => {
      this.scene.remove(pollinator.mesh);
      this.disposeGroup(pollinator.mesh);
    });
    this.pollinators = [];
    
    this.pathLineMeshes.forEach((line) => {
      this.scene.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    });
    this.pathLineMeshes = [];
    
    this.paths = [];
  }
}
