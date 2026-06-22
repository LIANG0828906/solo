import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { EnvironmentParams } from '@/types'

export const useEnvironmentStore = defineStore('environment', () => {
  const params = ref<EnvironmentParams>({
    light: 60,
    water: 50,
    temperature: 60,
    nutrients: 50
  })

  function setLight(value: number) {
    params.value.light = Math.max(0, Math.min(100, value))
  }

  function setWater(value: number) {
    params.value.water = Math.max(0, Math.min(100, value))
  }

  function setTemperature(value: number) {
    params.value.temperature = Math.max(0, Math.min(100, value))
  }

  function setNutrients(value: number) {
    params.value.nutrients = Math.max(0, Math.min(100, value))
  }

  function updateParams(newParams: Partial<EnvironmentParams>) {
    if (newParams.light !== undefined) setLight(newParams.light)
    if (newParams.water !== undefined) setWater(newParams.water)
    if (newParams.temperature !== undefined) setTemperature(newParams.temperature)
    if (newParams.nutrients !== undefined) setNutrients(newParams.nutrients)
  }

  return {
    params,
    setLight,
    setWater,
    setTemperature,
    setNutrients,
    updateParams
  }
})
