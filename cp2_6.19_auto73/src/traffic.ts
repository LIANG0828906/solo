import * as THREE from 'three';

interface TrafficPath {
  curve: THREE.CatmullRomCurve3;
  baseline: THREE.Line;
  trailPoints: THREE.Points;
  headParticles: THREE.Points;
  particleCount: number;
  trailLength: number;
  progress: number;
  speed: number;
}

export class TrafficManager {
  private scene: THREE.Scene;
  private paths: TrafficPath[] = [];
  private readonly pathCount = 5;

  /**
   * 数据流：构造函数接收来自 main.ts 的 scene 引用
   * 用于向场景中添加交通路径线、流动光点和拖尾粒子
   */
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.createTrafficPaths();
  }

  /**
   * 批量创建交通路径，路径数量由 pathCount 决定
   * 每条路径包含：基线（半透明参考线）+ 头部光点 + 拖尾粒子
   */
  private createTrafficPaths(): void {
    for (let i = 0; i < this.pathCount; i++) {
      this.createSinglePath(i);
    }
  }

  /**
   * 创建单条交通路径及其动画粒子系统
   * 数据流：generatePathPoints → CatmullRomCurve3 → 路径几何
   * → Points 粒子系统（头部光点 + 拖尾粒子）
   */
  private createSinglePath(index: number): void {
    const controlPoints = this.generatePathPoints(index);
    const curve = new THREE.CatmullRomCurve3(controlPoints, true, 'catmullrom', 0.5);

    const linePoints = curve.getPoints(200);
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.12,
    });
    const baseline = new THREE.Line(lineGeometry, lineMaterial);
    this.scene.add(baseline);

    const particleCount = 8;
    const trailLength = 25;
    const totalTrailPoints = particleCount * trailLength;

    const trailPositions = new Float32Array(totalTrailPoints * 3);
    const trailColors = new Float32Array(totalTrailPoints * 3);

    for (let i = 0; i < totalTrailPoints; i++) {
      trailPositions[i * 3] = 0;
      trailPositions[i * 3 + 1] = 0.5;
      trailPositions[i * 3 + 2] = 0;

      const trailIndex = i % trailLength;
      const alpha = Math.pow(1 - trailIndex / trailLength, 1.5);

      trailColors[i * 3] = 0.3 * alpha;
      trailColors[i * 3 + 1] = 0.7 * alpha;
      trailColors[i * 3 + 2] = 1.0 * alpha;
    }

    const trailGeometry = new THREE.BufferGeometry();
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trailGeometry.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));

    const trailMaterial = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const trailPoints = new THREE.Points(trailGeometry, trailMaterial);
    this.scene.add(trailPoints);

    const headPositions = new Float32Array(particleCount * 3);
    const headColors = new Float32Array(particleCount * 3);
    const headSizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      headColors[i * 3] = 0.8;
      headColors[i * 3 + 1] = 0.95;
      headColors[i * 3 + 2] = 1.0;
      headSizes[i] = 0.6;
    }

    const headGeometry = new THREE.BufferGeometry();
    headGeometry.setAttribute('position', new THREE.BufferAttribute(headPositions, 3));
    headGeometry.setAttribute('color', new THREE.BufferAttribute(headColors, 3));
    headGeometry.setAttribute('size', new THREE.BufferAttribute(headSizes, 1));

    const headMaterial = new THREE.PointsMaterial({
      size: 0.55,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const headParticles = new THREE.Points(headGeometry, headMaterial);
    this.scene.add(headParticles);

    this.paths.push({
      curve,
      baseline,
      trailPoints,
      headParticles,
      particleCount,
      trailLength,
      progress: Math.random(),
      speed: 0.00008 + Math.random() * 0.00006,
    });
  }

  /**
   * 生成随机但平滑闭合的路径控制点
   * 在建筑群周围的街道区域内生成环绕路径
   */
  private generatePathPoints(index: number): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    const halfArea = 52;
    const segments = 7 + (index % 3);

    const startAngle = (index / this.pathCount) * Math.PI * 2 + Math.random() * 0.3;
    const startRadius = 30 + Math.random() * 15;
    const startX = Math.cos(startAngle) * startRadius;
    const startZ = Math.sin(startAngle) * startRadius;

    points.push(new THREE.Vector3(
      THREE.MathUtils.clamp(startX, -halfArea, halfArea),
      0.5,
      THREE.MathUtils.clamp(startZ, -halfArea, halfArea)
    ));

    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const angleOffset = t * Math.PI * 2 * (0.7 + (index % 3) * 0.15);
      const angle = startAngle + angleOffset;
      const radiusVariation = Math.sin(t * Math.PI * 2 + index) * 12;
      const radius = startRadius + radiusVariation + Math.random() * 8 - 4;
      const x = Math.cos(angle) * radius + Math.random() * 10 - 5;
      const z = Math.sin(angle) * radius + Math.random() * 10 - 5;
      points.push(new THREE.Vector3(
        THREE.MathUtils.clamp(x, -halfArea, halfArea),
        0.5,
        THREE.MathUtils.clamp(z, -halfArea, halfArea)
      ));
    }

    return points;
  }

  /**
   * 数据流：每帧由 main.ts 的 animate 循环调用
   * time: 当前时间戳（用于调试）
   * deltaTime: 帧间隔毫秒数（用于计算光点移动距离，保证不同帧率下速度一致）
   *
   * 更新逻辑：
   * 1. 每条路径有多个光点（particleCount），均匀分布在路径上
   * 2. 每个光点后方拖出 trailLength 个粒子，逐渐淡出
   * 3. progress 匀速递增，模 1 循环，实现不间断运动
   */
  public update(time: number, deltaTime: number): void {
    const clampedDelta = Math.min(deltaTime, 50);

    this.paths.forEach((path) => {
      const trailPositions = path.trailPoints.geometry.attributes.position.array as Float32Array;
      const headPositions = path.headParticles.geometry.attributes.position.array as Float32Array;

      for (let i = 0; i < path.particleCount; i++) {
        const particleOffset = i / path.particleCount;

        for (let t = 0; t < path.trailLength; t++) {
          const trailStep = t * 0.004;
          const progress = (path.progress + particleOffset - trailStep + 1) % 1;
          const point = path.curve.getPointAt(progress);

          const idx = (i * path.trailLength + t) * 3;
          trailPositions[idx] = point.x;
          trailPositions[idx + 1] = point.y;
          trailPositions[idx + 2] = point.z;
        }

        const headProgress = (path.progress + particleOffset + 1) % 1;
        const headPoint = path.curve.getPointAt(headProgress);
        headPositions[i * 3] = headPoint.x;
        headPositions[i * 3 + 1] = headPoint.y;
        headPositions[i * 3 + 2] = headPoint.z;
      }

      path.progress = (path.progress + path.speed * clampedDelta) % 1;
      if (path.progress < 0) path.progress += 1;

      path.trailPoints.geometry.attributes.position.needsUpdate = true;
      path.headParticles.geometry.attributes.position.needsUpdate = true;
    });
  }
}
