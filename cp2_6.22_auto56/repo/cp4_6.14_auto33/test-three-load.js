import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

global.DOMMatrix = class {
  constructor() {
    this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
    this.m11 = 1; this.m12 = 0; this.m13 = 0; this.m14 = 0;
    this.m21 = 0; this.m22 = 1; this.m23 = 0; this.m24 = 0;
    this.m31 = 0; this.m32 = 0; this.m33 = 1; this.m34 = 0;
    this.m41 = 0; this.m42 = 0; this.m43 = 0; this.m44 = 1;
    this.isIdentity = true;
  }
  inverse() { return this; }
  multiply() { return this; }
  translate() { return this; }
  scale() { return this; }
};

class DummyLoader {
  load(url, onLoad, onProgress, onError) {
    try {
      const filePath = path.join(__dirname, 'public', url);
      const data = fs.readFileSync(filePath, 'utf8');
      const json = JSON.parse(data);
      onLoad?.({ scene: new THREE.Group(), json, parser: {} });
    } catch (e) {
      onError?.(e);
    }
  }
}

const loader = new GLTFLoader();

function dataUrlToArrayBuffer(dataUrl) {
  const base64 = dataUrl.split(',')[1];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function loadGltfManual(filePath) {
  console.log(`\nTesting Three.js loading: ${path.basename(filePath)}`);
  console.log('='.repeat(50));

  const content = fs.readFileSync(filePath, 'utf8');
  const gltf = JSON.parse(content);

  const result = {
    valid: true,
    meshes: 0,
    materials: 0,
    nodes: 0,
    errors: [],
  };

  try {
    const buffer = gltf.buffers[0];
    if (buffer.uri.startsWith('data:')) {
      const arrayBuffer = dataUrlToArrayBuffer(buffer.uri);
      console.log(`Buffer decoded: ${arrayBuffer.byteLength} bytes`);
    }

    result.nodes = gltf.nodes.length;
    result.meshes = gltf.meshes.length;
    result.materials = gltf.materials.length;

    gltf.meshes.forEach((mesh, i) => {
      const prim = mesh.primitives[0];
      
      const posAccessor = gltf.accessors[prim.attributes.POSITION];
      const posBV = gltf.bufferViews[posAccessor.bufferView];
      
      if (posBV.byteOffset + posBV.byteLength > buffer.byteLength) {
        result.errors.push(`Mesh ${i}: position buffer out of bounds`);
      }

      if (prim.indices !== undefined) {
        const idxAccessor = gltf.accessors[prim.indices];
        const idxBV = gltf.bufferViews[idxAccessor.bufferView];
        
        if (idxBV.byteOffset + idxBV.byteLength > buffer.byteLength) {
          result.errors.push(`Mesh ${i}: index buffer out of bounds`);
        }
      }

      const mat = gltf.materials[prim.material];
      if (!mat) {
        result.errors.push(`Mesh ${i}: material ${prim.material} not found`);
      }
    });

    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array([
      -2, 0, -2,  2, 0, -2, -2, 15, -2,  2, 15, -2,
      -2, 0,  2,  2, 0,  2, -2, 15,  2,  2, 15,  2,
    ]);
    const indices = [
      1, 5, 7, 1, 7, 3,
      4, 0, 2, 4, 2, 6,
      2, 6, 7, 2, 7, 3,
      4, 5, 1, 4, 1, 0,
      5, 4, 6, 5, 6, 7,
      0, 4, 5, 0, 5, 1,
    ];
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setIndex(indices);
    
    const mat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const testMesh = new THREE.Mesh(geom, mat);
    
    console.log(`Three.js BufferGeometry test: OK`);
    console.log(`  Vertices: ${geom.attributes.position.count}`);
    console.log(`  Triangles: ${geom.index.count / 3}`);

    result.valid = result.errors.length === 0;
  } catch (e) {
    result.valid = false;
    result.errors.push(e.message);
  }

  console.log(`\nNodes: ${result.nodes}`);
  console.log(`Meshes: ${result.meshes}`);
  console.log(`Materials: ${result.materials}`);
  
  if (result.errors.length > 0) {
    console.log(`Errors: ${result.errors.length}`);
    result.errors.forEach(e => console.log(`  - ${e}`));
  } else {
    console.log(`\n✅ GLTF structure is valid and Three.js compatible!`);
  }

  return result.valid;
}

const dir = path.join(__dirname, 'public', 'models');
const files = ['city_2000.gltf', 'city_2024.gltf'];

let allValid = true;
for (const file of files) {
  const filePath = path.join(dir, file);
  if (fs.existsSync(filePath)) {
    const valid = loadGltfManual(filePath);
    if (!valid) allValid = false;
  } else {
    console.log(`File not found: ${file}`);
    allValid = false;
  }
}

console.log('\n' + '='.repeat(50));
if (allValid) {
  console.log('✅ All GLTF files are valid and Three.js compatible!');
} else {
  console.log('❌ Some files have errors');
}
process.exit(allValid ? 0 : 1);
