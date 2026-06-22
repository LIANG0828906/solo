import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

const modelCache = new Map<string, THREE.Scene>();

const gltfLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
gltfLoader.setDRACOLoader(dracoLoader);

export interface LoadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface LoadCallbacks {
  onProgress?: (progress: LoadProgress) => void;
  onError?: (error: Error) => void;
  onComplete?: (scene: THREE.Scene) => void;
}

export async function loadModel(
  url: string,
  callbacks: LoadCallbacks = {}
): Promise<THREE.Scene> {
  const { onProgress, onError, onComplete } = callbacks;

  if (modelCache.has(url)) {
    const cachedScene = modelCache.get(url)!;
    const clonedScene = cachedScene.clone(true);
    onComplete?.(clonedScene);
    return clonedScene;
  }

  return new Promise((resolve, reject) => {
    gltfLoader.load(
      url,
      (gltf) => {
        const scene = gltf.scene;
        modelCache.set(url, scene.clone(true));
        onComplete?.(scene);
        resolve(scene);
      },
      (xhr) => {
        if (xhr.lengthComputable) {
          const progress: LoadProgress = {
            loaded: xhr.loaded,
            total: xhr.total,
            percentage: Math.round((xhr.loaded / xhr.total) * 100)
          };
          onProgress?.(progress);
        }
      },
      (error) => {
        const err = error instanceof Error ? error : new Error(String(error));
        onError?.(err);
        reject(err);
      }
    );
  });
}

export function clearCache(): void {
  modelCache.clear();
}

export function hasModel(url: string): boolean {
  return modelCache.has(url);
}
