import {
  Scene, Group, Mesh, SphereGeometry, BoxGeometry,
  BufferGeometry, Line, LineBasicMaterial, MeshBasicMaterial,
  Float32BufferAttribute, Color
} from 'three';

function disposeGroup(group: Group) {
  group.parent?.remove(group);
  group.traverse((child) => {
    if (child instanceof Mesh || child instanceof Line) {
      child.geometry.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => m.dispose());
      } else {
        child.material.dispose();
      }
    }
  });
}

export function createAttackEffect(
  from: [number, number, number],
  to: [number, number, number]
): Group {
  const group = new Group();

  const points = new Float32Array([...from, ...to]);
  const lineGeo = new BufferGeometry();
  lineGeo.setAttribute('position', new Float32BufferAttribute(points, 3));
  const lineMat = new LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
  group.add(new Line(lineGeo, lineMat));

  const dx = to[0] - from[0], dy = to[1] - from[1], dz = to[2] - from[2];
  for (let i = 1; i <= 4; i++) {
    const t = i / 5;
    const sg = new SphereGeometry(0.04, 6, 6);
    const sm = new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
    const sphere = new Mesh(sg, sm);
    sphere.position.set(from[0] + dx * t, from[1] + dy * t, from[2] + dz * t);
    group.add(sphere);
  }

  const timer = setTimeout(() => {
    disposeGroup(group);
  }, 400);
  void timer;

  return group;
}

export function createSpellEffect(
  from: [number, number, number],
  to: [number, number, number],
  color: string = '#9c27b0'
): Group {
  const group = new Group();
  const baseColor = new Color(color);

  for (let i = 0; i < 10; i++) {
    const sg = new SphereGeometry(0.06, 6, 6);
    const sm = new MeshBasicMaterial({ color: baseColor, transparent: true, opacity: 0.8 });
    const sphere = new Mesh(sg, sm);
    sphere.position.set(to[0], to[1], to[2]);
    const angle = (Math.PI * 2 * i) / 10;
    const spread = 0.3 + Math.random() * 0.2;
    sphere.userData.velocity = [
      Math.cos(angle) * spread,
      0.2 + Math.random() * 0.3,
      Math.sin(angle) * spread
    ];
    group.add(sphere);
  }

  const timer = setTimeout(() => {
    disposeGroup(group);
  }, 600);
  void timer;

  return group;
}

export function createHealEffect(
  position: [number, number, number]
): Group {
  const group = new Group();

  for (let i = 0; i < 8; i++) {
    const bg = new BoxGeometry(0.05, 0.05, 0.05);
    const bm = new MeshBasicMaterial({ color: 0x66bb6a, transparent: true, opacity: 0.85 });
    const box = new Mesh(bg, bm);
    const offset = 0.25;
    box.position.set(
      position[0] + (Math.random() - 0.5) * offset * 2,
      position[1] + Math.random() * 0.3,
      position[2] + (Math.random() - 0.5) * offset * 2
    );
    box.userData.velocity = [
      (Math.random() - 0.5) * 0.05,
      0.3 + Math.random() * 0.4,
      (Math.random() - 0.5) * 0.05
    ];
    group.add(box);
  }

  const timer = setTimeout(() => {
    disposeGroup(group);
  }, 500);
  void timer;

  return group;
}
