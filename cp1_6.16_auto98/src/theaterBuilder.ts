import * as THREE from 'three';

export interface SeatData {
  mesh: THREE.Mesh;
  row: number;
  col: number;
  position: THREE.Vector3;
  soundPressureLevel: number;
}

export interface TheaterData {
  group: THREE.Group;
  seats: SeatData[];
  stageFrontEdge: THREE.Vector3[];
}

const CONFIG = {
  stageRadius: 8,
  stageHeight: 0.5,
  firstRowDistance: 12,
  rowSpacing: 3,
  seatSize: 1.0,
  seatHeight: 1.0,
  rowHeightIncrement: 0.6,
  rows: 5,
  seatsPerRow: 10,
  halfAngle: Math.PI * 0.75,
};

function colorFromSPL(dB: number): THREE.Color {
  const clampedDb = Math.max(60, Math.min(110, dB));
  const t = (clampedDb - 60) / 50;
  
  const colorStops = [
    { pos: 0.0, color: new THREE.Color(0x000080) },
    { pos: 0.4, color: new THREE.Color(0x00ffff) },
    { pos: 0.7, color: new THREE.Color(0xffff00) },
    { pos: 1.0, color: new THREE.Color(0x8b0000) },
  ];

  for (let i = 0; i < colorStops.length - 1; i++) {
    const stop1 = colorStops[i];
    const stop2 = colorStops[i + 1];
    if (t >= stop1.pos && t <= stop2.pos) {
      const localT = (t - stop1.pos) / (stop2.pos - stop1.pos);
      return stop1.color.clone().lerp(stop2.color, localT);
    }
  }
  
  return colorStops[colorStops.length - 1].color.clone();
}

export function updateSeatColor(seat: SeatData): void {
  const material = seat.mesh.material as THREE.MeshStandardMaterial;
  const color = colorFromSPL(seat.soundPressureLevel);
  material.color.copy(color);
}

export function buildTheater(): TheaterData {
  const theaterGroup = new THREE.Group();
  const seats: SeatData[] = [];
  const stageFrontEdge: THREE.Vector3[] = [];

  const stageGeo = new THREE.CylinderGeometry(
    CONFIG.stageRadius,
    CONFIG.stageRadius,
    CONFIG.stageHeight,
    64,
    1,
    false,
    0,
    Math.PI
  );
  const stageMat = new THREE.MeshStandardMaterial({
    color: 0x4a4a5a,
    roughness: 0.8,
    metalness: 0.2,
    side: THREE.DoubleSide,
  });
  const stage = new THREE.Mesh(stageGeo, stageMat);
  stage.position.y = CONFIG.stageHeight / 2;
  stage.rotation.y = Math.PI / 2;
  theaterGroup.add(stage);

  const stageFloorGeo = new THREE.CircleGeometry(CONFIG.stageRadius - 0.5, 64, 0, Math.PI);
  const stageFloorMat = new THREE.MeshStandardMaterial({
    color: 0x6a5a4a,
    roughness: 0.9,
    side: THREE.DoubleSide,
  });
  const stageFloor = new THREE.Mesh(stageFloorGeo, stageFloorMat);
  stageFloor.rotation.x = -Math.PI / 2;
  stageFloor.position.y = CONFIG.stageHeight + 0.01;
  stageFloor.rotation.z = Math.PI / 2;
  theaterGroup.add(stageFloor);

  for (let i = 0; i <= 20; i++) {
    const angle = -CONFIG.halfAngle / 2 + (CONFIG.halfAngle * i) / 20;
    const x = Math.sin(angle) * (CONFIG.stageRadius - 0.5);
    const z = Math.cos(angle) * (CONFIG.stageRadius - 0.5);
    stageFrontEdge.push(new THREE.Vector3(x, CONFIG.stageHeight, z));
  }

  for (let row = 0; row < CONFIG.rows; row++) {
    const rowGroup = new THREE.Group();
    rowGroup.name = `row_${row}`;
    
    const rowRadius = CONFIG.firstRowDistance + row * CONFIG.rowSpacing;
    const rowHeight = row * CONFIG.rowHeightIncrement;

    const riserGeo = new THREE.CylinderGeometry(
      rowRadius + CONFIG.rowSpacing * 0.4,
      rowRadius + CONFIG.rowSpacing * 0.4,
      CONFIG.rowHeightIncrement,
      64,
      1,
      false,
      0,
      CONFIG.halfAngle
    );
    const riserMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a4a,
      roughness: 0.9,
    });
    const riser = new THREE.Mesh(riserGeo, riserMat);
    riser.position.y = rowHeight + CONFIG.rowHeightIncrement / 2;
    riser.rotation.y = Math.PI / 2;
    rowGroup.add(riser);

    for (let col = 0; col < CONFIG.seatsPerRow; col++) {
      const angle = -CONFIG.halfAngle / 2 + (CONFIG.halfAngle * col) / (CONFIG.seatsPerRow - 1);
      const x = Math.sin(angle) * rowRadius;
      const z = Math.cos(angle) * rowRadius;
      const y = rowHeight + CONFIG.rowHeightIncrement + CONFIG.seatHeight / 2;

      const seatGeo = new THREE.BoxGeometry(
        CONFIG.seatSize * 0.85,
        CONFIG.seatHeight,
        CONFIG.seatSize * 0.85
      );
      const seatMat = new THREE.MeshStandardMaterial({
        color: 0x1a3a6a,
        transparent: true,
        opacity: 0.75,
        roughness: 0.5,
        metalness: 0.1,
      });
      const seatMesh = new THREE.Mesh(seatGeo, seatMat);
      seatMesh.position.set(x, y, z);
      seatMesh.rotation.y = -angle;
      seatMesh.userData = { type: 'seat', row, col };

      const seatPos = new THREE.Vector3(x, y, z);
      seats.push({
        mesh: seatMesh,
        row,
        col,
        position: seatPos,
        soundPressureLevel: 75,
      });

      rowGroup.add(seatMesh);
    }

    theaterGroup.add(rowGroup);
  }

  return { group: theaterGroup, seats, stageFrontEdge };
}

export const THEATER_CONFIG = CONFIG;
