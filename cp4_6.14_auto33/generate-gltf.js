import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateCubeData(height = 1) {
  const w2 = 2;
  const d2 = 2;
  const h = height;

  const positions = new Float32Array([
    -w2, 0, -d2,
     w2, 0, -d2,
    -w2, h, -d2,
     w2, h, -d2,
    -w2, 0,  d2,
     w2, 0,  d2,
    -w2, h,  d2,
     w2, h,  d2,
  ]);

  const indices = new Uint16Array([
    1, 5, 7, 1, 7, 3,
    4, 0, 2, 4, 2, 6,
    2, 6, 7, 2, 7, 3,
    4, 5, 1, 4, 1, 0,
    5, 4, 6, 5, 6, 7,
    0, 4, 5, 0, 5, 1,
  ]);

  return { positions, indices };
}

function createBuildingGltf(buildings, sceneName) {
  const numBuildings = buildings.length;

  let totalByteLength = 0;
  const buildingData = buildings.map((b, i) => {
    const { positions, indices } = generateCubeData(b.height);
    const posByteOffset = totalByteLength;
    totalByteLength += positions.byteLength;
    const idxByteOffset = totalByteLength;
    totalByteLength += indices.byteLength;
    while (totalByteLength % 4 !== 0) totalByteLength++;
    return { positions, indices, posByteOffset, idxByteOffset, ...b };
  });

  const buffer = new ArrayBuffer(totalByteLength);
  const uint8View = new Uint8Array(buffer);

  buildingData.forEach((bd) => {
    const posBytes = new Uint8Array(bd.positions.buffer);
    uint8View.set(posBytes, bd.posByteOffset);
    const idxBytes = new Uint8Array(bd.indices.buffer);
    uint8View.set(idxBytes, bd.idxByteOffset);
  });

  let binary = '';
  for (let i = 0; i < uint8View.length; i++) {
    binary += String.fromCharCode(uint8View[i]);
  }
  const base64Data = btoa(binary);

  const nodes = buildingData.map((bd, i) => ({
    name: bd.name,
    mesh: i,
    translation: [bd.position[0], 0, bd.position[2]],
  }));

  const meshes = buildingData.map((bd, i) => ({
    primitives: [{
      attributes: { POSITION: i * 2 },
      indices: i * 2 + 1,
      material: i,
    }],
  }));

  const materials = buildings.map((b, i) => ({
    name: `Mat_${i}`,
    pbrMetallicRoughness: {
      baseColorFactor: b.colorFactor,
      metallicFactor: 0.1,
      roughnessFactor: 0.8,
    },
  }));

  const accessors = [];
  const bufferViews = [];

  buildingData.forEach((bd, i) => {
    const posAccessorIdx = i * 2;
    const idxAccessorIdx = i * 2 + 1;

    const posBV = {
      buffer: 0,
      byteOffset: bd.posByteOffset,
      byteLength: bd.positions.byteLength,
      target: 34962,
    };
    bufferViews.push(posBV);

    const posAccessor = {
      bufferView: posAccessorIdx,
      componentType: 5126,
      count: 8,
      type: 'VEC3',
      min: [-2, 0, -2],
      max: [2, bd.height, 2],
    };
    accessors.push(posAccessor);

    const idxBV = {
      buffer: 0,
      byteOffset: bd.idxByteOffset,
      byteLength: bd.indices.byteLength,
      target: 34963,
    };
    bufferViews.push(idxBV);

    const idxAccessor = {
      bufferView: idxAccessorIdx,
      componentType: 5123,
      count: 36,
      type: 'SCALAR',
      min: [0],
      max: [7],
    };
    accessors.push(idxAccessor);
  });

  const gltf = {
    asset: {
      version: '2.0',
      generator: 'CityEvolution3D-Generator',
    },
    scene: 0,
    scenes: [{
      name: sceneName,
      nodes: buildingData.map((_, i) => i),
    }],
    nodes,
    meshes,
    materials,
    accessors,
    bufferViews,
    buffers: [{
      byteLength: totalByteLength,
      uri: `data:application/octet-stream;base64,${base64Data}`,
    }],
  };

  return gltf;
}

function hexToRgbFactor(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255,
    1,
  ] : [1, 1, 1, 1];
}

const buildings2000 = [
  { name: '市政大楼', position: [-8, 0, -8], height: 15, color: '#8B4513', colorFactor: hexToRgbFactor('#8B4513') },
  { name: '商业中心', position: [8, 0, -8], height: 20, color: '#4682B4', colorFactor: hexToRgbFactor('#4682B4') },
  { name: '文化艺术馆', position: [-8, 0, 8], height: 12, color: '#2E8B57', colorFactor: hexToRgbFactor('#2E8B57') },
  { name: '居民小区A区', position: [8, 0, 8], height: 8, color: '#CD853F', colorFactor: hexToRgbFactor('#CD853F') },
  { name: '交通枢纽', position: [0, 0, 0], height: 10, color: '#708090', colorFactor: hexToRgbFactor('#708090') },
];

const buildings2024 = [
  { name: '金融中心大厦', position: [-8, 0, -8], height: 45, color: '#1E90FF', colorFactor: hexToRgbFactor('#1E90FF') },
  { name: '环球商业广场', position: [8, 0, -8], height: 35, color: '#FF6347', colorFactor: hexToRgbFactor('#FF6347') },
  { name: '科技研发中心', position: [-8, 0, 8], height: 28, color: '#32CD32', colorFactor: hexToRgbFactor('#32CD32') },
  { name: '国际公寓', position: [8, 0, 8], height: 30, color: '#DAA520', colorFactor: hexToRgbFactor('#DAA520') },
  { name: '中央车站', position: [0, 0, 0], height: 22, color: '#9370DB', colorFactor: hexToRgbFactor('#9370DB') },
  { name: '绿色生态塔', position: [0, 0, 15], height: 40, color: '#00CED1', colorFactor: hexToRgbFactor('#00CED1') },
];

const gltf2000 = createBuildingGltf(buildings2000, 'City_2000');
const gltf2024 = createBuildingGltf(buildings2024, 'City_2024');

const outputDir = path.join(__dirname, 'public', 'models');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(
  path.join(outputDir, 'city_2000.gltf'),
  JSON.stringify(gltf2000, null, 2)
);
fs.writeFileSync(
  path.join(outputDir, 'city_2024.gltf'),
  JSON.stringify(gltf2024, null, 2)
);

console.log('Generated city_2000.gltf and city_2024.gltf');
console.log('city_2000:', buildings2000.length, 'buildings');
console.log('city_2024:', buildings2024.length, 'buildings');
