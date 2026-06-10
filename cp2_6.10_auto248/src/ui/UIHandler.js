import * as THREE from 'three';

class UIHandler {
  constructor(starSystem, collisionSystem) {
    this.starSystem = starSystem;
    this.collisionSystem = collisionSystem;
    this.selectedBodyType = null;
    this.currentBody = null;
    this.stardust = 0;
    this.targetStardust = 0;
    this.isPlaying = true;
    this.isPaused = false;
    this.onResetCallback = null;
    this.unlockedTypes = new Set(['star', 'planet', 'ring']);

    this.initDOM();
    this.bindEvents();
    this.initResponsive();
    this.startStardustAnimation();
  }

  initDOM() {
    this.createToolbar();
    this.createTopControls();
    this.createPropertiesPanel();
    this.createStardustCounter();
    this.createUnlockEffect();
    this.createFlashEffect();
  }

  createToolbar() {
    this.toolbar = document.createElement('div');
    this.toolbar.id = 'ui-toolbar';
    this.toolbar.className = 'toolbar';
    this.toolbar.innerHTML = `
      <div class="toolbar-header">星体选择</div>
      <div class="toolbar-items">
        <button class="toolbar-item" data-type="star" title="恒星">
          <svg viewBox="0 0 24 24" width="32" height="32">
            <circle cx="12" cy="12" r="6" fill="#ffd700" />
            <g stroke="#ffd700" stroke-width="2">
              <line x1="12" y1="2" x2="12" y2="5" />
              <line x1="12" y1="19" x2="12" y2="22" />
              <line x1="2" y1="12" x2="5" y2="12" />
              <line x1="19" y1="12" x2="22" y2="12" />
              <line x1="4.93" y1="4.93" x2="7.05" y2="7.05" />
              <line x1="16.95" y1="16.95" x2="19.07" y2="19.07" />
              <line x1="4.93" y1="19.07" x2="7.05" y2="16.95" />
              <line x1="16.95" y1="7.05" x2="19.07" y2="4.93" />
            </g>
          </svg>
          <span>恒星</span>
        </button>
        <button class="toolbar-item" data-type="planet" title="行星">
          <svg viewBox="0 0 24 24" width="32" height="32">
            <circle cx="12" cy="12" r="7" fill="#4da6ff" />
            <ellipse cx="12" cy="12" rx="10" ry="3" fill="none" stroke="#87ceeb" stroke-width="1.5" transform="rotate(-20 12 12)" />
          </svg>
          <span>行星</span>
        </button>
        <button class="toolbar-item" data-type="ring" title="星环">
          <svg viewBox="0 0 24 24" width="32" height="32">
            <circle cx="12" cy="12" r="3" fill="#c0c0c0" />
            <ellipse cx="12" cy="12" rx="10" ry="2.5" fill="none" stroke="#d4af37" stroke-width="2" />
            <ellipse cx="12" cy="12" rx="8" ry="1.8" fill="none" stroke="#daa520" stroke-width="1.5" />
          </svg>
          <span>星环</span>
        </button>
        <button class="toolbar-item locked" data-type="pulsar" title="脉冲星 (需解锁)">
          <svg viewBox="0 0 24 24" width="32" height="32">
            <circle cx="12" cy="12" r="4" fill="#00ffff" />
            <line x1="2" y1="12" x2="22" y2="12" stroke="#00ffff" stroke-width="2" stroke-dasharray="4,2" />
            <line x1="12" y1="2" x2="12" y2="22" stroke="#00ffff" stroke-width="2" stroke-dasharray="4,2" />
          </svg>
          <span>脉冲星</span>
          <div class="lock-icon">🔒</div>
        </button>
        <button class="toolbar-item locked" data-type="blackhole" title="黑洞 (需解锁)">
          <svg viewBox="0 0 24 24" width="32" height="32">
            <circle cx="12" cy="12" r="8" fill="url(#accretionGradient)" />
            <circle cx="12" cy="12" r="4" fill="#000" />
            <defs>
              <radialGradient id="accretionGradient">
                <stop offset="50%" stop-color="#000" />
                <stop offset="70%" stop-color="#ff6600" />
                <stop offset="85%" stop-color="#ffcc00" />
                <stop offset="100%" stop-color="transparent" />
              </radialGradient>
            </defs>
          </svg>
          <span>黑洞</span>
          <div class="lock-icon">🔒</div>
        </button>
      </div>
      <button id="place-btn" class="place-btn" disabled>
        <svg viewBox="0 0 24 24" width="20" height="20">
          <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2" />
          <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" />
        </svg>
        放置
      </button>
    `;
    document.body.appendChild(this.toolbar);
  }

  createTopControls() {
    this.topControls = document.createElement('div');
    this.topControls.id = 'ui-top-controls';
    this.topControls.className = 'top-controls';
    this.topControls.innerHTML = `
      <button id="play-btn" class="control-btn" title="播放/暂停">
        <svg class="play-icon" viewBox="0 0 24 24" width="24" height="24">
          <polygon points="5,3 19,12 5,21" fill="currentColor" />
        </svg>
        <svg class="pause-icon" viewBox="0 0 24 24" width="24" height="24" style="display:none">
          <rect x="6" y="4" width="4" height="16" fill="currentColor" />
          <rect x="14" y="4" width="4" height="16" fill="currentColor" />
        </svg>
      </button>
      <button id="reset-btn" class="control-btn" title="重置">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z" fill="currentColor" />
        </svg>
      </button>
    `;
    document.body.appendChild(this.topControls);
  }

  createPropertiesPanel() {
    this.propertiesPanel = document.createElement('div');
    this.propertiesPanel.id = 'ui-properties';
    this.propertiesPanel.className = 'properties-panel hidden';
    this.propertiesPanel.innerHTML = `
      <div class="panel-header">
        <span class="panel-title">星体属性</span>
        <button class="close-btn" id="close-properties">×</button>
      </div>
      <div class="panel-content">
        <div class="property-group">
          <label>
            <span class="property-label">质量</span>
            <span class="property-value" id="mass-value">1.0</span>
          </label>
          <input type="range" id="mass-slider" min="0.1" max="10" step="0.1" value="1" />
        </div>
        <div class="property-group">
          <label>
            <span class="property-label">色相</span>
            <span class="property-value" id="hue-value">0</span>
          </label>
          <input type="range" id="hue-slider" min="0" max="360" step="1" value="0" />
          <div class="hue-preview" id="hue-preview"></div>
        </div>
        <div class="property-group">
          <label>
            <span class="property-label">半径</span>
            <span class="property-value" id="radius-value">1.0</span>
          </label>
          <input type="range" id="radius-slider" min="0.5" max="5" step="0.1" value="1" />
        </div>
        <button id="delete-btn" class="delete-btn">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" fill="currentColor" />
          </svg>
          删除星体
        </button>
      </div>
    `;
    document.body.appendChild(this.propertiesPanel);
  }

  createStardustCounter() {
    this.stardustCounter = document.createElement('div');
    this.stardustCounter.id = 'ui-stardust';
    this.stardustCounter.className = 'stardust-counter';
    this.stardustCounter.innerHTML = `
      <div class="stardust-icon">
        <svg viewBox="0 0 24 24" width="28" height="28">
          <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" fill="#ffd700" />
        </svg>
      </div>
      <div class="stardust-info">
        <div class="stardust-label">星尘</div>
        <div class="stardust-amount" id="stardust-amount">0</div>
      </div>
    `;
    document.body.appendChild(this.stardustCounter);
  }

  createUnlockEffect() {
    this.unlockNotification = document.createElement('div');
    this.unlockNotification.id = 'unlock-notification';
    this.unlockNotification.className = 'unlock-notification hidden';
    this.unlockNotification.innerHTML = `
      <div class="unlock-content">
        <div class="unlock-icon">✨</div>
        <div class="unlock-text">
          <div class="unlock-title">新星体解锁！</div>
          <div class="unlock-type" id="unlock-type-name"></div>
        </div>
      </div>
    `;
    document.body.appendChild(this.unlockNotification);
  }

  createFlashEffect() {
    this.flashOverlay = document.createElement('div');
    this.flashOverlay.id = 'flash-overlay';
    this.flashOverlay.className = 'flash-overlay';
    document.body.appendChild(this.flashOverlay);
  }

  bindEvents() {
    const toolbarItems = this.toolbar.querySelectorAll('.toolbar-item');
    toolbarItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const type = item.dataset.type;
        if (!item.classList.contains('locked')) {
          this.selectBodyType(type);
        }
      });
    });

    const placeBtn = document.getElementById('place-btn');
    placeBtn.addEventListener('click', () => {
      if (this.selectedBodyType && this.starSystem) {
        this.handlePlacement();
      }
    });

    const playBtn = document.getElementById('play-btn');
    playBtn.addEventListener('click', () => this.togglePlay());

    const resetBtn = document.getElementById('reset-btn');
    resetBtn.addEventListener('click', () => this.reset());

    const closeBtn = document.getElementById('close-properties');
    closeBtn.addEventListener('click', () => this.hideProperties());

    const massSlider = document.getElementById('mass-slider');
    const hueSlider = document.getElementById('hue-slider');
    const radiusSlider = document.getElementById('radius-slider');

    massSlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      document.getElementById('mass-value').textContent = value.toFixed(1);
      if (this.currentBody && this.starSystem) {
        this.starSystem.updateBodyParameters(this.currentBody, { mass: value });
      }
    });

    hueSlider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      document.getElementById('hue-value').textContent = value;
      document.getElementById('hue-preview').style.backgroundColor = `hsl(${value}, 80%, 60%)`;
      if (this.currentBody && this.starSystem) {
        const colorHex = this.hslToHex(value, 80, 60);
        this.starSystem.updateBodyParameters(this.currentBody, { color: colorHex });
        this.currentBody.hue = value;
      }
    });

    radiusSlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      document.getElementById('radius-value').textContent = value.toFixed(1);
      if (this.currentBody && this.starSystem) {
        this.starSystem.updateBodyParameters(this.currentBody, { radius: value });
      }
    });

    const deleteBtn = document.getElementById('delete-btn');
    deleteBtn.addEventListener('click', () => {
      if (this.currentBody && this.starSystem) {
        this.starSystem.removeBody(this.currentBody);
        this.hideProperties();
      }
    });

    window.addEventListener('resize', () => this.handleResize());
  }

  initResponsive() {
    this.handleResize();
  }

  handleResize() {
    const isMobile = window.innerWidth <= 768;
    document.body.classList.toggle('mobile-view', isMobile);

    if (isMobile) {
      this.toolbar.classList.add('mobile-toolbar');
      this.propertiesPanel.classList.add('mobile-panel');
    } else {
      this.toolbar.classList.remove('mobile-toolbar');
      this.propertiesPanel.classList.remove('mobile-panel');
    }
  }

  selectBodyType(type) {
    this.selectedBodyType = type;

    const toolbarItems = this.toolbar.querySelectorAll('.toolbar-item');
    toolbarItems.forEach(item => {
      item.classList.toggle('active', item.dataset.type === type);
    });

    const placeBtn = document.getElementById('place-btn');
    placeBtn.disabled = false;
  }

  showProperties(body) {
    this.currentBody = body;
    this.propertiesPanel.classList.remove('hidden');

    const mass = body.mass || 1;
    const radius = body.radius || 1;
    
    let hue = body.hue;
    if (hue === undefined && body.color) {
      const color = new THREE.Color(body.color);
      hue = Math.floor(this.rgbToHue(color.r, color.g, color.b));
    }
    hue = hue || 0;
    body.hue = hue;

    document.getElementById('mass-slider').value = mass;
    document.getElementById('mass-value').textContent = mass.toFixed(1);

    document.getElementById('hue-slider').value = hue;
    document.getElementById('hue-value').textContent = hue;
    document.getElementById('hue-preview').style.backgroundColor = `hsl(${hue}, 80%, 60%)`;

    document.getElementById('radius-slider').value = radius;
    document.getElementById('radius-value').textContent = radius.toFixed(1);
  }

  hideProperties() {
    this.currentBody = null;
    this.propertiesPanel.classList.add('hidden');
  }

  updateStardust(amount) {
    this.targetStardust = amount;
  }

  startStardustAnimation() {
    const animate = () => {
      if (this.stardust !== this.targetStardust) {
        const diff = this.targetStardust - this.stardust;
        const step = Math.ceil(Math.abs(diff) * 0.1) * Math.sign(diff);
        this.stardust += step;

        if ((step > 0 && this.stardust > this.targetStardust) ||
            (step < 0 && this.stardust < this.targetStardust)) {
          this.stardust = this.targetStardust;
        }

        const amountEl = document.getElementById('stardust-amount');
        amountEl.textContent = this.stardust.toLocaleString();
        amountEl.classList.add('counting');
        setTimeout(() => amountEl.classList.remove('counting'), 100);
      }
      requestAnimationFrame(animate);
    };
    animate();
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    this.isPaused = !this.isPlaying;
    const playIcon = this.topControls.querySelector('.play-icon');
    const pauseIcon = this.topControls.querySelector('.pause-icon');

    playIcon.style.display = this.isPlaying ? 'block' : 'none';
    pauseIcon.style.display = this.isPlaying ? 'none' : 'block';

    if (this.starSystem && this.starSystem.setPaused) {
      this.starSystem.setPaused(this.isPaused);
    }
  }

  reset() {
    this.hideProperties();
    this.selectedBodyType = null;
    this.stardust = 0;
    this.targetStardust = 0;
    document.getElementById('stardust-amount').textContent = '0';

    const toolbarItems = this.toolbar.querySelectorAll('.toolbar-item');
    toolbarItems.forEach(item => item.classList.remove('active'));

    const placeBtn = document.getElementById('place-btn');
    placeBtn.disabled = true;

    if (!this.isPlaying) {
      this.togglePlay();
    }

    if (this.onResetCallback) {
      this.onResetCallback();
    }
  }

  setOnReset(callback) {
    this.onResetCallback = callback;
  }

  onUnlock(type) {
    this.unlockedTypes.add(type);

    const lockedItem = this.toolbar.querySelector(`.toolbar-item[data-type="${type}"]`);
    if (lockedItem) {
      lockedItem.classList.remove('locked');
      const lockIcon = lockedItem.querySelector('.lock-icon');
      if (lockIcon) {
        lockIcon.remove();
      }
    }

    const typeNames = {
      pulsar: '脉冲星',
      blackhole: '黑洞'
    };

    const typeName = typeNames[type] || type;
    document.getElementById('unlock-type-name').textContent = typeName;

    this.showFlashEffect();
    this.showUnlockNotification();
  }

  showFlashEffect() {
    this.flashOverlay.classList.add('active');
    setTimeout(() => {
      this.flashOverlay.classList.remove('active');
    }, 300);
  }

  showUnlockNotification() {
    this.unlockNotification.classList.remove('hidden');

    setTimeout(() => {
      this.unlockNotification.classList.add('show');
    }, 100);

    setTimeout(() => {
      this.unlockNotification.classList.remove('show');
      setTimeout(() => {
        this.unlockNotification.classList.add('hidden');
      }, 500);
    }, 3000);
  }

  handlePlacement() {
    if (!this.selectedBodyType || !this.starSystem) return;

    const camera = this.starSystem.camera;
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);
    const position = camera.position.clone().add(direction.multiplyScalar(15));

    let body = null;
    switch (this.selectedBodyType) {
      case 'star':
        body = this.starSystem.createStar('MAIN_SEQUENCE', position);
        break;
      case 'planet':
        const stars = this.starSystem.bodies.filter(b => b.type === 'star');
        if (stars.length > 0) {
          const parent = stars[Math.floor(Math.random() * stars.length)];
          const orbitalRadius = parent.radius * 4 + Math.random() * 8;
          body = this.starSystem.createPlanet(parent, orbitalRadius);
        } else {
          body = this.starSystem.createStar('MAIN_SEQUENCE', position);
        }
        break;
      case 'ring':
        const planets = this.starSystem.bodies.filter(b => b.type === 'planet');
        if (planets.length > 0) {
          const planet = planets[Math.floor(Math.random() * planets.length)];
          if (!planet.hasRing) {
            this.createRingForPlanet(planet);
            planet.hasRing = true;
          }
        }
        break;
      case 'pulsar':
        body = this.starSystem.createStar('PULSAR', position);
        break;
      case 'blackhole':
        body = this.starSystem.createStar('BLACK_HOLE', position);
        break;
    }

    if (body) {
      const hue = Math.floor(Math.random() * 360);
      body.hue = hue;
      this.showProperties(body);
    }
  }

  setPaused(paused) {
    this.isPaused = paused;
  }

  hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return parseInt(`0x${f(0)}${f(8)}${f(4)}`, 16);
  }

  rgbToHue(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let hue = 0;

    if (max !== min) {
      const delta = max - min;
      if (max === r) {
        hue = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
      } else if (max === g) {
        hue = ((b - r) / delta + 2) * 60;
      } else {
        hue = ((r - g) / delta + 4) * 60;
      }
    }
    return hue;
  }

  createRingForPlanet(planet) {
    const innerRadius = planet.radius * 1.5;
    const outerRadius = planet.radius * 2.5;
    const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
    const material = new THREE.MeshBasicMaterial({
      color: planet.color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6
    });

    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.3;
    planet.mesh.add(ring);
    planet.ring = ring;
  }
}

export default UIHandler;
