import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Grid, Stars } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'

import { useAppStore } from './store'
import { getPlantData } from './PlantData'
import {
  computeMorphology,
  generateStemSegments,
  generateLeafMorphs,
  generatePetalMorphs,
  getFlowerCenter,
  createStemGeometry,
  createCurvedLeafGeometry,
} from './PlantModel'

const PlantMesh = () => {
  const groupRef = useRef<THREE.Group>(null)
  const stemGroupRef = useRef<THREE.Group>(null)
  const leafGroupRef = useRef<THREE.Group>(null)
  const flowerGroupRef = useRef<THREE.Group>(null)
  const particleGroupRef = useRef<THREE.Group>(null)
  const holoMaterialRef = useRef<THREE.ShaderMaterial | null>(null)
  const leafMeshesRef = useRef<THREE.Mesh[]>([])
  const petalMeshesRef = useRef<THREE.Mesh[]>([])
  const stemMeshRef = useRef<THREE.Mesh | null>(null)
  const flowerCenterRef = useRef<THREE.Mesh | null>(null)
  const introOpacity = useRef({ v: 0 })
  const timeRef = useRef(0)
  const prevStage = useRef<string>('')
  const particlesRef = useRef<Array<{
    mesh: THREE.Mesh
    velocity: THREE.Vector3
    life: number
    maxLife: number
  }>>([])

  const selectedPlant = useAppStore((s) => s.selectedPlant)
  const smoothedEnv = useAppStore((s) => s.smoothedEnv)
  const simulationProgress = useAppStore((s) => s.simulationProgress)
  const growthStage = useAppStore((s) => s.growthStage)
  const isSimulating = useAppStore((s) => s.isSimulating)

  const species = useMemo(() => getPlantData(selectedPlant), [selectedPlant])

  const morph = useMemo(() => {
    const progress = isSimulating ? simulationProgress : 1
    const stage = isSimulating ? growthStage : 'mature'
    return computeMorphology(species, smoothedEnv, progress, stage)
  }, [species, smoothedEnv, simulationProgress, growthStage, isSimulating])

  const stemSegments = useMemo(() => generateStemSegments(species, morph), [species, morph])

  const leafMorphs = useMemo(
    () => generateLeafMorphs(species, morph, stemSegments),
    [species, morph, stemSegments]
  )

  const petalMorphs = useMemo(
    () => generatePetalMorphs(species, morph, stemSegments),
    [species, morph, stemSegments]
  )

  const flowerCenter = useMemo(
    () => getFlowerCenter(species, stemSegments, morph),
    [species, stemSegments, morph]
  )

  const leafGeoCache = useRef<Map<string, THREE.BufferGeometry>>(new Map())

  const disposeLeafGeometries = () => {
    leafGeoCache.current.forEach((geo) => geo.dispose())
    leafGeoCache.current.clear()
  }

  const getOrCreateLeafGeo = (key: string, w: number, l: number, c: number, t: number) => {
    if (!leafGeoCache.current.has(key)) {
      const { geometry } = createCurvedLeafGeometry(w, l, c, t)
      leafGeoCache.current.set(key, geometry)
    }
    return leafGeoCache.current.get(key)!
  }

  useEffect(() => {
    if (growthStage === 'flowering' && prevStage.current !== 'flowering') {
      spawnFlowerParticles()
    }
    prevStage.current = growthStage
  }, [growthStage])

  useEffect(() => {
    disposeLeafGeometries()
    introOpacity.current.v = 0
    gsap.to(introOpacity.current, {
      v: 1,
      duration: 0.8,
      ease: 'power3.out',
    })
    return () => {
      disposeLeafGeometries()
    }
  }, [selectedPlant])

  const spawnFlowerParticles = () => {
    if (!particleGroupRef.current) return
    const count = 22
    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.03 + Math.random() * 0.04, 6, 6)
      const col = new THREE.Color().setHSL(
        0.08 + Math.random() * 0.12,
        0.6 + Math.random() * 0.3,
        0.6 + Math.random() * 0.3
      )
      const mat = new THREE.MeshBasicMaterial({
        color: col,
        transparent: true,
        opacity: 1,
      })
      const mesh = new THREE.Mesh(geo, mat)
      const jitter = 0.2
      mesh.position.set(
        flowerCenter.position.x + (Math.random() - 0.5) * jitter,
        flowerCenter.position.y + Math.random() * 0.1,
        flowerCenter.position.z + (Math.random() - 0.5) * jitter
      )
      particleGroupRef.current.add(mesh)
      particlesRef.current.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.6,
          0.4 + Math.random() * 0.8,
          (Math.random() - 0.5) * 0.6
        ),
        life: 0,
        maxLife: 2.2 + Math.random() * 1.3,
      })
    }
  }

  useFrame((_, delta) => {
    const speed = morph.animationSpeed
    timeRef.current += delta * speed

    const t = timeRef.current
    const pulseFreq = 0.5

    if (groupRef.current) {
      const floatY = Math.sin(t * pulseFreq * Math.PI * 2) * 0.015
      groupRef.current.position.y = floatY
    }

    leafMeshesRef.current.forEach((mesh, i) => {
      const leaf = leafMorphs[i]
      if (!leaf) return
      const wobblePhase = i * 0.7 + t * pulseFreq * Math.PI * 2
      const wobbleAmp = 0.06 + (1 - morph.leafOpenFactor) * 0.05
      mesh.rotation.x = leaf.rotation.x + Math.sin(wobblePhase) * wobbleAmp
      mesh.rotation.z = Math.cos(wobblePhase * 0.8) * wobbleAmp * 0.6
      const swayFactor = 0.9 + Math.sin(wobblePhase * 0.6) * 0.08
      mesh.scale.set(
        leaf.scale.x * swayFactor,
        leaf.scale.y * (1 + Math.sin(wobblePhase * 0.9) * 0.1),
        leaf.scale.z * swayFactor
      )
    })

    petalMeshesRef.current.forEach((mesh, i) => {
      const petal = petalMorphs[i]
      if (!petal) return
      const bloomPhase = i * 0.5 + t * pulseFreq * 0.5 * Math.PI * 2
      const breath = 1 + Math.sin(bloomPhase) * 0.06
      const openWobble = Math.sin(bloomPhase * 1.2) * 0.04
      mesh.rotation.x = petal.rotation.x + openWobble
      mesh.scale.set(
        petal.scale.x * breath,
        petal.scale.y * (1 + Math.sin(bloomPhase * 0.7) * 0.15),
        petal.scale.z * breath
      )
    })

    if (flowerCenterRef.current) {
      const pulse = 1 + Math.sin(t * pulseFreq * Math.PI * 2) * 0.05
      flowerCenterRef.current.scale.setScalar(pulse)
    }

    if (stemMeshRef.current && holoMaterialRef.current) {
      holoMaterialRef.current.uniforms.uTime.value = t
      holoMaterialRef.current.uniforms.uOpacity.value = introOpacity.current.v
    }

    const arr = particlesRef.current
    for (let i = arr.length - 1; i >= 0; i--) {
      const p = arr[i]
      p.life += delta
      const lifeT = p.life / p.maxLife
      p.velocity.y -= delta * 0.4
      p.velocity.multiplyScalar(0.995)
      p.mesh.position.addScaledVector(p.velocity, delta)
      p.mesh.rotation.x += delta * (1 + Math.random() * 2)
      p.mesh.rotation.y += delta * 1.5
      const mat = p.mesh.material as THREE.MeshBasicMaterial
      mat.opacity = Math.max(0, 1 - lifeT * lifeT)
      if (p.life >= p.maxLife) {
        if (particleGroupRef.current) particleGroupRef.current.remove(p.mesh)
        p.mesh.geometry.dispose()
        mat.dispose()
        arr.splice(i, 1)
      }
    }
  })

  useEffect(() => {
    if (!stemMeshRef.current) return
    const oldGeo = stemMeshRef.current.geometry
    const newGeo = createStemGeometry(stemSegments)
    stemMeshRef.current.geometry = newGeo
    if (oldGeo && oldGeo !== newGeo) oldGeo.dispose()
  }, [stemSegments])

  useEffect(() => {
    if (!leafGroupRef.current) return
    const group = leafGroupRef.current

    while (group.children.length > leafMorphs.length) {
      const child = group.children[group.children.length - 1]
      group.remove(child)
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose())
        else child.material.dispose()
      }
    }
    while (group.children.length < leafMorphs.length) {
      const mat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
        metalness: 0.05,
        roughness: 0.85,
        transparent: true,
        opacity: 1,
      })
      const mesh = new THREE.Mesh(new THREE.BufferGeometry(), mat)
      mesh.castShadow = true
      mesh.receiveShadow = true
      group.add(mesh)
    }

    leafMeshesRef.current = group.children as THREE.Mesh[]

    leafMorphs.forEach((leaf, i) => {
      const mesh = leafMeshesRef.current[i]
      if (!mesh) return

      const geoKey = `${i}_${leaf.scale.x.toFixed(3)}_${leaf.scale.z.toFixed(3)}_${leaf.curl.toFixed(3)}`
      const newGeo = getOrCreateLeafGeo(
        geoKey,
        leaf.scale.x,
        leaf.scale.z,
        leaf.curl,
        leaf.scale.y
      )
      if (mesh.geometry !== newGeo) {
        const oldG = mesh.geometry
        mesh.geometry = newGeo
        if (oldG) oldG.dispose()
      }

      const pos = newGeo.getAttribute('position')
      const colors = new Float32Array(pos.count * 3)
      const factors = pos.count
      for (let v = 0; v < factors; v++) {
        const uvAttr = newGeo.getAttribute('uv')
        if (uvAttr) {
          const uu = uvAttr.getX(v)
          const vv = uvAttr.getY(v)
          const edgeFactor = Math.max(Math.abs(uu - 0.5) * 2, (1 - vv) * 0.8)
          const t = Math.min(1, edgeFactor)
          const r = leaf.baseColor.r + (leaf.edgeColor.r - leaf.baseColor.r) * t
          const g = leaf.baseColor.g + (leaf.edgeColor.g - leaf.baseColor.g) * t
          const b = leaf.baseColor.b + (leaf.edgeColor.b - leaf.baseColor.b) * t
          colors[v * 3] = r
          colors[v * 3 + 1] = g
          colors[v * 3 + 2] = b
        }
      }
      newGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
      newGeo.computeVertexNormals()

      gsap.to(mesh.position, {
        x: leaf.position.x,
        y: leaf.position.y,
        z: leaf.position.z,
        duration: 0.35,
        ease: 'power2.out',
      })
      gsap.to(mesh.rotation, {
        y: leaf.rotation.y,
        z: leaf.rotation.z,
        duration: 0.35,
        ease: 'power2.out',
      })
    })
  }, [leafMorphs])

  useEffect(() => {
    if (!flowerGroupRef.current) return
    const group = flowerGroupRef.current

    while (group.children.length > petalMorphs.length + 1) {
      const child = group.children[group.children.length - 1]
      group.remove(child)
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose())
        else child.material.dispose()
      }
    }

    while (group.children.length < petalMorphs.length + 1) {
      if (group.children.length === 0) {
        const centerMat = new THREE.MeshStandardMaterial({
          color: flowerCenter.color,
          roughness: 0.6,
          metalness: 0.1,
          emissive: flowerCenter.color,
          emissiveIntensity: 0.15,
        })
        const center = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), centerMat)
        center.castShadow = true
        group.add(center)
        flowerCenterRef.current = center
      } else {
        const petalMat = new THREE.MeshStandardMaterial({
          vertexColors: true,
          side: THREE.DoubleSide,
          metalness: 0.08,
          roughness: 0.7,
          transparent: true,
          opacity: 1,
        })
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), petalMat)
        mesh.castShadow = true
        group.add(mesh)
      }
    }

    petalMeshesRef.current = []
    for (let i = 1; i < group.children.length; i++) {
      petalMeshesRef.current.push(group.children[i] as THREE.Mesh)
    }
    if (group.children[0]) flowerCenterRef.current = group.children[0] as THREE.Mesh

    if (flowerCenterRef.current) {
      const center = flowerCenterRef.current
      gsap.to(center.position, {
        x: flowerCenter.position.x,
        y: flowerCenter.position.y,
        z: flowerCenter.position.z,
        duration: 0.4,
        ease: 'power2.out',
      })
      gsap.to(center.scale, {
        x: flowerCenter.radius * 10,
        y: flowerCenter.radius * 10,
        z: flowerCenter.radius * 10,
        duration: 0.5,
        ease: 'back.out(2)',
      })
      const cMat = center.material as THREE.MeshStandardMaterial
      cMat.color.copy(flowerCenter.color)
      cMat.emissive.copy(flowerCenter.color)
    }

    petalMorphs.forEach((petal, i) => {
      const mesh = petalMeshesRef.current[i]
      if (!mesh) return
      const oldGeo = mesh.geometry
      const petalGeo = createCurvedLeafGeometry(petal.scale.x, petal.scale.z, 0.3, petal.scale.y).geometry
      mesh.geometry = petalGeo
      if (oldGeo && oldGeo !== petalGeo) oldGeo.dispose()

      const pos = petalGeo.getAttribute('position')
      const colCount = pos.count
      const cols = new Float32Array(colCount * 3)
      for (let v = 0; v < colCount; v++) {
        const t = v / colCount
        cols[v * 3] = petal.color.r
        cols[v * 3 + 1] = petal.color.g
        cols[v * 3 + 2] = petal.color.b
      }
      petalGeo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3))
      petalGeo.computeVertexNormals()

      gsap.to(mesh.position, {
        x: petal.position.x,
        y: petal.position.y,
        z: petal.position.z,
        duration: 0.4,
        ease: 'power2.out',
      })
      gsap.to(mesh.rotation, {
        x: petal.rotation.x,
        y: petal.rotation.y,
        z: petal.rotation.z,
        duration: 0.4,
        ease: 'power2.out',
      })
    })
  }, [petalMorphs, flowerCenter])

  const hologramShader = useMemo(() => ({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uColor1: { value: new THREE.Color(0x66e0a0) },
      uColor2: { value: new THREE.Color(0x88ffbb) },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying float vHeight;
      varying vec2 vUv;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        vHeight = position.y;
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uOpacity;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying float vHeight;
      varying vec2 vUv;
      void main() {
        vec3 baseColor = mix(uColor1, uColor2, vUv.y);
        float scanline = sin(vPosition.y * 30.0 + uTime * 4.0) * 0.08 + 0.92;
        float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5) * 0.5;
        float glow = 0.5 + 0.5 * sin(uTime * 2.0 + vHeight * 6.0);
        vec3 color = baseColor * scanline + vec3(fresnel * 0.6) + glow * 0.05;
        float alpha = uOpacity * (0.85 + fresnel * 0.4);
        gl_FragColor = vec4(color, alpha);
      }
    `,
  }), [])

  const stemMaterial = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(hologramShader.uniforms),
      vertexShader: hologramShader.vertexShader,
      fragmentShader: hologramShader.fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    holoMaterialRef.current = mat
    return mat
  }, [hologramShader])

  return (
    <group ref={groupRef} position={[0, -0.8, 0]}>
      <group ref={stemGroupRef}>
        <mesh ref={stemMeshRef} material={stemMaterial} castShadow receiveShadow>
          <primitive object={createStemGeometry(stemSegments)} attach="geometry" />
        </mesh>
      </group>

      <group ref={leafGroupRef} />

      {species.flower.hasFlower && <group ref={flowerGroupRef} />}

      <group ref={particleGroupRef} />

      <pointLight
        position={[0, morph.stemHeight * 0.9, 0]}
        intensity={0.8 * introOpacity.current.v}
        color={new THREE.Color(0x88ffaa)}
        distance={4}
        decay={2}
      />
    </group>
  )
}

const CameraReset = () => {
  const { camera } = useThree()
  const controlsRef = useRef<any>(null)

  useEffect(() => {
    const handler = () => {
      if (controlsRef.current) {
        controlsRef.current.reset()
      }
    }
    window.addEventListener('reset-camera', handler)
    return () => window.removeEventListener('reset-camera', handler)
  }, [])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.detail === 2) {
        const target = e.target as HTMLElement
        const canvas = document.querySelector('canvas')
        if (canvas && (target === canvas || canvas.contains(target))) {
          gsap.to(camera.position, {
            x: 0,
            y: 1.8,
            z: 5.5,
            duration: 0.8,
            ease: 'power3.out',
          })
        }
      }
    }
    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [camera])

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={false}
      minDistance={3}
      maxDistance={15}
      minPolarAngle={Math.PI * 0.15}
      maxPolarAngle={Math.PI * 0.85}
      target={[0, 0.2, 0]}
      enableDamping
      dampingFactor={0.08}
    />
  )
}

const SceneContent = () => {
  return (
    <>
      <CameraReset />
      <ambientLight intensity={0.45} color={new THREE.Color(0xccffdd)} />
      <directionalLight
        position={[5, 8, 4]}
        intensity={1.1}
        color={new THREE.Color(0xffffee)}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight
        position={[-4, 5, -3]}
        intensity={0.35}
        color={new THREE.Color(0x88ccff)}
      />
      <hemisphereLight
        args={[0x88ddaa, 0x225533, 0.5]}
      />
      <pointLight position={[-3, 2, 3]} intensity={0.3} color={0xaaffcc} />

      <PlantMesh />

      <Grid
        args={[20, 20]}
        cellSize={1}
        cellThickness={0.5}
        cellColor={new THREE.Color(0x3d8b5a)}
        sectionSize={5}
        sectionThickness={1}
        sectionColor={new THREE.Color(0x55aa77)}
        fadeDistance={20}
        fadeStrength={1.5}
        followCamera={false}
        infiniteGrid
        position={[0, -0.8, 0]}
      />

      <Stars
        radius={50}
        depth={5}
        count={800}
        factor={3}
        saturation={0.2}
        fade
        speed={0.3}
      />

      <fog attach="fog" args={[0x0d2818, 10, 30]} />
    </>
  )
}

const PlantScene = () => {
  const stageLabelVisible = useAppStore((s) => s.stageLabelVisible)
  const stageLabelText = useAppStore((s) => s.stageLabelText)

  return (
    <div style={{
      flex: 1,
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <Canvas
        shadows
        camera={{ position: [0, 1.8, 5.5], fov: 50, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
      >
        <color attach="background" args={[0x0d2818]} />
        <SceneContent />
      </Canvas>

      <div style={{
        position: 'absolute',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        transition: 'all 0.4s ease-in-out',
        opacity: stageLabelVisible ? 1 : 0,
        pointerEvents: 'none',
      }}>
        <div style={{
          padding: '12px 28px',
          background: 'linear-gradient(135deg, rgba(184,245,184,0.15) 0%, rgba(107,200,107,0.1) 100%)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(184,245,184,0.3)',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          color: '#f0fff0',
          fontSize: 18,
          fontWeight: 600,
          letterSpacing: 2,
          textShadow: '0 0 20px rgba(184,245,184,0.5)',
        }}>
          {stageLabelText}
        </div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        zIndex: 10,
        pointerEvents: 'none',
      }}>
        <div style={{
          color: 'rgba(200,240,200,0.4)',
          fontSize: 10,
          fontFamily: 'monospace',
          textAlign: 'right',
          lineHeight: 1.6,
        }}>
          Plant Encyclopedia 3D v1.0
        </div>
      </div>
    </div>
  )
}

export default PlantScene
