import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { Clue } from '../hooks/useGameState'

interface SceneProps {
  clues: Clue[]
  doorOpen: boolean
  onItemClick: (itemId: string) => void
}

interface CameraPosition {
  position: THREE.Vector3
  target: THREE.Vector3
}

const ITEM_CAMERAS: Record<string, CameraPosition> = {
  default: {
    position: new THREE.Vector3(0, 2.5, 6),
    target: new THREE.Vector3(0, 1.5, 0)
  },
  bookshelf: {
    position: new THREE.Vector3(-3, 2, 3),
    target: new THREE.Vector3(-3, 1.8, -0.5)
  },
  desk: {
    position: new THREE.Vector3(1.5, 1.8, 3),
    target: new THREE.Vector3(1.5, 1.2, -0.5)
  },
  fireplace: {
    position: new THREE.Vector3(0, 2, -3.5),
    target: new THREE.Vector3(0, 1.5, -2.8)
  },
  globe: {
    position: new THREE.Vector3(-2.5, 1.5, 2),
    target: new THREE.Vector3(-2.5, 1.2, 0.5)
  },
  clock: {
    position: new THREE.Vector3(2.8, 2.5, -1),
    target: new THREE.Vector3(2.8, 2.2, -2.5)
  }
}

export default function Scene({ clues, doorOpen, onItemClick }: SceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster())
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2())
  const interactiveObjectsRef = useRef<THREE.Mesh[]>([])
  const targetCameraPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 2.5, 6))
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.5, 0))
  const doorRef = useRef<THREE.Group | null>(null)
  const animationIdRef = useRef<number>(0)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const createBookshelf = useCallback((scene: THREE.Scene) => {
    const group = new THREE.Group()
    group.name = 'bookshelf'

    const woodMaterial = new THREE.MeshStandardMaterial({
      color: 0x4A2F1A,
      roughness: 0.7,
      metalness: 0.1
    })

    const shelf = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 2.5, 0.4),
      woodMaterial
    )
    shelf.position.set(0, 1.25, 0)
    shelf.castShadow = true
    shelf.receiveShadow = true
    group.add(shelf)

    for (let row = 0; row < 4; row++) {
      const shelfBoard = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.05, 0.35),
        woodMaterial
      )
      shelfBoard.position.set(0, 0.4 + row * 0.6, 0)
      group.add(shelfBoard)
    }

    const bookColors = [0x8B4513, 0x2F4F4F, 0x556B2F, 0x800020, 0x191970]
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 5; col++) {
        const bookHeight = 0.25 + Math.random() * 0.15
        const book = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, bookHeight, 0.25),
          new THREE.MeshStandardMaterial({
            color: bookColors[Math.floor(Math.random() * bookColors.length)],
            roughness: 0.8
          })
        )
        book.position.set(
          -0.6 + col * 0.3,
          0.55 + row * 0.6 + bookHeight / 2 - 0.15,
          0
        )
        group.add(book)
      }
    }

    const diary = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.3, 0.08),
      new THREE.MeshStandardMaterial({
        color: 0x8B0000,
        roughness: 0.6,
        emissive: 0x330000,
        emissiveIntensity: 0.2
      })
    )
    diary.position.set(0.2, 1.4, 0.15)
    diary.rotation.y = -0.3
    diary.name = 'bookshelf_item'
    diary.userData.itemId = 'bookshelf'
    group.add(diary)
    interactiveObjectsRef.current.push(diary)

    group.position.set(-3, 0, -2.5)
    scene.add(group)
    return group
  }, [])

  const createDesk = useCallback((scene: THREE.Scene) => {
    const group = new THREE.Group()
    group.name = 'desk'

    const woodMaterial = new THREE.MeshStandardMaterial({
      color: 0x5D3A1A,
      roughness: 0.6,
      metalness: 0.1
    })

    const tabletop = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.08, 1),
      woodMaterial
    )
    tabletop.position.y = 1
    tabletop.castShadow = true
    tabletop.receiveShadow = true
    group.add(tabletop)

    const legPositions = [
      [-0.9, 0.5, -0.4],
      [0.9, 0.5, -0.4],
      [-0.9, 0.5, 0.4],
      [0.9, 0.5, 0.4]
    ]
    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 1, 0.08),
        woodMaterial
      )
      leg.position.set(pos[0], pos[1], pos[2])
      leg.castShadow = true
      group.add(leg)
    })

    const puzzleBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.15, 0.2),
      new THREE.MeshStandardMaterial({
        color: 0xB8860B,
        roughness: 0.4,
        metalness: 0.6,
        emissive: 0x332200,
        emissiveIntensity: 0.2
      })
    )
    puzzleBox.position.set(0.3, 1.12, 0)
    puzzleBox.name = 'desk_item'
    puzzleBox.userData.itemId = 'desk'
    group.add(puzzleBox)
    interactiveObjectsRef.current.push(puzzleBox)

    const lampBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, 0.1, 16),
      new THREE.MeshStandardMaterial({ color: 0x2C2C2C, metalness: 0.8 })
    )
    lampBase.position.set(-0.6, 1.05, 0.2)
    group.add(lampBase)

    const lampShade = new THREE.Mesh(
      new THREE.ConeGeometry(0.15, 0.2, 16, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0xF5DEB3,
        side: THREE.DoubleSide,
        emissive: 0xFFE4B5,
        emissiveIntensity: 0.5
      })
    )
    lampShade.position.set(-0.6, 1.3, 0.2)
    group.add(lampShade)

    const lampLight = new THREE.PointLight(0xFFD080, 0.8, 5)
    lampLight.position.set(-0.6, 1.15, 0.2)
    lampLight.castShadow = true
    group.add(lampLight)

    group.position.set(1.5, 0, -1.5)
    scene.add(group)
    return group
  }, [])

  const createFireplace = useCallback((scene: THREE.Scene) => {
    const group = new THREE.Group()
    group.name = 'fireplace'

    const stoneMaterial = new THREE.MeshStandardMaterial({
      color: 0x4A3728,
      roughness: 0.9,
      metalness: 0.05
    })

    const surround = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 0.4),
      stoneMaterial
    )
    surround.position.y = 1
    surround.castShadow = true
    surround.receiveShadow = true
    group.add(surround)

    const opening = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.2, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x1a0a00 })
    )
    opening.position.set(0, 0.8, -0.1)
    group.add(opening)

    const fireLight = new THREE.PointLight(0xFF6600, 1.5, 8)
    fireLight.position.set(0, 0.6, 0.1)
    fireLight.castShadow = true
    group.add(fireLight)

    const ember = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xFF4400 })
    )
    ember.position.set(0, 0.3, -0.05)
    ember.name = 'fireplace_item'
    ember.userData.itemId = 'fireplace'
    group.add(ember)
    interactiveObjectsRef.current.push(ember)

    const mantle = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.15, 0.5),
      stoneMaterial
    )
    mantle.position.y = 1.7
    group.add(mantle)

    group.position.set(0, 0, -3.8)
    scene.add(group)
    return group
  }, [])

  const createGlobe = useCallback((scene: THREE.Scene) => {
    const group = new THREE.Group()
    group.name = 'globe'

    const standMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.6,
      metalness: 0.2
    })

    const stand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.2, 0.4, 16),
      standMaterial
    )
    stand.position.y = 0.2
    stand.castShadow = true
    group.add(stand)

    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(0.35, 0.02, 8, 32, Math.PI),
      standMaterial
    )
    arc.position.y = 0.65
    arc.rotation.x = Math.PI / 2
    group.add(arc)

    const globeMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 32, 32),
      new THREE.MeshStandardMaterial({
        color: 0x2E5939,
        roughness: 0.8,
        emissive: 0x0A1F12,
        emissiveIntensity: 0.1
      })
    )
    globeMesh.position.y = 0.65
    globeMesh.name = 'globe_item'
    globeMesh.userData.itemId = 'globe'
    group.add(globeMesh)
    interactiveObjectsRef.current.push(globeMesh)

    group.position.set(-2.5, 0, 0.5)
    scene.add(group)
    return group
  }, [])

  const createClock = useCallback((scene: THREE.Scene) => {
    const group = new THREE.Group()
    group.name = 'clock'

    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x4A2F1A,
      roughness: 0.5,
      metalness: 0.3
    })

    const frame = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.08, 32),
      frameMaterial
    )
    frame.rotation.x = Math.PI / 2
    frame.castShadow = true
    group.add(frame)

    const face = new THREE.Mesh(
      new THREE.CircleGeometry(0.25, 32),
      new THREE.MeshStandardMaterial({ color: 0xF5F5DC })
    )
    face.position.z = 0.05
    group.add(face)

    const hourHand = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.12, 0.01),
      new THREE.MeshStandardMaterial({ color: 0x2C1E14 })
    )
    hourHand.position.set(0, 0.06, 0.06)
    group.add(hourHand)

    const minuteHand = new THREE.Mesh(
      new THREE.BoxGeometry(0.015, 0.18, 0.01),
      new THREE.MeshStandardMaterial({ color: 0x2C1E14 })
    )
    minuteHand.position.set(0.05, 0.04, 0.06)
    minuteHand.rotation.z = -0.5
    group.add(minuteHand)

    const clockBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.7, 0.15),
      frameMaterial
    )
    clockBody.position.y = -0.3
    clockBody.name = 'clock_item'
    clockBody.userData.itemId = 'clock'
    group.add(clockBody)
    interactiveObjectsRef.current.push(clockBody)

    group.position.set(2.8, 2.2, -2.8)
    group.rotation.y = -0.8
    scene.add(group)
    return group
  }, [])

  const createDoor = useCallback((scene: THREE.Scene) => {
    const group = new THREE.Group()

    const doorFrameMaterial = new THREE.MeshStandardMaterial({
      color: 0x3E2723,
      roughness: 0.7
    })

    const frameLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 3, 0.15),
      doorFrameMaterial
    )
    frameLeft.position.set(-0.6, 1.5, 0)
    group.add(frameLeft)

    const frameRight = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 3, 0.15),
      doorFrameMaterial
    )
    frameRight.position.set(0.6, 1.5, 0)
    group.add(frameRight)

    const frameTop = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.1, 0.15),
      doorFrameMaterial
    )
    frameTop.position.set(0, 3, 0)
    group.add(frameTop)

    const doorGroup = new THREE.Group()
    doorGroup.position.set(-0.55, 0, 0)

    const door = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 2.9, 0.08),
      new THREE.MeshStandardMaterial({
        color: 0x5D3A1A,
        roughness: 0.6,
        metalness: 0.1
      })
    )
    door.position.set(0.55, 1.45, 0)
    door.castShadow = true
    doorGroup.add(door)

    const handle = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0xB8860B,
        metalness: 0.8,
        roughness: 0.3
      })
    )
    handle.position.set(0.9, 1.45, 0.05)
    doorGroup.add(handle)

    group.add(doorGroup)
    doorRef.current = doorGroup

    group.position.set(3.5, 0, -1.5)
    group.rotation.y = -Math.PI / 2
    scene.add(group)
    return group
  }, [])

  const createRoom = useCallback((scene: THREE.Scene) => {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.MeshStandardMaterial({
        color: 0x1B3A2D,
        roughness: 0.9
      })
    )
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    scene.add(floor)

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x4A2F1A,
      roughness: 0.8
    })

    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 5),
      wallMaterial
    )
    backWall.position.set(0, 2.5, -5)
    backWall.receiveShadow = true
    scene.add(backWall)

    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 5),
      wallMaterial
    )
    leftWall.position.set(-5, 2.5, 0)
    leftWall.rotation.y = Math.PI / 2
    leftWall.receiveShadow = true
    scene.add(leftWall)

    const rightWall = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 5),
      wallMaterial
    )
    rightWall.position.set(5, 2.5, 0)
    rightWall.rotation.y = -Math.PI / 2
    rightWall.receiveShadow = true
    scene.add(rightWall)
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x4A2F1A)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      100
    )
    camera.position.set(0, 2.5, 6)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.5
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const ambientLight = new THREE.AmbientLight(0xFFE4B5, 0.9)
    scene.add(ambientLight)

    const mainLight = new THREE.PointLight(0xFFCC80, 1.5, 20)
    mainLight.position.set(0, 4.5, 0)
    mainLight.castShadow = true
    scene.add(mainLight)

    const fillLight = new THREE.PointLight(0xFFE0B0, 0.8, 15)
    fillLight.position.set(-2, 3, 2)
    scene.add(fillLight)

    const backLight = new THREE.PointLight(0xFFD090, 0.6, 12)
    backLight.position.set(0, 3, -3)
    scene.add(backLight)

    createRoom(scene)
    createBookshelf(scene)
    createDesk(scene)
    createFireplace(scene)
    createGlobe(scene)
    createClock(scene)
    createDoor(scene)

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)

      if (cameraRef.current) {
        cameraRef.current.position.lerp(targetCameraPos.current, 0.05)
        cameraRef.current.lookAt(targetLookAt.current)
      }

      if (doorRef.current) {
        const targetRotation = doorOpen ? -Math.PI / 2 : 0
        doorRef.current.rotation.y += (targetRotation - doorRef.current.rotation.y) * 0.02
      }

      const globe = scene.getObjectByName('globe_item')
      if (globe) {
        globe.rotation.y += 0.002
      }

      if (cameraRef.current) {
        renderer.render(scene, cameraRef.current)
      }
    }
    animate()

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return
      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight
      cameraRef.current.aspect = width / height
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(width, height)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationIdRef.current)
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement)
        rendererRef.current.dispose()
      }
    }
  }, [createRoom, createBookshelf, createDesk, createFireplace, createGlobe, createClock, createDoor])

  useEffect(() => {
    if (!doorOpen && doorRef.current) {
      doorRef.current.rotation.y = 0
    }
  }, [doorOpen])

  const focusOnItem = useCallback((itemId: string) => {
    const cam = ITEM_CAMERAS[itemId] || ITEM_CAMERAS.default
    targetCameraPos.current.copy(cam.position)
    targetLookAt.current.copy(cam.target)
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    const handleMouseMove = (event: MouseEvent) => {
      if (!containerRef.current || !cameraRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)
      const intersects = raycasterRef.current.intersectObjects(interactiveObjectsRef.current)

      if (intersects.length > 0) {
        const itemId = intersects[0].object.userData.itemId
        if (itemId) {
          setHoveredItem(itemId)
          document.body.style.cursor = 'pointer'
        }
      } else {
        setHoveredItem(null)
        document.body.style.cursor = 'default'
      }
    }

    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current || !cameraRef.current || !sceneRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)
      const intersects = raycasterRef.current.intersectObjects(interactiveObjectsRef.current)

      if (intersects.length > 0) {
        const itemId = intersects[0].object.userData.itemId
        if (itemId) {
          focusOnItem(itemId)
          setTimeout(() => {
            onItemClick(itemId)
          }, 600)
        }
      }
    }

    containerRef.current.addEventListener('mousemove', handleMouseMove)
    containerRef.current.addEventListener('click', handleClick)

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', handleMouseMove)
        containerRef.current.removeEventListener('click', handleClick)
      }
    }
  }, [focusOnItem, onItemClick])

  useEffect(() => {
    interactiveObjectsRef.current.forEach(obj => {
      const material = obj.material as THREE.MeshStandardMaterial
      if (hoveredItem === obj.userData.itemId) {
        if (material.emissive) {
          material.emissive.setHex(0xFFC107)
          material.emissiveIntensity = 0.4
        }
      } else {
        const clue = clues.find(c => c.itemId === obj.userData.itemId)
        if (material.emissive) {
          if (clue?.collected) {
            material.emissive.setHex(0x27AE60)
            material.emissiveIntensity = 0.15
          } else {
            material.emissive.setHex(0x000000)
            material.emissiveIntensity = 0.1
          }
        }
      }
    })
  }, [hoveredItem, clues])

  return (
    <div ref={containerRef} className="scene-container" />
  )
}
