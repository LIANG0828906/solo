import { ref } from 'vue'
import type { LODLevel } from '@/types'
import type { TerrainRenderer } from '@/renderer/terrainRenderer'

export function usePerformance() {
  const fps = ref(0)
  const vertexCount = ref(0)
  const lowFpsDuration = ref(0)
  const autoLODOffset = ref(0)

  let frameCount = 0
  let lastTime = performance.now()
  let intervalId: ReturnType<typeof setInterval> | null = null

  function startMonitoring(r: TerrainRenderer): void {
    frameCount = 0
    lastTime = performance.now()

    const countFrame = (): void => {
      frameCount++
    }
    r.renderer.setAnimationLoop(() => {
      countFrame()
    })

    intervalId = setInterval(() => {
      const now = performance.now()
      const elapsed = (now - lastTime) / 1000
      fps.value = Math.round(frameCount / elapsed)
      vertexCount.value = r.getVertexCount()
      frameCount = 0
      lastTime = now

      if (fps.value < 30) {
        lowFpsDuration.value += 1
        if (lowFpsDuration.value >= 3 && autoLODOffset.value < 3) {
          autoLODOffset.value++
          lowFpsDuration.value = 0
        }
      } else if (fps.value > 45) {
        lowFpsDuration.value = 0
        if (autoLODOffset.value > 0) {
          autoLODOffset.value--
        }
      }
    }, 1000)
  }

  function stopMonitoring(): void {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  function getEffectiveLOD(baseLOD: LODLevel): LODLevel {
    return Math.min(baseLOD + autoLODOffset.value, 3) as LODLevel
  }

  return {
    fps,
    vertexCount,
    autoLODOffset,
    startMonitoring,
    stopMonitoring,
    getEffectiveLOD,
  }
}
