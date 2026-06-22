import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'stats-js';
import RockLayerScene from './scene.js';
import WaveformDisplay from './waveform.js';
import UIControls from './controls.js';

class App {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.waveformCanvas = document.getElementById('waveform-canvas');
    
    this.clock = new THREE.Clock();
    this.stats = null;
    this.scene = null;
    this.waveform = null;
    this.controls = null;
    this.uiControls = null;
    this.animationId = null;
    
    this.init();
    this.animate();
  }

  init() {
    this.initStats();
    
    this.scene = new RockLayerScene(this.container);
    this.waveform = new WaveformDisplay(this.waveformCanvas);
    this.uiControls = new UIControls(this.scene, this.waveform);
    
    this.initOrbitControls();
    
    this.scene.onReflection = (data) => {
      this.waveform.addSignal(data);
    };
    
    this.scene.onLayerClick = (layer, point) => {
      console.log(`点击岩层 #${layer.id}，密度: ${layer.density.toFixed(2)}，位置: (${point.x.toFixed(1)}, ${point.y.toFixed(1)})`);
    };
  }

  initStats() {
    this.stats = new Stats();
    this.stats.showPanel(0);
    this.stats.dom.id = 'stats';
    document.body.appendChild(this.stats.dom);
  }

  initOrbitControls() {
    this.controls = new OrbitControls(this.scene.camera, this.scene.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 40;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.3;
    this.controls.minPolarAngle = 0.3;
    this.controls.target.set(0, -2, 0);
    this.controls.enablePan = false;
    
    this.scene.controls = this.controls;
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    this.stats.begin();
    
    const deltaTime = Math.min(this.clock.getDelta(), 0.1);
    
    this.scene.update(deltaTime);
    this.waveform.update();
    
    this.stats.end();
  }

  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    if (this.scene) {
      this.scene.dispose();
    }
    
    if (this.stats && this.stats.dom.parentNode) {
      this.stats.dom.parentNode.removeChild(this.stats.dom);
    }
  }
}

let app = null;

function initApp() {
  if (app) {
    app.dispose();
  }
  app = new App();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

window.addEventListener('beforeunload', () => {
  if (app) {
    app.dispose();
  }
});

export default App;
