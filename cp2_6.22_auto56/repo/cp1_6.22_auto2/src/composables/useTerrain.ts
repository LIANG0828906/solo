import { ref, shallowRef } from 'vue'
import { TerrainRenderer } from '@/renderer/terrainRenderer'
import { getTileGeometry, getLODForDistance, clearCache } from '@/data/tileManager'
import type { LODLevel } from '@/types'
import { throttle } from 'lodash'

export function useTerrain() {
  const renderer = shallowRef<TerrainRenderer | null>(null)
  const loading = ref(false)
  const loadProgress = ref(0)
  const currentLOD = ref<LODLevel>(2)
  const loadingTileCount = ref(0)
  const lodOffset = ref(0)

  const loadedTiles = new Set<string>()

  function initRenderer(container: HTMLElement): TerrainRenderer {
    const r = new TerrainRenderer(container)
    renderer.value = r
    r.startLoop()
    return r
  }

  async function loadVisibleTiles(r: TerrainRenderer): Promise<void> {
    if (loading.value) return
    const range = r.getVisibleTileRange()
    const camDist = r.controls.getDistance()
    const baseLod = getLODForDistance(camDist)
    const effectiveLod = Math.min(baseLod + lodOffset.value, 3) as LODLevel
    currentLOD.value = effectiveLod

    const tiles: { lat: number; lon: number }[] = []
    for (let lat = range.minLat; lat <= range.maxLat; lat++) {
      for (let lon = range.minLon; lon <= range.maxLon; lon++) {
        const key = `${lat}_${lon}_${effectiveLod}`
        if (!loadedTiles.has(key)) {
          tiles.push({ lat, lon })
        }
      }
    }

    if (tiles.length === 0) return

    loading.value = true
    loadingTileCount.value = tiles.length
    let completed = 0

    for (const tile of tiles) {
      const key = `${tile.lat}_${tile.lon}_${effectiveLod}`
      try {
        const geometry = await getTileGeometry(tile.lat, tile.lon, effectiveLod, pct => {
          loadProgress.value = Math.round(((completed + pct / 100) / tiles.length) * 100)
        })
        r.addTerrainMesh(geometry, tile.lat, tile.lon)
        loadedTiles.add(key)
      } catch {
        // skip failed tiles
      }
      completed++
      loadProgress.value = Math.round((completed / tiles.length) * 100)
    }

    loading.value = false
    loadProgress.value = 100
  }

  const throttledLoad = throttle(loadVisibleTiles, 500, { leading: true, trailing: true })

  function resetView(r: TerrainRenderer): void {
    loadedTiles.clear()
    clearCache()
    r.terrainGroup.clear()
    lodOffset.value = 0
    loadVisibleTiles(r)
  }

  return {
    renderer,
    loading,
    loadProgress,
    currentLOD,
    loadingTileCount,
    lodOffset,
    initRenderer,
    loadVisibleTiles,
    throttledLoad,
    resetView,
  }
}
