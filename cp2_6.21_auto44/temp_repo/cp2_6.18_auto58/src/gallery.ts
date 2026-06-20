import * as THREE from 'three'
import { ARTWORKS, createArtworkMesh, ArtworkInfo } from './artwork'

export interface ArtworkPlacement {
  info: ArtworkInfo
  group: THREE.Group
  pulsePeriod: number
  pulsePhase: number
  version: number
}

export interface GalleryScene {
  galleryGroup: THREE.Group
  artworks: ArtworkPlacement[]
  floorEnvMap: THREE.CubeTexture | null
  reflectiveGroup: THREE.Object3D
  cubeCamera: THREE.CubeCamera | null
  cubeRenderTarget: THREE.WebGLCubeRenderTarget | null
  updateReflection: (renderer: THREE.WebGLRenderer) => void
}

const GALLERY_W = 16
const GALLERY_D = 12
const GALLERY_H = 4

function makeWallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#3a3a52'
  ctx.fillRect(0, 0, 512, 512)
  const imgData = ctx.getImageData(0, 0, 512, 512)
  const data = imgData.data
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 14
    data[i] = Math.min(255, Math.max(0, data[i] + n))
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n))
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n))
  }
  ctx.putImageData(imgData, 0, 0)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(4, 2)
  return tex
}

export function createGallery(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer
): GalleryScene {
  const galleryGroup = new THREE.Group()
  const reflectiveGroup = new THREE.Group()

  const wallTex = makeWallTexture()
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x3a3a52,
    map: wallTex,
    roughness: 0.9,
    metalness: 0.0,
    side: THREE.DoubleSide,
  })

  const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(GALLERY_W, GALLERY_H),
    wallMat
  )
  backWall.position.set(0, GALLERY_H / 2, -GALLERY_D / 2)
  backWall.receiveShadow = true
  reflectiveGroup.add(backWall)
  galleryGroup.add(backWall)

  const frontWall = new THREE.Mesh(
    new THREE.PlaneGeometry(GALLERY_W, GALLERY_H),
    wallMat
  )
  frontWall.position.set(0, GALLERY_H / 2, GALLERY_D / 2)
  reflectiveGroup.add(frontWall)
  galleryGroup.add(frontWall)

  const leftWall = new THREE.Mesh(
    new THREE.PlaneGeometry(GALLERY_D, GALLERY_H),
    wallMat
  )
  leftWall.rotation.y = Math.PI / 2
  leftWall.position.set(-GALLERY_W / 2, GALLERY_H / 2, 0)
  leftWall.receiveShadow = true
  reflectiveGroup.add(leftWall)
  galleryGroup.add(leftWall)

  const rightWall = new THREE.Mesh(
    new THREE.PlaneGeometry(GALLERY_D, GALLERY_H),
    wallMat
  )
  rightWall.rotation.y = -Math.PI / 2
  rightWall.position.set(GALLERY_W / 2, GALLERY_H / 2, 0)
  rightWall.receiveShadow = true
  reflectiveGroup.add(rightWall)
  galleryGroup.add(rightWall)

  const ceilingMat = new THREE.MeshStandardMaterial({
    color: 0x2d2d44,
    roughness: 0.9,
    side: THREE.DoubleSide,
  })
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(GALLERY_W, GALLERY_D),
    ceilingMat
  )
  ceiling.rotation.x = Math.PI / 2
  ceiling.position.y = GALLERY_H
  reflectiveGroup.add(ceiling)
  galleryGroup.add(ceiling)

  const ceilingLightPositions = [
    { x: -4, z: -3 },
    { x: 4, z: -3 },
    { x: -4, z: 3 },
    { x: 4, z: 3 },
  ]
  ceilingLightPositions.forEach((pos) => {
    const light = new THREE.PointLight(0xfff4e6, 1.6, 14, 1.2)
    light.position.set(pos.x, GALLERY_H - 0.1, pos.z)
    light.castShadow = false
    galleryGroup.add(light)

    const fixture = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 0.05, 32),
      new THREE.MeshStandardMaterial({
        color: 0x444466,
        emissive: 0xfff4e6,
        emissiveIntensity: 0.6,
      })
    )
    fixture.position.set(pos.x, GALLERY_H - 0.025, pos.z)
    reflectiveGroup.add(fixture)
    galleryGroup.add(fixture)
  })

  const cornerColors = [0x6a5acd, 0x483d8b, 0x6a5acd, 0x483d8b]
  const cornerPositions = [
    { x: -GALLERY_W / 2 + 0.5, z: -GALLERY_D / 2 + 0.5 },
    { x: GALLERY_W / 2 - 0.5, z: -GALLERY_D / 2 + 0.5 },
    { x: -GALLERY_W / 2 + 0.5, z: GALLERY_D / 2 - 0.5 },
    { x: GALLERY_W / 2 - 0.5, z: GALLERY_D / 2 - 0.5 },
  ]
  cornerPositions.forEach((pos, i) => {
    const light = new THREE.PointLight(cornerColors[i], 1.0, 10, 1.8)
    light.position.set(pos.x, 0.5, pos.z)
    galleryGroup.add(light)

    const column = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 1, 16),
      new THREE.MeshStandardMaterial({
        color: 0x222244,
        emissive: cornerColors[i],
        emissiveIntensity: 0.8,
      })
    )
    column.position.set(pos.x, 0.5, pos.z)
    reflectiveGroup.add(column)
    galleryGroup.add(column)
  })

  const artworks: ArtworkPlacement[] = []

  const wallLayout = [
    {
      info: ARTWORKS[0],
      pos: { x: -GALLERY_W / 2 + 0.08, y: GALLERY_H / 2 + 0.2, z: -2.5 },
      rotY: Math.PI / 2,
    },
    {
      info: ARTWORKS[1],
      pos: { x: -GALLERY_W / 2 + 0.08, y: GALLERY_H / 2 + 0.2, z: 2.5 },
      rotY: Math.PI / 2,
    },
    {
      info: ARTWORKS[2],
      pos: { x: GALLERY_W / 2 - 0.08, y: GALLERY_H / 2 + 0.2, z: -2.5 },
      rotY: -Math.PI / 2,
    },
    {
      info: ARTWORKS[3],
      pos: { x: GALLERY_W / 2 - 0.08, y: GALLERY_H / 2 + 0.2, z: 2.5 },
      rotY: -Math.PI / 2,
    },
    {
      info: ARTWORKS[4],
      pos: { x: -3, y: GALLERY_H / 2 + 0.2, z: -GALLERY_D / 2 + 0.08 },
      rotY: 0,
    },
    {
      info: ARTWORKS[5],
      pos: { x: 3, y: GALLERY_H / 2 + 0.2, z: -GALLERY_D / 2 + 0.08 },
      rotY: 0,
    },
  ]

  wallLayout.forEach((layout) => {
    const { group, pulsePeriod, pulsePhase, version } = createArtworkMesh(layout.info)
    group.position.set(layout.pos.x, layout.pos.y, layout.pos.z)
    group.rotation.y = layout.rotY
    reflectiveGroup.add(group)
    galleryGroup.add(group)
    artworks.push({ info: layout.info, group, pulsePeriod, pulsePhase, version })
  })

  let cubeCamera: THREE.CubeCamera | null = null
  let cubeRenderTarget: THREE.WebGLCubeRenderTarget | null = null
  let floorEnvMap: THREE.CubeTexture | null = null
  let floor: THREE.Mesh | null = null

  const floorGeom = new THREE.PlaneGeometry(GALLERY_W, GALLERY_D)
  const floorMat = new THREE.MeshPhysicalMaterial({
    color: 0x2d2d44,
    transparent: true,
    opacity: 0.92,
    roughness: 0.28,
    metalness: 0.15,
    transmission: 0.08,
    thickness: 0.5,
    clearcoat: 0.45,
    clearcoatRoughness: 0.45,
    envMapIntensity: 0.55,
    reflectivity: 0.35,
  })

  try {
    cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
      format: THREE.RGBAFormat,
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter,
      colorSpace: THREE.SRGBColorSpace,
    })
    cubeCamera = new THREE.CubeCamera(0.05, 50, cubeRenderTarget)
    cubeCamera.position.set(0, -0.001, 0)
    galleryGroup.add(cubeCamera)

    floorEnvMap = cubeRenderTarget.texture
    floorMat.envMap = floorEnvMap
  } catch (e) {
    console.warn('Could not create floor reflection camera:', e)
  }

  floor = new THREE.Mesh(floorGeom, floorMat)
  floor.rotation.x = -Math.PI / 2
  floor.position.y = 0
  floor.receiveShadow = true
  galleryGroup.add(floor)

  function updateReflection(renderer: THREE.WebGLRenderer) {
    if (!cubeCamera || !floor) return

    const prevVisible = floor.visible
    floor.visible = false

    cubeCamera.update(renderer, scene)

    floor.visible = prevVisible
  }

  return { galleryGroup, artworks, floorEnvMap, reflectiveGroup, cubeCamera, cubeRenderTarget, updateReflection }
}
