const fs = require('fs');
const path = require('path');

function createBoxGeometry(width, height, depth) {
  const w = width / 2;
  const h = height / 2;
  const d = depth / 2;

  const positions = new Float32Array([
    -w, -h,  d,   w, -h,  d,   w,  h,  d,  -w,  h,  d,
     w, -h, -d,  -w, -h, -d,  -w,  h, -d,   w,  h, -d,
    -w,  h,  d,   w,  h,  d,   w,  h, -d,  -w,  h, -d,
    -w, -h, -d,   w, -h, -d,   w, -h,  d,  -w, -h,  d,
     w, -h,  d,   w, -h, -d,   w,  h, -d,   w,  h,  d,
    -w, -h, -d,  -w, -h,  d,  -w,  h,  d,  -w,  h, -d,
  ]);

  const normals = new Float32Array([
    0,  0,  1,  0,  0,  1,  0,  0,  1,  0,  0,  1,
    0,  0, -1,  0,  0, -1,  0,  0, -1,  0,  0, -1,
    0,  1,  0,  0,  1,  0,  0,  1,  0,  0,  1,  0,
    0, -1,  0,  0, -1,  0,  0, -1,  0,  0, -1,  0,
    1,  0,  0,  1,  0,  0,  1,  0,  0,  1,  0,  0,
   -1,  0,  0, -1,  0,  0, -1,  0,  0, -1,  0,  0,
  ]);

  const indices = new Uint16Array([
    0, 1, 2,  0, 2, 3,
    4, 5, 6,  4, 6, 7,
    8, 9, 10, 8, 10, 11,
    12, 13, 14, 12, 14, 15,
    16, 17, 18, 16, 18, 19,
    20, 21, 22, 20, 22, 23,
  ]);

  return { positions, normals, indices };
}

function arrayToBase64(buffer) {
  return Buffer.from(buffer).toString('base64');
}

function createBuildingGltf(buildings) {
  const accessors = [];
  const bufferViews = [];
  const meshes = [];
  const nodes = [];
  const materials = [];

  let byteOffset = 0;
  let totalByteLength = 0;

  const allBuffers = [];

  buildings.forEach((building, buildingIndex) => {
    const { positions, normals, indices } = createBoxGeometry(4, building.height, 4);

    const posBuffer = positions.buffer;
    const normBuffer = normals.buffer;
    const idxBuffer = indices.buffer;

    allBuffers.push(Buffer.from(posBuffer));
    allBuffers.push(Buffer.from(normBuffer));
    allBuffers.push(Buffer.from(idxBuffer));

    const positionAccessorIndex = accessors.length;
    accessors.push({
      bufferView: bufferViews.length,
      componentType: 5126,
      count: 24,
      type: 'VEC3',
      min: [-2, -building.height / 2, -2],
      max: [2, building.height / 2, 2],
    });
    bufferViews.push({
      buffer: 0,
      byteOffset: byteOffset,
      byteLength: posBuffer.byteLength,
      target: 34962,
    });
    byteOffset += posBuffer.byteLength;

    const normalAccessorIndex = accessors.length;
    accessors.push({
      bufferView: bufferViews.length,
      componentType: 5126,
      count: 24,
      type: 'VEC3',
    });
    bufferViews.push({
      buffer: 0,
      byteOffset: byteOffset,
      byteLength: normBuffer.byteLength,
      target: 34962,
    });
    byteOffset += normBuffer.byteLength;

    const indexAccessorIndex = accessors.length;
    accessors.push({
      bufferView: bufferViews.length,
      componentType: 5123,
      count: 36,
      type: 'SCALAR',
      min: [0],
      max: [23],
    });
    bufferViews.push({
      buffer: 0,
      byteOffset: byteOffset,
      byteLength: idxBuffer.byteLength,
      target: 34963,
    });
    byteOffset += idxBuffer.byteLength;

    totalByteLength = byteOffset;

    materials.push({
      name: `Mat_${buildingIndex}`,
      pbrMetallicRoughness: {
        baseColorFactor: hexToRgba(building.color),
        metallicFactor: 0.3,
        roughnessFactor: 0.7,
      },
    });

    meshes.push({
      name: building.name,
      primitives: [
        {
          attributes: {
            POSITION: positionAccessorIndex,
            NORMAL: normalAccessorIndex,
          },
          indices: indexAccessorIndex,
          material: buildingIndex,
        },
      ],
    });

    nodes.push({
      name: building.name,
      mesh: buildingIndex,
      translation: [building.position[0], building.height / 2, building.position[2]],
    });
  });

  const combinedBuffer = Buffer.concat(allBuffers);
  const base64Data = arrayToBase64(combinedBuffer);

  const gltf = {
    asset: {
      version: '2.0',
      generator: 'CityEvolution3D',
    },
    scene: 0,
    scenes: [
      {
        name: 'CityScene',
        nodes: buildings.map((_, i) => i),
      },
    ],
    nodes,
    meshes,
    materials,
    accessors,
    bufferViews,
    buffers: [
      {
        byteLength: combinedBuffer.length,
        uri: `data:application/octet-stream;base64,${base64Data}`,
      },
    ],
  };

  return gltf;
}

function hexToRgba(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
        1,
      ]
    : [1, 1, 1, 1];
}

const buildings2000 = [
  { name: '市政大楼', position: [-8, 0, -8], height: 15, color: '#8B4513' },
  { name: '商业中心', position: [8, 0, -8], height: 20, color: '#4682B4' },
  { name: '文化艺术馆', position: [-8, 0, 8], height: 12, color: '#2E8B57' },
  { name: '居民小区A区', position: [8, 0, 8], height: 8, color: '#CD853F' },
  { name: '交通枢纽', position: [0, 0, 0], height: 10, color: '#708090' },
];

const buildings2024 = [
  { name: '金融中心大厦', position: [-8, 0, -8], height: 45, color: '#1E90FF' },
  { name: '环球商业广场', position: [8, 0, -8], height: 35, color: '#FF6347' },
  { name: '科技研发中心', position: [-8, 0, 8], height: 28, color: '#32CD32' },
  { name: '国际公寓', position: [8, 0, 8], height: 30, color: '#DAA520' },
  { name: '中央车站', position: [0, 0, 0], height: 22, color: '#9370DB' },
  { name: '绿色生态塔', position: [0, 0, 15], height: 40, color: '#00CED1' },
];

const modelsDir = path.join(__dirname, 'public', 'models');
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

const gltf2000 = createBuildingGltf(buildings2000);
fs.writeFileSync(
  path.join(modelsDir, 'city_2000.gltf'),
  JSON.stringify(gltf2000, null, 2)
);

const gltf2024 = createBuildingGltf(buildings2024);
fs.writeFileSync(
  path.join(modelsDir, 'city_2024.gltf'),
  JSON.stringify(gltf2024, null, 2)
);

console.log('GLTF models generated successfully!');
console.log('- city_2000.gltf: ' + buildings2000.length + ' buildings');
console.log('- city_2024.gltf: ' + buildings2024.length + ' buildings');
