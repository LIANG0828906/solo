<script setup lang="ts">
import GameBoard from '@/components/GameBoard.vue'
import UIController from '@/components/UIController.vue'
import { useGameState, GRID_SIZE, CELL_SIZE } from '@/composables/useGameState'
import { onMounted, watch } from 'vue'
import { themeConfigs } from '@/utils/themes'

const game = useGameState()

onMounted(() => {
  const theme = themeConfigs[game.currentTheme]
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      game.addFurniture({
        type: 'floor',
        name: '地砖',
        gridX: x,
        gridY: y,
        gridW: 1,
        gridH: 1,
        rotation: 0,
        theme: game.currentTheme,
      })
    }
  }
  void theme
  game.addFurniture({
    type: 'wall',
    name: '墙纸',
    gridX: 0,
    gridY: 0,
    gridW: 3,
    gridH: 3,
    rotation: 0,
    theme: game.currentTheme,
  })
  game.addFurniture({
    type: 'bar',
    name: '吧台',
    gridX: 1,
    gridY: 2,
    gridW: 2,
    gridH: 1,
    rotation: 0,
    theme: game.currentTheme,
  })
  game.addFurniture({
    type: 'table',
    name: '餐桌1',
    gridX: 5,
    gridY: 6,
    gridW: 2,
    gridH: 2,
    rotation: 0,
    theme: game.currentTheme,
  })
  game.addFurniture({
    type: 'table',
    name: '餐桌2',
    gridX: 9,
    gridY: 6,
    gridW: 2,
    gridH: 2,
    rotation: 0,
    theme: game.currentTheme,
  })
  game.addFurniture({
    type: 'table',
    name: '餐桌3',
    gridX: 5,
    gridY: 10,
    gridW: 2,
    gridH: 2,
    rotation: 0,
    theme: game.currentTheme,
  })
  game.addFurniture({
    type: 'table',