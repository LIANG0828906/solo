import * as THREE from 'three';

export interface BuildingParams {
  width: number;
  depth: number;
  floorHeight: number;
  floors: number;
}

export function createBuildingModel(params: BuildingParams): THREE.Group {
  const { width, depth, floorHeight, floors } = params;
  const buildingGroup = new THREE.Group();
  buildingGroup.name = 'Building';

  const totalHeight = floorHeight * floors;

  const buildingMaterial = new THREE.MeshStandardMaterial({
    color: 0xcfd8dc,
    roughness: 0.7,
    metalness: 0.1,
  });

  const buildingGeometry = new THREE.BoxGeometry(width, totalHeight, depth);
  const buildingMesh = new THREE.Mesh(buildingGeometry, buildingMaterial);
  buildingMesh.position.y = totalHeight / 2;
  buildingMesh.castShadow = true;
  buildingMesh.receiveShadow = true;
  buildingGroup.add(buildingMesh);

  const edgeGeometry = new THREE.EdgesGeometry(buildingGeometry);
  const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 1 });
  const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
  edges.position.y = totalHeight / 2;
  buildingGroup.add(edges);

  for (let f = 1; f < floors; f++) {
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-width / 2, f * floorHeight, -depth / 2),
      new THREE.Vector3(width / 2, f * floorHeight, -depth / 2),
      new THREE.Vector3(width / 2, f * floorHeight, depth / 2),
      new THREE.Vector3(-width / 2, f * floorHeight, depth / 2),
      new THREE.Vector3(-width / 2, f * floorHeight, -depth / 2),
    ]);
    const floorLine = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true }));
    buildingGroup.add(floorLine);
  }

  const windowMaterial = new THREE.MeshStandardMaterial({
    color: 0x64b5f6,
    roughness: 0.3,
    metalness: 0.6,
    emissive: 0x1976d2,
    emissiveIntensity: 0.1,
  });

  const windowWidth = width * 0.15;
  const windowHeight = floorHeight * 0.5;
  const windowDepth = 0.05;
  const windowsPerSide = Math.floor(width / (windowWidth * 2.5));
  const windowsPerDepth = Math.floor(depth / (windowWidth * 2.5));

  for (let f = 0; f < floors; f++) {
    const yPos = f * floorHeight + floorHeight * 0.55;

    for (let w = 0; w < windowsPerSide; w++) {
      const xSpacing = width / (windowsPerSide + 1);
      const xPos = -width / 2 + xSpacing * (w + 1);

      const frontWindow = new THREE.Mesh(
        new THREE.BoxGeometry(windowWidth, windowHeight, windowDepth),
        windowMaterial
      );
      frontWindow.position.set(xPos, yPos, depth / 2 + 0.01);
      frontWindow.castShadow = false;
      buildingGroup.add(frontWindow);

      const backWindow = frontWindow.clone();
      backWindow.position.set(xPos, yPos, -depth / 2 - 0.01);
      buildingGroup.add(backWindow);
    }

    for (let w = 0; w < windowsPerDepth; w++) {
      const zSpacing = depth / (windowsPerDepth + 1);
      const zPos = -depth / 2 + zSpacing * (w + 1);

      const rightWindow = new THREE.Mesh(
        new THREE.BoxGeometry(windowDepth, windowHeight, windowWidth),
        windowMaterial
      );
      rightWindow.position.set(width / 2 + 0.01, yPos, zPos);
      rightWindow.castShadow = false;
      buildingGroup.add(rightWindow);

      const leftWindow = rightWindow.clone();
      leftWindow.position.set(-width / 2 - 0.01, yPos, zPos);
      buildingGroup.add(leftWindow);
    }
  }

  return buildingGroup;
}

export function getRoofDimensions(params: BuildingParams): { width: number; depth: number; height: number } {
  return {
    width: params.width,
    depth: params.depth,
    height: params.floorHeight * params.floors,
  };
}
