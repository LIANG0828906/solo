import * as THREE from 'three';
import { River } from './river';

export class Vegetation {
  public group: THREE.Group;
  private trees: { mesh: THREE.Group; phase: number; amplitude: number }[] = [];
  private windSpeed: number = 2;
  private windDirection: THREE.Vector3 = new THREE.Vector3(0, 0, -1);

  constructor(private river: River) {
    this.group = new THREE.Group();
    this.generateVegetation();
  }

  private generateVegetation(): void {
    const numPoints = 80;
    for (let i = 0; i < numPoints; i++) {
      const t = i / numPoints;
      if (t < 0.01 || t > 0.99) continue;

      const point = this.river.getPositionAtT(t);
      const tangent = this.river.getTangentAtT(t);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const seg = this.river.getSegmentAtT(t);
      const halfW = seg.width / 2;

      for (let side = -1; side <= 1; side += 2) {
        const offsetDist = halfW + 1 + Math.random() * 6;
        const pos = point.clone().add(normal.clone().multiplyScalar(side * offsetDist));
        pos.y = 0;

        const type = this.getVegetationType(t, seg.type);
        const tree = this.createTree(type, pos);
        if (tree) {
          const scale = 0.7 + Math.random() * 0.6;
          tree.mesh.scale.set(scale, scale, scale);
          this.trees.push(tree);
          this.group.add(tree.mesh);
        }
      }
    }

    const reedCount = 60;
    for (let i = 0; i < reedCount; i++) {
      const t = Math.random() * 0.9 + 0.05;
      const point = this.river.getPositionAtT(t);
      const tangent = this.river.getTangentAtT(t);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const seg = this.river.getSegmentAtT(t);
      const halfW = seg.width / 2;
      const side = Math.random() > 0.5 ? 1 : -1;
      const offsetDist = halfW - 0.5 + Math.random() * 2;
      const pos = point.clone().add(normal.clone().multiplyScalar(side * offsetDist));
      pos.y = 0;

      const reed = this.createReed(pos);
      this.trees.push(reed);
      this.group.add(reed.mesh);
    }
  }

  private getVegetationType(t: number, segType: string): string {
    if (segType === 'rapid') return 'cedar';
    if (segType === 'calm') return 'willow';
    return Math.random() > 0.5 ? 'cedar' : 'willow';
  }

  private createTree(type: string, position: THREE.Vector3): { mesh: THREE.Group; phase: number; amplitude: number } | null {
    const group = new THREE.Group();
    group.position.copy(position);
    const phase = Math.random() * Math.PI * 2;
    const amplitude = 5 + Math.random() * 5;

    if (type === 'cedar') {
      const height = 5 + Math.random() * 3;
      const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, height * 0.4, 6);
      const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5A3A1A });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = height * 0.2;
      group.add(trunk);

      const layers = 4;
      for (let l = 0; l < layers; l++) {
        const layerHeight = height * 0.15;
        const layerRadius = (layers - l) * 0.6 + 0.3;
        const coneGeo = new THREE.ConeGeometry(layerRadius, layerHeight, 6);
        const green = 0x2E5A2E + Math.floor(Math.random() * 0x101010);
        const coneMat = new THREE.MeshLambertMaterial({ color: green });
        const cone = new THREE.Mesh(coneGeo, coneMat);
        cone.position.y = height * 0.35 + l * height * 0.15;
        group.add(cone);
      }
    } else if (type === 'willow') {
      const height = 4 + Math.random() * 2;
      const trunkGeo = new THREE.CylinderGeometry(0.25, 0.4, height * 0.5, 6);
      const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5A3A1A });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = height * 0.25;
      group.add(trunk);

      const crownGeo = new THREE.SphereGeometry(2.5, 8, 6);
      const crownMat = new THREE.MeshLambertMaterial({ color: 0x3A6A2A });
      const crown = new THREE.Mesh(crownGeo, crownMat);
      crown.position.y = height * 0.55;
      crown.scale.y = 0.7;
      group.add(crown);

      for (let w = 0; w < 9; w++) {
        const angle = (w / 9) * Math.PI * 2;
        const droopPoints: THREE.Vector3[] = [];
        const startX = Math.cos(angle) * 2.3;
        const startZ = Math.sin(angle) * 2.3;
        for (let p = 0; p < 5; p++) {
          const pt = p / 4;
          droopPoints.push(new THREE.Vector3(
            startX + Math.cos(angle) * pt * 1.5,
            height * 0.55 - pt * pt * 3,
            startZ + Math.sin(angle) * pt * 1.5
          ));
        }
        const curve = new THREE.CatmullRomCurve3(droopPoints);
        const tubeGeo = new THREE.TubeGeometry(curve, 8, 0.03, 4, false);
        const willowMat = new THREE.MeshLambertMaterial({ color: 0x4A8A3A });
        const tube = new THREE.Mesh(tubeGeo, willowMat);
        group.add(tube);
      }
    }

    return { mesh: group, phase, amplitude };
  }

  private createReed(position: THREE.Vector3): { mesh: THREE.Group; phase: number; amplitude: number } {
    const group = new THREE.Group();
    group.position.copy(position);
    const phase = Math.random() * Math.PI * 2;
    const amplitude = 6 + Math.random() * 4;

    const stalkCount = 3 + Math.floor(Math.random() * 4);
    for (let s = 0; s < stalkCount; s++) {
      const height = 1.5 + Math.random() * 1;
      const stalkGeo = new THREE.CylinderGeometry(0.02, 0.03, height, 4);
      const stalkMat = new THREE.MeshLambertMaterial({ color: 0x6A8A3A });
      const stalk = new THREE.Mesh(stalkGeo, stalkMat);
      stalk.position.y = height / 2;
      stalk.position.x = (Math.random() - 0.5) * 0.3;
      stalk.position.z = (Math.random() - 0.5) * 0.3;
      group.add(stalk);

      const topGeo = new THREE.ConeGeometry(0.08, 0.3, 4);
      const topMat = new THREE.MeshLambertMaterial({ color: 0x8A7A3A });
      const top = new THREE.Mesh(topGeo, topMat);
      top.position.y = height + 0.1;
      top.position.x = stalk.position.x;
      top.position.z = stalk.position.z;
      group.add(top);
    }

    return { mesh: group, phase, amplitude };
  }

  setWindSpeed(speed: number): void {
    this.windSpeed = speed;
  }

  update(time: number): void {
    const windFactor = this.windSpeed / 8;
    this.trees.forEach(tree => {
      const sway = Math.sin(time * 2 + tree.phase) * tree.amplitude * windFactor * Math.PI / 180;
      tree.mesh.rotation.x = sway * this.windDirection.z * 0.3;
      tree.mesh.rotation.z = sway * this.windDirection.x * 0.3;
    });
  }
}
