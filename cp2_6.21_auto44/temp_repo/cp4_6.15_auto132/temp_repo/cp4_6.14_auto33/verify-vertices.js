import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function verifyGltfVertices(filePath) {
  console.log(`\nVerifying vertices in: ${path.basename(filePath)}`);
  console.log('='.repeat(50));

  const content = fs.readFileSync(filePath, 'utf8');
  const gltf = JSON.parse(content);

  const buffer = gltf.buffers[0];
  const base64Data = buffer.uri.replace('data:application/octet-stream;base64,', '');
  const bufferData = Buffer.from(base64Data, 'base64');

  gltf.meshes.forEach((mesh, meshIdx) => {
    console.log(`\nMesh ${meshIdx} (${gltf.nodes[meshIdx].name}):`);

    const prim = mesh.primitives[0];
    const posAccessor = gltf.accessors[prim.attributes.POSITION];
    const idxAccessor = gltf.accessors[prim.indices];

    const posBV = gltf.bufferViews[posAccessor.bufferView];
    const idxBV = gltf.bufferViews[idxAccessor.bufferView];

    const posData = bufferData.slice(posBV.byteOffset, posBV.byteOffset + posBV.byteLength);
    const idxData = bufferData.slice(idxBV.byteOffset, idxBV.byteOffset + idxBV.byteLength);

    const positions = new Float32Array(posData.buffer, posData.byteOffset, posData.byteLength / 4);
    const indices = new Uint16Array(idxData.buffer, idxData.byteOffset, idxData.byteLength / 2);

    console.log(`  Vertices: ${positions.length / 3}`);
    console.log(`  Indices: ${indices.length}`);
    console.log(`  Triangles: ${indices.length / 3}`);

    console.log('  Vertex positions:');
    for (let i = 0; i < positions.length; i += 3) {
      console.log(`    [${positions[i].toFixed(2)}, ${positions[i + 1].toFixed(2)}, ${positions[i + 2].toFixed(2)}]`);
    }

    const minY = Math.min(...positions.filter((_, i) => i % 3 === 1));
    const maxY = Math.max(...positions.filter((_, i) => i % 3 === 1));
    const height = maxY - minY;

    const minX = Math.min(...positions.filter((_, i) => i % 3 === 0));
    const maxX = Math.max(...positions.filter((_, i) => i % 3 === 0));
    const width = maxX - minX;

    const minZ = Math.min(...positions.filter((_, i) => i % 3 === 2));
    const maxZ = Math.max(...positions.filter((_, i) => i % 3 === 2));
    const depth = maxZ - minZ;

    console.log(`  Dimensions: ${width.toFixed(1)} x ${height.toFixed(1)} x ${depth.toFixed(1)} (WxHxD)`);
    console.log(`  Base at Y: ${minY.toFixed(1)}`);

    if (Math.abs(width - 4) > 0.01) console.log('  WARNING: Width is not 4!');
    if (Math.abs(depth - 4) > 0.01) console.log('  WARNING: Depth is not 4!');
    if (Math.abs(minY) > 0.01) console.log('  WARNING: Base is not at Y=0!');

    let validIndices = true;
    for (let i = 0; i < indices.length; i++) {
      if (indices[i] >= positions.length / 3) {
        validIndices = false;
        console.log(`  ERROR: Index ${indices[i]} out of bounds!`);
      }
    }
    if (validIndices) console.log('  Indices: all valid');

    const material = gltf.materials[prim.material];
    const color = material.pbrMetallicRoughness.baseColorFactor;
    console.log(`  Color: rgba(${color.map(c => (c * 255).toFixed(0)).join(', ')})`);
  });
}

const dir = path.join(__dirname, 'public', 'models');
const files = ['city_2000.gltf', 'city_2024.gltf'];

for (const file of files) {
  const filePath = path.join(dir, file);
  if (fs.existsSync(filePath)) {
    verifyGltfVertices(filePath);
  }
}

console.log('\n' + '='.repeat(50));
console.log('Vertex verification complete!');
