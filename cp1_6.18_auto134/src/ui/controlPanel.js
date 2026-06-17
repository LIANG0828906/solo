import { PlayMode } from '../engine/audioMixer';
export class ControlPanel {
    constructor(container, audioMixer) {
        this.rightPanel = null;
        this.bottomBar = null;
        this.fpsCounter = null;
        this.infoTooltip = null;
        this.volumeSlider = null;
        this.pitchSlider = null;
        this.speedSlider = null;
        this.volumeValue = null;
        this.pitchValue = null;
        this.speedValue = null;
        this.playButton = null;
        this.progressBar = null;
        this.progressFill = null;
        this.masterVolumeSlider = null;
        this.masterVolumeValue = null;
        this.loopBtn = null;
        this.singleBtn = null;
        this.shuffleBtn = null;
        this.selectedTrack = null;
        this.onTrackParameterChange = null;
        this.onPlayClick = null;
        this.onPauseClick = null;
        this.onSeek = null;
        this.onPlayModeChange = null;
        this.container = container;
        this.app = document.getElementById('app') || document.body;
        this.audioMixer = audioMixer;
        this.create();
    }
    create() {
        this.createRightPanel();
        this.createBottomBar();
        this.createFPSCounter();
        this.createInfoTooltip();
        this.injectStyles();
    }
    createRightPanel() {
        this.rightPanel = document.createElement('div');
        this.rightPanel.id = 'right-panel';
        this.rightPanel.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      width: 280px;
      background: rgba(26, 26, 46, 0.9);
      border-radius: 12px;
      padding: 20px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      opacity: 0;
      transform: translateX(300px);
      transition: all 0.3s ease-out;
      pointer-events: none;
      z-index: 100;
    `;
        const title = document.createElement('div');
        title.style.cssText = `
      color: #fff;
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    `;
        title.id = 'panel-title';
        title.textContent = '选择音轨';
        this.rightPanel.appendChild(title);
        this.volumeSlider = this.createSlider({
            min: 0, max: 100, value: 60, step: 1,
            label: '音量', unit: ''
        }, 'volume');
        this.pitchSlider = this.createSlider({
            min: -5, max: 5, value: 0, step: 0.1,
            label: '音调', unit: ' 半音'
        }, 'pitch');
        this.speedSlider = this.createSlider({
            min: 0.5, max: 2.0, value: 1.0, step: 0.1,
            label: '速度', unit: 'x'
        }, 'speed');
        this.rightPanel.appendChild(this.volumeSlider.container);
        this.rightPanel.appendChild(this.pitchSlider.container);
        this.rightPanel.appendChild(this.speedSlider.container);
        this.volumeValue = this.volumeSlider.valueDisplay;
        this.pitchValue = this.pitchSlider.valueDisplay;
        this.speedValue = this.speedSlider.valueDisplay;
        this.app.appendChild(this.rightPanel);
    }
    createSlider(config, id) {
        const container = document.createElement('div');
        container.style.cssText = `
      margin-bottom: 20px;
    `;
        const header = document.createElement('div');
        header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    `;
        const label = document.createElement('span');
        label.style.cssText = `
      color: #aaa;
      font-size: 14px;
    `;
        label.textContent = config.label;
        const valueDisplay = document.createElement('span');
        valueDisplay.style.cssText = `
      color: #6C63FF;
      font-size: 14px;
      font-weight: bold;
    `;
        valueDisplay.textContent = config.value.toString() + config.unit;
        header.appendChild(label);
        header.appendChild(valueDisplay);
        const input = document.createElement('input');
        input.type = 'range';
        input.id = `${id}-slider`;
        input.min = config.min.toString();
        input.max = config.max.toString();
        input.step = config.step.toString();
        input.value = config.value.toString();
        input.style.cssText = `
      width: 100%;
      height: 6px;
      background: #2D2D44;
      border-radius: 4px;
      outline: none;
      -webkit-appearance: none;
      cursor: pointer;
    `;
        input.addEventListener('input', () => {
            const value = parseFloat(input.value);
            valueDisplay.textContent = value.toString() + config.unit;
            if (this.selectedTrack) {
                if (id === 'volume') {
                    this.selectedTrack.volume = value;
                    this.audioMixer.setTrackVolume(this.selectedTrack.id, value);
                }
                else if (id === 'pitch') {
                    this.selectedTrack.pitch = value;
                    this.audioMixer.setTrackPitch(this.selectedTrack.id, value);
                }
                else if (id === 'speed') {
                    this.selectedTrack.speed = value;
                    this.audioMixer.setTrackSpeed(this.selectedTrack.id, value);
                }
                if (this.onTrackParameterChange) {
                    this.onTrackParameterChange(this.selectedTrack);
                }
            }
        });
        container.appendChild(header);
        container.appendChild(input);
        return { container, input, valueDisplay };
    }
    createBottomBar() {
        this.bottomBar = document.createElement('div');
        this.bottomBar.id = 'bottom-bar';
        this.bottomBar.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 60px;
      background: #0D1117;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      padding: 0 20px;
      gap: 20px;
      z-index: 100;
    `;
        this.playButton = document.createElement('div');
        this.playButton.id = 'play-button';
        this.playButton.style.cssText = `
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #6C63FF;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease-out;
      flex-shrink: 0;
    `;
        const playIcon = document.createElement('div');
        playIcon.id = 'play-icon';
        playIcon.style.cssText = `
      width: 0;
      height: 0;
      border-left: 12px solid white;
      border-top: 8px solid transparent;
      border-bottom: 8px solid transparent;
      margin-left: 3px;
      transition: all 0.3s ease-out;
    `;
        this.playButton.appendChild(playIcon);
        this.playButton.addEventListener('mouseenter', () => {
            if (this.playButton) {
                this.playButton.style.transform = 'scale(1.1)';
                this.playButton.style.filter = 'brightness(1.2)';
            }
        });
        this.playButton.addEventListener('mouseleave', () => {
            if (this.playButton) {
                this.playButton.style.transform = 'scale(1)';
                this.playButton.style.filter = 'brightness(1)';
            }
        });
        this.playButton.addEventListener('mousedown', () => {
            if (this.playButton) {
                this.playButton.style.transform = 'scale(0.95)';
            }
        });
        this.playButton.addEventListener('mouseup', () => {
            if (this.playButton) {
                this.playButton.style.transform = 'scale(1)';
            }
        });
        this.playButton.addEventListener('click', () => {
            if (this.audioMixer.isPlaying) {
                if (this.onPauseClick)
                    this.onPauseClick();
            }
            else {
                if (this.onPlayClick)
                    this.onPlayClick();
            }
        });
        this.progressBar = document.createElement('div');
        this.progressBar.style.cssText = `
      flex: 1;
      height: 6px;
      background: #2D2D44;
      border-radius: 4px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    `;
        this.progressFill = document.createElement('div');
        this.progressFill.style.cssText = `
      height: 100%;
      background: linear-gradient(90deg, #6C63FF, #9B95FF);
      border-radius: 4px;
      width: 0%;
      transition: width 0.1s linear;
    `;
        this.progressBar.appendChild(this.progressFill);
        this.progressBar.addEventListener('click', (e) => {
            const rect = this.progressBar.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            const time = percent * this.audioMixer.duration;
            if (this.onSeek)
                this.onSeek(time);
        });
        const masterVolumeContainer = document.createElement('div');
        masterVolumeContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    `;
        const masterLabel = document.createElement('span');
        masterLabel.style.cssText = `
      color: #aaa;
      font-size: 12px;
    `;
        masterLabel.textContent = '总音量';
        this.masterVolumeSlider = document.createElement('input');
        this.masterVolumeSlider.type = 'range';
        this.masterVolumeSlider.min = '0';
        this.masterVolumeSlider.max = '100';
        this.masterVolumeSlider.step = '1';
        this.masterVolumeSlider.value = this.audioMixer.masterVolume.toString();
        this.masterVolumeSlider.style.cssText = `
      width: 100px;
      height: 4px;
      background: #2D2D44;
      border-radius: 2px;
      outline: none;
      -webkit-appearance: none;
      cursor: pointer;
    `;
        this.masterVolumeValue = document.createElement('span');
        this.masterVolumeValue.style.cssText = `
      color: #6C63FF;
      font-size: 12px;
      width: 30px;
      text-align: right;
    `;
        this.masterVolumeValue.textContent = this.audioMixer.masterVolume.toString();
        this.masterVolumeSlider.addEventListener('input', () => {
            const value = parseInt(this.masterVolumeSlider.value);
            this.masterVolumeValue.textContent = value.toString();
            this.audioMixer.setMasterVolume(value);
        });
        masterVolumeContainer.appendChild(masterLabel);
        masterVolumeContainer.appendChild(this.masterVolumeSlider);
        masterVolumeContainer.appendChild(this.masterVolumeValue);
        const playModeContainer = document.createElement('div');
        playModeContainer.style.cssText = `
      display: flex;
      gap: 5px;
      flex-shrink: 0;
    `;
        this.loopBtn = this.createPlayModeButton('循环', PlayMode.LOOP, true);
        this.singleBtn = this.createPlayModeButton('单曲', PlayMode.SINGLE, false);
        this.shuffleBtn = this.createPlayModeButton('随机', PlayMode.SHUFFLE, false);
        playModeContainer.appendChild(this.loopBtn);
        playModeContainer.appendChild(this.singleBtn);
        playModeContainer.appendChild(this.shuffleBtn);
        this.bottomBar.appendChild(this.playButton);
        this.bottomBar.appendChild(this.progressBar);
        this.bottomBar.appendChild(masterVolumeContainer);
        this.bottomBar.appendChild(playModeContainer);
        this.app.appendChild(this.bottomBar);
    }
    createPlayModeButton(label, mode, active) {
        const btn = document.createElement('div');
        btn.textContent = label;
        btn.dataset.mode = mode;
        btn.style.cssText = `
      padding: 0 12px;
      height: 32px;
      border-radius: 8px;
      background: ${active ? '#6C63FF' : '#2D2D44'};
      color: white;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease-out;
    `;
        btn.addEventListener('mouseenter', () => {
            btn.style.filter = 'brightness(1.1)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.filter = 'brightness(1)';
        });
        btn.addEventListener('mousedown', () => {
            btn.style.transform = 'scale(0.95)';
        });
        btn.addEventListener('mouseup', () => {
            btn.style.transform = 'scale(1)';
        });
        btn.addEventListener('click', () => {
            this.setPlayMode(mode);
            if (this.onPlayModeChange) {
                this.onPlayModeChange(mode);
            }
        });
        return btn;
    }
    createFPSCounter() {
        this.fpsCounter = document.createElement('div');
        this.fpsCounter.id = 'fps-counter';
        this.fpsCounter.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      color: white;
      font-size: 12px;
      font-family: 'Consolas', monospace;
      z-index: 100;
      line-height: 1.6;
      pointer-events: none;
    `;
        this.fpsCounter.innerHTML = 'FPS: 0<br>Particles: 0';
        this.app.appendChild(this.fpsCounter);
    }
    createInfoTooltip() {
        this.infoTooltip = document.createElement('div');
        this.infoTooltip.id = 'info-tooltip';
        this.infoTooltip.style.cssText = `
      position: absolute;
      bottom: 80px;
      left: 20px;
      width: 200px;
      height: 40px;
      background: rgba(26, 26, 46, 0.9);
      border-radius: 8px;
      display: flex;
      align-items: center;
      padding: 0 15px;
      color: #aaa;
      font-size: 12px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      opacity: 0;
      transition: opacity 0.3s ease-out;
      z-index: 100;
      pointer-events: none;
    `;
        this.infoTooltip.textContent = '悬停节点查看信息';
        this.app.appendChild(this.infoTooltip);
    }
    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #6C63FF;
        cursor: pointer;
        transition: all 0.2s ease-out;
      }
      
      input[type="range"]::-webkit-slider-thumb:hover {
        transform: scale(1.2);
        box-shadow: 0 0 10px rgba(108, 99, 255, 0.5);
      }
      
      input[type="range"]::-moz-range-thumb {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #6C63FF;
        cursor: pointer;
        border: none;
      }
    `;
        document.head.appendChild(style);
    }
    setSelectedTrack(track) {
        this.selectedTrack = track;
        if (this.rightPanel) {
            if (track) {
                this.rightPanel.style.opacity = '1';
                this.rightPanel.style.transform = 'translateX(0)';
                this.rightPanel.style.pointerEvents = 'auto';
                const title = this.rightPanel.querySelector('#panel-title');
                if (title) {
                    title.textContent = track.name;
                    title.style.color = track.color;
                }
                if (this.volumeSlider)
                    this.volumeSlider.input.value = track.volume.toString();
                if (this.pitchSlider)
                    this.pitchSlider.input.value = track.pitch.toString();
                if (this.speedSlider)
                    this.speedSlider.input.value = track.speed.toString();
                if (this.volumeValue)
                    this.volumeValue.textContent = track.volume.toString();
                if (this.pitchValue)
                    this.pitchValue.textContent = track.pitch.toString() + ' 半音';
                if (this.speedValue)
                    this.speedValue.textContent = track.speed.toString() + 'x';
            }
            else {
                this.rightPanel.style.opacity = '0';
                this.rightPanel.style.transform = 'translateX(300px)';
                this.rightPanel.style.pointerEvents = 'none';
            }
        }
    }
    showTrackInfo(track) {
        if (this.infoTooltip) {
            if (track) {
                this.infoTooltip.style.opacity = '1';
                this.infoTooltip.innerHTML = `
          <span style="color: ${track.color}; margin-right: 8px;">●</span>
          ${track.name} | 音量: ${track.volume} | 音调: ${track.pitch}
        `;
            }
            else {
                this.infoTooltip.style.opacity = '0';
            }
        }
    }
    updateFPS(fps, particleCount) {
        if (this.fpsCounter) {
            this.fpsCounter.innerHTML = `FPS: ${fps}<br>Particles: ${particleCount}`;
        }
    }
    updateProgress(time, duration) {
        if (this.progressFill) {
            const percent = (time / duration) * 100;
            this.progressFill.style.width = percent + '%';
        }
    }
    setPlaying(playing) {
        const playIcon = document.getElementById('play-icon');
        if (playIcon) {
            if (playing) {
                playIcon.style.cssText = `
          width: 12px;
          height: 12px;
          border-left: none;
          border-top: none;
          border-bottom: none;
          margin-left: 0;
          display: flex;
          gap: 3px;
        `;
                playIcon.innerHTML = `
          <div style="width: 3px; height: 12px; background: white;"></div>
          <div style="width: 3px; height: 12px; background: white;"></div>
        `;
            }
            else {
                playIcon.style.cssText = `
          width: 0;
          height: 0;
          border-left: 12px solid white;
          border-top: 8px solid transparent;
          border-bottom: 8px solid transparent;
          margin-left: 3px;
          transition: all 0.3s ease-out;
        `;
                playIcon.innerHTML = '';
            }
        }
    }
    setPlayMode(mode) {
        const buttons = [this.loopBtn, this.singleBtn, this.shuffleBtn];
        buttons.forEach(btn => {
            if (btn) {
                if (btn.dataset.mode === mode) {
                    btn.style.background = '#6C63FF';
                }
                else {
                    btn.style.background = '#2D2D44';
                }
            }
        });
    }
    setOnTrackParameterChange(callback) {
        this.onTrackParameterChange = callback;
    }
    setOnPlayClick(callback) {
        this.onPlayClick = callback;
    }
    setOnPauseClick(callback) {
        this.onPauseClick = callback;
    }
    setOnSeek(callback) {
        this.onSeek = callback;
    }
    setOnPlayModeChange(callback) {
        this.onPlayModeChange = callback;
    }
    dispose() {
        if (this.rightPanel)
            this.rightPanel.remove();
        if (this.bottomBar)
            this.bottomBar.remove();
        if (this.fpsCounter)
            this.fpsCounter.remove();
        if (this.infoTooltip)
            this.infoTooltip.remove();
    }
}
