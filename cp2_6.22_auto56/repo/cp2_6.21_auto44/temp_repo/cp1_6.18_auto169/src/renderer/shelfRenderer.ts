import * as THREE from 'three';

export const SHELF_CONFIG = {
  rows: 4,
  cols: 5,
  cellWidth: 2.2,
  cellHeight: 2.5,
  cellDepth: 2.0,
  gap: 0.15,
  shelfThickness: 0.12,
};

export function buildShelfGeometry(): THREE.Group {
  const group = new THREE.Group();
  const { rows, cols, cellWidth, cellHeight, cellDepth, gap, shelfThickness } = SHELF_CONFIG;

  const totalWidth = cols * cellWidth + (cols + 1) * gap;
  const totalHeight = rows * cellHeight + (rows + 1) * gap;

  const shelfMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a3e,
    roughness: 0.7,
    metalness: 0.3,
  });

  for (let r = 0; r <= rows; r++) {
    const y = r * (cellHeight + gap) - totalHeight / 2;
    const shelfGeo = new THREE.BoxGeometry(totalWidth + gap, shelfThickness, cellDepth + gap);
    const shelf = new THREE.Mesh(shelfGeo, shelfMat);
    shelf.position.set(0, y, 0);
    shelf.receiveShadow = true;
    group.add(shelf);
  }

  const sideMat = new THREE.MeshStandardMaterial({
    color: 0x22223a,
    roughness: 0.8,
    metalness: 0.2,
  });

  const sideHeight = totalHeight + shelfThickness;
  const sideGeo = new THREE.BoxGeometry(gap, sideHeight, cellDepth + gap);

  const leftSide = new THREE.Mesh(sideGeo, sideMat);
  leftSide.position.set(-totalWidth / 2 - gap / 2, 0, 0);
  leftSide.receiveShadow = true;
  group.add(leftSide);

  const rightSide = new THREE.Mesh(sideGeo, sideMat);
  rightSide.position.set(totalWidth / 2 + gap / 2, 0, 0);
  rightSide.receiveShadow = true;
  group.add(rightSide);

  const backGeo = new THREE.BoxGeometry(totalWidth + gap * 2, sideHeight, gap * 0.5);
  const backMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a2e,
    roughness: 0.9,
    metalness: 0.1,
  });
  const back = new THREE.Mesh(backGeo, backMat);
  back.position.set(0, 0, -(cellDepth + gap) / 2);
  back.receiveShadow = true;
  group.add(back);

  return group;
}

export function getSlotPosition(row: number, col: number): THREE.Vector3 {
  const { rows, cols, cellWidth, cellHeight, cellDepth, gap } = SHELF_CONFIG;
  const totalWidth = cols * cellWidth + (cols + 1) * gap;
  const totalHeight = rows * cellHeight + (rows + 1) * gap;

  const x = col * (cellWidth + gap) + cellWidth / 2 + gap - totalWidth / 2;
  const y = row * (cellHeight + gap) + cellHeight / 2 + gap - totalHeight / 2;
  const z = 0;

  return new THREE.Vector3(x, y, z);
}

export function buildPetGeometry(rarityColor: number): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: rarityColor,
    roughness: 0.4,
    metalness: 0.3,
  });

  const headGeo = new THREE.SphereGeometry(0.35, 16, 16);
  const head = new THREE.Mesh(headGeo, mat);
  head.position.set(0, 0.55, 0);
  head.castShadow = true;
  group.add(head);

  const bodyGeo = new THREE.CylinderGeometry(0.25, 0.3, 0.6, 12);
  const body = new THREE.Mesh(bodyGeo, mat);
  body.position.set(0, 0, 0);
  body.castShadow = true;
  group.add(body);

  const tailGeo = new THREE.ConeGeometry(0.15, 0.5, 8);
  const tail = new THREE.Mesh(tailGeo, mat);
  tail.position.set(0, -0.1, -0.45);
  tail.rotation.x = -0.5;
  tail.castShadow = true;
  group.add(tail);

  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x444444 });
  const eyeGeo = new THREE.SphereGeometry(0.07, 8, 8);

  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.12, 0.6, 0.28);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.12, 0.6, 0.28);
  group.add(rightEye);

  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const pupilGeo = new THREE.SphereGeometry(0.04, 8, 8);

  const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
  leftPupil.position.set(-0.12, 0.6, 0.34);
  group.add(leftPupil);

  const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
  rightPupil.position.set(0.12, 0.6, 0.34);
  group.add(rightPupil);

  return group;
}

export const RARITY_THREE_COLORS: Record<string, number> = {
  common: 0xb0bec5,
  rare: 0xffd54f,
  legendary: 0xe57373,
};
