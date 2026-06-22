import * as THREE from 'three'

const BUBBLE_COLORS = [
  0x4fc3f7,
  0xe91e63,
  0xffd700,
  0x9c27b0,
  0x00bcd4,
  0xff9800,
  0x66bb6a,
  0x7c4dff
]

export class BubbleManager {
  constructor(scene, camera, renderer, audioContext) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.audioContext = audioContext
    this.bubbles = []
    this.particles = []
    this.stars = []
    this.growthSpeed = 1.0
    this.maxBubbles = 20
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    this.bubbleMeshes = []
    this.initStars()
  }

  initStars() {
    const starGeometry = new THREE.BufferGeometry()
    const starCount = 1500
    const positions = new Float32Array(starCount * 3)
    const colors = new Float32Array(starCount * 3)
    const sizes = new Float32Array(starCount)

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3
      const radius = 150 + Math.random() * 100
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i3 + 2] = radius * Math.cos(phi)

      const color = new THREE.Color()
      color.setHSL(0.6 + Math.random() * 0.2, 0.8, 0.5 + Math.random() * 0.5)
      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b

      sizes[i] = Math.random() * 2 + 0.5
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        varying float vSize;
        uniform float time;
        void main() {
          vColor = color;
          vSize = size;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float twinkle = sin(time * 2.0 + position.x * 0.1 + position.y * 0.1) * 0.3 + 0.7;
          gl_PointSize = size * twinkle * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          if (dist > 0.5) discard;
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    this.starField = new THREE.Points(starGeometry, starMaterial)
    this.scene.add(this.starField)
    this.starMaterial = starMaterial
  }

  createBubble(position = null, velocity = null) {
    if (this.bubbles.length >= this.maxBubbles) {
      this.removeOldestBubble()
    }

    if (!position) {
      position = new THREE.Vector3(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 30
      )
    }

    if (!velocity) {
      velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1
      )
    }

    const color = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)]
    
    const bubbleGroup = new THREE.Group()
    
    const bubbleGeometry = new THREE.SphereGeometry(1, 64, 64)
    const bubbleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        baseColor: { value: new THREE.Color(color) },
        targetColor: { value: new THREE.Color(color) },
        colorTransition: { value: 0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        uniform float time;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          vUv = uv;
          vec3 pos = position;
          float noise = sin(pos.x * 3.0 + time) * cos(pos.y * 3.0 + time * 0.7) * sin(pos.z * 3.0 + time * 0.5) * 0.02;
          pos += normal * noise;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        uniform float time;
        uniform vec3 baseColor;
        uniform vec3 targetColor;
        uniform float colorTransition;
        
        void main() {
          vec3 viewDirection = normalize(cameraPosition - vPosition);
          float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), 3.0);
          
          vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
          float specular = pow(max(dot(reflect(-lightDir, vNormal), viewDirection), 0.0), 64.0);
          
          float highlight = sin(vUv.x * 10.0 + time * 2.0) * cos(vUv.y * 10.0 + time * 1.5) * 0.1 + 0.9;
          
          vec3 finalBaseColor = mix(baseColor, targetColor, colorTransition);
          vec3 color = finalBaseColor * (0.3 + fresnel * 0.7) + specular * vec3(1.0, 0.95, 0.8) * 0.8;
          color *= highlight;
          
          float alpha = 0.25 + fresnel * 0.45;
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    })

    const bubbleMesh = new THREE.Mesh(bubbleGeometry, bubbleMaterial)
    bubbleMesh.scale.setScalar(0.5)
    bubbleGroup.add(bubbleMesh)

    const innerStarGeometry = new THREE.SphereGeometry(0.15, 16, 16)
    const innerStarMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        glowColor: { value: new THREE.Color(0xffd700) }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform float time;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          float pulse = 1.0 + sin(time * 5.0) * 0.2;
          vec3 pos = position * pulse;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform float time;
        uniform vec3 glowColor;
        void main() {
          vec3 viewDirection = normalize(cameraPosition - vPosition);
          float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), 2.0);
          float pulse = sin(time * 8.0) * 0.5 + 0.5;
          vec3 color = glowColor * (0.8 + pulse * 0.4);
          float alpha = 0.9 + fresnel * 0.1;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    const innerStar = new THREE.Mesh(innerStarGeometry, innerStarMaterial)
    bubbleGroup.add(innerStar)

    const starGlowGeometry = new THREE.SphereGeometry(0.4, 16, 16)
    const starGlowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        glowColor: { value: new THREE.Color(0xffd700) }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform float time;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          float pulse = 1.0 + sin(time * 3.0) * 0.3;
          vec3 pos = position * pulse;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform float time;
        uniform vec3 glowColor;
        void main() {
          vec3 viewDirection = normalize(cameraPosition - vPosition);
          float dist = length(gl_PointCoord - vec2(0.5));
          float glow = pow(1.0 - abs(dot(viewDirection, vNormal)), 4.0);
          float pulse = sin(time * 4.0) * 0.3 + 0.7;
          vec3 color = glowColor * pulse;
          float alpha = glow * 0.6;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false
    })

    const starGlow = new THREE.Mesh(starGlowGeometry, starGlowMaterial)
    bubbleGroup.add(starGlow)

    bubbleGroup.position.copy(position)
    this.scene.add(bubbleGroup)

    const bubble = {
      mesh: bubbleGroup,
      bubbleMesh: bubbleMesh,
      innerStar: innerStar,
      starGlow: starGlow,
      material: bubbleMaterial,
      starMaterial: innerStarMaterial,
      glowMaterial: starGlowMaterial,
      velocity: velocity,
      targetRadius: 1.5 + Math.random() * 2,
      currentRadius: 0.5,
      mass: 1,
      color: color,
      isColorChanging: false,
      colorTransitionProgress: 0,
      originalColor: new THREE.Color(color)
    }

    this.bubbles.push(bubble)
    this.bubbleMeshes.push(bubbleMesh)
    this.playBubbleSound(800, 0.1)

    return bubble
  }

  removeOldestBubble() {
    const oldest = this.bubbles.shift()
    this.scene.remove(oldest.mesh)
    oldest.bubbleMesh.geometry.dispose()
    oldest.material.dispose()
    oldest.innerStar.geometry.dispose()
    oldest.starMaterial.dispose()
    oldest.starGlow.geometry.dispose()
    oldest.glowMaterial.dispose()
    this.bubbleMeshes.shift()
  }

  setGrowthSpeed(speed) {
    this.growthSpeed = speed
  }

  update(deltaTime) {
    const dt = deltaTime * this.growthSpeed

    this.starMaterial.uniforms.time.value += deltaTime

    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const bubble = this.bubbles[i]
      
      if (bubble.currentRadius < bubble.targetRadius) {
        bubble.currentRadius += dt * 0.3
        if (bubble.currentRadius > bubble.targetRadius) {
          bubble.currentRadius = bubble.targetRadius
        }
        bubble.bubbleMesh.scale.setScalar(bubble.currentRadius)
      }

      bubble.mesh.position.add(bubble.velocity.clone().multiplyScalar(dt * 60))

      const bounds = 40
      if (Math.abs(bubble.mesh.position.x) > bounds) {
        bubble.velocity.x *= -1
        bubble.mesh.position.x = Math.sign(bubble.mesh.position.x) * bounds
      }
      if (Math.abs(bubble.mesh.position.y) > bounds) {
        bubble.velocity.y *= -1
        bubble.mesh.position.y = Math.sign(bubble.mesh.position.y) * bounds
      }
      if (Math.abs(bubble.mesh.position.z) > bounds) {
        bubble.velocity.z *= -1
        bubble.mesh.position.z = Math.sign(bubble.mesh.position.z) * bounds
      }

      bubble.material.uniforms.time.value += deltaTime
      bubble.starMaterial.uniforms.time.value += deltaTime
      bubble.glowMaterial.uniforms.time.value += deltaTime

      if (bubble.isColorChanging) {
        bubble.colorTransitionProgress += deltaTime * 2
        if (bubble.colorTransitionProgress >= 1) {
          bubble.colorTransitionProgress = 1
          bubble.isColorChanging = false
          bubble.originalColor.copy(bubble.material.uniforms.targetColor.value)
        }
        bubble.material.uniforms.colorTransition.value = bubble.colorTransitionProgress
      }

      this.checkCollisions(i)
    }

    this.updateParticles(deltaTime)
  }

  checkCollisions(index) {
    const bubbleA = this.bubbles[index]
    
    for (let j = index + 1; j < this.bubbles.length; j++) {
      const bubbleB = this.bubbles[j]
      
      const distance = bubbleA.mesh.position.distanceTo(bubbleB.mesh.position)
      const minDistance = bubbleA.currentRadius + bubbleB.currentRadius
      
      if (distance < minDistance) {
        this.resolveCollision(bubbleA, bubbleB, distance, minDistance)
      }
    }
  }

  resolveCollision(bubbleA, bubbleB, distance, minDistance) {
    const overlap = (minDistance - distance) / 2
    const direction = bubbleB.mesh.position.clone().sub(bubbleA.mesh.position).normalize()
    
    bubbleA.mesh.position.sub(direction.clone().multiplyScalar(overlap))
    bubbleB.mesh.position.add(direction.clone().multiplyScalar(overlap))

    const relativeVelocity = bubbleB.velocity.clone().sub(bubbleA.velocity)
    const velocityAlongNormal = relativeVelocity.dot(direction)
    
    if (velocityAlongNormal > 0) return

    const restitution = 0.8
    const impulse = -(1 + restitution) * velocityAlongNormal / (1 / bubbleA.mass + 1 / bubbleB.mass)
    
    const impulseVector = direction.clone().multiplyScalar(impulse)
    bubbleA.velocity.sub(impulseVector.clone().multiplyScalar(1 / bubbleA.mass))
    bubbleB.velocity.add(impulseVector.clone().multiplyScalar(1 / bubbleB.mass))

    const collisionPoint = bubbleA.mesh.position.clone().add(direction.clone().multiplyScalar(bubbleA.currentRadius))
    this.createCollisionParticles(collisionPoint, bubbleA.color, bubbleB.color)
    
    const frequency = 400 + Math.random() * 400
    this.playBubbleSound(frequency, 0.15)

    if (Math.random() < 0.3 && this.bubbles.length < this.maxBubbles) {
      this.mergeBubbles(bubbleA, bubbleB)
    }
  }

  mergeBubbles(bubbleA, bubbleB) {
    const center = bubbleA.mesh.position.clone().add(bubbleB.mesh.position).multiplyScalar(0.5)
    const newRadius = Math.min(5, Math.cbrt(Math.pow(bubbleA.currentRadius, 3) + Math.pow(bubbleB.currentRadius, 3)))
    
    const velocity = bubbleA.velocity.clone().add(bubbleB.velocity).multiplyScalar(0.5)

    const indexA = this.bubbles.indexOf(bubbleA)
    const indexB = this.bubbles.indexOf(bubbleB)
    
    this.removeBubble(indexA > indexB ? indexA : indexB)
    this.removeBubble(indexA > indexB ? indexB : indexA)

    const newBubble = this.createBubble(center, velocity)
    newBubble.currentRadius = newRadius
    newBubble.targetRadius = newRadius
    newBubble.bubbleMesh.scale.setScalar(newRadius)
    newBubble.mass = bubbleA.mass + bubbleB.mass

    this.playBubbleSound(200, 0.2)
  }

  removeBubble(index) {
    const bubble = this.bubbles[index]
    this.scene.remove(bubble.mesh)
    bubble.bubbleMesh.geometry.dispose()
    bubble.material.dispose()
    bubble.innerStar.geometry.dispose()
    bubble.starMaterial.dispose()
    bubble.starGlow.geometry.dispose()
    bubble.glowMaterial.dispose()
    this.bubbles.splice(index, 1)
    this.bubbleMeshes.splice(index, 1)
  }

  createCollisionParticles(position, color1, color2) {
    const particleCount = 30
    
    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.05 + Math.random() * 0.1, 8, 8)
      const color = Math.random() > 0.5 ? color1 : color2
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending
      })
      
      const particle = new THREE.Mesh(geometry, material)
      particle.position.copy(position)
      
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5
      ).normalize().multiplyScalar(0.1 + Math.random() * 0.2)
      
      this.scene.add(particle)
      
      this.particles.push({
        mesh: particle,
        velocity: velocity,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.02
      })
    }

    this.createRipple(position, color1)
  }

  createRipple(position, color) {
    const rippleGeometry = new THREE.RingGeometry(0.1, 0.15, 64)
    const rippleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(color) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vTime;
        uniform float time;
        void main() {
          vUv = uv;
          vTime = time;
          vec3 pos = position;
          float scale = 1.0 + time * 5.0;
          pos.xy *= scale;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying float vTime;
        uniform vec3 color;
        void main() {
          float dist = length(vUv - 0.5);
          float alpha = (1.0 - smoothstep(0.0, 0.5, dist)) * (1.0 - vTime);
          gl_FragColor = vec4(color, alpha * 0.8);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    const ripple = new THREE.Mesh(rippleGeometry, rippleMaterial)
    ripple.position.copy(position)
    ripple.lookAt(this.camera.position)
    this.scene.add(ripple)

    this.particles.push({
      mesh: ripple,
      velocity: new THREE.Vector3(),
      life: 1.0,
      decay: 0.03,
      isRipple: true,
      material: rippleMaterial
    })
  }

  updateParticles(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i]
      
      particle.mesh.position.add(particle.velocity.clone().multiplyScalar(deltaTime * 60))
      particle.life -= particle.decay
      
      if (particle.isRipple) {
        particle.material.uniforms.time.value = 1.0 - particle.life
      } else {
        particle.mesh.material.opacity = particle.life
        particle.mesh.scale.setScalar(particle.life)
      }
      
      if (particle.life <= 0) {
        this.scene.remove(particle.mesh)
        particle.mesh.geometry.dispose()
        particle.mesh.material.dispose()
        this.particles.splice(i, 1)
      }
    }
  }

  playBubbleSound(frequency, duration) {
    if (!this.audioContext) return
    
    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()
      
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.5, this.audioContext.currentTime + duration)
      
      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration)
      
      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)
      
      oscillator.start()
      oscillator.stop(this.audioContext.currentTime + duration)
    } catch (e) {
      console.log('Audio playback error:', e)
    }
  }

  handleClick(event, canvas, ui) {
    const rect = canvas.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    this.raycaster.setFromCamera(this.mouse, this.camera)
    
    const allMeshes = []
    this.bubbles.forEach(b => {
      allMeshes.push(b.bubbleMesh)
      allMeshes.push(b.innerStar)
    })
    
    const intersects = this.raycaster.intersectObjects(allMeshes, true)
    
    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object
      const bubble = this.bubbles.find(b => b.bubbleMesh === clickedMesh || b.innerStar === clickedMesh)
      
      if (bubble) {
        ui.handleBubbleClick(event.clientX, event.clientY)
        this.triggerBubbleColorChange(bubble)
        this.playBubbleSound(600 + Math.random() * 200, 0.2)
      }
    }
  }

  triggerBubbleColorChange(bubble) {
    const newColor = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)]
    bubble.material.uniforms.targetColor.value = new THREE.Color(newColor)
    bubble.material.uniforms.baseColor.value.copy(bubble.originalColor)
    bubble.material.uniforms.colorTransition.value = 0
    bubble.colorTransitionProgress = 0
    bubble.isColorChanging = true
    bubble.color = newColor
  }

  reset() {
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      this.removeBubble(i)
    }
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.scene.remove(this.particles[i].mesh)
      this.particles[i].mesh.geometry.dispose()
      this.particles[i].mesh.material.dispose()
    }
    this.particles = []
  }
}
