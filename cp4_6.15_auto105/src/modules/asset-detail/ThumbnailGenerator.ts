import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

export async function generateThumbnail(
  modelUrl: string,
  format: 'gltf' | 'glb' | 'obj',
  width = 400,
  height = 300
): Promise<string> {
  return new Promise((resolve, reject) => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e1e2f);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0x06b6d4, 0.5, 20);
    pointLight1.position.set(-3, 2, -3);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x3b82f6, 0.3, 20);
    pointLight2.position.set(3, -2, 3);
    scene.add(pointLight2);

    const onLoad = (object: THREE.Object3D) => {
      const box = new THREE.Box3().setFromObject(object);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2.5 / maxDim;
      object.scale.setScalar(scale);
      object.position.sub(center.multiplyScalar(scale));

      scene.add(object);

      object.rotation.y = -Math.PI / 6;
      object.rotation.x = Math.PI / 8;

      renderer.render(scene, camera);

      const dataURL = renderer.domElement.toDataURL('image/png');

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

      resolve(dataURL);
    };

    const onError = (error: unknown) => {
      renderer.dispose();
      reject(error);
    };

    if (format === 'gltf' || format === 'glb') {
      const loader = new GLTFLoader();
      loader.load(
        modelUrl,
        (gltf) => onLoad(gltf.scene),
        undefined,
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
        undefined,
        onError
      );
    } else {
      reject(new Error(`Unsupported format: ${format}`));
    }
  });
}
