import * as THREE from 'three';

export interface ParticleData {
  position: THREE.Vector3;
  color: THREE.Color;
  clusterId: number;
  size: number;
}

export interface ClusterInfo {
  id: number;
  name: string;
  center: THREE.Vector3;
  color: THREE.Color;
  brightness: number;
  myth: string;
  radius: number;
}

const COLOR_PALETTE = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD'
];

const CONSTELLATION_NAMES = [
  '猎户座',
  '仙女座',
  '天鹅座',
  '天琴座',
  '天蝎座',
  '狮子座'
];

const CONSTELLATION_MYTHS = [
  '猎户座源于希腊神话中的猎人俄里翁，他是海神波塞冬之子，因追求七姐妹而被月亮女神阿尔忒弥斯误杀，后被宙斯升上天空成为星座。',
  '仙女座讲述了埃塞俄比亚公主安德洛墨达的故事，她因母亲的虚荣被献祭给海怪，幸被英雄珀耳修斯所救，后化为星座永挂天际。',
  '天鹅座相传是宙斯化身天鹅接近斯巴达王后勒达的故事，美丽的天鹅在银河中展翅飞翔，象征着爱与美的永恒追求。',
  '天琴座代表着伟大的音乐家俄耳甫斯的竖琴，他的音乐能感动草木鸟兽，甚至能打动冥王，这把竖琴后被置于天空成为星座。',
  '天蝎座与猎户座的传说相关，是天后赫拉派出杀死猎人俄里翁的毒蝎，两个星座在天空中遥遥相对，永不同时出现。',
  '狮子座是尼米亚猛狮的化身，它是赫拉克勒斯十二项功绩中第一项的对手，其刀枪不入的皮毛后被英雄剥下作为战衣。'
];

const BRIGHTNESSES = [0.85, 0.72, 0.91, 0.78, 0.88, 0.69];

export class ParticleClusterGenerator {
  private particleCount: number;
  private clusterCount: number;
  private spaceRadius: number;

  constructor(particleCount = 15000, clusterCount = 6, spaceRadius = 50) {
    this.particleCount = particleCount;
    this.clusterCount = clusterCount;
    this.spaceRadius = spaceRadius;
  }

  public generate(): { particles: ParticleData[]; clusters: ClusterInfo[] } {
    const particles: ParticleData[] = [];
    const clusterCenters = this.generateClusterCenters();

    for (let i = 0; i < this.particleCount; i++) {
      const clusterId = this.assignCluster(i);
      const center = clusterCenters[clusterId];
      const position = this.generateParticlePosition(center);
      const color = new THREE.Color(COLOR_PALETTE[clusterId]);
      const size = 2 + Math.random() * 3;

      particles.push({
        position,
        color,
        clusterId,
        size
      });
    }

    const clusters = this.calculateClusterInfo(particles, clusterCenters);

    return { particles, clusters };
  }

  private generateClusterCenters(): THREE.Vector3[] {
    const centers: THREE.Vector3[] = [];
    const phiStep = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < this.clusterCount; i++) {
      const y = 1 - (i / (this.clusterCount - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const phi = phiStep * i;

      const x = Math.cos(phi) * radiusAtY;
      const z = Math.sin(phi) * radiusAtY;

      const center = new THREE.Vector3(x, y, z);
      center.multiplyScalar(this.spaceRadius * 0.55);
      centers.push(center);
    }

    return centers;
  }

  private assignCluster(index: number): number {
    const random = Math.random();
    if (random < 0.12) {
      return Math.floor(Math.random() * this.clusterCount);
    }

    const baseCluster = index % this.clusterCount;
    return baseCluster;
  }

  private generateParticlePosition(center: THREE.Vector3): THREE.Vector3 {
    const spread = this.spaceRadius * 0.25;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.pow(Math.random(), 0.6) * spread;

    const offset = new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    );

    return center.clone().add(offset);
  }

  private calculateClusterInfo(
    particles: ParticleData[],
    initialCenters: THREE.Vector3[]
  ): ClusterInfo[] {
    const clusters: ClusterInfo[] = [];

    for (let i = 0; i < this.clusterCount; i++) {
      const clusterParticles = particles.filter(p => p.clusterId === i);

      if (clusterParticles.length === 0) continue;

      let maxDist = 0;
      const center = initialCenters[i];

      for (const p of clusterParticles) {
        const dist = p.position.distanceTo(center);
        if (dist > maxDist) {
          maxDist = dist;
        }
      }

      clusters.push({
        id: i,
        name: CONSTELLATION_NAMES[i],
        center: center.clone(),
        color: new THREE.Color(COLOR_PALETTE[i]),
        brightness: BRIGHTNESSES[i],
        myth: CONSTELLATION_MYTHS[i],
        radius: maxDist * 1.1
      });
    }

    return clusters;
  }
}
