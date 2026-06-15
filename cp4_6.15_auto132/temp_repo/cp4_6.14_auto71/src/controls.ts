export interface ControlState {
  showConstellations: boolean;
  rotationSpeed: number;
  resetView: () => void;
  onChange: (callback: () => void) => void;
}

export function createControls(): ControlState {
  const state: ControlState = {
    showConstellations: true,
    rotationSpeed: 1.0,
    resetView: () => {},
    onChange: () => {}
  };

  const listeners: (() => void)[] = [];

  const notifyChange = () => {
    listeners.forEach(cb => cb());
  };

  state.onChange = (callback: () => void) => {
    listeners.push(callback);
  };

  const panel = document.createElement('div');
  panel.id = 'control-panel';
  panel.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #1e293baa;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-radius: 12px;
    padding: 20px;
    z-index: 50;
    opacity: 0.6;
    transition: opacity 0.3s ease;
    font-family: 'Consolas', 'Monaco', 'Courier New', ui-monospace, monospace, -apple-system, BlinkMacSystemFont, sans-serif;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 260px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
  `;

  panel.addEventListener('mouseenter', () => {
    panel.style.opacity = '0.9';
  });

  panel.addEventListener('mouseleave', () => {
    panel.style.opacity = '0.6';
  });

  const title = document.createElement('div');
  title.style.cssText = `
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.5px;
    opacity: 0.9;
    margin-bottom: 4px;
  `;
  title.textContent = '控制面板';
  panel.appendChild(title);

  const toggleRow = document.createElement('div');
  toggleRow.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  `;

  const toggleLabel = document.createElement('span');
  toggleLabel.style.cssText = `
    font-size: 13px;
    opacity: 0.85;
  `;
  toggleLabel.textContent = '显示星座连线';
  toggleRow.appendChild(toggleLabel);

  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.style.cssText = `
    width: 52px;
    height: 28px;
    border-radius: 14px;
    border: none;
    cursor: pointer;
    background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);
    position: relative;
    transition: background 0.2s ease;
    outline: none;
    padding: 0;
    flex-shrink: 0;
  `;

  const toggleKnob = document.createElement('div');
  toggleKnob.style.cssText = `
    position: absolute;
    top: 3px;
    right: 3px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #ffffff;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  `;
  toggleBtn.appendChild(toggleKnob);

  const updateToggleState = () => {
    if (state.showConstellations) {
      toggleBtn.style.background = 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)';
      toggleKnob.style.right = '3px';
      toggleKnob.style.left = 'auto';
    } else {
      toggleBtn.style.background = '#475569';
      toggleKnob.style.left = '3px';
      toggleKnob.style.right = 'auto';
    }
  };

  toggleBtn.addEventListener('click', () => {
    state.showConstellations = !state.showConstellations;
    updateToggleState();
    notifyChange();
  });

  toggleRow.appendChild(toggleBtn);
  panel.appendChild(toggleRow);

  const sliderRow = document.createElement('div');
  sliderRow.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 8px;
  `;

  const sliderLabelRow = document.createElement('div');
  sliderLabelRow.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;

  const sliderLabel = document.createElement('span');
  sliderLabel.style.cssText = `
    font-size: 13px;
    opacity: 0.85;
  `;
  sliderLabel.textContent = '旋转速度';

  const speedValue = document.createElement('span');
  speedValue.style.cssText = `
    font-size: 13px;
    font-weight: 600;
    color: #a5f3fc;
    min-width: 48px;
    text-align: right;
  `;
  speedValue.textContent = `${state.rotationSpeed.toFixed(1)}x`;

  sliderLabelRow.appendChild(sliderLabel);
  sliderLabelRow.appendChild(speedValue);
  sliderRow.appendChild(sliderLabelRow);

  const sliderContainer = document.createElement('div');
  sliderContainer.style.cssText = `
    position: relative;
    height: 6px;
    background: #334155;
    border-radius: 3px;
    cursor: pointer;
  `;

  const sliderFill = document.createElement('div');
  sliderFill.style.cssText = `
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background: linear-gradient(90deg, #818cf8 0%, #a5f3fc 100%);
    border-radius: 3px;
    transition: width 0.1s ease;
  `;
  sliderContainer.appendChild(sliderFill);

  const sliderThumb = document.createElement('div');
  sliderThumb.style.cssText = `
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 16px;
    height: 16px;
    background: #ffffff;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    cursor: grab;
    transition: transform 0.15s ease;
  `;
  sliderContainer.appendChild(sliderThumb);

  const updateSliderUI = () => {
    const percentage = ((state.rotationSpeed - 0.5) / (5 - 0.5)) * 100;
    sliderFill.style.width = `${percentage}%`;
    sliderThumb.style.left = `${percentage}%`;
    speedValue.textContent = `${state.rotationSpeed.toFixed(1)}x`;
  };

  let isDragging = false;

  const handleSliderMove = (clientX: number) => {
    const rect = sliderContainer.getBoundingClientRect();
    let percentage = (clientX - rect.left) / rect.width;
    percentage = Math.max(0, Math.min(1, percentage));
    const value = 0.5 + percentage * (5 - 0.5);
    state.rotationSpeed = Math.round(value * 10) / 10;
    updateSliderUI();
    notifyChange();
  };

  sliderContainer.addEventListener('mousedown', (e) => {
    isDragging = true;
    sliderThumb.style.transform = 'translate(-50%, -50%) scale(1.1)';
    handleSliderMove(e.clientX);
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      handleSliderMove(e.clientX);
    }
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      sliderThumb.style.transform = 'translate(-50%, -50%) scale(1)';
    }
  });

  sliderContainer.addEventListener('touchstart', (e) => {
    isDragging = true;
    sliderThumb.style.transform = 'translate(-50%, -50%) scale(1.1)';
    handleSliderMove(e.touches[0].clientX);
  });

  document.addEventListener('touchmove', (e) => {
    if (isDragging && e.touches.length > 0) {
      handleSliderMove(e.touches[0].clientX);
    }
  });

  document.addEventListener('touchend', () => {
    if (isDragging) {
      isDragging = false;
      sliderThumb.style.transform = 'translate(-50%, -50%) scale(1)';
    }
  });

  sliderRow.appendChild(sliderContainer);
  panel.appendChild(sliderRow);

  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.textContent = '重置视角';
  resetBtn.style.cssText = `
    width: 100%;
    padding: 10px 16px;
    border-radius: 8px;
    border: 1px solid #475569;
    background: rgba(71, 85, 105, 0.5);
    color: #ffffff;
    font-size: 13px;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.2s ease;
    outline: none;
    font-weight: 500;
  `;

  resetBtn.addEventListener('mouseenter', () => {
    resetBtn.style.background = 'rgba(129, 140, 248, 0.3)';
    resetBtn.style.borderColor = '#818cf8';
  });

  resetBtn.addEventListener('mouseleave', () => {
    resetBtn.style.background = 'rgba(71, 85, 105, 0.5)';
    resetBtn.style.borderColor = '#475569';
  });

  resetBtn.addEventListener('click', () => {
    state.resetView();
  });

  state.resetView = () => {};

  panel.appendChild(resetBtn);

  const updateResponsiveLayout = () => {
    const width = window.innerWidth;
    if (width >= 320 && width <= 768) {
      panel.style.cssText = `
        position: fixed;
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%);
        background: #1e293baa;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-radius: 12px;
        padding: 12px 16px;
        z-index: 50;
        opacity: 0.6;
        transition: opacity 0.3s ease;
        font-family: 'Consolas', 'Monaco', 'Courier New', ui-monospace, monospace, -apple-system, BlinkMacSystemFont, sans-serif;
        color: #ffffff;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 12px;
        width: calc(100% - 32px);
        max-width: 480px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
      `;
      title.style.display = 'none';
      toggleLabel.style.fontSize = '11px';
      sliderLabel.style.fontSize = '11px';
      speedValue.style.fontSize = '11px';
      resetBtn.style.fontSize = '11px';
      resetBtn.style.padding = '8px 12px';
      toggleBtn.style.width = '44px';
      toggleBtn.style.height = '24px';
      toggleKnob.style.width = '18px';
      toggleKnob.style.height = '18px';
      toggleRow.style.gap = '8px';
    } else if (width >= 1024) {
      panel.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: #1e293baa;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-radius: 12px;
        padding: 20px;
        z-index: 50;
        opacity: 0.6;
        transition: opacity 0.3s ease;
        font-family: 'Consolas', 'Monaco', 'Courier New', ui-monospace, monospace, -apple-system, BlinkMacSystemFont, sans-serif;
        color: #ffffff;
        display: flex;
        flex-direction: column;
        gap: 16px;
        min-width: 260px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
      `;
      title.style.display = 'block';
      toggleLabel.style.fontSize = '13px';
      sliderLabel.style.fontSize = '13px';
      speedValue.style.fontSize = '13px';
      resetBtn.style.fontSize = '13px';
      resetBtn.style.padding = '10px 16px';
      toggleBtn.style.width = '52px';
      toggleBtn.style.height = '28px';
      toggleKnob.style.width = '22px';
      toggleKnob.style.height = '22px';
      toggleRow.style.gap = '12px';
    } else {
      panel.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #1e293baa;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-radius: 12px;
        padding: 16px;
        z-index: 50;
        opacity: 0.6;
        transition: opacity 0.3s ease;
        font-family: 'Consolas', 'Monaco', 'Courier New', ui-monospace, monospace, -apple-system, BlinkMacSystemFont, sans-serif;
        color: #ffffff;
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-width: 220px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
      `;
      title.style.display = 'block';
    }
    updateToggleState();
    updateSliderUI();
  };

  window.addEventListener('resize', updateResponsiveLayout);

  document.body.appendChild(panel);

  updateToggleState();
  updateSliderUI();
  updateResponsiveLayout();

  return state;
}
