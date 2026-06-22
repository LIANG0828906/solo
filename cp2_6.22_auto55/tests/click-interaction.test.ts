import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { FishSchool } from '../src/FishSchool';
import { CoralGenerator } from '../src/CoralGenerator';
import { SceneInitializer } from '../src/SceneInitializer';
import { RegionInfo } from '../src/types';

describe('点击交互 - activeRegionInfo 填充', () => {
  it('handleClick 返回后 activeRegionInfo 字段完整', () => {
    const scene = new THREE.Scene();
    const si = new SceneInitializer(scene);
    si.init();
    const cg = new CoralGenerator(scene, si, 60);
    const corals = cg.generate();
    const fs = new FishSchool(scene, 20, corals);
    fs.fishes[0].position.set(5, 4, 5);
    const fakeIntersect: THREE.Intersection = {
      distance: 2, point: new THREE.Vector3(5, 4, 5),
      object: fs.fishes[0].mesh, face: null, faceIndex: 0, uv: new THREE.Vector2(), instanceId: 0,
    };
    expect(fs.activeRegionInfo).toBeNull();
    const idx = fs.handleClick(fakeIntersect);
    expect(idx).toBeGreaterThanOrEqual(0);
    const info: RegionInfo | null = fs.activeRegionInfo;
    expect(info).not.toBeNull();
    expect(typeof info!.coralDensity).toBe('number');
    expect(info!.coralDensity).toBeGreaterThanOrEqual(0);
    expect(typeof info!.temperature).toBe('number');
    expect(info!.temperature).toBeGreaterThanOrEqual(18);
    expect(info!.temperature).toBeLessThanOrEqual(28);
    expect(typeof info!.nutrients).toBe('number');
    expect(info!.nutrients).toBeGreaterThanOrEqual(5);
    expect(info!.nutrients).toBeLessThanOrEqual(100);
    expect(info!.position).toBeInstanceOf(THREE.Vector3);
    expect(info!.position.distanceTo(new THREE.Vector3(5, 4, 5))).toBeLessThan(0.001);
  });

  it('info 标签约 4 秒后被清除', () => {
    const scene = new THREE.Scene();
    const si = new SceneInitializer(scene);
    si.init();
    const cg = new CoralGenerator(scene, si, 20);
    const corals = cg.generate();
    const fs = new FishSchool(scene, 10, corals);
    fs.fishes[0].position.set(0, 3, 0);
    const fake: THREE.Intersection = {
      distance: 1, point: new THREE.Vector3(0, 3, 0),
      object: fs.fishes[0].mesh, face: null, faceIndex: 0, uv: new THREE.Vector2(), instanceId: 0,
    };
    fs.handleClick(fake);
    for (let i = 0; i < 39; i++) {
      fs.update(i * 0.1, 0.1, { currentSpeed: 2, lightIntensity: 60, nutrientLevel: 55 });
    }
    expect(fs.activeRegionInfo).not.toBeNull();
    fs.update(4.0, 0.2, { currentSpeed: 2, lightIntensity: 60, nutrientLevel: 55 });
    expect(fs.activeRegionInfo).toBeNull();
  });

  it('密集区与空旷区 coralDensity 存在显著差异', () => {
    const scene = new THREE.Scene();
    const si = new SceneInitializer(scene);
    si.init();
    const cg = new CoralGenerator(scene, si, 0);
    const pushFake = (x: number, z: number) => {
      const g = new THREE.Group();
      g.position.set(x, 2, z);
      g.add(new THREE.Mesh(new THREE.SphereGeometry(1, 4, 4)));
      scene.add(g);
      (cg.corals as unknown[]).push({
        mesh: g, position: new THREE.Vector3(x, 2, z),
        boundingRadius: 1, type: 'brain', baseScale: 1, phase: 0,
        baseColor: new THREE.Color(), materials: [],
      });
    };
    for (let i = 0; i < 60; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 9;
      pushFake(Math.cos(a) * r, Math.sin(a) * r);
    }
    const fs = new FishSchool(scene, 10, cg.corals);
    const compute = (fs as unknown as { computeRegionInfo: (p: THREE.Vector3) => RegionInfo }).computeRegionInfo.bind(fs);
    const dense = compute(new THREE.Vector3(0, 3, 0));
    const empty = compute(new THREE.Vector3(100, 3, 100));
    expect(dense.coralDensity).toBeGreaterThan(50);
    expect(empty.coralDensity).toBe(0);
  });
});
