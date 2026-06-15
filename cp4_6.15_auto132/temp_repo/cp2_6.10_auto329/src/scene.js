import * as THREE from 'three'

const MUSICAL_SCALE = [
  { pitch: 'C4',  frequency: 261.63 },
  { pitch: 'D4',  frequency: 293.66 },
  { pitch: 'E4',  frequency: 329.63 },
  { pitch: 'F4',  frequency: 349.23 },
  { pitch: 'G4',  frequency: 392.00 },
  { pitch: 'A4',  frequency: 440.00 },
  { pitch: 'B4',  frequency: 493.88 },
  { pitch: 'C5',  frequency: 523.25 },
  { pitch: 'D5',  frequency: 587.33 },
  { pitch: 'E5',  frequency: 659.25 },
  { pitch: 'F5',  frequency: 698.46 },
  { pitch: 'G5',  frequency: 783.99 },
]

const COLORS = [
  new THREE.Color(0x00d4ff),
  new THREE.Color(0x00b8e6),
  new THREE.Color(0x0099cc),
  new THREE.Color(0x4ddbff),
  new THREE.Color(0xff6b6b),
  new THREE.Color(0xff8787),
  new THREE.Color(0xffa3a3),
  new THREE.Color(0xff5252),
]

export class SceneManager {
  constructor(container, camera, renderer) {
    this.container = container
    this.camera = camera
    this.renderer = renderer
    this.scene = new THREE.Scene()
    
    this.nodes = []
    this.connections = []
    this.particles = []
    this.shockwaves = []
    
    this.flowIntensity = 0.5
    this.maxNodes = 20
    this.connectionDistance = 8
    this.nodeIdCounter = 0
    
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    this.draggedNode = null
    this.isDragging = false
    this.dragStartPos = new THREE.Vector3()
    this.dragOffset = new THREE.Vector3()
    
    this.audioContext = null
    this.masterGain = null
    
    this.sharedSphereGeometry = new THREE.SphereGeometry(0.4, 32, 32)
    
    this.init()
  }

  init() {
    this.setupScene()
    this.setupLights()
    this.setupBackground()
    this.initAudio()
  }

  setupScene() {
    this.scene.fog = new THREE.FogExp2(0x0a1628, 0.035)
  }

  setupLights() {
    const ambientLight = new THREE.AmbientLight(0x404060, 0.4)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3)
    directionalLight.position.set(5, 10, 7)
    this.scene.add(directionalLight)

    const blueLight = new THREE.PointLight(0x00d4ff, 0.5, 30)
    blueLight.position.set(-10, 5, -10)
    this.scene.add(blueLight)

    const coralLight = new THREE.PointLight(0xff6b6b, 0.3, 30)
    coralLight.position.set(10, -5, 10)
    this.scene.add(coralLight)
  }

  setupBackground() {
    const starGeometry = new THREE.BufferGeometry()
    const starCount = 2000
    const positions = new Float32Array(starCount * 3)
    const colors = new Float32Array(starCount * 3)

    for (let i = 0; i < starCount * 3; i += 3) {
      const radius = 50 + Math.random() * 50
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      
      positions[i] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i + 2] = radius * Math.cos(phi)

      const colorChoice = Math.random()
      if (colorChoice < 0.5) {
        colors[i] = 0.0
        colors[i + 1] = 0.83
        colors[i + 2] = 1.0
      } else {
        colors[i] = 1.0
        colors[i + 1] = 0.42
        colors[i + 2] = 0.42
      }
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const starMaterial = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    })

    this.stars = new THREE.Points(starGeometry, starMaterial)
    this.scene.add(this.stars)
  }

  initAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.value = 0.15
      this.masterGain.connect(this.audioContext.destination)
    } catch (e) {
      console.warn('Web Audio API not supported')
    }
  }

  resumeAudio() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }
  }

  createNode(position, noteIndex = null) {
    if (this.nodes.length >= this.maxNodes) {
      return null
    }

    this.resumeAudio()

    const idx = noteIndex !== null ? noteIndex : Math.floor(Math.random() * MUSICAL_SCALE.length)
    const note = MUSICAL_SCALE[idx]
    const color = COLORS[idx % COLORS.length].clone()

    const gradientTexture = this.createGradientTexture(color)
    
    const material = new THREE.MeshPhongMaterial({
      map: gradientTexture,
      transparent: true,
      opacity: 0.85,
      shininess: 100,
      emissive: color,
      emissiveIntensity: 0.3,
      side: THREE.DoubleSide
    })

    const mesh = new THREE.Mesh(this.sharedSphereGeometry, material)
    mesh.position.copy(position)
    mesh.userData.nodeId = this.nodeIdCounter

    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide
    })
    const glowMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 32, 32),
      glowMaterial
    )
    mesh.add(glowMesh)

    const pointLight = new THREE.PointLight(color, 0.8, 5)
    mesh.add(pointLight)

    this.scene.add(mesh)

    const node = {
      id: this.nodeIdCounter++,
      position: position.clone(),
      pitch: note.pitch,
      frequency: note.frequency,
      color: color,
      pulseSpeed: 0.8 + Math.random() * 0.4,
      pulsePhase: Math.random() * Math.PI * 2,
      baseScale: 1,
      mesh: mesh,
      glowMesh: glowMesh,
      oscillator: null,
      gainNode: null,
      isPlaying: false,
      velocity: new THREE.Vector3(),
      springTarget: position.clone()
    }

    this.nodes.push(node)
    this.createOscillator(node)
    this.updateConnections()
    this.hideHint()

    return node
  }

  createGradientTexture(baseColor) {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')

    const gradient = ctx.createRadialGradient(
      128, 128, 0,
      128, 128, 128
    )
    
    const r = Math.floor(baseColor.r * 255)
    const g = Math.floor(baseColor.g * 255)
    const b = Math.floor(baseColor.b * 255)
    
    gradient.addColorStop(0, `rgba(255, 255, 255, 1)`)
    gradient.addColorStop(0.2, `rgba(${r}, ${g}, ${b}, 0.9)`)
    gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.7)`)
    gradient.addColorStop(0.8, `rgba(${r * 0.5}, ${g * 0.5}, ${b * 0.5}, 0.4)`)
    gradient.addColorStop(1, `rgba(0, 0, 0, 0)`)

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 256, 256)

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }

  createOscillator(node) {
    if (!this.audioContext) return

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()
      
      oscillator.type = 'sine'
      oscillator.frequency.value = node.frequency
      gainNode.gain.value = 0
      
      oscillator.connect(gainNode)
      gainNode.connect(this.masterGain)
      oscillator.start()
      
      node.oscillator = oscillator
      node.gainNode = gainNode
    } catch (e) {
      console.warn('Failed to create oscillator:', e)
    }
  }

  playNote(node, duration = 0.8) {
    if (!node.gainNode || !this.audioContext) return

    const now = this.audioContext.currentTime
    node.gainNode.gain.cancelScheduledValues(now)
    node.gainNode.gain.setValueAtTime(0, now)
    node.gainNode.gain.linearRampToValueAtTime(0.3, now + 0.02)
    node.gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration)
    
    node.isPlaying = true
    setTimeout(() => { node.isPlaying = false }, duration * 1000)
  }

  updateConnections() {
    this.connections.forEach(conn => {
      this.scene.remove(conn.line)
      if (conn.line.geometry) conn.line.geometry.dispose()
      if (conn.line.material) conn.line.material.dispose()
    })
    this.connections = []

    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const nodeA = this.nodes[i]
        const nodeB = this.nodes[j]
        const distance = nodeA.position.distanceTo(nodeB.position)

        if (distance < this.connectionDistance) {
          this.createConnection(nodeA, nodeB, distance)
        }
      }
    }
  }

  createConnection(nodeA, nodeB, distance) {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(2 * 3)
    
    positions[0] = nodeA.position.x
    positions[1] = nodeA.position.y
    positions[2] = nodeA.position.z
    positions[3] = nodeB.position.x
    positions[4] = nodeB.position.y
    positions[5] = nodeB.position.z
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const color = new THREE.Color().lerpColors(nodeA.color, nodeB.color, 0.5)
    
    const material = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.4 * this.flowIntensity
    })

    const line = new THREE.Line(geometry, material)
    line.userData.isConnection = true
    
    this.scene.add(line)

    this.connections.push({
      startId: nodeA.id,
      endId: nodeB.id,
      line: line,
      flowOffset: Math.random() * Math.PI * 2,
      baseOpacity: 0.4,
      distance: distance
    })
  }

  triggerSonicBoom(node) {
    this.playNote(node, 1.2)
    this.createShockwave(node)
    this.createParticles(node)
    this.perturbNearbyNodes(node)
  }

  createShockwave(node) {
    const geometry = new THREE.RingGeometry(0.5, 0.7, 64)
    const material = new THREE.MeshBasicMaterial({
      color: node.color,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    })

    const ring = new THREE.Mesh(geometry, material)
    ring.position.copy(node.position)
    ring.lookAt(this.camera.position)
    
    this.scene.add(ring)

    this.shockwaves.push({
      mesh: ring,
      scale: 1,
      opacity: 0.8,
      speed: 8
    })
  }

  createParticles(node) {
    const particleCount = 30
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const velocities = []

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = node.position.x
      positions[i * 3 + 1] = node.position.y
      positions[i * 3 + 2] = node.position.z

      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const speed = 2 + Math.random() * 3
      
      velocities.push(new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed
      ))
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const material = new THREE.PointsMaterial({
      color: node.color,
      size: 0.15,
      transparent: true,
      opacity: 1,
      sizeAttenuation: true
    })

    const particles = new THREE.Points(geometry, material)
    this.scene.add(particles)

    this.particles.push({
      points: particles,
      velocities: velocities,
      life: 1,
      decay: 0.02
    })
  }

  perturbNearbyNodes(sourceNode) {
    const pushRadius = 5
    const pushStrength = 0.5

    this.nodes.forEach(node => {
      if (node.id === sourceNode.id) return
      
      const distance = node.position.distanceTo(sourceNode.position)
      if (distance < pushRadius) {
        const direction = node.position.clone().sub(sourceNode.position).normalize()
        const force = pushStrength * (1 - distance / pushRadius)
        node.velocity.add(direction.multiplyScalar(force))
      }
    })
  }

  setFlowIntensity(value) {
    this.flowIntensity = value
    this.connections.forEach(conn => {
      conn.line.material.opacity = conn.baseOpacity * this.flowIntensity
    })
  }

  getIntersectedNode(event) {
    const rect = this.container.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera)
    
    const meshes = this.nodes.map(n => n.mesh)
    const intersects = this.raycaster.intersectObjects(meshes, false)

    if (intersects.length > 0) {
      const nodeId = intersects[0].object.userData.nodeId
      return this.nodes.find(n => n.id === nodeId)
    }
    return null
  }

  getClickPosition(event) {
    const rect = this.container.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera)
    
    const planeNormal = new THREE.Vector3(0, 0, 1)
    planeNormal.applyQuaternion(this.camera.quaternion)
    
    const plane = new THREE.Plane(planeNormal, -5)
    const targetPoint = new THREE.Vector3()
    
    this.raycaster.ray.intersectPlane(plane, targetPoint)
    
    const distance = targetPoint.length()
    if (distance > 8) {
      targetPoint.normalize().multiplyScalar(8)
    }
    
    return targetPoint
  }

  startDrag(node, event) {
    this.draggedNode = node
    this.isDragging = true
    this.dragStartPos.copy(node.position)
    
    const clickPos = this.getClickPosition(event)
    this.dragOffset.copy(node.position).sub(clickPos)
  }

  updateDrag(event) {
    if (!this.draggedNode) return

    const clickPos = this.getClickPosition(event)
    const targetPos = clickPos.add(this.dragOffset)
    
    const distance = targetPos.length()
    if (distance > 8) {
      targetPos.normalize().multiplyScalar(8)
    }
    
    this.draggedNode.springTarget.copy(targetPos)
    
    this.draggedNode.mesh.scale.setScalar(1.3)
    this.draggedNode.mesh.material.emissiveIntensity = 0.8
  }

  endDrag() {
    if (this.draggedNode) {
      this.draggedNode.mesh.scale.setScalar(1)
      this.draggedNode.mesh.material.emissiveIntensity = 0.3
      
      this.draggedNode.position.copy(this.draggedNode.springTarget)
      this.draggedNode.mesh.position.copy(this.draggedNode.springTarget)
      
      this.updateConnections()
    }
    
    this.draggedNode = null
    this.isDragging = false
  }

  hideHint() {
    const hint = document.getElementById('hint-text')
    if (hint && this.nodes.length > 0) {
      hint.classList.add('hidden')
    }
  }

  update(time, deltaTime) {
    this.updateNodes(time, deltaTime)
    this.updateConnections(time)
    this.updateShockwaves(deltaTime)
    this.updateParticles(deltaTime)
    this.updateStars(time)
  }

  updateNodes(time, deltaTime) {
    this.nodes.forEach(node => {
      const pulse = Math.sin(time * node.pulseSpeed + node.pulsePhase) * 0.15 + 1
      const targetScale = node === this.draggedNode ? 1.3 : pulse
      
      node.mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
      
      if (node.glowMesh) {
        const glowPulse = pulse * 1.2
        node.glowMesh.scale.setScalar(glowPulse)
        node.glowMesh.material.opacity = 0.15 + Math.sin(time * node.pulseSpeed + node.pulsePhase) * 0.1
      }
      
      if (node.isPlaying) {
        node.mesh.material.emissiveIntensity = 0.6
      } else if (node !== this.draggedNode) {
        node.mesh.material.emissiveIntensity = 0.3 + Math.sin(time * node.pulseSpeed * 2) * 0.1
      }

      if (node !== this.draggedNode) {
        node.velocity.multiplyScalar(0.92)
        node.springTarget.add(node.velocity.clone().multiplyScalar(deltaTime * 60))
        
        const springForce = node.springTarget.clone().sub(node.position).multiplyScalar(0.05)
        node.velocity.add(springForce)
        
        node.position.add(node.velocity.clone().multiplyScalar(deltaTime * 60))
        node.mesh.position.copy(node.position)
      }
    })
  }

  updateConnections(time) {
    this.connections.forEach(conn => {
      const startNode = this.nodes.find(n => n.id === conn.startId)
      const endNode = this.nodes.find(n => n.id === conn.endId)
      
      if (startNode && endNode) {
        const positions = conn.line.geometry.attributes.position.array
        positions[0] = startNode.position.x
        positions[1] = startNode.position.y
        positions[2] = startNode.position.z
        positions[3] = endNode.position.x
        positions[4] = endNode.position.y
        positions[5] = endNode.position.z
        conn.line.geometry.attributes.position.needsUpdate = true
        
        const flow = Math.sin(time * 3 + conn.flowOffset) * 0.3 + 0.7
        const intensityFactor = this.flowIntensity * flow
        conn.line.material.opacity = conn.baseOpacity * intensityFactor
        
        const baseLinewidth = 1 + this.flowIntensity * 3
        conn.line.material.color.setHSL(
          0.55 - this.flowIntensity * 0.2,
          0.8,
          0.5 + this.flowIntensity * 0.2
        )
      }
    })
  }

  updateShockwaves(deltaTime) {
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i]
      sw.scale += sw.speed * deltaTime * 60
      sw.opacity -= 0.03 * deltaTime * 60
      
      sw.mesh.scale.setScalar(sw.scale)
      sw.mesh.material.opacity = sw.opacity
      sw.mesh.lookAt(this.camera.position)
      
      if (sw.opacity <= 0) {
        this.scene.remove(sw.mesh)
        sw.mesh.geometry.dispose()
        sw.mesh.material.dispose()
        this.shockwaves.splice(i, 1)
      }
    }
  }

  updateParticles(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      const positions = p.points.geometry.attributes.position.array
      
      for (let j = 0; j < p.velocities.length; j++) {
        positions[j * 3] += p.velocities[j].x * deltaTime * 60
        positions[j * 3 + 1] += p.velocities[j].y * deltaTime * 60
        positions[j * 3 + 2] += p.velocities[j].z * deltaTime * 60
        
        p.velocities[j].multiplyScalar(0.96)
      }
      
      p.points.geometry.attributes.position.needsUpdate = true
      
      p.life -= p.decay * deltaTime * 60
      p.points.material.opacity = p.life
      p.points.material.size = 0.15 * p.life
      
      if (p.life <= 0) {
        this.scene.remove(p.points)
        p.points.geometry.dispose()
        p.points.material.dispose()
        this.particles.splice(i, 1)
      }
    }
  }

  updateStars(time) {
    if (this.stars) {
      this.stars.rotation.y = time * 0.02
      this.stars.rotation.x = Math.sin(time * 0.01) * 0.1
    }
  }

  getNodes() {
    return this.nodes
  }

  getScene() {
    return this.scene
  }
}
