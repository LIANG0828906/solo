import * as THREE from 'three';
import { ProductModel, MaterialType } from './ProductModel';
import { SceneManager } from './SceneManager';

export class UIController {
  private sceneManager: SceneManager;
  private productModel: ProductModel;
  private container: HTMLElement;
  private camera: THREE.PerspectiveCamera;

  private isDragging: boolean = false;
  private previousMouseX: number = 0;
  private previousMouseY: number = 0;
  private targetRotationX: number = 0;
  private targetRotationY: number = 0;
  private currentRotationX: number = 0;
  private currentRotationY: number = 0;

  private autoRotateBtn: HTMLElement | null = null;
  private materialBtns: NodeListOf<HTMLElement> | null = null;
  private colorPicker: HTMLInputElement | null = null;
  private colorPickerWrapper: HTMLElement | null = null;
  private colorValue: HTMLElement | null = null;

  private normalizedMouseX: number = 0;
  private normalizedMouseY: number = 0;

  private minDistance: number = 4;
  private maxDistance: number = 40;

  constructor(sceneManager: SceneManager, productModel: ProductModel, containerId: string) {
    this.sceneManager = sceneManager;
    this.productModel = productModel;
    this.camera = sceneManager.getCamera();
    
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }
    this.container = container;

    this.cacheElements();
    this.bindEvents();
    this.updateUI();
  }

  private cacheElements(): void {
    this.autoRotateBtn = document.getElementById('auto-rotate-btn');
    this.materialBtns = document.querySelectorAll('.material-btn');
    this.colorPicker = document.getElementById('color-picker') as HTMLInputElement;
    this.colorPickerWrapper = document.querySelector('.color-picker-wrapper');
    this.colorValue = document.querySelector('.color-value');
  }

  private bindEvents(): void {
    this.container.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.container.addEventListener('wheel', this.onWheel.bind(this), { passive: false });

    this.container.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    this.container.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    this.container.addEventListener('touchend', this.onTouchEnd.bind(this));

    if (this.autoRotateBtn) {
      this.autoRotateBtn.addEventListener('click', this.onAutoRotateToggle.bind(this));
    }

    if (this.materialBtns) {
      this.materialBtns.forEach(btn => {
        btn.addEventListener('click', (e) => this.onMaterialChange(e));
      });
    }

    if (this.colorPicker) {
      this.colorPicker.addEventListener('input', this.onColorChange.bind(this));
      this.colorPicker.addEventListener('change', this.onColorChange.bind(this));
    }
  }

  private onMouseDown(event: MouseEvent): void {
    if ((event.target as HTMLElement).closest('.control-panel')) return;
    
    this.isDragging = true;
    this.previousMouseX = event.clientX;
    this.previousMouseY = event.clientY;
    this.container.style.cursor = 'grabbing';
  }

  private onMouseMove(event: MouseEvent): void {
    const rect = this.container.getBoundingClientRect();
    this.normalizedMouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.normalizedMouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.sceneManager.updateLightPosition(this.normalizedMouseX, this.normalizedMouseY);
    this.productModel.handleHover(this.normalizedMouseX, this.normalizedMouseY, this.camera);

    if (this.isDragging) {
      const deltaX = event.clientX - this.previousMouseX;
      const deltaY = event.clientY - this.previousMouseY;

      this.targetRotationY += deltaX * 0.01;
      this.targetRotationX += deltaY * 0.01;

      this.targetRotationX = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.targetRotationX));

      this.previousMouseX = event.clientX;
      this.previousMouseY = event.clientY;
    }
  }

  private onMouseUp(): void {
    this.isDragging = false;
    this.container.style.cursor = 'grab';
  }

  private onWheel(event: WheelEvent): void {
    event.preventDefault();
    
    const currentDistance = this.camera.position.length();
    let newDistance = currentDistance + event.deltaY * 0.01;
    newDistance = Math.max(this.minDistance, Math.min(this.maxDistance, newDistance));
    
    const direction = this.camera.position.clone().normalize();
    this.camera.position.copy(direction.multiplyScalar(newDistance));
  }

  private onTouchStart(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length === 1) {
      this.isDragging = true;
      this.previousMouseX = event.touches[0].clientX;
      this.previousMouseY = event.touches[0].clientY;
    }
  }

  private onTouchMove(event: TouchEvent): void {
    event.preventDefault();
    
    if (event.touches.length === 1 && this.isDragging) {
      const touch = event.touches[0];
      const deltaX = touch.clientX - this.previousMouseX;
      const deltaY = touch.clientY - this.previousMouseY;

      this.targetRotationY += deltaX * 0.01;
      this.targetRotationX += deltaY * 0.01;
      this.targetRotationX = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.targetRotationX));

      this.previousMouseX = touch.clientX;
      this.previousMouseY = touch.clientY;

      const rect = this.container.getBoundingClientRect();
      this.normalizedMouseX = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
      this.normalizedMouseY = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

      this.sceneManager.updateLightPosition(this.normalizedMouseX, this.normalizedMouseY);
      this.productModel.handleHover(this.normalizedMouseX, this.normalizedMouseY, this.camera);
    } else if (event.touches.length === 2) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if ((event as TouchEvent & { _lastPinchDistance?: number })._lastPinchDistance !== undefined) {
        const delta = (event as TouchEvent & { _lastPinchDistance: number })._lastPinchDistance - distance;
        const currentDistance = this.camera.position.length();
        let newDistance = currentDistance + delta * 0.05;
        newDistance = Math.max(this.minDistance, Math.min(this.maxDistance, newDistance));
        
        const direction = this.camera.position.clone().normalize();
        this.camera.position.copy(direction.multiplyScalar(newDistance));
      }
      (event as TouchEvent & { _lastPinchDistance?: number })._lastPinchDistance = distance;
    }
  }

  private onTouchEnd(event: TouchEvent): void {
    this.isDragging = false;
    (event as TouchEvent & { _lastPinchDistance?: number })._lastPinchDistance = undefined;
  }

  private onAutoRotateToggle(): void {
    const newState = !this.productModel.getAutoRotation();
    this.productModel.setAutoRotation(newState);
    
    if (this.autoRotateBtn) {
      const toggleText = this.autoRotateBtn.querySelector('.toggle-text');
      if (toggleText) {
        toggleText.textContent = newState ? '开启' : '关闭';
      }
      
      if (newState) {
        this.autoRotateBtn.classList.add('active');
      } else {
        this.autoRotateBtn.classList.remove('active');
      }

      this.autoRotateBtn.classList.remove('click-bounce');
      void this.autoRotateBtn.offsetWidth;
      this.autoRotateBtn.classList.add('click-bounce');
    }
  }

  private onMaterialChange(event: Event): void {
    const target = event.currentTarget as HTMLElement;
    const materialType = target.dataset.material as MaterialType;
    
    if (!materialType) return;
    
    this.productModel.setMaterial(materialType);
    
    if (this.materialBtns) {
      this.materialBtns.forEach(btn => {
        btn.classList.remove('active');
      });
    }
    target.classList.add('active');

    target.classList.remove('click-bounce');
    void target.offsetWidth;
    target.classList.add('click-bounce');
  }

  private onColorChange(): void {
    if (!this.colorPicker) return;
    
    const color = this.colorPicker.value;
    this.productModel.setColor(color);
    
    if (this.colorValue) {
      this.colorValue.textContent = color.toUpperCase();
    }
    
    if (this.colorPickerWrapper) {
      this.colorPickerWrapper.classList.remove('pulse', 'flash');
      void this.colorPickerWrapper.offsetWidth;
      this.colorPickerWrapper.classList.add('flash');
      
      const wrapper = this.colorPickerWrapper;
      setTimeout(() => {
        wrapper.classList.remove('flash');
        void wrapper.offsetWidth;
        wrapper.classList.add('pulse');
      }, 300);
    }
  }

  public update(deltaTime: number): void {
    if (Math.abs(this.currentRotationX - this.targetRotationX) > 0.001 ||
        Math.abs(this.currentRotationY - this.targetRotationY) > 0.001) {
      
      this.currentRotationX += (this.targetRotationX - this.currentRotationX) * 10 * deltaTime;
      this.currentRotationY += (this.targetRotationY - this.currentRotationY) * 10 * deltaTime;

      const group = this.productModel.getGroup();
      if (!this.productModel.getAutoRotation()) {
        group.rotation.y = this.currentRotationY;
      }
      group.rotation.x = this.currentRotationX;
    }

    this.camera.lookAt(0, 0, 0);
  }

  private updateUI(): void {
    this.container.style.cursor = 'grab';
    if (this.colorPickerWrapper) {
      this.colorPickerWrapper.classList.add('pulse');
    }
  }
}
