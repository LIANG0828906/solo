import * as THREE from 'three';

export interface SceneCallbacks {
  onZoomChange?: (zoom: number) => void;
}

export function createWoodTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#B8885C';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 40; i++) {
    const y = Math.random() * 512;
    const width = 1 + Math.random() * 3;
    ctx.strokeStyle = `rgba(139, 90, 43, ${0.15 + Math.random() * 0.25})`;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < 512; x += 20) {
      ctx.lineTo(x, y + Math.sin(x * 0.02) * 3);
    }
    ctx.stroke();
  }

  for (let i = 0; i < 8; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 15 + Math.random() * 25;
    ctx.strokeStyle = 'rgba(120, 70, 30, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function createPetalGeometry(petalCount: number, petalLength: number, petalWidth: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.quadraticCurveTo(petalWidth / 2, petalLength * 0.5, 0, petalLength);
  shape.quadraticCurveTo(-petalWidth / 2, petalLength * 0.5, 0, 0);

  const geo = new THREE.ShapeGeometry(shape);
  return geo;
}

export function createFlowerMesh(
  petalColor: string,
  centerColor: string,
  stemColor: string,
  flowerType: string
): THREE.Group {
  const group = new THREE.Group();

  const petalMat = new THREE.MeshStandardMaterial({
    color: petalColor,
    side: THREE.DoubleSide,
    roughness: 0.6,
    metalness: 0.05,
  });

  const centerMat = new THREE.MeshStandardMaterial({
    color: centerColor,
    roughness: 0.8,
    metalness: 0.0,
  });

  const stemMat = new THREE.MeshStandardMaterial({
    color: stemColor,
    roughness: 0.7,
  });

  const petalConfigs: Record<string, { count: number; length: number; width: number; layers: number }> = {
    rose: { count: 8, length: 0.35, width: 0.22, layers: 3 },
    lily: { count: 6, length: 0.5, width: 0.18, layers: 1 },
    hydrangea: { count: 5, length: 0.15, width: 0.12, layers: 1 },
    sunflower: { count: 14, length: 0.35, width: 0.12, layers: 1 },
    tulip: { count: 6, length: 0.4, width: 0.2, layers: 2 },
    carnation: { count: 10, length: 0.25, width: 0.18, layers: 3 },
    peony: { count: 8, length: 0.4, width: 0.25, layers: 3 },
    lavender: { count: 4, length: 0.12, width: 0.06, layers: 1 },
  };

  const config = petalConfigs[flowerType] || petalConfigs.rose;

  if (flowerType === 'hydrangea') {
    const clusterGroup = new THREE.Group();
    for (let i = 0; i < 12; i++) {
      const miniFlower = new THREE.Group();
      const miniPetalGeo = createPetalGeometry(5, config.length, config.width);
      for (let p = 0; p < 5; p++) {
        const petal = new THREE.Mesh(miniPetalGeo, petalMat);
        const angle = (p / 5) * Math.PI * 2;
        petal.rotation.z = angle;
        petal.rotation.x = -0.4;
        miniFlower.add(petal);
      }
      const miniCenter = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 8, 8),
        centerMat
      );
      miniFlower.add(miniCenter);

      const theta = Math.random() * Math.PI * 0.6;
      const phi = Math.random() * Math.PI * 2;
      miniFlower.position.set(
        0.2 * Math.sin(theta) * Math.cos(phi),
        0.2 * Math.cos(theta),
        0.2 * Math.sin(theta) * Math.sin(phi)
      );
      clusterGroup.add(miniFlower);
    }
    clusterGroup.position.y = 0.6;
    group.add(clusterGroup);
  } else if (flowerType === 'lavender') {
    const spikeGroup = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const bud = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 6, 6),
        petalMat
      );
      bud.position.set(
        (Math.random() - 0.5) * 0.06,
        0.3 + i * 0.07,
        (Math.random() - 0.5) * 0.06
      );
      bud.scale.set(1, 1.3, 1);
      spikeGroup.add(bud);
    }
    group.add(spikeGroup);
  } else {
    for (let layer = 0; layer < config.layers; layer++) {
      const layerScale = 1 - layer * 0.2;
      const petalGeo = createPetalGeometry(config.count, config.length * layerScale, config.width * layerScale);

      for (let i = 0; i < config.count; i++) {
        const petal = new THREE.Mesh(petalGeo, petalMat);
        const angle = (i / config.count) * Math.PI * 2 + layer * 0.2;
        petal.rotation.z = angle;
        petal.rotation.x = -0.3 - layer * 0.25;
        petal.position.y = layer * 0.06;
        petal.scale.setScalar(layerScale);
        group.add(petal);
      }
    }

    const centerSize = flowerType === 'sunflower' ? 0.15 : 0.07;
    const center = new THREE.Mesh(
      new THREE.SphereGeometry(centerSize, 12, 12),
      centerMat
    );
    center.position.y = 0.05;
    group.add(center);
  }

  const stemGeo = new THREE.CylinderGeometry(0.02, 0.025, 0.7, 8);
  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.position.y = -0.35;
  group.add(stem);

  return group;
}

export function createWrappingMesh(
  wrappingColor: string,
  secondaryColor: string
): THREE.Group {
  const group = new THREE.Group();

  const wrappingMat = new THREE.MeshStandardMaterial({
    color: wrappingColor,
    side: THREE.DoubleSide,
    roughness: 0.5,
    metalness: 0.05,
    transparent: true,
    opacity: 0.85,
  });

  const coneGeo = new THREE.ConeGeometry(0.55, 1.1, 16, 1, true);
  const cone = new THREE.Mesh(coneGeo, wrappingMat);
  cone.position.y = -0.2;
  group.add(cone);

  const rimMat = new THREE.MeshStandardMaterial({
    color: secondaryColor,
    roughness: 0.4,
    metalness: 0.1,
  });
  const rimGeo = new THREE.TorusGeometry(0.55, 0.025, 8, 32);
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.position.y = -0.75;
  rim.rotation.x = Math.PI / 2;
  group.add(rim);

  return group;
}

export function createRibbonMesh(ribbonColor: string): THREE.Group {
  const group = new THREE.Group();

  const ribbonMat = new THREE.MeshStandardMaterial({
    color: ribbonColor,
    roughness: 0.3,
    metalness: 0.3,
  });

  const loop1Geo = new THREE.TorusGeometry(0.1, 0.015, 8, 16);
  const loop1 = new THREE.Mesh(loop1Geo, ribbonMat);
  loop1.position.set(0.08, -0.5, 0);
  loop1.rotation.y = Math.PI / 4;
  group.add(loop1);

  const loop2 = new THREE.Mesh(loop1Geo, ribbonMat);
  loop2.position.set(-0.08, -0.5, 0);
  loop2.rotation.y = -Math.PI / 4;
  group.add(loop2);

  const tailGeo = new THREE.BoxGeometry(0.025, 0.2, 0.005);
  const tail1 = new THREE.Mesh(tailGeo, ribbonMat);
  tail1.position.set(0.05, -0.65, 0);
  tail1.rotation.z = 0.3;
  group.add(tail1);

  const tail2 = new THREE.Mesh(tailGeo, ribbonMat);
  tail2.position.set(-0.05, -0.65, 0);
  tail2.rotation.z = -0.3;
  group.add(tail2);

  const knotGeo = new THREE.SphereGeometry(0.03, 8, 8);
  const knot = new THREE.Mesh(knotGeo, ribbonMat);
  knot.position.y = -0.5;
  group.add(knot);

  const bandGeo = new THREE.CylinderGeometry(0.56, 0.56, 0.04, 32, 1, true);
  const band = new THREE.Mesh(bandGeo, ribbonMat);
  band.position.y = -0.5;
  group.add(band);

  return group;
}

export function createBaseMesh(): THREE.Mesh {
  const woodTexture = createWoodTexture();
  const baseMat = new THREE.MeshStandardMaterial({
    map: woodTexture,
    roughness: 0.7,
    metalness: 0.05,
  });
  const baseGeo = new THREE.CylinderGeometry(0.65, 0.7, 0.1, 32);
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = -0.85;
  return base;
}
