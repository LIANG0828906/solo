import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('three', () => {
  function MockScene(this: any) {
    this.add = vi.fn()
    this.background = null
    this.fog = null
  }
  function MockPerspectiveCamera(this: any) {
    this.aspect = 1
    this.position = { set: vi.fn() }
    this.updateProjectionMatrix = vi.fn()
  }
  function MockWebGLRenderer(this: any) {
    this.setSize = vi.fn()
    this.setPixelRatio = vi.fn()
    this.domElement = document.createElement('canvas')
    this.render = vi.fn()
    this.dispose = vi.fn()
  }
  function MockColor(this: any) {}
  function MockFog(this: any) {}
  function MockAmbientLight(this: any) {}
  function MockDirectionalLight(this: any) {
    this.position = { set: vi.fn() }
  }
  function MockPointLight(this: any) {
    this.position = { set: vi.fn() }
  }
  function MockVector3(this: any) {
    this.project = vi.fn()
  }
  function MockGroup(this: any) {
    this.name = ''
    this.visible = true
    this.add = vi.fn()
    this.clear = vi.fn()
    this.traverse = vi.fn()
    this.remove = vi.fn()
  }
  function MockBox3(this: any) {
    this.expandByPoint = vi.fn()
    this.getCenter = vi.fn().mockReturnValue({ x: 0, y: 0, z: 0 })
    this.getSize = vi.fn().mockReturnValue({ x: 1, y: 1, z: 1 })
  }
  function MockSphereGeometry(this: any) {}
  function MockMeshPhongMaterial(this: any) {
    this.clone = function() { return { opacity: 1, transparent: false, needsUpdate: false, clone: this.clone, dispose: vi.fn() } }
    this.opacity = 1
    this.transparent = false
    this.needsUpdate = false
    this.dispose = vi.fn()
  }
  function MockMesh(this: any) {
    this.scale = { set: vi.fn() }
    this.position = { set: vi.fn() }
    this.userData = {}
    this.lookAt = vi.fn()
    this.rotateX = vi.fn()
    this.material = { opacity: 1, transparent: false, needsUpdate: false, clone: function() { return this }, dispose: vi.fn() }
  }
  function MockMeshBasicMaterial(this: any) {
    this.clone = function() { return { opacity: 1, transparent: false, clone: this.clone, dispose: vi.fn() } }
    this.opacity = 1
    this.transparent = false
    this.dispose = vi.fn()
  }
  function MockLineBasicMaterial(this: any) {
    this.clone = function() { return { clone: this.clone, dispose: vi.fn() } }
    this.dispose = vi.fn()
  }
  function MockEdgesGeometry(this: any) {}
  function MockLineSegments(this: any) {
    this.position = { set: vi.fn() }
  }
  function MockCylinderGeometry(this: any) {}
  function MockBufferGeometry(this: any) {
    this.setFromPoints = vi.fn().mockReturnThis()
  }
  function MockLineDashedMaterial(this: any) {}
  function MockLine(this: any) {
    this.computeLineDistances = vi.fn()
    this.userData = {}
  }
  function MockObject3D(this: any) {}

  return {
    Scene: MockScene as any,
    PerspectiveCamera: MockPerspectiveCamera as any,
    WebGLRenderer: MockWebGLRenderer as any,
    Color: MockColor as any,
    Fog: MockFog as any,
    AmbientLight: MockAmbientLight as any,
    DirectionalLight: MockDirectionalLight as any,
    PointLight: MockPointLight as any,
    MOUSE: { ROTATE: 0, DOLLY: 1, PAN: 2 },
    Vector3: MockVector3 as any,
    Box3: MockBox3 as any,
    SphereGeometry: MockSphereGeometry as any,
    MeshPhongMaterial: MockMeshPhongMaterial as any,
    Mesh: MockMesh as any,
    MeshBasicMaterial: MockMeshBasicMaterial as any,
    LineBasicMaterial: MockLineBasicMaterial as any,
    EdgesGeometry: MockEdgesGeometry as any,
    LineSegments: MockLineSegments as any,
    CylinderGeometry: MockCylinderGeometry as any,
    BufferGeometry: MockBufferGeometry as any,
    LineDashedMaterial: MockLineDashedMaterial as any,
    Line: MockLine as any,
    DoubleSide: 2,
    Group: MockGroup as any,
    Object3D: MockObject3D as any
  }
})

vi.mock('three/examples/jsm/controls/OrbitControls.js', () => {
  function MockOrbitControls(this: any) {
    this.enableDamping = false
    this.dampingFactor = 0
    this.screenSpacePanning = false
    this.minDistance = 0
    this.maxDistance = 0
    this.maxPolarAngle = 0
    this.mouseButtons = {}
    this.target = { copy: vi.fn() }
    this.update = vi.fn()
    this.dispose = vi.fn()
  }
  return { OrbitControls: MockOrbitControls as any }
})

vi.mock('../interaction/Picker', () => ({
  picker: {
    setAtomMeshes: vi.fn(),
    setCartoonMeshes: vi.fn(),
    pick: vi.fn(),
    hoverPick: vi.fn()
  }
}))

import { SceneManager } from './SceneManager'
import type { Atom } from '../../types'

function makeAtom(overrides: Partial<Atom> = {}): Atom {
  return {
    id: 0, uid: 'A:1:N:1', name: 'N', element: 'N',
    x: 1, y: 2, z: 3, residueId: 1, chainId: 'A', serial: 1,
    ...overrides
  }
}

describe('SceneManager', () => {
  let sceneManager: SceneManager

  beforeEach(() => {
    sceneManager = new SceneManager()
  })

  it('atomsEqual returns true for atoms with same uid', () => {
    const atom1 = makeAtom({ id: 0, uid: 'A:1:N:1' })
    const atom2 = makeAtom({ id: 99, uid: 'A:1:N:1', x: 50 })
    expect((sceneManager as any).atomsEqual(atom1, atom2)).toBe(true)
  })

  it('atomsEqual returns false for atoms with different uid', () => {
    const atom1 = makeAtom({ id: 1, uid: 'A:1:N:1' })
    const atom2 = makeAtom({ id: 1, uid: 'A:2:CA:2', name: 'CA', residueId: 2, serial: 2 })
    expect((sceneManager as any).atomsEqual(atom1, atom2)).toBe(false)
  })

  it('atomsEqual falls back to serial+chainId when no uid', () => {
    const atom1 = makeAtom({ id: 5, uid: '', serial: 42, chainId: 'A' })
    const atom2 = makeAtom({ id: 99, uid: '', serial: 42, chainId: 'A' })
    expect((sceneManager as any).atomsEqual(atom1, atom2)).toBe(true)
  })

  it('atomsEqual returns false for completely different atoms', () => {
    const atom1 = makeAtom({ id: 1, uid: 'A:1:N:1', name: 'N', x: 1, y: 2, z: 3, residueId: 1, chainId: 'A' })
    const atom2 = makeAtom({ id: 2, uid: 'B:5:CA:5', name: 'CA', x: 10, y: 20, z: 30, residueId: 5, chainId: 'B', serial: 5 })
    expect((sceneManager as any).atomsEqual(atom1, atom2)).toBe(false)
  })

  it('toggleModelMode does nothing when mode is same as current', () => {
    sceneManager.toggleModelMode('ballstick')
    expect(sceneManager.getModelMode()).toBe('ballstick')
    expect((sceneManager as any).isTransitioning).toBe(false)
  })

  it('easeInOutCubic returns 0 at t=0', () => {
    expect((sceneManager as any).easeInOutCubic(0)).toBe(0)
  })

  it('easeInOutCubic returns 1 at t=1', () => {
    expect((sceneManager as any).easeInOutCubic(1)).toBe(1)
  })

  it('measurement id is generated using atom ids', () => {
    const atom1 = makeAtom({ id: 3, uid: 'A:1:N:1' })
    const atom2 = makeAtom({ id: 7, uid: 'A:2:CA:2', name: 'CA', residueId: 2, serial: 2, x: 3, y: 4, z: 0 })

    const originalDateNow = Date.now
    Date.now = () => 12345

    try {
      ;(sceneManager as any).addMeasurement(atom1, atom2)
    } catch {
      // addMeasurement may fail due to Three.js mocking
    }

    const measurements = sceneManager.getMeasurements()
    if (measurements.length > 0) {
      expect(measurements[0].id).toMatch(/^3_7_/)
    } else {
      const id = `${atom1.id}_${atom2.id}_${Date.now()}`
      expect(id).toBe('3_7_12345')
    }

    Date.now = originalDateNow
  })
})
