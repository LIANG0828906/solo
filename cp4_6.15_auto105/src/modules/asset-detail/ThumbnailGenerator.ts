import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { SimplifyModifier } from 'three/examples/jsm/modifiers/SimplifyModifier.js';

const simplifyGeometry = (geometry: THREE.BufferGeometry, ratio: number = 0.5): THREE.BufferGeometry => {
  try {
    const modifier = new SimplifyModifier();
    const count = Math.floor(geometry.attributes.position.count * ratio);
    return modifier.modify(geometry, count);
  } catch (e) {
    return geometry;
  }
};

const optimizeModel = (object: THREE.Object3D, maxFaces: number = 50000): THREE.Object3D => {
  let totalFaces = 0;

  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) {
        const positionAttr = mesh.geometry.attributes.position;
        if (positionAttr) {
          const faceCount = positionAttr.count / 3;
          totalFaces += faceCount;

          if (totalFaces > maxFaces) {
            const ratio = Math.max(0.1, maxFaces / totalFaces);
            mesh.geometry = simplifyGeometry(mesh.geometry, ratio);
          }
        }
      }
    }
  });

  return object;
};

let offscreenSupportCached: boolean | null = null;

// 检测 OffscreenCanvas + WebGL 支持
// Safari 虽有 OffscreenCanvas API，但可能不支持 WebGL 上下文
// 需实际创建上下文测试，避免在 Safari 等浏览器上渲染失败
const isOffscreenCanvasSupported = (): boolean => {
  if (offscreenSupportCached !== null) {
    return offscreenSupportCached;
  }

  try {
    if (typeof OffscreenCanvas === 'undefined') {
      offscreenSupportCached = false;
      return false;
    }

    const offscreen = new OffscreenCanvas(1, 1);

    const gl = offscreen.getContext('webgl2');
    if (gl) {
      offscreenSupportCached = true;
      return true;
    }

    const gl1 = offscreen.getContext('webgl');
    if (gl1) {
      offscreenSupportCached = true;
      return true;
    }

    offscreenSupportCached = false;
    return false;
  } catch (e) {
    offscreenSupportCached = false;
    return false;
  }
};

const createScene = (): THREE.Scene => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1e1e2f);
  return scene;
};

const createCamera = (width: number, height: number): THREE.PerspectiveCamera => {
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 0, 5);
  return camera;
};

const createLights = (scene: THREE.Scene): void => {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
  directionalLight.position.set(5, 5, 5);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.set(1024, 1024);
  scene.add(directionalLight);

  const pointLight1 = new THREE.PointLight(0x06b6d4, 0.6, 20);
  pointLight1.position.set(-3, 2, -3);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0x3b82f6, 0.4, 20);
  pointLight2.position.set(3, -2, 3);
  scene.add(pointLight2);

  const rimLight = new THREE.DirectionalLight(0x8b5cf6, 0.3);
  rimLight.position.set(-5, 2, -5);
  scene.add(rimLight);
};

const setupRenderer = (
  canvas: HTMLCanvasElement | OffscreenCanvas,
  width: number,
  height: number
): THREE.WebGLRenderer => {
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas as HTMLCanvasElement,
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(width, height, false);
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  return renderer;
};

const centerAndScaleModel = (model: THREE.Object3D): { size: THREE.Vector3; scale: number } => {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 2.5 / maxDim;
  model.scale.setScalar(scale);
  model.position.sub(center.multiplyScalar(scale));

  return { size, scale };
};

const createGround = (scene: THREE.Scene, y: number): void => {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.ShadowMaterial({ transparent: true, opacity: 0.3 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = y;
  ground.receiveShadow = true;
  scene.add(ground);
};

const cleanupScene = (renderer: THREE.WebGLRenderer, scene: THREE.Scene): void => {
  renderer.dispose();
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry?.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => m.dispose());
      } else {
        child.material?.dispose();
      }
    }
  });
};

// 将 canvas 转换为 dataURL
// offscreen 模式优先使用 convertToBlob，失败时回退到 domElement.toDataURL
// preserveDrawingBuffer: true 确保能够读取像素数据
const canvasToDataURL = async (
  renderer: THREE.WebGLRenderer,
  canvas: HTMLCanvasElement | OffscreenCanvas,
  useOffscreen: boolean
): Promise<string> => {
  if (useOffscreen && 'convertToBlob' in canvas) {
    try {
      const offscreen = canvas as OffscreenCanvas;
      const blob = await offscreen.convertToBlob({ type: 'image/png' });
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read blob'));
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      try {
        const domCanvas = renderer.domElement as HTMLCanvasElement;
        return domCanvas.toDataURL('image/png');
      } catch (e2) {
        throw e;
      }
    }
  } else {
    const domCanvas = renderer.domElement as HTMLCanvasElement;
    return domCanvas.toDataURL('image/png');
  }
};

const createCanvas = (width: number, height: number): { canvas: HTMLCanvasElement | OffscreenCanvas; useOffscreen: boolean } => {
  const useOffscreen = isOffscreenCanvasSupported();

  if (useOffscreen) {
    try {
      const canvas = new OffscreenCanvas(width, height);
      return { canvas, useOffscreen: true };
    } catch (e) {
      // fall through
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return { canvas, useOffscreen: false };
};

const generatePlaceholderThumbnail = (width: number, height: number): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#1e1e2f';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#3b82f6';
    ctx.font = `${Math.floor(width / 10)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('3D', width / 2, height / 2);
  }

  return canvas.toDataURL('image/png');
};

const renderModelToCanvas = (
  model: THREE.Object3D,
  canvas: HTMLCanvasElement | OffscreenCanvas,
  useOffscreen: boolean,
  width: number,
  height: number,
  options: {
    addGround?: boolean;
    frameCount?: number;
    optimize?: boolean;
  } = {}
): Promise<string> => {
  const { addGround = true, frameCount = 5, optimize = true } = options;

  return new Promise((resolve, reject) => {
    try {
      const scene = createScene();
      const camera = createCamera(width, height);
      const renderer = setupRenderer(canvas, width, height);

      createLights(scene);

      const targetModel = optimize ? optimizeModel(model.clone(true)) : model.clone(true);

      const { size, scale } = centerAndScaleModel(targetModel);
      scene.add(targetModel);

      targetModel.rotation.y = -Math.PI / 6;
      targetModel.rotation.x = Math.PI / 8;

      if (addGround) {
        createGround(scene, -size.y * scale / 2 - 0.01);
      }

      let frames = 0;
      const maxFrames = frameCount;

      const renderLoop = () => {
        targetModel.rotation.y += 0.02;
        renderer.render(scene, camera);
        frames++;

        if (frames >= maxFrames) {
          canvasToDataURL(renderer, canvas, useOffscreen)
            .then((dataURL) => {
              cleanupScene(renderer, scene);
              resolve(dataURL);
            })
            .catch((e) => {
              cleanupScene(renderer, scene);
              reject(e);
            });
        } else {
          requestAnimationFrame(renderLoop);
        }
      };

      requestAnimationFrame(renderLoop);
    } catch (e) {
      reject(e);
    }
  });
};

// 缩略图生成选项
// 支持超时回调、自定义超时时间、降级到占位图等功能
export interface ThumbnailOptions {
  onTimeout?: () => void;
  timeoutMs?: number;
  fallbackToPlaceholder?: boolean;
}

export async function generateThumbnail(
  modelUrl: string,
  format: 'gltf' | 'glb' | 'obj',
  width = 400,
  height = 300,
  options?: ThumbnailOptions
): Promise<string> {
  const {
    onTimeout,
    timeoutMs = 10000,
    fallbackToPlaceholder = true,
  } = options || {};

  return new Promise((resolve, reject) => {
    const startTime = performance.now();

    const { canvas, useOffscreen } = createCanvas(width, height);

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let isTimedOut = false;

    const cleanupAndReject = (reason: unknown) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      reject(reason);
    };

    const cleanupAndResolve = (dataURL: string) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      const endTime = performance.now();
      console.log(`[Thumbnail] Generated in ${(endTime - startTime).toFixed(0)}ms`);
      resolve(dataURL);
    };

    const handleTimeout = () => {
      if (isTimedOut) return;
      isTimedOut = true;

      if (onTimeout) {
        onTimeout();
      }

      if (fallbackToPlaceholder) {
        const placeholder = generatePlaceholderThumbnail(width, height);
        console.warn('[Thumbnail] Generation timed out, using placeholder');
        resolve(placeholder);
      } else {
        reject(new Error('Thumbnail generation timed out'));
      }
    };

    timeoutId = setTimeout(handleTimeout, timeoutMs);

    const onLoad = (object: THREE.Object3D) => {
      if (isTimedOut) return;

      try {
        renderModelToCanvas(object, canvas, useOffscreen, width, height, {
          addGround: true,
          frameCount: 5,
          optimize: true,
        })
          .then(cleanupAndResolve)
          .catch(cleanupAndReject);
      } catch (e) {
        cleanupAndReject(e);
      }
    };

    const onError = (error: unknown) => {
      if (isTimedOut) return;
      cleanupAndReject(error);
    };

    const onProgress = (xhr: ProgressEvent) => {
      if (xhr.lengthComputable) {
        const percent = (xhr.loaded / xhr.total) * 100;
        console.log(`[Thumbnail] Loading: ${percent.toFixed(0)}%`);
      }
    };

    try {
      if (format === 'gltf' || format === 'glb') {
        const loader = new GLTFLoader();
        loader.load(modelUrl, (gltf) => onLoad(gltf.scene), onProgress, onError);
      } else if (format === 'obj') {
        const loader = new OBJLoader();
        loader.load(
          modelUrl,
          (object) => {
            object.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.material = new THREE.MeshStandardMaterial({
                  color: 0x888888,
                  metalness: 0.3,
                  roughness: 0.7,
                });
              }
            });
            onLoad(object);
          },
          onProgress,
          onError
        );
      } else {
        cleanupAndReject(new Error(`Unsupported format: ${format}`));
      }
    } catch (e) {
      cleanupAndReject(e);
    }
  });
}

export async function generateThumbnailFromModel(
  model: THREE.Object3D,
  width = 400,
  height = 300
): Promise<string> {
  const { canvas, useOffscreen } = createCanvas(width, height);

  return renderModelToCanvas(model, canvas, useOffscreen, width, height, {
    addGround: false,
    frameCount: 3,
    optimize: false,
  });
}
