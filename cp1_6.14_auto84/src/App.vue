<template>
  <div class="app-root">
    <div ref="canvasContainer" class="canvas-container"></div>
    <div class="fps-display">{{ fps }} FPS</div>
    <ControlPanel
      :nodeCount="nodeCount"
      :flowSpeed="flowSpeed"
      :colorTheme="colorTheme"
      @update:nodeCount="onNodeCountChange"
      @update:flowSpeed="onFlowSpeedChange"
      @update:colorTheme="onColorThemeChange"
    />
    <div
      ref="nodeLabel"
      class="node-label"
      v-show="labelVisible"
    >{{ labelText }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import ControlPanel from './components/ControlPanel.vue'
import { useFlowScene } from './composable/useFlowScene'

const canvasContainer = ref<HTMLElement | null>(null)
const nodeLabel = ref<HTMLElement | null>(null)
const labelVisible = ref(false)
const labelText = ref('')

const nodeCount = ref(20)
const flowSpeed = ref(5)
const colorTheme = ref('cyberpunk')

const { init, dispose, fps, setNodeCount, setFlowSpeed, setColorTheme, setLabelElement } = useFlowScene(canvasContainer)

onMounted(() => {
  if (nodeLabel.value) {
    setLabelElement(nodeLabel.value)
  }
  init()
})

onUnmounted(() => {
  dispose()
})

function onNodeCountChange(val: number) {
  nodeCount.value = val
  setNodeCount(val)
}

function onFlowSpeedChange(val: number) {
  flowSpeed.value = val
  setFlowSpeed(val)
}

function onColorThemeChange(val: string) {
  colorTheme.value = val
  setColorTheme(val)
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #1a1a2e;
}

.app-root {
  width: 100%;
  height: 100%;
  position: relative;
}

.canvas-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.canvas-container canvas {
  display: block;
}

.fps-display {
  position: fixed;
  top: 16px;
  left: 16px;
  color: rgba(255, 255, 255, 0.6);
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  z-index: 100;
  pointer-events: none;
  user-select: none;
}

.node-label {
  position: fixed;
  color: #fff;
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
  background: rgba(0, 0, 0, 0.65);
  padding: 4px 10px;
  border-radius: 4px;
  pointer-events: none;
  z-index: 50;
  white-space: nowrap;
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(4px);
}
</style>
