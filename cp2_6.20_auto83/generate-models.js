import * as THREE from 'three'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class FileReaderPolyfill {
  constructor() {
    this.result = null
    this.onload = null
  }
  readAsArrayBuffer(blob) {
    this.result = blob.arrayBuffer ? blob.arrayBuffer() : Promise.resolve(blob)
    if (this.onload) {
      Promise.resolve(this.result).then(buf => {
        this.result = buf
        this.onload({ target: this })
      })
    }
  }
  readAsDataURL(blob) {
    const buffer = blob instanceof Buffer ? blob : Buffer.from(blob)
    const mimeType = 'application/octet-stream'
    this.result = `data:${mimeType};base64,${buffer.toString('base64')}`
    if (this.onload) {
      this.onload({ target: this })
    }
  }
  readAsText(blob) {
    this.result = blob.toString()
    if (this.onload) {
      this.onload({ target: this })
    }
  }
}

global.FileReader = FileReaderPolyfill
global.Blob = class BlobPolyfill {
  constructor(parts, options = {}) {
    this._buffer = Buffer.concat(parts.map(p => {
      if (p instanceof Buffer) return p
      if (typeof p === 'string') return Buffer.from(p)
      if (p instanceof ArrayBuffer) return Buffer.from(p)
      return Buffer.from(String(p))
    }))
    this.type = options.type || ''
    this.size = this._buffer.length
  }
  arrayBuffer() {
    return Promise.resolve(this._buffer.buffer.slice(
      this._buffer.byteOffset,
      this._buffer.byteOffset + this._buffer.length
    ))
  }
  text() {
    return Promise.resolve(this._buffer.toString())
  }
}

global.URL = {
  createObjectURL: () => 'blob:fake-url',
  revokeObjectURL: () => {}
}

const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js')

function createSwordModel() {
  const group = new THREE.Group()
  group.name = 'sword'

  const bladeLength = 1.8
  const bladeWidth = 0.12
  const bladeThickness = 0.04

  const bladeShape = new THREE.Shape()
  bladeShape.moveTo(0, 0)
  bladeShape.lineTo(bladeWidth / 2, 0)
  bladeShape.lineTo(bladeWidth / 2, bladeLength - 0.15)
  bladeShape.quadraticCurveTo(bladeWidth / 2, bladeLength, 0, bladeLength)
  bladeShape.quadraticCurveTo(-bladeWidth / 2, bladeLength, -bladeWidth / 2, bladeLength - 0.15)
  bladeShape.lineTo(-bladeWidth / 2, 0)
  bladeShape.lineTo(0, 0)

  const extrudeSettings = {
    steps: 2,
    depth: bladeThickness,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelOffset: 0,
    bevelSegments: 3
  }

  const bladeGeometry = new THREE.ExtrudeGeometry(bladeShape, extrudeSettings)
  bladeGeometry.center()
  bladeGeometry.translate(0, bladeLength / 2 - 0.1, 0)
  const bladeMaterial = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.95,
    roughness: 0.08,
    envMapIntensity: 1.0
  })
  const blade = new THREE.Mesh(bladeGeometry, bladeMaterial)
  blade.name = 'blade'
  blade.castShadow = true
  blade.receiveShadow = true
  group.add(blade)

  const edgeGeometry = new THREE.BoxGeometry(0.005, bladeLength - 0.2, bladeThickness + 0.002)
  edgeGeometry.translate(0, bladeLength / 2 - 0.1, 0)
  const edgeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 1.0,
    roughness: 0.05,
    envMapIntensity: 1.2
  })
  const edge1 = new THREE.Mesh(edgeGeometry, edgeMaterial)
  edge1.position.x = bladeWidth / 2 - 0.002
  const edge2 = new THREE.Mesh(edgeGeometry, edgeMaterial)
  edge2.position.x = -bladeWidth / 2 + 0.002
  group.add(edge1, edge2)

  const fullerGeometry = new THREE.BoxGeometry(0.02, bladeLength * 0.7, 0.002)
  fullerGeometry.translate(0, bladeLength / 2 - 0.1, 0)
  const fullerMaterial = new THREE.MeshStandardMaterial({
    color: 0x888888,
    metalness: 0.9,
    roughness: 0.15
  })
  const fuller = new THREE.Mesh(fullerGeometry, fullerMaterial)
  fuller.position.z = bladeThickness / 2 + 0.001
  const fullerBack = fuller.clone()
  fullerBack.position.z = -bladeThickness / 2 - 0.001
  fullerBack.rotation.y = Math.PI
  group.add(fuller, fullerBack)

  const guardGeometry = new THREE.BoxGeometry(0.6, 0.12, 0.15)
  const guardMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.9,
    roughness: 0.15
  })
  const guard = new THREE.Mesh(guardGeometry, guardMaterial)
  guard.position.y = -0.05
  guard.castShadow = true
  guard.name = 'guard'
  group.add(guard)

  const guardDetailGeometry = new THREE.TorusGeometry(0.06, 0.02, 8, 16)
  const guardDetailMaterial = new THREE.MeshStandardMaterial({
    color: 0xc9a227,
    metalness: 0.8,
    roughness: 0.25
  })
  for (let i = 0; i < 3; i++) {
    const detail = new THREE.Mesh(guardDetailGeometry, guardDetailMaterial)
    detail.rotation.y = Math.PI / 2
    detail.position.set(-0.2 + i * 0.2, -0.05, 0)
    group.add(detail)
  }

  const gripGeometry = new THREE.CylinderGeometry(0.045, 0.055, 0.55, 16)
  const gripMaterial = new THREE.MeshStandardMaterial({
    color: 0x3d2817,
    metalness: 0.1,
    roughness: 0.75
  })
  const grip = new THREE.Mesh(gripGeometry, gripMaterial)
  grip.position.y = -0.38
  grip.castShadow = true
  grip.name = 'grip'
  group.add(grip)

  const wrapGeometry = new THREE.TorusGeometry(0.05, 0.012, 8, 32)
  const wrapMaterial = new THREE.MeshStandardMaterial({
    color: 0x654321,
    metalness: 0.05,
    roughness: 0.85
  })
  for (let i = 0; i < 5; i++) {
    const wrap = new THREE.Mesh(wrapGeometry, wrapMaterial)
    wrap.rotation.x = Math.PI / 2
    wrap.position.y = -0.2 - i * 0.08
    group.add(wrap)
  }

  const pommelBaseGeometry = new THREE.SphereGeometry(0.1, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2)
  const pommelMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.9,
    roughness: 0.15
  })
  const pommelBase = new THREE.Mesh(pommelBaseGeometry, pommelMaterial)
  pommelBase.position.y = -0.68
  pommelBase.rotation.x = Math.PI
  pommelBase.castShadow = true
  group.add(pommelBase)

  const pommelGemGeometry = new THREE.OctahedronGeometry(0.06, 0)
  const pommelGemMaterial = new THREE.MeshStandardMaterial({
    color: 0xff3333,
    metalness: 0.3,
    roughness: 0.1,
    emissive: 0xff3333,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.9
  })
  const pommelGem = new THREE.Mesh(pommelGemGeometry, pommelGemMaterial)
  pommelGem.position.y = -0.68
  group.add(pommelGem)

  group.rotation.x = -Math.PI / 2
  group.position.y = 0

  return group
}

function createBowModel() {
  const group = new THREE.Group()
  group.name = 'bow'

  const bowCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -1.4, 0),
    new THREE.Vector3(0.15, -1.0, 0),
    new THREE.Vector3(0.25, -0.5, 0),
    new THREE.Vector3(0.3, 0, 0),
    new THREE.Vector3(0.25, 0.5, 0),
    new THREE.Vector3(0.15, 1.0, 0),
    new THREE.Vector3(0, 1.4, 0)
  ])

  const bowGeometry = new THREE.TubeGeometry(bowCurve, 64, 0.045, 12, false)
  const bowMaterial = new THREE.MeshStandardMaterial({
    color: 0x654321,
    metalness: 0.15,
    roughness: 0.65
  })
  const bow = new THREE.Mesh(bowGeometry, bowMaterial)
  bow.castShadow = true
  bow.name = 'bow_limb'
  group.add(bow)

  const laminationGeometry = new THREE.TubeGeometry(bowCurve, 64, 0.035, 12, false)
  const laminationMaterial = new THREE.MeshStandardMaterial({
    color: 0xd4a574,
    metalness: 0.1,
    roughness: 0.55
  })
  const lamination = new THREE.Mesh(laminationGeometry, laminationMaterial)
  lamination.position.z = 0.012
  group.add(lamination)

  const tipGeometry = new THREE.ConeGeometry(0.05, 0.15, 8)
  const tipMaterial = new THREE.MeshStandardMaterial({
    color: 0x2c2c2c,
    metalness: 0.85,
    roughness: 0.25
  })
  const tip1 = new THREE.Mesh(tipGeometry, tipMaterial)
  tip1.position.set(0, 1.48, 0)
  tip1.rotation.z = Math.PI
  const tip2 = new THREE.Mesh(tipGeometry, tipMaterial)
  tip2.position.set(0, -1.48, 0)
  group.add(tip1, tip2)

  const stringPoints = []
  for (let i = 0; i <= 40; i++) {
    const t = i / 40
    const y = (1 - 2 * t) * 1.4
    const x = 0.02 * Math.sin(t * Math.PI * 2) * 0.3
    stringPoints.push(new THREE.Vector3(x, y, 0.02))
  }
  const stringGeometry = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(stringPoints),
    40,
    0.006,
    4,
    false
  )
  const stringMaterial = new THREE.MeshStandardMaterial({
    color: 0xf5f5dc,
    metalness: 0.0,
    roughness: 0.95
  })
  const string = new THREE.Mesh(stringGeometry, stringMaterial)
  string.name = 'bowstring'
  group.add(string)

  const riserGeometry = new THREE.BoxGeometry(0.12, 0.45, 0.2)
  const riserMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a3728,
    metalness: 0.2,
    roughness: 0.7
  })
  const riser = new THREE.Mesh(riserGeometry, riserMaterial)
  riser.position.set(0, 0, 0)
  riser.castShadow = true
  riser.name = 'riser'
  group.add(riser)

  const gripWrapGeometry = new THREE.TorusGeometry(0.12, 0.025, 8, 32)
  const gripWrapMaterial = new THREE.MeshStandardMaterial({
    color: 0x2c1810,
    metalness: 0.05,
    roughness: 0.9
  })
  for (let i = 0; i < 4; i++) {
    const wrap = new THREE.Mesh(gripWrapGeometry, gripWrapMaterial)
    wrap.rotation.y = Math.PI / 2
    wrap.position.set(0, -0.1 + i * 0.08, 0)
    group.add(wrap)
  }

  const arrowRestGeometry = new THREE.BoxGeometry(0.02, 0.06, 0.1)
  const arrowRestMaterial = new THREE.MeshStandardMaterial({
    color: 0x2c2c2c,
    metalness: 0.8,
    roughness: 0.3
  })
  const arrowRest = new THREE.Mesh(arrowRestGeometry, arrowRestMaterial)
  arrowRest.position.set(0.07, 0.02, 0.05)
  group.add(arrowRest)

  const sightGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.15, 8)
  const sightMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a4a4a,
    metalness: 0.7,
    roughness: 0.35
  })
  const sight = new THREE.Mesh(sightGeometry, sightMaterial)
  sight.position.set(0, 0.25, 0.11)
  group.add(sight)

  const sightPinGeometry = new THREE.SphereGeometry(0.02, 8, 8)
  const sightPinMaterial = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0xff0000,
    emissiveIntensity: 0.5,
    metalness: 0.5,
    roughness: 0.2
  })
  const sightPin = new THREE.Mesh(sightPinGeometry, sightPinMaterial)
  sightPin.position.set(0, 0.25, 0.2)
  group.add(sightPin)

  const stabilizerGeometry = new THREE.CylinderGeometry(0.02, 0.025, 0.4, 8)
  const stabilizerMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.85,
    roughness: 0.25
  })
  const stabilizer = new THREE.Mesh(stabilizerGeometry, stabilizerMaterial)
  stabilizer.position.set(0, -0.3, 0.2)
  stabilizer.rotation.x = Math.PI / 6
  group.add(stabilizer)

  const stabilizerEndGeometry = new THREE.SphereGeometry(0.04, 12, 12)
  const stabilizerEnd = new THREE.Mesh(stabilizerEndGeometry, stabilizerMaterial)
  stabilizerEnd.position.set(0, -0.4, 0.38)
  group.add(stabilizerEnd)

  group.rotation.y = -Math.PI / 6
  group.position.y = 0

  return group
}

function createStaffModel() {
  const group = new THREE.Group()
  group.name = 'staff'

  const staffLength = 2.8

  const staffPoints = []
  for (let i = 0; i <= 30; i++) {
    const t = i / 30
    const y = (t - 0.5) * staffLength
    const twist = Math.sin(t * Math.PI * 3) * 0.015
    const x = Math.sin(t * Math.PI * 2) * twist
    const z = Math.cos(t * Math.PI * 2) * twist
    staffPoints.push(new THREE.Vector3(x, y, z))
  }
  const staffCurve = new THREE.CatmullRomCurve3(staffPoints)

  const staffGeometry = new THREE.TubeGeometry(staffCurve, 60, 0.055, 14, false)
  const staffMaterial = new THREE.MeshStandardMaterial({
    color: 0x3d2817,
    metalness: 0.15,
    roughness: 0.75
  })
  const staff = new THREE.Mesh(staffGeometry, staffMaterial)
  staff.castShadow = true
  staff.name = 'staff_body'
  group.add(staff)

  const ringGeometry = new THREE.TorusGeometry(0.06, 0.015, 8, 24)
  const ringMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.9,
    roughness: 0.15
  })
  for (let i = 0; i < 6; i++) {
    const ring = new THREE.Mesh(ringGeometry, ringMaterial)
    ring.rotation.x = Math.PI / 2
    ring.position.y = -1.2 + i * 0.4
    group.add(ring)
  }

  const carvingGeometry = new THREE.TorusGeometry(0.058, 0.008, 6, 48)
  const carvingMaterial = new THREE.MeshStandardMaterial({
    color: 0x2c1810,
    metalness: 0.1,
    roughness: 0.85
  })
  for (let i = 0; i < 8; i++) {
    const carving = new THREE.Mesh(carvingGeometry, carvingMaterial)
    carving.rotation.x = Math.PI / 2
    carving.position.y = -1.1 + i * 0.3
    group.add(carving)
  }

  const bottomCapGeometry = new THREE.ConeGeometry(0.07, 0.18, 10)
  const bottomCapMaterial = new THREE.MeshStandardMaterial({
    color: 0x2c2c2c,
    metalness: 0.85,
    roughness: 0.25
  })
  const bottomCap = new THREE.Mesh(bottomCapGeometry, bottomCapMaterial)
  bottomCap.position.y = -staffLength / 2 - 0.05
  bottomCap.rotation.x = Math.PI
  bottomCap.castShadow = true
  group.add(bottomCap)

  const headBaseGeometry = new THREE.SphereGeometry(0.18, 16, 16)
  const headBaseMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.92,
    roughness: 0.12
  })
  const headBase = new THREE.Mesh(headBaseGeometry, headBaseMaterial)
  headBase.position.y = staffLength / 2 - 0.05
  headBase.castShadow = true
  headBase.name = 'staff_head_base'
  group.add(headBase)

  const clawGeometry = new THREE.ConeGeometry(0.035, 0.25, 6)
  const clawMaterial = new THREE.MeshStandardMaterial({
    color: 0xc9a227,
    metalness: 0.88,
    roughness: 0.18
  })
  for (let i = 0; i < 6; i++) {
    const claw = new THREE.Mesh(clawGeometry, clawMaterial)
    const angle = (i / 6) * Math.PI * 2
    claw.position.set(
      Math.cos(angle) * 0.12,
      staffLength / 2 + 0.02,
      Math.sin(angle) * 0.12
    )
    claw.rotation.x = -Math.PI / 4
    claw.rotation.z = angle + Math.PI / 2
    claw.castShadow = true
    group.add(claw)
  }

  const gemGeometry = new THREE.IcosahedronGeometry(0.14, 1)
  const gemMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a90d9,
    metalness: 0.4,
    roughness: 0.08,
    emissive: 0x4a90d9,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.85
  })
  const gem = new THREE.Mesh(gemGeometry, gemMaterial)
  gem.position.y = staffLength / 2 + 0.05
  gem.name = 'crystal'
  group.add(gem)

  const innerGemGeometry = new THREE.OctahedronGeometry(0.08, 0)
  const innerGemMaterial = new THREE.MeshStandardMaterial({
    color: 0x88ccff,
    metalness: 0.3,
    roughness: 0.05,
    emissive: 0xaaddff,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.9
  })
  const innerGem = new THREE.Mesh(innerGemGeometry, innerGemMaterial)
  innerGem.position.y = staffLength / 2 + 0.05
  group.add(innerGem)

  const glowGeometry = new THREE.SphereGeometry(0.22, 16, 16)
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x4a90d9,
    transparent: true,
    opacity: 0.15,
    side: THREE.BackSide
  })
  const glow = new THREE.Mesh(glowGeometry, glowMaterial)
  glow.position.y = staffLength / 2 + 0.05
  group.add(glow)

  const runeRingGeometry = new THREE.TorusGeometry(0.25, 0.012, 8, 48)
  const runeRingMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    emissive: 0xffd700,
    emissiveIntensity: 0.3,
    metalness: 0.9,
    roughness: 0.1
  })
  const runeRing1 = new THREE.Mesh(runeRingGeometry, runeRingMaterial)
  runeRing1.position.y = staffLength / 2 + 0.05
  runeRing1.rotation.x = Math.PI / 3
  group.add(runeRing1)

  const runeRing2 = new THREE.Mesh(runeRingGeometry, runeRingMaterial)
  runeRing2.position.y = staffLength / 2 + 0.05
  runeRing2.rotation.x = -Math.PI / 3
  runeRing2.rotation.z = Math.PI / 2
  group.add(runeRing2)

  group.rotation.x = -Math.PI / 8
  group.position.y = -0.2

  return group
}

function saveGLB(model, filename) {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter()
    exporter.parse(
      model,
      (result) => {
        if (result instanceof ArrayBuffer) {
          const outputPath = path.join(__dirname, 'public', 'models', filename)
          fs.writeFileSync(outputPath, Buffer.from(result))
          console.log(`Saved: ${filename} (${(result.byteLength / 1024).toFixed(1)} KB)`)
          resolve(true)
        } else {
          reject(new Error('Expected ArrayBuffer result'))
        }
      },
      (error) => {
        console.error(`Error exporting ${filename}:`, error)
        reject(error)
      },
      { binary: true, trs: false, onlyVisible: false }
    )
  })
}

async function main() {
  console.log('Generating weapon models...\n')

  const sword = createSwordModel()
  console.log('Sword model created with', sword.children.length, 'meshes')
  await saveGLB(sword, 'sword.glb')

  const bow = createBowModel()
  console.log('Bow model created with', bow.children.length, 'meshes')
  await saveGLB(bow, 'bow.glb')

  const staff = createStaffModel()
  console.log('Staff model created with', staff.children.length, 'meshes')
  await saveGLB(staff, 'staff.glb')

  console.log('\nAll models generated successfully!')
  console.log('\nModels saved to: public/models/')
}

main().catch(console.error)
