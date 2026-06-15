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

export async function generateThumbnail(
  modelUrl: string,
  format: 'gltf' | 'glb' | 'obj',
  width = 400,
  height = 300
): Promise<string> {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();

    let offscreenCanvas: HTMLCanvasElement | OffscreenCanvas;
    let useOffscreen = false;

    try {
      if (typeof OffscreenCanvas !== 'undefined') {
        offscreenCanvas = new OffscreenCanvas(width, height);
        useOffscreen = true;
      } else {
        offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = width;
        offscreenCanvas.height = height;
      }
    } catch (e) {
      offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = width;
      offscreenCanvas.height = height;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e1e2f);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({
      canvas: offscreenCanvas as HTMLCanvasElement,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

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

    const cleanup = () => {
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

    const onLoad = (object: THREE.Object3D) => {
      try {
        const optimized = optimizeModel(object);

        const box = new THREE.Box3().setFromObject(optimized);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.5 / maxDim;
        optimized.scale.setScalar(scale);
        optimized.position.sub(center.multiplyScalar(scale));

        scene.add(optimized);

        optimized.rotation.y = -Math.PI / 6;
        optimized.rotation.x = Math.PI / 8;

        const ground = new THREE.Mesh(
          new THREE.PlaneGeometry(10, 10),
          new THREE.ShadowMaterial({ transparent: true, opacity: 0.3 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -size.y * scale / 2 - 0.01;
        ground.receiveShadow = true;
        scene.add(ground);

        let frameCount = 0;
        const maxFrames = 5;

        const renderLoop = () => {
          optimized.rotation.y += 0.02;

          renderer.render(scene, camera);
          frameCount++;

          if (frameCount >= maxFrames) {
            let dataURL: string;

            if (useOffscreen && 'convertToBlob' in offscreenCanvas) {
              const offscreen = offscreenCanvas as OffscreenCanvas;
              offscreen.convertToBlob({ type: 'image/png' }).then((blob) => {
                const reader = new FileReader();
                reader.onload = () => {
                  dataURL = reader.result as string;
                  cleanup();
                  const endTime = performance.now();
                  console.log(`[Thumbnail] Generated in ${(endTime - startTime).toFixed(0)}ms`);
                  resolve(dataURL);
                };
                reader.onerror = () => {
                  cleanup();
                  reject(new Error('Failed to read blob'));
                };
                reader.readAsDataURL(blob);
              }).catch((err) => {
                try {
                  const canvas = renderer.domElement as HTMLCanvasElement;
                  dataURL = canvas.toDataURL('image/png');
                  cleanup();
                  resolve(dataURL);
                } catch (e) {
                  cleanup();
                  reject(err);
                }
              });
            } else {
              try {
                const canvas = renderer.domElement as HTMLCanvasElement;
                dataURL = canvas.toDataURL('image/png');
                cleanup();
                const endTime = performance.now();
                console.log(`[Thumbnail] Generated in ${(endTime - startTime).toFixed(0)}ms`);
                resolve(dataURL);
              } catch (e) {
                cleanup();
                reject(e);
              }
            }
          } else {
            requestAnimationFrame(renderLoop);
          }
        };

        requestAnimationFrame(renderLoop);
      } catch (e) {
        cleanup();
        reject(e);
      }
    };

    const onError = (error: unknown) => {
      cleanup();
      reject(error);
    };

    const onProgress = (xhr: ProgressEvent) => {
      if (xhr.lengthComputable) {
        const percent = (xhr.loaded / xhr.total) * 100;
        console.log(`[Thumbnail] Loading: ${percent.toFixed(0)}%`);
      }
    };

    if (format === 'gltf' || format === 'glb') {
      const loader = new GLTFLoader();
      loader.load(
        modelUrl,
        (gltf) => onLoad(gltf.scene),
        onProgress,
        onError
      );
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
      cleanup();
      reject(new Error(`Unsupported format: ${format}`));
    }

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Thumbnail generation timed out after 10s'));
    }, 10000);

    const originalReject = reject;
    reject = (reason) => {
      clearTimeout(timeout);
      originalReject(reason);
    };
  });
}

export async function generateThumbnailFromModel(
  model: THREE.Object3D,
  width = 400,
  height = 300
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e1e2f);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(1);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x06b6d4, 0.5, 20);
    pointLight.position.set(-3, 2, -3);
    scene.add(pointLight);

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2.5 / maxDim;
    model.scale.setScalar(scale);
    model.position.sub(center.multiplyScalar(scale));

    scene.add(model);
    model.rotation.y = -Math.PI / 6;
    model.rotation.x = Math.PI / 8;

    let frame = 0;
    const render = () => {
      model.rotation.y += 0.02;
      renderer.render(scene, camera);
      frame++;

      if (frame >= 3) {
        const dataURL = canvas.toDataURL('image/png');
        renderer.dispose();
        scene.remove(model);
        resolve(dataURL);
      } else {
        requestAnimationFrame(render);
      }
    };

    requestAnimationFrame(render);
  });
}
