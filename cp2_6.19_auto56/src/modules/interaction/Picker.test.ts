import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Atom, Residue } from '../../types'

vi.mock('three', () => {
  function MockRaycaster(this: any) {
    this.setFromCamera = vi.fn()
    this.intersectObjects = vi.fn().mockReturnValue([])
  }
  function MockVector2(this: any) {
    this.x = 0
    this.y = 0
  }
  function MockObject3D(this: any) {}

  return {
    Raycaster: MockRaycaster as any,
    Vector2: MockVector2 as any,
    Object3D: MockObject3D as any
  }
})

import { Picker } from './Picker'

function makeAtom(overrides: Partial<Atom> = {}): Atom {
  return {
    id: 0, uid: 'A:1:N:1', name: 'N', element: 'N',
    x: 1, y: 2, z: 3, residueId: 1, chainId: 'A', serial: 1,
    ...overrides
  }
}

describe('Picker', () => {
  let picker: Picker

  beforeEach(() => {
    picker = new Picker()
  })

  it('setAtomMeshes stores the map correctly', () => {
    const map = new Map()
    const atom = makeAtom()
    map.set({}, atom)
    picker.setAtomMeshes(map)
    expect((picker as any).atomMeshMap).toBe(map)
  })

  it('setCartoonMeshes stores the map correctly', () => {
    const map = new Map()
    const residue: Residue = {
      id: 0, name: 'MET', seqNum: 1, chainId: 'A',
      atoms: [], center: { x: 0, y: 0, z: 0 }
    }
    map.set({}, residue)
    picker.setCartoonMeshes(map)
    expect((picker as any).cartoonMeshMap).toBe(map)
  })

  it('pick returns {atom:null, residue:null, point:null} when no meshes set', () => {
    const container = document.createElement('div')
    Object.defineProperty(container, 'getBoundingClientRect', {
      value: () => ({ left: 0, top: 0, width: 800, height: 600 })
    })

    const camera = {
      type: 'PerspectiveCamera'
    } as any

    const result = picker.pick(400, 300, container, camera)
    expect(result.atom).toBeNull()
    expect(result.residue).toBeNull()
    expect(result.point).toBeNull()
  })
})
