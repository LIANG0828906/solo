import * as THREE from 'three';

export interface SceneModule {
  group: THREE.Group;
  update: (time: number) => void;
}

const STREET_LENGTH = 200;
const STREET_WIDTH = 16;
const LANE_COUNT = 4;
const BUILDING_GAP = 2;
const WINDOW_PULSE_PERIOD = 1.5;

export function createScene(): SceneModule {
  const group = new THREE.Group();
  const windowLights: { mesh: THREE.Mesh; phase: number; baseIntensity: number }[] = [];

  createStreet(group);
  createLaneLines(group);
  const buildings = createBuildings(windowLights);
  group.add(buildings);

  function update(time: number): void {
    const pulseFreq = (Math.PI * 2) / WINDOW_PULSE_PERIOD;
    for (const light of windowLights) {
      const normSin = 0.5 + 0.5 * Math.sin(time * pulseFreq + light.phase);
      const pulse = 0.6 + 0.4 * normSin;
      const material = light.mesh.material as THREE.MeshBasicMaterial;
      material.opacity = pulse;
    }
  }

  return { group, update };
}

function createStreet(parent: THREE.Group): void {
  const geometry = new THREE.PlaneGeometry(STREET_WIDTH, STREET_LENGTH);
  const material = new THREE.MeshStandardMaterial({
    color: 0x555555,
    roughness: 0.9,
    metalness: 0.1,
  });
  const street = new THREE.Mesh(geometry, material);
  street.rotation.x = -Math.PI / 2;
  street.receiveShadow = true;
  parent.add(street);

  const sidewalkGeo = new THREE.BoxGeometry(STREET_WIDTH + 4, 0.3, 0.5);
  const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
  
  const sidewalk1 = new THREE.Mesh(sidewalkGeo, sidewalkMat);
  sidewalk1.position.set(0, -0.15, STREET_LENGTH / 2 + 0.25);
  parent.add(sidewalk1);
  
  const sidewalk2 = new THREE.Mesh(sidewalkGeo, sidewalkMat);
  sidewalk2.position.set(0, -0.15, -STREET_LENGTH / 2 - 0.25);
  parent.add(sidewalk2);

  const groundGeo = new THREE.PlaneGeometry(300, 300);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x222233 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  parent.add(ground);
}

function createLaneLines(parent: THREE.Group): void {
  const laneWidth = STREET_WIDTH / LANE_COUNT;
  const dashLength = 3;
  const gapLength = 2;
  const segmentLength = dashLength + gapLength;
  const segmentCount = Math.floor(STREET_LENGTH / segmentLength);

  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.8, transparent: true });

  for (let lane = 1; lane < LANE_COUNT; lane++) {
    if (lane === LANE_COUNT / 2) continue;
    
    const x = -STREET_WIDTH / 2 + lane * laneWidth;
    const points: THREE.Vector3[] = [];

    for (let i = 0; i < segmentCount; i++) {
      const zStart = -STREET_LENGTH / 2 + i * segmentLength;
      points.push(new THREE.Vector3(x, 0.01, zStart));
      points.push(new THREE.Vector3(x, 0.01, zStart + dashLength));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.LineSegments(geometry, lineMaterial);
    parent.add(line);
  }

  const centerLineMaterial = new THREE.LineBasicMaterial({ color: 0xffdd00, opacity: 0.9, transparent: true });
  const centerX = 0;
  const centerPoints: THREE.Vector3[] = [];
  for (let i = 0; i < segmentCount; i++) {
    const zStart = -STREET_LENGTH / 2 + i * segmentLength;
    centerPoints.push(new THREE.Vector3(centerX, 0.01, zStart));
    centerPoints.push(new THREE.Vector3(centerX, 0.01, zStart + dashLength));
  }
  const centerGeometry = new THREE.BufferGeometry().setFromPoints(centerPoints);
  const centerLine = new THREE.LineSegments(centerGeometry, centerLineMaterial);
  parent.add(centerLine);
}

function createBuildings(
  windowLights: { mesh: THREE.Mesh; phase: number; baseIntensity: number }[]
): THREE.Group {
  const buildingGroup = new THREE.Group();
  const buildingColors = [0x4a4a4a, 0x555555, 0x606060, 0x6b6b6b, 0x777777];

  const leftBuildings = createBuildingRow(
    -STREET_WIDTH / 2 - BUILDING_GAP,
    buildingColors,
    windowLights
  );
  const rightBuildings = createBuildingRow(
    STREET_WIDTH / 2 + BUILDING_GAP,
    buildingColors,
    windowLights
  );

  buildingGroup.add(leftBuildings);
  buildingGroup.add(rightBuildings);

  return buildingGroup;
}

function createBuildingRow(
  xBase: number,
  colors: number[],
  windowLights: { mesh: THREE.Mesh; phase: number; baseIntensity: number }[]
): THREE.Group {
  const rowGroup = new THREE.Group();
  const buildingWidth = 8;
  const buildingDepth = 6;
  const spacing = 10;
  const count = Math.floor(STREET_LENGTH / spacing) - 2;

  const colorGroups: { [color: number]: THREE.BoxGeometry[] } = {};
  const buildingData: { x: number; y: number; z: number; height: number; color: number }[] = [];

  for (let i = 0; i < count; i++) {
    const z = -STREET_LENGTH / 2 + (i + 1) * spacing;
    const height = 10 + Math.random() * 20;
    const color = colors[Math.floor(Math.random() * colors.length)];

    const geo = new THREE.BoxGeometry(buildingWidth, height, buildingDepth);
    geo.translate(xBase, height / 2, z);

    if (!colorGroups[color]) {
      colorGroups[color] = [];
    }
    colorGroups[color].push(geo);

    buildingData.push({ x: xBase, y: height / 2, z, height, color });
  }

  for (const colorStr of Object.keys(colorGroups)) {
    const color = parseInt(colorStr);
    const geos = colorGroups[color];
    
    if (geos.length > 0) {
      const mergedGeo = mergeGeometries(geos);
      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.7,
        metalness: 0.2,
      });
      const mergedMesh = new THREE.Mesh(mergedGeo, material);
      mergedMesh.castShadow = true;
      mergedMesh.receiveShadow = true;
      rowGroup.add(mergedMesh);
    }

    geos.forEach((g) => g.dispose());
  }

  for (const data of buildingData) {
    addWindows(rowGroup, data.x, data.y, data.z, buildingWidth, data.height, buildingDepth, windowLights);
  }

  return rowGroup;
}

function mergeGeometries(geometries: THREE.BoxGeometry[]): THREE.BufferGeometry {
  if (geometries.length === 0) return new THREE.BufferGeometry();
  if (geometries.length === 1) return geometries[0];

  let totalVertices = 0;
  let totalIndices = 0;

  for (const geo of geometries) {
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    totalVertices += posAttr.count;
    if (geo.index) {
      totalIndices += geo.index.count;
    } else {
      totalIndices += posAttr.count;
    }
  }

  const mergedPositions = new Float32Array(totalVertices * 3);
  const mergedNormals = new Float32Array(totalVertices * 3);
  const mergedUvs = new Float32Array(totalVertices * 2);
  const mergedIndices = new Uint32Array(totalIndices);

  let vertexOffset = 0;
  let indexOffset = 0;

  for (const geo of geometries) {
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const normAttr = geo.attributes.normal as THREE.BufferAttribute;
    const uvAttr = geo.attributes.uv as THREE.BufferAttribute;

    const vertexCount = posAttr.count;
    
    for (let i = 0; i < vertexCount; i++) {
      mergedPositions[(vertexOffset + i) * 3] = posAttr.getX(i);
      mergedPositions[(vertexOffset + i) * 3 + 1] = posAttr.getY(i);
      mergedPositions[(vertexOffset + i) * 3 + 2] = posAttr.getZ(i);
      
      mergedNormals[(vertexOffset + i) * 3] = normAttr.getX(i);
      mergedNormals[(vertexOffset + i) * 3 + 1] = normAttr.getY(i);
      mergedNormals[(vertexOffset + i) * 3 + 2] = normAttr.getZ(i);
      
      if (uvAttr) {
        mergedUvs[(vertexOffset + i) * 2] = uvAttr.getX(i);
        mergedUvs[(vertexOffset + i) * 2 + 1] = uvAttr.getY(i);
      }
    }

    if (geo.index) {
      const indexAttr = geo.index as THREE.BufferAttribute;
      for (let i = 0; i < indexAttr.count; i++) {
        mergedIndices[indexOffset + i] = indexAttr.getX(i) + vertexOffset;
      }
      indexOffset += indexAttr.count;
    } else {
      for (let i = 0; i < vertexCount; i++) {
        mergedIndices[indexOffset + i] = i + vertexOffset;
      }
      indexOffset += vertexCount;
    }

    vertexOffset += vertexCount;
  }

  const mergedGeometry = new THREE.BufferGeometry();
  mergedGeometry.setAttribute('position', new THREE.BufferAttribute(mergedPositions, 3));
  mergedGeometry.setAttribute('normal', new THREE.BufferAttribute(mergedNormals, 3));
  mergedGeometry.setAttribute('uv', new THREE.BufferAttribute(mergedUvs, 2));
  mergedGeometry.setIndex(new THREE.BufferAttribute(mergedIndices, 1));

  return mergedGeometry;
}

function addWindows(
  parent: THREE.Group,
  buildingX: number,
  buildingY: number,
  buildingZ: number,
  width: number,
  height: number,
  depth: number,
  windowLights: { mesh: THREE.Mesh; phase: number; baseIntensity: number }[]
): void {
  const windowRows = Math.floor(height / 3);
  const windowCols = 3;
  const windowW = width * 0.2;
  const windowH = 1.2;

  for (let row = 0; row < windowRows; row++) {
    for (let col = 0; col < windowCols; col++) {
      if (Math.random() > 0.5) {
        const y = buildingY - height / 2 + row * 3 + 2;
        const xOffset = -width * 0.3 + col * width * 0.3;

        const windowGeo = new THREE.PlaneGeometry(windowW, windowH);
        const windowMat = new THREE.MeshBasicMaterial({
          color: 0xffdd55,
          transparent: true,
          opacity: 0.8,
        });

        const windowFront = new THREE.Mesh(windowGeo, windowMat);
        windowFront.position.set(buildingX + xOffset, y, buildingZ + depth / 2 + 0.01);
        parent.add(windowFront);

        const windowBack = new THREE.Mesh(windowGeo, windowMat.clone());
        windowBack.position.set(buildingX + xOffset, y, buildingZ - depth / 2 - 0.01);
        windowBack.rotation.y = Math.PI;
        parent.add(windowBack);

        windowLights.push(
          { mesh: windowFront, phase: Math.random() * Math.PI * 2, baseIntensity: 0.8 },
          { mesh: windowBack, phase: Math.random() * Math.PI * 2, baseIntensity: 0.8 }
        );
      }
    }
  }
}

export const sceneConfig = {
  streetLength: STREET_LENGTH,
  streetWidth: STREET_WIDTH,
  laneCount: LANE_COUNT,
};
