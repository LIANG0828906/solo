import * as THREE from 'three';

export class LightManager {
  private scene: THREE.Scene;
  public directionalLight!: THREE.DirectionalLight;
  private ambientLight!: THREE.AmbientLight;
  private hemisphereLight!: THREE.HemisphereLight;
  private sunMesh!: THREE.Mesh;
  private sunGlow!: THREE.Mesh;

  private readonly sunOrbitRadius: number = 80;
  private readonly centerOffset: number = 0;
  private sceneBounds: { minX: number; maxX: number; minZ: number; maxZ: number; maxHeight: number };

  /**
   * 数据流：构造函数接收来自 main.ts 的 scene 引用
   * sceneBounds 由 BuildingManager 提供的建筑群包围盒数据
   * 用于动态计算阴影相机的视锥体范围
   */
  constructor(
    scene: THREE.Scene,
    sceneBounds: { minX: number; maxX: number; minZ: number; maxZ: number; maxHeight: number }
  ) {
    this.scene = scene;
    this.sceneBounds = sceneBounds;
    this.createSunVisual();
    this.initLights();
  }

  /**
   * 初始化各类光源并设置阴影参数
   * 数据流：使用 sceneBounds 动态计算 shadow.camera 的 left/right/top/bottom
   * 确保所有建筑都在阴影相机视锥体内，避免阴影被裁剪
   */
  private initLights(): void {
    this.ambientLight = new THREE.AmbientLight(0x404060, 0.4);
    this.scene.add(this.ambientLight);

    this.hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x362d26, 0.4);
    this.scene.add(this.hemisphereLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    this.directionalLight.castShadow = true;

    this.directionalLight.shadow.mapSize.set(2048, 2048);
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 300;
    this.directionalLight.shadow.bias = -0.0005;
    this.directionalLight.shadow.normalBias = 0.02;
    this.directionalLight.shadow.radius = 4;
    this.directionalLight.shadow.blurSamples = 8;

    this.updateShadowCameraBounds();

    this.scene.add(this.directionalLight);
    this.scene.add(this.directionalLight.target);
    this.updateSunPosition(12);
  }

  /**
   * 根据建筑群包围盒动态计算阴影相机的视锥体参数
   * 预留 1.5 倍边距确保太阳在极端角度下仍能正确投射阴影
   * 数据流：BuildingManager.getSceneBounds() → LightManager.sceneBounds → shadow.camera
   */
  private updateShadowCameraBounds(): void {
    const margin = 1.5;
    const width = Math.max(
      Math.abs(this.sceneBounds.minX),
      Math.abs(this.sceneBounds.maxX)
    ) * margin;
    const depth = Math.max(
      Math.abs(this.sceneBounds.minZ),
      Math.abs(this.sceneBounds.maxZ)
    ) * margin;
    const extent = Math.max(width, depth);

    this.directionalLight.shadow.camera.left = -extent;
    this.directionalLight.shadow.camera.right = extent;
    this.directionalLight.shadow.camera.top = extent;
    this.directionalLight.shadow.camera.bottom = -extent;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = this.sunOrbitRadius * 2 + this.sceneBounds.maxHeight * 2;

    this.directionalLight.shadow.camera.updateProjectionMatrix();
  }

  private createSunVisual(): void {
    const sunGeometry = new THREE.SphereGeometry(2.5, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: 0xffdd00,
    });
    this.sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    this.scene.add(this.sunMesh);

    const glowGeometry = new THREE.SphereGeometry(5, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.3,
    });
    this.sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.scene.add(this.sunGlow);
  }

  /**
   * 数据流：接收来自 UI 模块（经 main.ts 传递）的时间值（6~18小时）
   * 计算太阳在半圆弧上的位置 → 更新 DirectionalLight 位置和颜色
   * → 更新阴影相机 → 触发 renderer 下一帧重绘
   */
  public updateSunPosition(hours: number): void {
    const t = (hours - 6) / 12;
    const clampedT = Math.max(0, Math.min(1, t));
    const angle = Math.PI * clampedT;

    const x = this.sunOrbitRadius * Math.cos(angle) + this.centerOffset;
    const y = this.sunOrbitRadius * Math.sin(angle);
    const z = this.centerOffset;

    this.directionalLight.position.set(x, y, z);
    this.directionalLight.target.position.set(this.centerOffset, 0, this.centerOffset);
    this.directionalLight.target.updateMatrixWorld();

    this.sunMesh.position.set(x, y, z);
    this.sunGlow.position.set(x, y, z);

    this.updateLightingByTime(hours, clampedT);
  }

  private updateLightingByTime(hours: number, t: number): void {
    const sunHeight = Math.sin(Math.PI * t);
    const intensity = 0.3 + sunHeight * 0.9;
    this.directionalLight.intensity = intensity;

    let sunColor: THREE.Color;
    if (hours < 8) {
      sunColor = new THREE.Color(0xff8844).lerp(new THREE.Color(0xffdd88), (hours - 6) / 2);
    } else if (hours < 16) {
      sunColor = new THREE.Color(0xffdd88).lerp(new THREE.Color(0xffffff), Math.min(1, (hours - 8) / 4));
      sunColor.lerp(new THREE.Color(0xffdd88), Math.max(0, (hours - 12) / 4));
    } else {
      sunColor = new THREE.Color(0xffdd88).lerp(new THREE.Color(0xff6644), (hours - 16) / 2);
    }
    this.directionalLight.color.copy(sunColor);

    (this.sunMesh.material as THREE.MeshBasicMaterial).color.copy(sunColor);
    (this.sunGlow.material as THREE.MeshBasicMaterial).color.copy(sunColor);
    (this.sunGlow.material as THREE.MeshBasicMaterial).opacity = 0.2 + sunHeight * 0.3;

    const ambientIntensity = 0.2 + sunHeight * 0.35;
    this.ambientLight.intensity = ambientIntensity;
    this.hemisphereLight.intensity = 0.2 + sunHeight * 0.4;

    const skyColor = this.getSkyColor(hours, sunHeight);
    this.hemisphereLight.color.copy(skyColor);
  }

  private getSkyColor(hours: number, sunHeight: number): THREE.Color {
    if (hours < 7 || hours > 17) {
      return new THREE.Color(0xff7744);
    } else if (hours < 9 || hours > 15) {
      return new THREE.Color(0xffaa66);
    } else {
      return new THREE.Color(0x87ceeb);
    }
  }

  public getDirectionalLight(): THREE.DirectionalLight {
    return this.directionalLight;
  }

  /**
   * 数据流：支持外部动态更新场景包围盒（如建筑数量变化时）
   * main.ts → LightManager.updateSceneBounds() → 重新计算阴影相机
   */
  public updateSceneBounds(
    bounds: { minX: number; maxX: number; minZ: number; maxZ: number; maxHeight: number }
  ): void {
    this.sceneBounds = bounds;
    this.updateShadowCameraBounds();
  }
}
