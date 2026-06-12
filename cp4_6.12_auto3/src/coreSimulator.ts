import { useReactorStore, EventType } from './store'

const TICK_RATE = 6
const TICK_INTERVAL = 1000 / TICK_RATE

const EVENT_TYPES: EventType[] = ['plasma_rupture', 'coil_quench', 'impurity_injection']

let simulationInterval: number | null = null
let eventTimer: number | null = null
let eventCountdownInterval: number | null = null
let quenchRecoveryTimeout: number | null = null

export function startSimulation() {
  if (simulationInterval !== null) return

  simulationInterval = window.setInterval(() => {
    const { isReplayMode, isShutdown, currentEvent, params } = useReactorStore.getState()

    if (isReplayMode || isShutdown) return

    const { temperature, density, magneticField } = params

    const fieldSquared = magneticField * magneticField
    const densityInverse = density > 0 ? 1 / density : 0

    const tempChangeRate = fieldSquared - densityInverse
    const newTemperature = Math.max(1, Math.min(150, temperature + tempChangeRate * 0.1))

    let newDensity = density
    if (newTemperature > 120) {
      newDensity = Math.max(0.1, density - 0.02)
    } else if (newTemperature < 30) {
      newDensity = Math.min(5, density + 0.01)
    }

    let newMagneticField = magneticField
    if (currentEvent?.type === 'coil_quench' && !currentEvent.isResolved) {
      newMagneticField = Math.max(0, magneticField)
    } else {
      const fluctuation = (Math.random() - 0.5) * 0.1
      newMagneticField = Math.max(1, Math.min(10, magneticField + fluctuation))
    }

    if (newMagneticField === 0 && currentEvent?.type === 'coil_quench') {
      const tempFluctuation = (Math.random() - 0.5) * 10
      const newTempWithFluctuation = Math.max(1, Math.min(150, newTemperature + tempFluctuation))
      useReactorStore.getState().updateParams({
        temperature: newTempWithFluctuation,
        density: newDensity,
        magneticField: newMagneticField
      })
    } else {
      useReactorStore.getState().updateParams({
        temperature: newTemperature,
        density: newDensity,
        magneticField: newMagneticField
      })
    }

    const currentParams = useReactorStore.getState().params
    useReactorStore.getState().addHistoryRecord({
      timestamp: Date.now(),
      temperature: currentParams.temperature,
      density: currentParams.density,
      magneticField: currentParams.magneticField,
      event: currentEvent && !currentEvent.isResolved ? currentEvent.type : undefined
    })
  }, TICK_INTERVAL)

  scheduleNextEvent()
}

export function stopSimulation() {
  if (simulationInterval !== null) {
    clearInterval(simulationInterval)
    simulationInterval = null
  }
  if (eventTimer !== null) {
    clearTimeout(eventTimer)
    eventTimer = null
  }
  if (eventCountdownInterval !== null) {
    clearInterval(eventCountdownInterval)
    eventCountdownInterval = null
  }
  if (quenchRecoveryTimeout !== null) {
    clearTimeout(quenchRecoveryTimeout)
    quenchRecoveryTimeout = null
  }
}

function scheduleNextEvent() {
  if (eventTimer !== null) {
    clearTimeout(eventTimer)
  }

  const delay = 15000 + Math.random() * 10000

  eventTimer = window.setTimeout(() => {
    const { isReplayMode, isShutdown, currentEvent } = useReactorStore.getState()

    if (isReplayMode || isShutdown || currentEvent) {
      scheduleNextEvent()
      return
    }

    const randomType = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)]
    useReactorStore.getState().triggerEvent(randomType)

    startEventCountdown()

    if (randomType === 'coil_quench') {
      quenchRecoveryTimeout = window.setTimeout(() => {
        const { currentEvent, params } = useReactorStore.getState()
        if (currentEvent?.type === 'coil_quench' && !currentEvent.isResolved) {
          const targetField = 5
          const step = (targetField - params.magneticField) / 30
          let count = 0
          const recoverInterval = setInterval(() => {
            count++
            const { params: p } = useReactorStore.getState()
            if (count >= 30) {
              useReactorStore.getState().updateParams({ magneticField: targetField })
              clearInterval(recoverInterval)
            } else {
              useReactorStore.getState().updateParams({
                magneticField: Math.min(targetField, p.magneticField + step)
              })
            }
          }, 100)
        }
      }, 2000)
    }

    scheduleNextEvent()
  }, delay)
}

function startEventCountdown() {
  if (eventCountdownInterval !== null) {
    clearInterval(eventCountdownInterval)
  }

  const startTime = Date.now()
  const totalTime = 5000

  eventCountdownInterval = window.setInterval(() => {
    const { currentEvent } = useReactorStore.getState()
    if (!currentEvent || currentEvent.isResolved) {
      if (eventCountdownInterval !== null) {
        clearInterval(eventCountdownInterval)
        eventCountdownInterval = null
      }
      return
    }

    const elapsed = Date.now() - startTime
    const remaining = Math.max(0, totalTime - elapsed)

    useReactorStore.getState().updateEventRemainingTime(remaining)

    if (remaining <= 0) {
      useReactorStore.getState().resolveEvent(false)
      if (eventCountdownInterval !== null) {
        clearInterval(eventCountdownInterval)
        eventCountdownInterval = null
      }
    }
  }, 100)
}
