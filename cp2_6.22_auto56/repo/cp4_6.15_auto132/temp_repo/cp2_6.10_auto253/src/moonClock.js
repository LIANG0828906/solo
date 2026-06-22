import * as THREE from 'three'
import TWEEN from '@tweenjs/tween.js'

export const ORB_TYPES = {
  FULL_MOON:    { id: 'full',    color: 0xf0e68c, name: '满月光玉' },
  HALF_MOON:    { id: 'half',    color: 0xc0c0c0, name: '半月光玉' },
  CRESCENT:     { id: 'crescent',color: 0x88ccff, name: '新月光玉' },
  ECLIPSE:      { id: 'eclipse', color: 0x663399, name: '蚀月光玉' }
}

export const MOON_PHASES = [
  { id: 0, name: '新月',   requiredOrbs: ['crescent'] },
  { id: 1, name: '蛾眉月', requiredOrbs: ['crescent', 'half'] },
  { id: 2, name: '上弦月', requiredOrbs: ['half'] },
  { id: 3, name: '盈凸月', requiredOrbs: ['half', 'full'] },
  { id: 4, name: '满月',   requiredOrbs: ['full'] },
  { id: 5, name: '亏凸月', requiredOrbs: ['full', 'half'] },
  { id: 6, name: '下弦月', requiredOrbs: ['half'] },
  { id: 7, name: '残月',   requiredOrbs: ['half', 'crescent'] }
]

class MoonClock {
  constructor(scene) {
    this.scene = scene
    this.gears = []
    this.currentPhase = 0
    this.targetPhase = 0
    this.repairCompleteCallback = null
    this.group = new THREE.Group()
    this.scene.add(this.group)
    this.init()
  }

  init() {
    this.createGearSet()
    this.createMoonDisplay()
  }

  createGear(radius, teeth, depth, position) {
    const shape = new THREE.Shape()
    const toothHeight = radius * 0.15
    const toothWidth = (Math.PI * 2 / teeth) * 0.4
    const innerRadius = radius - toothHeight

    for (let i = 0; i < teeth; i++) {
      const angle = (i / teeth) * Math.PI * 2
      const nextAngle = ((i + 1) / teeth) * Math.PI * 2
      const toothStart = angle + toothWidth / 2
      const toothEnd = nextAngle - toothWidth / 2

      if (i === 0) {
        shape.moveTo(
          Math.cos(toothStart) * innerRadius,
          Math.sin(toothStart) * innerRadius
        )
      }

      shape.lineTo(
        Math.cos(toothStart) * radius,
        Math.sin(toothStart) * radius
      )
      shape.lineTo(
        Math.cos(toothEnd) * radius,
        Math.sin(toothEnd) * radius
      )
      shape.lineTo(
        Math.cos(toothEnd) * innerRadius,
        Math.sin(toothEnd) * innerRadius
      )
    }

    const holePath = new THREE.Path()
    holePath.absarc(0, 0, radius * 0.3, 0, Math.PI * 2, true)
    shape.holes.push(holePath)

    const extrudeSettings = {
      depth: depth,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 2
    }

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    geometry.center()
    geometry.rotateX(Math.PI / 2)

    const material = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.8,
      roughness: 0.3,
      emissive: 0x111111
    })

    const gear = new THREE.Mesh(geometry, material)
    gear.position.copy(position)
    gear.userData = {
      radius,
      teeth,
      rotationSpeed: 0.5,
      embeddedOrb: null,
      orbSlot: this.createOrbSlot(radius * 0.5, depth)
    }

    gear.add(gear.userData.orbSlot)
    this.group.add(gear)
    this.gears.push(gear)

    return gear
  }

  createOrbSlot(radius, depth) {
    const geometry = new THREE.CylinderGeometry(radius * 0.2, radius * 0.2, depth * 0.8, 16)
    const material = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.5,
      roughness: 0.5,
      emissive: 0x000000
    })
    const slot = new THREE.Mesh(geometry, material)
    slot.position.y = 0
    slot.rotation.x = Math.PI / 2
    slot.userData = { isOrbSlot: true }
    return slot
  }

  createGearSet() {
    const gearConfigs = [
      { radius: 2.0, teeth: 24, depth: 0.4, position: new THREE.Vector3(0, 2, 0) },
      { radius: 1.5, teeth: 18, depth: 0.35, position: new THREE.Vector3(2.8, 1.5, 0.5) },
      { radius: 1.2, teeth: 14, depth: 0.3, position: new THREE.Vector3(-2.5, 1.8, 0.3) },
      { radius: 1.0, teeth: 12, depth: 0.25, position: new THREE.Vector3(1.5, 3.2, -0.3) },
      { radius: 0.8, teeth: 10, depth: 0.2, position: new THREE.Vector3(-1.8, 3.0, 0.2) }
    ]

    gearConfigs.forEach((config, index) => {
      const gear = this.createGear(config.radius, config.teeth, config.depth, config.position)
      gear.userData.gearIndex = index
      gear.userData.orbSlot.userData.gearIndex = index
    })
  }

  createMoonDisplay() {
    const moonGeometry = new THREE.SphereGeometry(0.8, 32, 32)
    const moonMaterial = new THREE.MeshStandardMaterial({
      color: 0xaaaaaa,
      emissive: 0x333333,
      metalness: 0.3,
      roughness: 0.8
    })
    this.moonDisplay = new THREE.Mesh(moonGeometry, moonMaterial)
    this.moonDisplay.position.set(0, 5, 0)
    this.group.add(this.moonDisplay)
  }

  embedOrb(gearIndex, orbType) {
    const gear = this.gears[gearIndex]
    if (!gear) return false

    const orbData = Object.values(ORB_TYPES).find(o => o.id === orbType)
    if (!orbData) return false

    if (gear.userData.embeddedOrb) {
      this.removeOrbFromGear(gear)
    }

    const orbGeometry = new THREE.SphereGeometry(0.15, 16, 16)
    const orbMaterial = new THREE.MeshStandardMaterial({
      color: orbData.color,
      emissive: orbData.color,
      emissiveIntensity: 0.5,
      metalness: 0.2,
      roughness: 0.3
    })
    const orb = new THREE.Mesh(orbGeometry, orbMaterial)
    orb.position.copy(gear.userData.orbSlot.position)
    orb.userData = { orbType }
    gear.add(orb)

    gear.userData.embeddedOrb = orb
    gear.userData.orbSlot.material.emissive.setHex(orbData.color)
    gear.userData.orbSlot.material.emissiveIntensity = 0.3

    new TWEEN.Tween(orb.scale)
      .from({ x: 0, y: 0, z: 0 })
      .to({ x: 1, y: 1, z: 1 }, 500)
      .easing(TWEEN.Easing.Elastic.Out)
      .start()

    this.checkPhaseAlignment()
    return true
  }

  removeOrbFromGear(gear) {
    if (gear.userData.embeddedOrb) {
      gear.remove(gear.userData.embeddedOrb)
      gear.userData.embeddedOrb.geometry.dispose()
      gear.userData.embeddedOrb.material.dispose()
      gear.userData.embeddedOrb = null
      gear.userData.orbSlot.material.emissive.setHex(0x000000)
      gear.userData.orbSlot.material.emissiveIntensity = 0
    }
  }

  adjustGearOrder(newOrder) {
    newOrder.forEach((index, i) => {
      if (this.gears[index]) {
        this.gears[index].userData.order = i
      }
    })
  }

  checkPhaseAlignment() {
    const embeddedOrbs = this.gears
      .filter(g => g.userData.embeddedOrb)
      .map(g => g.userData.embeddedOrb.userData.orbType)

    const currentPhaseData = MOON_PHASES[Math.floor(this.currentPhase)]
    const requiredOrbs = currentPhaseData.requiredOrbs

    const hasAllOrbs = requiredOrbs.every(orbType =>
      embeddedOrbs.includes(orbType)
    )

    if (hasAllOrbs && embeddedOrbs.length >= requiredOrbs.length) {
      this.targetPhase = (Math.floor(this.currentPhase) + 1) % MOON_PHASES.length
      this.advancePhase()
    }

    return hasAllOrbs
  }

  advancePhase() {
    const newPhase = this.targetPhase
    const startPhase = this.currentPhase

    new TWEEN.Tween({ phase: startPhase })
      .to({ phase: newPhase }, 1500)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onUpdate((obj) => {
        this.currentPhase = obj.phase
        this.updateMoonDisplay()
      })
      .onComplete(() => {
        this.currentPhase = newPhase
        this.clearGears()
        if (this.repairCompleteCallback) {
          this.repairCompleteCallback(newPhase)
        }
      })
      .start()
  }

  clearGears() {
    this.gears.forEach(gear => {
      this.removeOrbFromGear(gear)
    })
  }

  updateMoonDisplay() {
    const phaseProgress = this.currentPhase / MOON_PHASES.length
    const angle = phaseProgress * Math.PI * 2

    if (!this.moonShadow) {
      const shadowGeometry = new THREE.CircleGeometry(0.81, 32)
      const shadowMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: Math.abs(Math.cos(angle)) * 0.8,
        side: THREE.DoubleSide
      })
      this.moonShadow = new THREE.Mesh(shadowGeometry, shadowMaterial)
      this.moonDisplay.add(this.moonShadow)
    }

    this.moonShadow.material.opacity = Math.abs(Math.cos(angle)) * 0.8
    this.moonShadow.rotation.y = angle
    this.moonShadow.position.z = 0.01

    const emissiveIntensity = 0.2 + Math.sin(angle) * 0.2
    this.moonDisplay.material.emissiveIntensity = emissiveIntensity
  }

  rotateGears(delta) {
    this.gears.forEach((gear, index) => {
      const direction = index % 2 === 0 ? 1 : -1
      const speed = gear.userData.rotationSpeed * direction
      gear.rotation.y += speed * delta * 0.5

      if (gear.userData.embeddedOrb) {
        gear.userData.embeddedOrb.rotation.y -= speed * delta * 0.5
      }
    })

    if (this.moonDisplay) {
      this.moonDisplay.rotation.y += delta * 0.1
    }
  }

  update(delta) {
    this.rotateGears(delta)
  }

  onRepairComplete(callback) {
    this.repairCompleteCallback = callback
  }

  getGearSlotMeshes() {
    return this.gears.map(gear => gear.userData.orbSlot)
  }

  dispose() {
    this.gears.forEach(gear => {
      gear.geometry.dispose()
      gear.material.dispose()
      if (gear.userData.embeddedOrb) {
        gear.userData.embeddedOrb.geometry.dispose()
        gear.userData.embeddedOrb.material.dispose()
      }
      gear.userData.orbSlot.geometry.dispose()
      gear.userData.orbSlot.material.dispose()
    })
    if (this.moonDisplay) {
      this.moonDisplay.geometry.dispose()
      this.moonDisplay.material.dispose()
    }
    this.scene.remove(this.group)
  }
}

export default MoonClock
