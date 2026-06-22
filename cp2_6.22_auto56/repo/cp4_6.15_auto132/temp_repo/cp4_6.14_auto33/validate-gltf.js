import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function validateGltf(filePath) {
  console.log(`\nValidating: ${path.basename(filePath)}`);
  console.log('='.repeat(50));

  const content = fs.readFileSync(filePath, 'utf8');
  const gltf = JSON.parse(content);

  let errors = [];
  let warnings = [];

  if (!gltf.asset) errors.push('Missing asset');
  if (gltf.asset?.version !== '2.0') errors.push('Asset version is not 2.0');

  if (gltf.scene === undefined) errors.push('Missing default scene index');
  if (!gltf.scenes || gltf.scenes.length === 0) errors.push('No scenes defined');

  if (!gltf.nodes || gltf.nodes.length === 0) errors.push('No nodes defined');
  if (!gltf.meshes || gltf.meshes.length === 0) errors.push('No meshes defined');
  if (!gltf.materials || gltf.materials.length === 0) errors.push('No materials defined');
  if (!gltf.accessors || gltf.accessors.length === 0) errors.push('No accessors defined');
  if (!gltf.bufferViews || gltf.bufferViews.length === 0) errors.push('No bufferViews defined');
  if (!gltf.buffers || gltf.buffers.length === 0) errors.push('No buffers defined');

  if (errors.length === 0) {
    const scene = gltf.scenes[gltf.scene];
    console.log(`Scene: ${scene.name || 'unnamed'}`);
    console.log(`Nodes in scene: ${scene.nodes.length}`);
    console.log(`Total nodes: ${gltf.nodes.length}`);
    console.log(`Total meshes: ${gltf.meshes.length}`);
    console.log(`Total materials: ${gltf.materials.length}`);
    console.log(`Total accessors: ${gltf.accessors.length}`);
    console.log(`Total bufferViews: ${gltf.bufferViews.length}`);
    console.log(`Total buffers: ${gltf.buffers.length}`);

    gltf.meshes.forEach((mesh, i) => {
      mesh.primitives.forEach((prim, j) => {
        const hasPosition = prim.attributes.POSITION !== undefined;
        const hasIndices = prim.indices !== undefined;
        const hasMaterial = prim.material !== undefined;

        console.log(`\nMesh ${i}, Primitive ${j}:`);
        console.log(`  Position accessor: ${hasPosition ? prim.attributes.POSITION : 'MISSING'}`);
        console.log(`  Indices accessor: ${hasIndices ? prim.indices : 'MISSING'}`);
        console.log(`  Material: ${hasMaterial ? prim.material : 'MISSING'}`);

        if (!hasPosition) errors.push(`Mesh ${i} primitive ${j} missing POSITION attribute`);
      });
    });

    const buffer = gltf.buffers[0];
    console.log(`\nBuffer 0:`);
    console.log(`  byteLength: ${buffer.byteLength}`);
    console.log(`  URI scheme: ${buffer.uri?.startsWith('data:') ? 'data URI' : 'external file'}`);

    if (buffer.uri?.startsWith('data:application/octet-stream;base64,')) {
      const base64Data = buffer.uri.replace('data:application/octet-stream;base64,', '');
      const decoded = Buffer.from(base64Data, 'base64');
      console.log(`  Decoded length: ${decoded.length} bytes`);

      if (decoded.length !== buffer.byteLength) {
        errors.push(`Buffer decoded length (${decoded.length}) does not match byteLength (${buffer.byteLength})`);
      }

      gltf.accessors.forEach((accessor, i) => {
        const bv = gltf.bufferViews[accessor.bufferView];
        if (!bv) {
          errors.push(`Accessor ${i} references invalid bufferView ${accessor.bufferView}`);
          return;
        }

        const buf = gltf.buffers[bv.buffer];
        if (!buf) {
          errors.push(`BufferView ${accessor.bufferView} references invalid buffer ${bv.buffer}`);
          return;
        }

        const end = bv.byteOffset + bv.byteLength;
        if (end > buffer.byteLength) {
          errors.push(`BufferView ${accessor.bufferView} exceeds buffer bounds`);
        }

        const componentSize = {
          5120: 1,
          5121: 1,
          5122: 2,
          5123: 2,
          5125: 4,
          5126: 4,
        }[accessor.componentType] || 0;

        const typeComponents = {
          SCALAR: 1,
          VEC2: 2,
          VEC3: 3,
          VEC4: 4,
          MAT2: 4,
          MAT3: 9,
          MAT4: 16,
        }[accessor.type] || 0;

        const expectedBytes = accessor.count * componentSize * typeComponents;
        if (expectedBytes > bv.byteLength) {
          errors.push(`Accessor ${i} expects ${expectedBytes} bytes but bufferView has ${bv.byteLength}`);
        }
      });
    }

    console.log(`\nMaterials:`);
    gltf.materials.forEach((mat, i) => {
      const color = mat.pbrMetallicRoughness?.baseColorFactor;
      console.log(`  Material ${i}: ${mat.name || 'unnamed'}, color: [${color?.join(', ')}]`);
    });

    console.log(`\nNodes:`);
    gltf.nodes.forEach((node, i) => {
      console.log(`  Node ${i}: ${node.name || 'unnamed'}, mesh: ${node.mesh}, pos: [${node.translation?.join(', ')}]`);
    });
  }

  console.log(`\n${errors.length} errors, ${warnings.length} warnings`);
  if (errors.length > 0) {
    console.log('Errors:');
    errors.forEach(e => console.log(`  - ${e}`));
  }

  return errors.length === 0;
}

const dir = path.join(__dirname, 'public', 'models');
const files = ['city_2000.gltf', 'city_2024.gltf'];

let allValid = true;
for (const file of files) {
  const filePath = path.join(dir, file);
  if (fs.existsSync(filePath)) {
    const valid = validateGltf(filePath);
    if (!valid) allValid = false;
  } else {
    console.log(`File not found: ${file}`);
    allValid = false;
  }
}

console.log('\n' + '='.repeat(50));
console.log(allValid ? 'All files are valid!' : 'Some files have errors!');
process.exit(allValid ? 0 : 1);
