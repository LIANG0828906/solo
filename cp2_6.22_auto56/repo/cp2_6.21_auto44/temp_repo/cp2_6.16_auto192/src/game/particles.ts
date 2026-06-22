import { useStore, type Debris, generateId } from './store'

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

export function addParticles(
  x: number,
  y: number,
  count: number,
  baseVx: number,
  baseVy: number,
  speedMultiplier: number
): void {
  const newDebris: Debris[] = []
  for (let i = 0; i < count; i++) {
    const angle = randomBetween(0, Math.PI * 2)
    const speedMult = randomBetween(0.5, 1.5)
    const baseSpeed = Math.sqrt(baseVx * baseVx + baseVy * baseVy)
    const speed = baseSpeed * speedMult * speedMultiplier
    const t = randomBetween(0, 1)
    const r = Math.floor(255 * (1 - t * 0.5))
    const g = Math.floor(68 * (1 - t * 0.6))
    const b = Math.floor(68 * (1 - t * 0.6))
    const color = `rgb(${r},${g},${b})`

    newDebris.push({
      id: generateId(),
      x: x + randomBetween(-3, 3),
      y: y + randomBetween(-3, 3),
      vx: Math.cos(angle) * speed + baseVx * 0.3,
      vy: Math.sin(angle) * speed + baseVy * 0.3,
      radius: randomBetween(0.5, 2),
      color,
      opacity: 1,
      age: 0,
      rotation: randomBetween(0, Math.PI * 2),
      rotationSpeed: randomBetween(-3, 3),
      isCleaning: false,
      cleanStartTime: 0,
    })
  }
  useStore.getState().addDebris(newDebris)
}

export function updateParticles(dt: number): void {
  const store = useStore.getState()
  store.tickCooldown(dt)

  if (store.warningMessage) {
    const elapsed = Date.now() - store.warningStartTime
    if (elapsed > 2000) {
      store.setWarning(null)
    }
  }

  if (store.edgeFlash) {
    const elapsed = Date.now() - store.edgeFlashStartTime
    if (elapsed > 300) {
      store.setEdgeFlash(false)
    }
  }

  const newTimer = store.historyTimer + dt
  if (newTimer >= 0.5) {
    store.recordDebrisHistory()
  } else {
    useStore.setState({ historyTimer: newTimer })
  }
}

export function clearAllDebris(): void {
  useStore.setState({ debris: [] })
}
