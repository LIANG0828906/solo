<template>
  <div class="dashboard-container">
    <div ref="threeContainerRef" class="three-scene"></div>
    <EnergyPanel />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useEnergyStore } from '@/stores/energyStore'
import Building3D from '@/components/Building3D'
import EnergyPanel from '@/components/EnergyPanel.vue'

const threeContainerRef = ref<HTMLDivElement | null>(null)
const energyStore = useEnergyStore()
let building3D: Building3D | null = null

onMounted(() => {
  if (threeContainerRef.value) {
    building3D = new Building3D(threeContainerRef.value)
    building3D.init()

    building3D.on('floorSelected', (floor: number) => {
      energyStore.setSelectedFloor(floor)
    })

    building3D.on('barClicked', (data: { floor: number; direction: string; value: number; changePercent: number }) => {
      energyStore.setClickedBar(data)
    })

    energyStore.generateMockData()
    building3D.updateFloorData(energyStore.getCurrentFloorData)
    const win: any = window
    win.__energyStore = energyStore
  }
})

watch(
  () => [energyStore.currentDateIndex, energyStore.selectedFloor],
  () => {
    if (building3D) {
      building3D.updateFloorData(energyStore.getCurrentFloorData)
      building3D.setFloorHighlight(energyStore.selectedFloor)
    }
  }
)

watch(
  () => energyStore.selectedFloor,
  (newFloor) => {
    if (building3D) {
      building3D.setFloorHighlight(newFloor)
    }
  }
)

onUnmounted(() => {
  if (building3D) {
    building3D.dispose()
    building3D = null
  }
})
</script>

<style scoped>
.dashboard-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

.three-scene {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}
</style>
