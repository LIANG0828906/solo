import { Ref, ref } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const SPHERE_RADIUS = 15
const NODE_RADIUS = 0.35
const GLOW_SCALE = 2.2
const MAX_PARTICLES = 500
const ROTATION_SPEED = 0.01
const BG_COLOR = 0x1a1a2e

const COLOR_THEMES: Record<string, { primary: THREE.Color; secondary: THREE.Color }> = {
  cyberpunk: { primary: new THREE.Color(0x00ffff), secondary: new THREE.Color(0x9d00ff) },
  warm: { primary: new THREE.Color(0xff6600), secondary: new THREE.Color(0xff0044) },
  fresh: { primary: new THREE.Color(0x0088ff), secondary: new THREE.Color(0x00ff88) }
}

interface NodeObj {
  mesh: THREE.Mesh
  glowMesh: THREE.Mesh
  position: THREE.Vector3
  colorFactor: number
  rotationAxis: THREE.Vector3
  index: number
}

interface ConnObj {
  from: number
  to: number
  line: THREE.Line
}

const particleVertexShader = `
  attribute float aSize;
  attribute float aOpacity;
  attribute vec3 aColor;
  varying float vOpacity;
  varying vec3 vColor;
  void main() {
    vOpacity = aOpacity;
    vColor = aColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (220.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const particleFragmentShader = `
  varying float vOpacity;
  varying vec3 vColor;
  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;
    float glow = smoothstep(0.5, 0.05, dist);
    float alpha = glow * vOpacity;
    vec3 finalColor = vColor * (1.0 + glow * 0.4);
    gl_FragColor = vec4(finalColor, alpha);
  }
`

export function useFlowScene(container: Ref<HTMLElement | null>) {
  let scene: THREE.Scene
  let camera: THREE.PerspectiveCamera
  let renderer: THREE.WebGLRenderer
  let controls: OrbitControls
  let animationId = 0
  let clock = new THREE.Clock()

  let nodeObjs: NodeObj[] = []
  let connObjs: ConnObj[] = []
  let nodeGroup = new THREE.Group()

  let particlePositions: Float32Array
  let particleColorArr: Float32Array
  let particleOpacities: Float32Array
  let particleSizeArr: Float32Array
  let particleGeometry: THREE.BufferGeometry
  let particleMaterial: THREE.ShaderMaterial
  let particlePoints: THREE.Points
  let particleData: { connIdx: number; progress: number }[] = []
  let activeParticles = 0

  let currentNodeCount = 20
  let currentFlowSpeed = 5
  let currentThemeName = 'cyberpunk'
  let livePrimary: THREE.Color = COLOR_THEMES.cyberpunk.primary.clone()
  let liveSecondary: THREE.Color = COLOR_THEMES.cyberpunk.secondary.clone()
  let targetPrimary: THREE.Color = COLOR_THEMES.cyberpunk.primary.clone()
  let targetSecondary: THREE.Color = COLOR_THEMES.cyberpunk.secondary.clone()

  let hoveredIdx = -1
  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2(-999, -999)
  let labelEl: HTMLDivElement | null = null

  let frames = 0
  let lastFpsTime = 0
  const fps = ref(0)

  const nodeGeometry = new THREE.SphereGeometry(NODE_RADIUS, 24, 24)
  const glowGeometry = new THREE.SphereGeometry(NODE_RADIUS * GLOW_SCALE, 16, 16)

  function fibonacciSphere(count: number, radius: number): THREE.Vector3[] {
    const pts: THREE.Vector3[] = []
    const phi = Math.PI * (Math.sqrt(5) - 1)
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2
      const r = Math.sqrt(Math.max(0, 1 - y * y))
      const theta = phi * i
      pts.push(new THREE.Vector3(
        Math.cos(theta) * r * radius,
        y * radius,
        Math.sin(theta) * r * radius
      ))
    }
    return pts
  }

  function buildTopology(): [number, number][] {
    const conns: [number, number][] = []
    const set = new Set<string>()
    for (let i = 0; i < nodeObjs.length; i++) {
      const dists: { j: number; d: number }[] = []
      for (let j = 0; j < nodeObjs.length; j++) {
        if (i === j) continue
        dists.push({ j, d: nodeObjs[i].position.distanceTo(nodeObjs[j].position) })
      }
      dists.sort((a, b) => a.d - b.d)
      const k = Math.min(3, dists.length)
      for (let m = 0; m < k; m++) {
        const j = dists[m].j
        const key = Math.min(i, j) + '-' + Math.max(i, j)
        if (!set.has(key)) {
          set.add(key)
          conns.push([i, j])
        }
      }
    }
    return conns
  }

  function getNodeColor(factor: number): THREE.Color {
    return livePrimary.clone().lerp(liveSecondary, factor)
  }

  function createNodes() {
    clearNodes()
    const positions = fibonacciSphere(currentNodeCount, SPHERE_RADIUS)
    for (let i = 0; i < positions.length; i++) {
      const factor = Math.random()
      const color = getNodeColor(factor)

      const mat = new THREE.MeshBasicMaterial({ color })
      const mesh = new THREE.Mesh(nodeGeometry, mat)
      mesh.position.copy(positions[i])
      mesh.userData = { nodeIndex: i }

      const glowMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false
      })
      const glowMesh = new THREE.Mesh(glowGeometry, glowMat)
      glowMesh.position.copy(positions[i])

      const axis = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize()

      nodeGroup.add(mesh)
      nodeGroup.add(glowMesh)

      nodeObjs.push({
        mesh,
        glowMesh,
        position: positions[i],
        colorFactor: factor,
        rotationAxis: axis,
        index: i
      })
    }
  }

  function clearNodes() {
    for (const n of nodeObjs) {
      nodeGroup.remove(n.mesh)
      nodeGroup.remove(n.glowMesh)
      ;(n.mesh.material as THREE.Material).dispose()
      ;(n.glowMesh.material as THREE.Material).dispose()
    }
    nodeObjs = []
  }

  function createConnections() {
    clearConnections()
    const topology = buildTopology()
    for (const [fi, ti] of topology) {
      const fromPos = nodeObjs[fi].position
      const toPos = nodeObjs[ti].position
      const fromColor = getNodeColor(nodeObjs[fi].colorFactor)
      const toColor = getNodeColor(nodeObjs[ti].colorFactor)

      const positions = new Float32Array([
        fromPos.x, fromPos.y, fromPos.z,
        toPos.x, toPos.y, toPos.z
      ])
      const colors = new Float32Array([
        fromColor.r, fromColor.g, fromColor.b,
        toColor.r, toColor.g, toColor.b
      ])

      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

      const mat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.5,
        depthWrite: false
      })
      const line = new THREE.Line(geo, mat)
      scene.add(line)
      connObjs.push({ from: fi, to: ti, line })
    }
  }

  function clearConnections() {
    for (const c of connObjs) {
      scene.remove(c.line)
      c.line.geometry.dispose()
      ;(c.line.material as THREE.Material).dispose()
    }
    connObjs = []
  }

  function initParticleSystem() {
    particlePositions = new Float32Array(MAX_PARTICLES * 3)
    particleColorArr = new Float32Array(MAX_PARTICLES * 3)
    particleOpacities = new Float32Array(MAX_PARTICLES)
    particleSizeArr = new Float32Array(MAX_PARTICLES)

    particleGeometry = new THREE.BufferGeometry()
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    particleGeometry.setAttribute('aColor', new THREE.BufferAttribute(particleColorArr, 3))
    particleGeometry.setAttribute('aOpacity', new THREE.BufferAttribute(particleOpacities, 1))
    particleGeometry.setAttribute('aSize', new THREE.BufferAttribute(particleSizeArr, 1))
    particleGeometry.setDrawRange(0, 0)

    particleMaterial = new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    particlePoints = new THREE.Points(particleGeometry, particleMaterial)
    scene.add(particlePoints)
  }

  function distributeParticles() {
    particleData = []
    if (connObjs.length === 0) {
      activeParticles = 0
      particleGeometry.setDrawRange(0, 0)
      return
    }

    const perConn = Math.floor(MAX_PARTICLES / connObjs.length)
    const remainder = MAX_PARTICLES % connObjs.length
    for (let i = 0; i < connObjs.length; i++) {
      const count = perConn + (i < remainder ? 1 : 0)
      for (let j = 0; j < count; j++) {
        particleData.push({
          connIdx: i,
          progress: Math.random()
        })
      }
    }
    activeParticles = particleData.length
    particleGeometry.setDrawRange(0, activeParticles)
  }

  function rebuildScene() {
    createNodes()
    createConnections()
    distributeParticles()
  }

  function updateParticleBuffers(dt: number) {
    const speed = currentFlowSpeed * 0.02
    for (let i = 0; i < activeParticles; i++) {
      const pd = particleData[i]
      pd.progress += speed * dt
      if (pd.progress > 1) pd.progress -= 1

      const conn = connObjs[pd.connIdx]
      if (!conn) continue

      const fromNode = nodeObjs[conn.from]
      const toNode = nodeObjs[conn.to]
      if (!fromNode || !toNode) continue

      const t = pd.progress
      const px = fromNode.position.x + (toNode.position.x - fromNode.position.x) * t
      const py = fromNode.position.y + (toNode.position.y - fromNode.position.y) * t
      const pz = fromNode.position.z + (toNode.position.z - fromNode.position.z) * t

      particlePositions[i * 3] = px
      particlePositions[i * 3 + 1] = py
      particlePositions[i * 3 + 2] = pz

      const fromColor = getNodeColor(fromNode.colorFactor)
      const toColor = getNodeColor(toNode.colorFactor)
      particleColorArr[i * 3] = fromColor.r + (toColor.r - fromColor.r) * t
      particleColorArr[i * 3 + 1] = fromColor.g + (toColor.g - fromColor.g) * t
      particleColorArr[i * 3 + 2] = fromColor.b + (toColor.b - fromColor.b) * t

      particleOpacities[i] = 1.0 - t * 0.75
      particleSizeArr[i] = 0.3
    }

    if (activeParticles > 0) {
      particleGeometry.attributes.position.needsUpdate = true
      particleGeometry.attributes.aColor.needsUpdate = true
      particleGeometry.attributes.aOpacity.needsUpdate = true
      particleGeometry.attributes.aSize.needsUpdate = true
    }
  }

  function updateNodeRotations() {
    for (const n of nodeObjs) {
      n.mesh.rotateOnAxis(n.rotationAxis, ROTATION_SPEED)
      n.glowMesh.rotation.copy(n.mesh.rotation)
    }
  }

  function updateThemeColors() {
    livePrimary.lerp(targetPrimary, 0.04)
    liveSecondary.lerp(targetSecondary, 0.04)

    for (const n of nodeObjs) {
      const c = getNodeColor(n.colorFactor)
      ;(n.mesh.material as THREE.MeshBasicMaterial).color.copy(c)
      ;(n.glowMesh.material as THREE.MeshBasicMaterial).color.copy(c)
    }

    for (const conn of connObjs) {
      const fromColor = getNodeColor(nodeObjs[conn.from].colorFactor)
      const toColor = getNodeColor(nodeObjs[conn.to].colorFactor)
      const colorAttr = conn.line.geometry.getAttribute('color') as THREE.BufferAttribute
      colorAttr.setXYZ(0, fromColor.r, fromColor.g, fromColor.b)
      colorAttr.setXYZ(1, toColor.r, toColor.g, toColor.b)
      colorAttr.needsUpdate = true
    }
  }

  function handleHover() {
    raycaster.setFromCamera(pointer, camera)
    const meshes = nodeObjs.map(n => n.mesh)
    const intersects = raycaster.intersectObjects(meshes)

    if (intersects.length > 0) {
      const idx = intersects[0].object.userData.nodeIndex as number
      if (hoveredIdx !== idx) {
        resetHover()
        hoveredIdx = idx
        const node = nodeObjs[idx]
        node.mesh.scale.setScalar(1.5)
        node.glowMesh.scale.setScalar(1.5)
        ;(node.glowMesh.material as THREE.MeshBasicMaterial).opacity = 0.5
      }
      updateLabelPosition(nodeObjs[hoveredIdx])
    } else {
      resetHover()
      if (labelEl) labelEl.style.display = 'none'
    }
  }

  function resetHover() {
    if (hoveredIdx >= 0 && hoveredIdx < nodeObjs.length) {
      const node = nodeObjs[hoveredIdx]
      node.mesh.scale.setScalar(1)
      node.glowMesh.scale.setScalar(1)
      ;(node.glowMesh.material as THREE.MeshBasicMaterial).opacity = 0.25
    }
    hoveredIdx = -1
  }

  function updateLabelPosition(node: NodeObj) {
    if (!labelEl) return
    const vector = node.position.clone().add(new THREE.Vector3(0, NODE_RADIUS * GLOW_SCALE + 0.6, 0))
    vector.project(camera)
    const x = (vector.x * 0.5 + 0.5) * renderer.domElement.clientWidth
    const y = (-vector.y * 0.5 + 0.5) * renderer.domElement.clientHeight
    labelEl.style.display = 'block'
    labelEl.style.left = x + 'px'
    labelEl.style.top = y + 'px'
    labelEl.style.transform = 'translate(-50%, -100%)'
    labelEl.textContent = 'Node ' + String(node.index + 1).padStart(2, '0')
  }

  function onPointerMove(e: MouseEvent) {
    const rect = renderer.domElement.getBoundingClientRect()
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
  }

  function onResize() {
    if (!camera || !renderer) return
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }

  function animate() {
    animationId = requestAnimationFrame(animate)
    const dt = Math.min(clock.getDelta(), 0.1)

    frames++
    const now = performance.now()
    if (now - lastFpsTime >= 1000) {
      fps.value = frames
      frames = 0
      lastFpsTime = now
    }

    controls.update()
    updateNodeRotations()
    updateThemeColors()
    updateParticleBuffers(dt * 60)
    handleHover()

    renderer.render(scene, camera)
  }

  function init() {
    if (!container.value) return

    scene = new THREE.Scene()
    scene.background = new THREE.Color(BG_COLOR)

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(0, 5, 35)

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.value.appendChild(renderer.domElement)

    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 10
    controls.maxDistance = 80

    const ambient = new THREE.AmbientLight(0x404040, 1.5)
    scene.add(ambient)
    scene.add(nodeGroup)

    initParticleSystem()
    rebuildScene()

    renderer.domElement.addEventListener('pointermove', onPointerMove)
    window.addEventListener('resize', onResize)

    clock.start()
    lastFpsTime = performance.now()
    animate()
  }

  function dispose() {
    if (animationId) cancelAnimationFrame(animationId)
    renderer?.domElement?.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('resize', onResize)

    clearConnections()
    clearNodes()

    if (particleGeometry) particleGeometry.dispose()
    if (particleMaterial) particleMaterial.dispose()
    nodeGeometry.dispose()
    glowGeometry.dispose()

    controls?.dispose()
    renderer?.dispose()
    if (container.value && renderer?.domElement) {
      container.value.removeChild(renderer.domElement)
    }
  }

  function setNodeCount(count: number) {
    currentNodeCount = count
    rebuildScene()
  }

  function setFlowSpeed(speed: number) {
    currentFlowSpeed = speed
  }

  function setColorTheme(name: string) {
    currentThemeName = name
    const theme = COLOR_THEMES[name]
    if (theme) {
      targetPrimary.copy(theme.primary)
      targetSecondary.copy(theme.secondary)
    }
  }

  function setLabelElement(el: HTMLDivElement) {
    labelEl = el
  }

  return {
    init,
    dispose,
    fps,
    setNodeCount,
    setFlowSpeed,
    setColorTheme,
    setLabelElement
  }
}
