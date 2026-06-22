import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { CoralGenerator } from '../src/CoralGenerator';
import { SceneInitializer } from '../src/SceneInitializer';
import { CoralType, CoralData } from '../src/types';

const VALID_TYPES: CoralType[] = [
  'brain', 'staghorn', 'anemone', 'plate', 'tube', 'mushroom',
  'fan', 'bubble', 'branch', 'cauliflower', 'vase', 'fire',
];

function makeEnv() {
  const scene = new THREE.Scene();
  const si = new SceneInitializer(scene);
  si.init();
  return { scene, si };
}

describe('CoralGenerator.generate()', () => {
  it('生成指定数量的珊瑚，位置贴合沙地高度', () => {
    const { scene, si } = makeEnv();
    const count = 25;
    const cg = new CoralGenerator(scene, si, count);
    const result = cg.generate();
    expect(result.length).toBe(count);
    expect(cg.corals.length).toBe(count);
    for (const coral of result) {
      expect(Math.abs(coral.position.x)).toBeLessThanOrEqual(80);
      expect(Math.abs(coral.position.z)).toBeLessThanOrEqual(80);
      const expectedY = si.getTerrainHeight(coral.position.x, coral.position.z);
      expect(Math.abs(coral.position.y - expectedY)).toBeLessThan(0.001);
    }
  });

  it('每个 CoralData 返回正确的 Mesh 结构', () => {
    const { scene, si } = makeEnv();
    const cg = new CoralGenerator(scene, si, 12);
    const corals = cg.generate();
    for (const c of corals) {
      expect(c.mesh).toBeInstanceOf(THREE.Group);
      expect(c.position).toBeInstanceOf(THREE.Vector3);
      expect(typeof c.boundingRadius).toBe('number');
      expect(c.boundingRadius).toBeGreaterThan(0);
      expect(VALID_TYPES.includes(c.type)).toBe(true);
      expect(c.baseColor).toBeInstanceOf(THREE.Color);
      expect(Array.isArray(c.materials)).toBe(true);
      expect(c.materials.length).toBeGreaterThanOrEqual(1);
      let meshCount = 0;
      c.mesh.traverse((o) => { if ((o as THREE.Mesh).isMesh) meshCount++; });
      expect(meshCount).toBeGreaterThanOrEqual(1);
    }
  });

  it('12 种 CoralType 均可被随机生成', () => {
    const { scene, si } = makeEnv();
    const cg = new CoralGenerator(scene, si, 300);
    const corals = cg.generate();
    const seen = new Set(corals.map((c) => c.type));
    for (const t of VALID_TYPES) expect(seen.has(t)).toBe(true);
  });

  it('CoralData.position 是独立克隆，不与 mesh.position 共享引用', () => {
    const { scene, si } = makeEnv();
    const cg = new CoralGenerator(scene, si, 1);
    const corals: CoralData[] = cg.generate();
    const orig = corals[0].position.clone();
    corals[0].mesh.position.x += 100;
    expect(corals[0].position.x).toBe(orig.x);
  });
});

describe('CoralGenerator 脑珊瑚分形褶皱', () => {
  it('脑珊瑚顶点半径标准差体现分形起伏（>0.08）', () => {
    const { scene, si } = makeEnv();
    const cg = new CoralGenerator(scene, si, 1);
    const buildBrain = (cg as unknown as { buildBrain: (c: THREE.Color) => THREE.Group }).buildBrain.bind(cg);
    const group = buildBrain(new THREE.Color(0xff8866));
    let mainMesh: THREE.Mesh | null = null;
    group.traverse((o) => { if ((o as THREE.Mesh).isMesh && !mainMesh) mainMesh = o as THREE.Mesh; });
    expect(mainMesh).not.toBeNull();
    const pos = mainMesh!.geometry.attributes.position as THREE.BufferAttribute;
    let sum = 0, sumSq = 0;
    const n = pos.count;
    for (let i = 0; i < n; i++) {
      const r = Math.sqrt(pos.getX(i) ** 2 + pos.getY(i) ** 2 + pos.getZ(i) ** 2);
      sum += r; sumSq += r * r;
    }
    const mean = sum / n;
    const std = Math.sqrt(Math.max(0, sumSq / n - mean * mean));
    expect(std).toBeGreaterThan(0.08);
    expect(mean).toBeGreaterThan(0.65);
    expect(mean).toBeLessThan(1.2);
  });
});

describe('CoralGenerator.update() 脉动', () => {
  it('营养盐越高，脉动幅度越大', () => {
    const { scene, si } = makeEnv();
    const cg = new CoralGenerator(scene, si, 5);
    cg.generate();
    const before = cg.corals.map((c) => c.mesh.scale.x);
    cg.update(1.2, { currentSpeed: 1, lightIntensity: 50, nutrientLevel: 5 });
    const afterLow = cg.corals.map((c) => c.mesh.scale.x);
    const diffLow = afterLow.reduce((s, v, i) => s + Math.abs(v - before[i]), 0);
    cg.update(2.0, { currentSpeed: 1, lightIntensity: 50, nutrientLevel: 100 });
    const afterHigh = cg.corals.map((c) => c.mesh.scale.x);
    const diffHigh = afterHigh.reduce((s, v, i) => s + Math.abs(v - before[i]), 0);
    expect(diffHigh).toBeGreaterThan(diffLow);
  });
});
