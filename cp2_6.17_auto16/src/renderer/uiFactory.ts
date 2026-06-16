import { useSunStore } from '../storage/store'
import { recalculateSunPosition, updateAllFaceIntensities } from '../sunlight/calculator'
import { updateFaceColors } from '../sunlight/colorMapper'

export interface UIPanelOptions {
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
}

const QUICK_DATES = [
  { label: '春分', month: 3, day: 20 },
  { label: '夏至', month: 6, day: 21 },
  { label: '秋分', month: 9, day: 23 },
  { label: '冬至', month: 12, day: 22 },
]

function formatTime(hour: number): string {
  const h = Math.floor(hour)
  const m = Math.floor((hour - h) * 60)
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

function formatDate(month: number, day: number): string {
  return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`
}

function parseDate(dateStr: string): { month: number; day: number } | null {
  const parts = dateStr.split('/')
  if (parts.length !== 2) return null
  const month = parseInt(parts[0], 10)
  const day = parseInt(parts[1], 10)
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  return { month, day }
}

function getDaysInMonth(month: number): number {
  const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return days[month - 1] || 30
}

export function createUIPanel(container: HTMLElement, options: UIPanelOptions = {}): HTMLElement {
  const panel = document.createElement('div')
  panel.style.position = 'absolute'
  panel.style.bottom = '24px'
  panel.style.left = '24px'
  panel.style.padding = '16px'
  panel.style.background = 'rgba(26, 35, 51, 0.85)'
  panel.style.borderRadius = '12px'
  panel.style.color = '#E0E0E0'
  panel.style.fontFamily = 'sans-serif'
  panel.style.fontSize = '13px'
  panel.style.minWidth = '280px'
  panel.style.backdropFilter = 'blur(8px)'
  panel.style.zIndex = '50'
  panel.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)'

  const title = document.createElement('div')
  title.style.fontSize = '16px'
  title.style.fontWeight = 'bold'
  title.style.marginBottom = '12px'
  title.style.display = 'flex'
  title.style.justifyContent = 'space-between'
  title.style.alignItems = 'center'
  title.innerHTML = `
    <span>☀️ 日照分析控制台</span>
    <div id="sunIndicator" style="width:48px;height:48px;border-radius:50%;background:radial-gradient(circle, rgba(255,200,50,0.25) 0%, transparent 70%);position:relative;border:1px solid rgba(255,200,50,0.2);">
      <div style="position:absolute;top:50%;left:0;right:0;height:1px;background:rgba(255,200,50,0.15);"></div>
      <div style="position:absolute;left:50%;top:0;bottom:0;width:1px;background:rgba(255,200,50,0.15);"></div>
      <div style="position:absolute;top:2px;left:50%;transform:translateX(-50%);font-size:9px;color:rgba(255,200,50,0.5);">N</div>
      <div id="sunDot" style="position:absolute;width:10px;height:10px;border-radius:50%;background:#FFD700;box-shadow:0 0 8px #FFD700, 0 0 16px rgba(255,215,0,0.5);left:19px;top:19px;"></div>
    </div>
  `
  panel.appendChild(title)

  const dateSection = document.createElement('div')
  dateSection.style.marginBottom = '14px'

  const dateLabel = document.createElement('div')
  dateLabel.style.marginBottom = '6px'
  dateLabel.style.fontSize = '12px'
  dateLabel.style.color = '#90A0B0'
  dateLabel.textContent = '日期 (MM/DD)'
  dateSection.appendChild(dateLabel)

  const dateInput = document.createElement('input')
  dateInput.type = 'text'
  dateInput.value = '06/21'
  dateInput.style.width = '100%'
  dateInput.style.padding = '8px 10px'
  dateInput.style.border = '1px solid #3A4A5A'
  dateInput.style.borderRadius = '6px'
  dateInput.style.background = '#0F1824'
  dateInput.style.color = '#E0E0E0'
  dateInput.style.fontSize = '13px'
  dateInput.style.fontFamily = 'monospace'
  dateInput.style.outline = 'none'
  dateInput.style.boxSizing = 'border-box'
  dateInput.style.transition = 'border-color 0.2s'
  dateSection.appendChild(dateInput)

  const quickBtns = document.createElement('div')
  quickBtns.style.display = 'flex'
  quickBtns.style.gap = '6px'
  quickBtns.style.marginTop = '8px'
  quickBtns.style.flexWrap = 'wrap'

  QUICK_DATES.forEach((qd) => {
    const btn = document.createElement('button')
    btn.textContent = qd.label
    btn.dataset.month = qd.month.toString()
    btn.dataset.day = qd.day.toString()
    btn.style.padding = '6px 12px'
    btn.style.border = 'none'
    btn.style.borderRadius = '20px'
    btn.style.background = '#2A3A5A'
    btn.style.color = '#E0E0E0'
    btn.style.fontSize = '12px'
    btn.style.cursor = 'pointer'
    btn.style.transition = 'all 0.3s ease'
    btn.style.flex = '1'
    btn.style.minWidth = '50px'

    if (qd.month === 6 && qd.day === 21) {
      btn.style.background = 'transparent'
      btn.style.color = '#00D4FF'
      btn.style.fontWeight = 'bold'
      btn.style.boxShadow = '0 0 0 1px #00D4FF'
    }

    btn.addEventListener('mouseenter', () => {
      if (btn.style.color !== '#00D4FF') {
        btn.style.background = '#3A5A7A'
      }
    })
    btn.addEventListener('mouseleave', () => {
      if (btn.style.color !== '#00D4FF') {
        btn.style.background = '#2A3A5A'
      }
    })
    btn.addEventListener('mousedown', () => {
      btn.style.transform = 'scale(0.95)'
    })
    btn.addEventListener('mouseup', () => {
      btn.style.transform = 'scale(1)'
    })

    quickBtns.appendChild(btn)
  })
  dateSection.appendChild(quickBtns)
  panel.appendChild(dateSection)

  const timeSection = document.createElement('div')
  timeSection.style.marginBottom = '8px'

  const timeLabel = document.createElement('div')
  timeLabel.style.display = 'flex'
  timeLabel.style.justifyContent = 'space-between'
  timeLabel.style.marginBottom = '6px'
  timeLabel.style.fontSize = '12px'
  timeLabel.style.color = '#90A0B0'
  timeLabel.innerHTML = `<span>时间</span><span id="timeValue" style="color:#00D4FF;font-weight:bold;font-family:monospace;">10:00</span>`
  timeSection.appendChild(timeLabel)

  const sliderContainer = document.createElement('div')
  sliderContainer.style.position = 'relative'
  sliderContainer.style.padding = '8px 0'

  const timeSlider = document.createElement('input')
  timeSlider.type = 'range'
  timeSlider.min = '0'
  timeSlider.max = '24'
  timeSlider.step = '0.1'
  timeSlider.value = '10'
  timeSlider.style.width = '100%'
  timeSlider.style.height = '4px'
  ;(timeSlider.style as any).webkitAppearance = 'none'
  timeSlider.style.appearance = 'none'
  timeSlider.style.background = '#3A4A5A'
  timeSlider.style.borderRadius = '2px'
  timeSlider.style.outline = 'none'
  timeSlider.style.cursor = 'pointer'

  const style = document.createElement('style')
  style.textContent = `
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #00D4FF;
      cursor: pointer;
      box-shadow: 0 0 0 0 rgba(0, 212, 255, 0.4);
      transition: box-shadow 0.3s ease-out;
    }
    input[type="range"]:active::-webkit-slider-thumb {
      box-shadow: 0 0 0 10px rgba(0, 212, 255, 0.2);
    }
    input[type="range"]::-moz-range-thumb {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #00D4FF;
      cursor: pointer;
      border: none;
      box-shadow: 0 0 0 0 rgba(0, 212, 255, 0.4);
      transition: box-shadow 0.3s ease-out;
    }
    input[type="range"]:active::-moz-range-thumb {
      box-shadow: 0 0 0 10px rgba(0, 212, 255, 0.2);
    }
  `
  document.head.appendChild(style)

  sliderContainer.appendChild(timeSlider)
  timeSection.appendChild(sliderContainer)

  const timeMarks = document.createElement('div')
  timeMarks.style.display = 'flex'
  timeMarks.style.justifyContent = 'space-between'
  timeMarks.style.fontSize = '10px'
  timeMarks.style.color = '#607080'
  timeMarks.style.marginTop = '2px'
  timeMarks.innerHTML = '<span>00:00</span><span>12:00</span><span>24:00</span>'
  timeSection.appendChild(timeMarks)
  panel.appendChild(timeSection)

  const infoSection = document.createElement('div')
  infoSection.style.marginTop = '12px'
  infoSection.style.paddingTop = '12px'
  infoSection.style.borderTop = '1px solid #2A3A4A'
  infoSection.style.fontSize = '11px'
  infoSection.style.color = '#708090'
  infoSection.style.lineHeight = '1.6'
  infoSection.innerHTML = `
    <div style="display:flex;justify-content:space-between;">
      <span>太阳方位角:</span>
      <span id="azimuthValue" style="color:#90A0B0;">-</span>
    </div>
    <div style="display:flex;justify-content:space-between;">
      <span>太阳高度角:</span>
      <span id="altitudeValue" style="color:#90A0B0;">-</span>
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:6px;">
      <span style="color:#708090;">坐标: 北京 (39.9°N, 116.4°E)</span>
    </div>
  `
  panel.appendChild(infoSection)

  container.appendChild(panel)

  let isDragging = false

  const updateFromStore = () => {
    const state = useSunStore.getState()
    const timeValueEl = document.getElementById('timeValue')
    const azimuthEl = document.getElementById('azimuthValue')
    const altitudeEl = document.getElementById('altitudeValue')
    const sunDot = document.getElementById('sunDot')

    if (timeValueEl) {
      timeValueEl.textContent = formatTime(state.timeHour)
    }
    if (azimuthEl) {
      azimuthEl.textContent = `${state.azimuth.toFixed(1)}°`
    }
    if (altitudeEl) {
      altitudeEl.textContent = `${state.altitude.toFixed(1)}°`
    }
    if (sunDot) {
      const indicatorSize = 48
      const dotSize = 10
      const centerX = indicatorSize / 2
      const centerY = indicatorSize / 2
      const radius = 15

      const angle = ((state.azimuth - 90) * Math.PI) / 180
      const altitudeRatio = Math.max(0, Math.min(1, state.altitude / 90))

      const offsetX = Math.cos(angle) * radius * altitudeRatio
      const offsetY = -Math.sin(angle) * radius * altitudeRatio

      const dotLeft = centerX + offsetX - dotSize / 2
      const dotTop = centerY + offsetY - dotSize / 2

      sunDot.style.left = `${dotLeft}px`
      sunDot.style.top = `${dotTop}px`
      sunDot.style.opacity = state.altitude > 0 ? '1' : '0.25'
      sunDot.style.transform = `scale(${0.6 + altitudeRatio * 0.6})`
    }
  }

  const recalculateAll = () => {
    recalculateSunPosition()
    updateAllFaceIntensities()
    updateFaceColors()
    updateFromStore()
  }

  dateInput.addEventListener('change', () => {
    const parsed = parseDate(dateInput.value)
    if (parsed) {
      useSunStore.getState().setDate(parsed.month, parsed.day)
      dateInput.value = formatDate(parsed.month, parsed.day)
      recalculateAll()
      updateQuickDateButtons()
    } else {
      const state = useSunStore.getState()
      dateInput.value = formatDate(state.currentDate.month, state.currentDate.day)
    }
  })

  const updateQuickDateButtons = () => {
    const state = useSunStore.getState()
    const btns = quickBtns.querySelectorAll('button')
    btns.forEach((btn) => {
      const month = parseInt(btn.dataset.month || '0', 10)
      const day = parseInt(btn.dataset.day || '0', 10)
      if (month === state.currentDate.month && day === state.currentDate.day) {
        btn.style.background = 'transparent'
        btn.style.color = '#00D4FF'
        btn.style.fontWeight = 'bold'
        btn.style.boxShadow = '0 0 0 1px #00D4FF'
      } else {
        btn.style.background = '#2A3A5A'
        btn.style.color = '#E0E0E0'
        btn.style.fontWeight = 'normal'
        btn.style.boxShadow = 'none'
      }
    })
  }

  quickBtns.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const month = parseInt(btn.dataset.month || '0', 10)
      const day = parseInt(btn.dataset.day || '0', 10)
      if (month && day) {
        useSunStore.getState().setDate(month, day)
        dateInput.value = formatDate(month, day)
        recalculateAll()
        updateQuickDateButtons()
      }
    })
  })

  timeSlider.addEventListener('input', () => {
    const hour = parseFloat(timeSlider.value)
    useSunStore.getState().setTime(hour)
    recalculateAll()
  })

  timeSlider.addEventListener('mousedown', () => {
    isDragging = true
  })

  timeSlider.addEventListener('mouseup', () => {
    isDragging = false
  })

  timeSlider.addEventListener('touchstart', () => {
    isDragging = true
  })

  timeSlider.addEventListener('touchend', () => {
    isDragging = false
  })

  recalculateAll()
  updateFromStore()

  const unsubscribe = useSunStore.subscribe(() => {
    updateFromStore()
  })

  return panel
}
