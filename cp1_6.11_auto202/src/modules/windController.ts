import * as THREE from 'three';

export class WindController {
  public speed: number = 0.3;
  public angle: number = 0;
  public vector: THREE.Vector3 = new THREE.Vector3(0.3, 0.1, 0);

  private arrowHelper: THREE.ArrowHelper;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    const dir = new THREE.Vector3(1, 0, 0).normalize();
    const origin = new THREE.Vector3(-12, 3, -12);
    const length = 1.5;
    const color = 0xff3333;

    this.arrowHelper = new THREE.ArrowHelper(dir, origin, length, color, 0.3, 0.15);
    this.scene.add(this.arrowHelper);

    this.updateVector();
    this.setupUI();
  }

  private updateVector(): void {
    const rad = (this.angle * Math.PI) / 180;
    this.vector.set(
      this.speed * Math.cos(rad),
      0.1,
      this.speed * Math.sin(rad)
    );

    const dir = this.vector.clone().normalize();
    dir.y = 0;
    if (dir.length() > 0) {
      dir.normalize();
    } else {
      dir.set(1, 0, 0);
    }
    this.arrowHelper.setDirection(dir);
    this.arrowHelper.setLength(Math.max(0.5, Math.abs(this.speed) * 2 + 0.5), 0.3, 0.15);
  }

  private setupUI(): void {
    const speedSlider = document.getElementById('wind-speed') as HTMLInputElement;
    const angleSlider = document.getElementById('wind-angle') as HTMLInputElement;
    const speedVal = document.getElementById('wind-speed-val');
    const angleVal = document.getElementById('wind-angle-val');

    if (speedSlider) {
      speedSlider.addEventListener('input', () => {
        this.speed = parseFloat(speedSlider.value);
        this.updateVector();
        if (speedVal) speedVal.textContent = this.speed.toFixed(2);
      });
    }

    if (angleSlider) {
      angleSlider.addEventListener('input', () => {
        this.angle = parseFloat(angleSlider.value);
        this.updateVector();
        if (angleVal) angleVal.textContent = this.angle + '°';
      });
    }

    const panelToggle = document.getElementById('panel-toggle');
    const controlPanel = document.getElementById('control-panel');
    if (panelToggle && controlPanel) {
      panelToggle.addEventListener('click', () => {
        controlPanel.classList.toggle('show');
      });
    }
  }

  getWindVector(): THREE.Vector3 {
    return this.vector.clone();
  }
}
