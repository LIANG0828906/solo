import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { CoralData } from '../src/types';
import { FishSchool } from '../src/FishSchool';

function makeFakeScene(): THREE.Scene { return new THREE.Scene(); }

function makeFakeCoral(x: number, y: number, z: number, r: number): CoralData {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.add(new THREE.Mesh(new THREE.SphereGeometry(r, 4, 4)));
  return {
    mesh: g,
    position: new THREE.Vector3(x, y, z),
    boundingRadius: r,
    type: 'brain',
    baseScale: 1,
    phase: 0,
    baseColor: new THREE.Color(0xff0000),
    materials: [],
  };
}

describe('FishSchool - 空间哈希碰撞回避', () => {
  it('近距离珊瑚产生正回避力', () => {
    const scene = makeFakeScene();
    const corals: CoralData[] = [
      makeFakeCoral(0, 2, 0, 2),
      makeFakeCoral(100, 2, 100, 2),
    ];
    const fs = new FishSchool(scene, 1, corals);
    const f = fs.fishes[0];
    f.position.set(3, 2, 0);
    f.velocity.set(0, 0, 0);
    f.acceleration.set(0, 0, 0);
    const avoid = (fs as unknown as { coralAvoidance: (f: unknown) => THREE.Vector3 }).coralAvoidance(f);
    expect(avoid.x).toBeGreaterThan(0);
    expect(Math.abs(avoid.x)).toBeGreaterThan(0.1);
  });

  it('远距离珊瑚回避力为零', () => {
    const scene = makeFakeScene();
    const corals = [makeFakeCoral(0, 2, 0, 2)];
    const fs = new FishSchool(scene, 1, corals);
    const f = fs.fishes[0];
    f.position.set(50, 2, 0);
    f.velocity.set(0, 0, 0);
    const avoid = (fs as unknown as { coralAvoidance: (f: unknown) => THREE.Vector3 }).coralAvoidance(f);
    expect(avoid.x).toBe(0);
    expect(avoid.y).toBe(0);
    expect(avoid.z).toBe(0);
  });

  it('拥挤鱼群分离力产生非零加速度', () => {
    const scene = makeFakeScene();
    const fs = new FishSchool(scene, 20, []);
    for (let i = 0; i < fs.fishes.length; i++) {
      fs.fishes[i].position.set(
        0.5 + (Math.random() - 0.5) * 0.4,
        3,
        0.5 + (Math.random() - 0.5) * 0.4,
      );
      fs.fishes[i].velocity.set(
        (Math.random() - 0.5) * 0.1,
        0,
        (Math.random() - 0.5) * 0.1,
      );
      fs.fishes[i].acceleration.set(0, 0, 0);
    }
    // 推进多帧，Boids 需要几帧才能累计出明显加速度
    for (let f = 0; f < 5; f++) {
      fs.update(f * 0.1, 0.1, { currentSpeed: 2, lightIntensity: 60, nutrientLevel: 55 });
    }
    let anyMoving = false;
    for (const f of fs.fishes) {
      if (f.velocity.length() > 0.15) { anyMoving = true; break; }
    }
    expect(anyMoving).toBe(true);
  });
});

describe('FishSchool - handleClick 逃逸动画', () => {
  it('10米半径内鱼 scattering=true 且有 timer', () => {
    const scene = makeFakeScene();
    const fs = new FishSchool(scene, 30, []);
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2;
      fs.fishes[i].position.set(Math.cos(a) * 3, 3, Math.sin(a) * 3);
      fs.fishes[i].scattering = false;
      fs.fishes[i].scatterTimer = 0;
    }
    const fakeIntersect: THREE.Intersection = {
      distance: 1,
      point: new THREE.Vector3(0, 3, 0),
      object: fs.fishes[0].mesh,
      face: null, faceIndex: 0, uv: new THREE.Vector2(), instanceId: 0,
    };
    const idx = fs.handleClick(fakeIntersect);
    expect(idx).toBeGreaterThanOrEqual(0);
    const scatCount = fs.fishes.filter((f) => f.scattering).length;
    expect(scatCount).toBe(30);
    for (const f of fs.fishes) expect(f.scatterTimer).toBeGreaterThan(0.5);
  });

  it('scatterTimer 逐帧递减，约3秒后停止散射', () => {
    const scene = makeFakeScene();
    const fs = new FishSchool(scene, 5, []);
    for (let i = 0; i < 5; i++) fs.fishes[i].position.set(0, 3, 0);
    const fake: THREE.Intersection = {
      distance: 1, point: new THREE.Vector3(0, 3, 0),
      object: fs.fishes[0].mesh, face: null, faceIndex: 0, uv: new THREE.Vector2(), instanceId: 0,
    };
    fs.handleClick(fake);
    const timers0 = fs.fishes.map((f) => f.scatterTimer);
    fs.update(0.3, 0.3, { currentSpeed: 2, lightIntensity: 60, nutrientLevel: 55 });
    for (let i = 0; i < 5; i++) {
      expect(fs.fishes[i].scatterTimer).toBeLessThan(timers0[i]);
    }
    for (let i = 0; i < 10; i++) {
      fs.update(1 + i * 0.3, 0.3, { currentSpeed: 2, lightIntensity: 60, nutrientLevel: 55 });
    }
    for (const f of fs.fishes) expect(f.scattering).toBe(false);
  });
});

describe('FishSchool - computeRegionInfo', () => {
  it('密集区密度 > 空旷区密度', () => {
    const scene = makeFakeScene();
    const corals: CoralData[] = [];
    for (let i = 0; i < 50; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 10;
      corals.push(makeFakeCoral(Math.cos(a) * r, 2, Math.sin(a) * r, 1));
    }
    const fs = new FishSchool(scene, 1, corals);
    const compute = (fs as unknown as { computeRegionInfo: (p: THREE.Vector3) => { coralDensity: number } }).computeRegionInfo.bind(fs);
    const near = compute(new THREE.Vector3(0, 3, 0));
    const far = compute(new THREE.Vector3(50, 3, 50));
    expect(near.coralDensity).toBeGreaterThan(far.coralDensity);
    expect(near.coralDensity).toBeGreaterThan(0);
    expect(far.coralDensity).toBe(0);
  });
});
