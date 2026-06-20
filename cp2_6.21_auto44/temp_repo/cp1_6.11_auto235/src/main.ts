import { initSkyMap, updatePlanets, resizeSkyMap } from './skyMap'
import { initDivination, performDivination } from './divination'
import { initAudio, playCrackSound } from './audio'

const SLIDER_IDS = ['slider-sun', 'slider-moon', 'slider-mars', 'slider-venus', 'slider-jupiter', 'slider-saturn']
const VALUE_IDS = ['val-sun', 'val-moon', 'val-mars', 'val-venus', 'val-jupiter', 'val-saturn']
const PLANET_LABELS = ['太阳', '月亮', '火星', '金星', '木星', '土星']

let debounceTimer: number | null = null
let lastDivinationHash: string = ''

function getLongitudes(): number[] {
  const values: number[] = []
  for (const id of SLIDER_IDS) {
    const el = document.getElementById(id) as HTMLInputElement
    values.push(parseInt(el.value, 10))
  }
  const mercuryLon = (values[0] + 28) % 360
  values.push(mercuryLon)
  return values
}

function updateValueLabels(values: number[]): void {
  for (let i = 0; i < SLIDER_IDS.length; i++) {
    const valEl = document.getElementById(VALUE_IDS[i])
    if (valEl) {
      valEl.textContent = `${values[i]}°`
    }
  }
}

function onSliderInput(): void {
  const longitudes = getLongitudes()

  updateValueLabels(longitudes.slice(0, 6))
  updatePlanets(longitudes)

  const hash = longitudes.slice(0, 6).join(',')
  if (hash !== lastDivinationHash) {
    lastDivinationHash = hash

    const turtleShell = document.getElementById('turtleShell')
    if (turtleShell) {
      turtleShell.classList.remove('cracking')
      void turtleShell.offsetWidth
      turtleShell.classList.add('cracking')
      setTimeout(() => turtleShell.classList.remove('cracking'), 300)
    }

    playCrackSound()

    if (debounceTimer !== null) {
      clearTimeout(debounceTimer)
    }
    debounceTimer = window.setTimeout(() => {
      performDivination(longitudes)
    }, 300)
  }
}

function initSliders(): void {
  for (const id of SLIDER_IDS) {
    const el = document.getElementById(id) as HTMLInputElement
    if (el) {
      el.addEventListener('input', onSliderInput)
    }
  }
}

function init(): void {
  const canvas = document.getElementById('skyCanvas') as HTMLCanvasElement
  const readingArea = document.getElementById('readingArea') as HTMLElement
  const fortuneSign = document.getElementById('fortuneSign') as HTMLElement

  if (!canvas || !readingArea || !fortuneSign) {
    console.error('Missing required DOM elements')
    return
  }

  initSkyMap(canvas)
  initDivination(readingArea, fortuneSign)
  initAudio()
  initSliders()

  const longitudes = getLongitudes()
  updateValueLabels(longitudes.slice(0, 6))
  updatePlanets(longitudes)
  performDivination(longitudes)

  let resizeTimer: number | null = null
  window.addEventListener('resize', () => {
    if (resizeTimer !== null) clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(() => {
      resizeSkyMap()
    }, 200)
  })
}

document.addEventListener('DOMContentLoaded', init)
