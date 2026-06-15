import { GalaxyControls, COLOR_THEMES } from './types'

export function buildControls(controls: GalaxyControls): void {
  const panel = document.getElementById('controls-panel')
  if (!panel) throw new Error('Controls panel not found')

  const initParams = controls.getParams()

  // 粒子数量
  const particleCountGroup = document.createElement('div')
  particleCountGroup.className = 'control-group'
  particleCountGroup.innerHTML = `
    <div class="group-label">
      <span>粒子数量</span>
      <span class="value" id="particleCountValue">${initParams.particleCount}</span>
    </div>
    <input type="range" id="particleCount" min="500" max="8000" step="500" value="${initParams.particleCount}" />
  `
  panel.appendChild(particleCountGroup)

  const particleCountSlider = particleCountGroup.querySelector('#particleCount') as HTMLInputElement
  const particleCountValue = particleCountGroup.querySelector('#particleCountValue') as HTMLElement
  let particleCountDebounce: number | null = null

  particleCountSlider.addEventListener('input', () => {
    const sliderStartTime = performance.now()
    const value = parseInt(particleCountSlider.value)
    particleCountValue.textContent = String(value)

    if (particleCountDebounce) window.clearTimeout(particleCountDebounce)
    particleCountDebounce = window.setTimeout(() => {
      const uiDelay = performance.now() - sliderStartTime
      console.log(`[UI Delay] 粒子数量滑块延迟: ${uiDelay.toFixed(2)}ms`)
      if (uiDelay > 100) console.warn(`[UI Warning] 滑块值变化到粒子更新开始延迟超过100ms!`)
      controls.setParticleCount(value, sliderStartTime)
    }, 50)
  })

  // 吸引子 1
  const attractor1Group = document.createElement('div')
  attractor1Group.className = 'control-group'
  attractor1Group.innerHTML = `
    <div class="group-label">
      <span>吸引子 #1 强度 (2,1,0)</span>
      <span class="value" id="attractor1Value">${initParams.attractor1Strength.toFixed(1)}</span>
    </div>
    <input type="range" id="attractor1" min="-5" max="5" step="0.1" value="${initParams.attractor1Strength}" />
  `
  panel.appendChild(attractor1Group)

  const attractor1Slider = attractor1Group.querySelector('#attractor1') as HTMLInputElement
  const attractor1Value = attractor1Group.querySelector('#attractor1Value') as HTMLElement

  attractor1Slider.addEventListener('input', () => {
    const sliderStartTime = performance.now()
    const v = parseFloat(attractor1Slider.value)
    attractor1Value.textContent = parseFloat(v).toFixed(1)
    const uiDelay = performance.now() - sliderStartTime
    console.log(`[UI Delay] 吸引子1滑块延迟: ${uiDelay.toFixed(2)}ms`)
    if (uiDelay > 100) console.warn(`[UI Warning] 滑块值变化到粒子更新开始延迟超过100ms!`)
    controls.setAttractor1Strength(parseFloat(v), sliderStartTime)
  })

  // 吸引子 2
  const attractor2Group = document.createElement('div')
  attractor2Group.className = 'control-group'
  attractor2Group.innerHTML = `
    <div class="group-label">
      <span>吸引子 #2 强度 (-2,-1,0)</span>
      <span class="value" id="attractor2Value">${initParams.attractor2Strength.toFixed(1)}</span>
    </div>
    <input type="range" id="attractor2" min="-5" max="5" step="0.1" value="${initParams.attractor2Strength}" />
  `
  panel.appendChild(attractor2Group)

  const attractor2Slider = attractor2Group.querySelector('#attractor2') as HTMLInputElement
  const attractor2Value = attractor2Group.querySelector('#attractor2Value') as HTMLElement

  attractor2Slider.addEventListener('input', () => {
    const sliderStartTime = performance.now()
    const v = parseFloat(attractor2Slider.value)
    attractor2Value.textContent = parseFloat(v).toFixed(1)
    const uiDelay = performance.now() - sliderStartTime
    console.log(`[UI Delay] 吸引子2滑块延迟: ${uiDelay.toFixed(2)}ms`)
    if (uiDelay > 100) console.warn(`[UI Warning] 滑块值变化到粒子更新开始延迟超过100ms!`)
    controls.setAttractor2Strength(parseFloat(v), sliderStartTime)
  })

  // 颜色主题
  const colorThemeGroup = document.createElement('div')
  colorThemeGroup.className = 'control-group'

  const themeLabels = ['星云紫蓝', '烈焰橙红', '极光绿青']
  const themePreviews = [
    'linear-gradient(135deg, #e6d9ff, #4d33ff)',
    'linear-gradient(135deg, #ffe4b5, #ff3300)',
    'linear-gradient(135deg, #b5ffe6, #00cc99)'
  ]

  let themeBtnsHtml = COLOR_THEMES.map((theme, i) => {
    const isActive = i === initParams.colorThemeIndex
    return `
      <button class="theme-btn ${isActive ? 'active' : ''}" data-theme="${i}">
        <div class="theme-preview" style="background:${themePreviews[i]}"></div>
        <span>${themeLabels[i]}</span>
      </button>
    `
  }).join('')

  colorThemeGroup.innerHTML = `
    <div class="group-label"><span>颜色主题</span></div>
    <div class="theme-buttons">${themeBtnsHtml}</div>
  `
  panel.appendChild(colorThemeGroup)

  colorThemeGroup.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const clickStartTime = performance.now()
      const idx = parseInt((btn as HTMLElement).dataset.theme!)
      colorThemeGroup.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      const uiDelay = performance.now() - clickStartTime
      console.log(`[UI Delay] 颜色主题按钮延迟: ${uiDelay.toFixed(2)}ms`)
      if (uiDelay > 100) console.warn(`[UI Warning] 主题切换延迟超过100ms!`)
      controls.setColorTheme(idx, clickStartTime)
    })
  })

  // 运动速度
  const moveSpeedGroup = document.createElement('div')
  moveSpeedGroup.className = 'control-group'
  moveSpeedGroup.innerHTML = `
    <div class="group-label">
      <span>运动速度</span>
      <span class="value" id="moveSpeedValue">${initParams.moveSpeed.toFixed(1)}</span>
    </div>
    <input type="range" id="moveSpeed" min="0.1" max="3.0" step="0.1" value="${initParams.moveSpeed}" />
  `
  panel.appendChild(moveSpeedGroup)

  const moveSpeedSlider = moveSpeedGroup.querySelector('#moveSpeed') as HTMLInputElement
  const moveSpeedValue = moveSpeedGroup.querySelector('#moveSpeedValue') as HTMLElement

  moveSpeedSlider.addEventListener('input', () => {
    const sliderStartTime = performance.now()
    const v = parseFloat(moveSpeedSlider.value)
    moveSpeedValue.textContent = v.toFixed(1)
    const uiDelay = performance.now() - sliderStartTime
    console.log(`[UI Delay] 速度滑块延迟: ${uiDelay.toFixed(2)}ms`)
    if (uiDelay > 100) console.warn(`[UI Warning] 速度调整延迟超过100ms!`)
    controls.setMoveSpeed(v, sliderStartTime)
  })

  // 暂停/恢复
  const pauseGroup = document.createElement('div')
  pauseGroup.className = 'control-group'
  pauseGroup.innerHTML = `
    <div class="group-label"><span>运动控制</span></div>
    <button class="action-btn" id="pauseBtn">暂停运动</button>
  `
  panel.appendChild(pauseGroup)

  const pauseBtn = pauseGroup.querySelector('#pauseBtn') as HTMLButtonElement
  pauseBtn.addEventListener('click', () => {
    const clickStartTime = performance.now()
    const isPaused = controls.togglePaused(clickStartTime)
    if (isPaused) {
      pauseBtn.textContent = '恢复运动'
      pauseBtn.classList.add('paused')
    } else {
      pauseBtn.textContent = '暂停运动'
      pauseBtn.classList.remove('paused')
    }
    const uiDelay = performance.now() - clickStartTime
    console.log(`[UI Delay] 暂停按钮延迟: ${uiDelay.toFixed(2)}ms`)
    if (uiDelay > 100) console.warn(`[UI Warning] 暂停切换延迟超过100ms!`)
  })

  console.log('[Controls Init] UI控件初始化完成')
}
