import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import type { GroupInfo } from './types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function getMeshColor(mesh: THREE.Mesh): string {
  const material = mesh.material;
  if (Array.isArray(material)) {
    const firstMat = material[0];
    if (firstMat instanceof THREE.MeshStandardMaterial || firstMat instanceof THREE.MeshBasicMaterial || firstMat instanceof THREE.MeshPhongMaterial) {
      return '#' + firstMat.color.getHexString();
    }
  }
  if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshBasicMaterial || material instanceof THREE.MeshPhongMaterial) {
    return '#' + material.color.getHexString();
  }
  const randomColor = new THREE.Color().setHSL(Math.random(), 0.6, 0.5);
  return '#' + randomColor.getHexString();
}

function countVerticesAndFaces(geometry: THREE.BufferGeometry): { vertexCount: number; faceCount: number } {
  const position = geometry.getAttribute('position');
  const vertexCount = position ? position.count : 0;
  let faceCount = 0;
  if (geometry.index) {
    faceCount = geometry.index.count / 3;
  } else if (position) {
    faceCount = position.count / 3;
  }
  return { vertexCount, faceCount: Math.floor(faceCount) };
}

function extractMeshes(object: THREE.Object3D): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = [];
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      meshes.push(child);
    }
  });
  return meshes;
}

function computeExplodeDirection(mesh: THREE.Mesh, modelCenter: THREE.Vector3): THREE.Vector3 {
  const meshWorldPos = new THREE.Vector3();
  mesh.getWorldPosition(meshWorldPos);
  const direction = meshWorldPos.clone().sub(modelCenter);
  if (direction.lengthSq() < 0.0001) {
    const geometry = mesh.geometry;
    geometry.computeVertexNormals();
    const normalAttr = geometry.getAttribute('normal');
    if (normalAttr && normalAttr.count > 0) {
      const avgNormal = new THREE.Vector3();
      const normal = new THREE.Vector3();
      for (let i = 0; i < normalAttr.count; i++) {
        normal.fromBufferAttribute(normalAttr, i);
        avgNormal.add(normal);
      }
      avgNormal.normalize();
      return avgNormal;
    }
    return new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
  }
  return direction.normalize();
}

export function loadModelFromFile(file: File): Promise<{ groups: GroupInfo[]; root: THREE.Object3D }> {
  return new Promise((resolve, reject) => {
    const fileName = file.name.toLowerCase();
    const reader = new FileReader();

    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      if (!arrayBuffer) {
        reject(new Error('Failed to read file'));
        return;
      }

      if (fileName.endsWith('.gltf') || fileName.endsWith('.glb')) {
        loadGLTF(arrayBuffer, fileName.endsWith('.glb'), resolve, reject);
      } else if (fileName.endsWith('.obj')) {
        loadOBJ(arrayBuffer, resolve, reject);
      } else {
        reject(new Error('Unsupported file format'));
      }
    };

    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsArrayBuffer(file);
  });
}

function loadGLTF(
  arrayBuffer: ArrayBuffer,
  isBinary: boolean,
  resolve: (value: { groups: GroupInfo[]; root: THREE.Object3D }) => void,
  reject: (reason: Error) => void
) {
  const loader = new GLTFLoader();
  try {
    const parseCallback = (gltf: { scene: THREE.Group }) => {
      const root = gltf.scene;
      processLoadedRoot(root, resolve, reject);
    };
    const errorCallback = (err: unknown) => {
      if (err instanceof Error) {
        reject(err);
      } else if (err instanceof ErrorEvent) {
        reject(new Error(err.message || 'GLTF parsing error'));
      } else {
        reject(new Error(String(err)));
      }
    };
    if (isBinary) {
      loader.parse(arrayBuffer, '', parseCallback, errorCallback);
    } else {
      const decoder = new TextDecoder();
      const text = decoder.decode(arrayBuffer);
      loader.parse(text, '', parseCallback, errorCallback);
    }
  } catch (err) {
    reject(err as Error);
  }
}

function loadOBJ(
  arrayBuffer: ArrayBuffer,
  resolve: (value: { groups: GroupInfo[]; root: THREE.Object3D }) => void,
  reject: (reason: Error) => void
) {
  try {
    const loader = new OBJLoader();
    const decoder = new TextDecoder();
    const text = decoder.decode(arrayBuffer);
    const root = loader.parse(text);
    root.traverse((child) => {
      if (child instanceof THREE.Mesh && !child.material) {
        child.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color().setHSL(Math.random(), 0.5, 0.5),
          metalness: 0.3,
          roughness: 0.7
        });
      }
    });
    processLoadedRoot(root, resolve, reject);
  } catch (err) {
    reject(err as Error);
  }
}

function processLoadedRoot(
  root: THREE.Object3D,
  resolve: (value: { groups: GroupInfo[]; root: THREE.Object3D }) => void,
  _reject: (reason: Error) => void
) {
  const meshes = extractMeshes(root);
  const box = new THREE.Box3().setFromObject(root);
  const center = new THREE.Vector3();
  box.getCenter(center);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = maxDim > 0 ? 10 / maxDim : 1;
  root.scale.setScalar(scale);
  root.position.sub(center.multiplyScalar(scale));

  const groups: GroupInfo[] = meshes.map((mesh, index) => {
    const worldPos = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);
    const { vertexCount, faceCount } = countVerticesAndFaces(mesh.geometry);
    const explodeDir = computeExplodeDirection(mesh, new THREE.Vector3(0, 0, 0));
    const randomAngle = (Math.random() - 0.5) * 10 * (Math.PI / 180);

    return {
      id: generateId(),
      name: mesh.name || `Part_${index + 1}`,
      color: getMeshColor(mesh),
      mesh,
      initialPosition: worldPos.clone(),
      initialMatrix: mesh.matrix.clone(),
      vertexCount,
      faceCount,
      selected: true,
      explodeOffset: explodeDir,
      randomAngle
    } as GroupInfo;
  });

  resolve({ groups, root });
}
