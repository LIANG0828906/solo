import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';

export function extractVertices(group: THREE.Group): Map<string, Float32Array> {
  const vertices = new Map<string, Float32Array>();
  group.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const geometry = mesh.geometry;
      const position = geometry.getAttribute('position');
      if (position) {
        vertices.set(mesh.uuid, new Float32Array(position.array as Float32Array));
      }
    }
  });
  return vertices;
}

export class ModelLoader {
  static load(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ group: THREE.Group; boundingBox: THREE.Box3; originalVertices: Map<string, Float32Array> }> {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();

      const reader = new FileReader();

      reader.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress(Math.round((event.loaded / event.total) * 50));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;

        if (onProgress) {
          onProgress(50);
        }

        loader.parse(
          arrayBuffer,
          '',
          (gltf) => {
            const group = gltf.scene;

            if (onProgress) {
              onProgress(100);
            }

            const boundingBox = new THREE.Box3().setFromObject(group);
            const originalVertices = extractVertices(group);

            resolve({ group, boundingBox, originalVertices });
          },
          (error) => {
            reject(error);
          }
        );
      };

      reader.readAsArrayBuffer(file);
    });
  }
}
