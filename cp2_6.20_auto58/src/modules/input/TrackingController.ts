import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';

/**
 * TrackingController
 * ------------------------------------------------------------------
 * 职责：监听 DOM 上的鼠标/触摸输入，将屏幕坐标映射为 3D 目标点，
 *       应用平滑阻尼跟随，并检测驻留（dwell）事件。
 *
 * 数据流：
 *   DOM 事件 (mousemove/touchmove)
 *     → normalizeScreenCoords()  [-1..1]
 *     → mapTo3DPlane()           [x:[-8,8], y:[-5,5], z:0]
 *     → this.rawTargetPos        (原始瞬时目标点)
 *     → update(dt) 每帧阻尼积分
 *     → this.smoothedTargetPos   (平滑后目标点)
 *     → store.pushTargetPosition (写入历史)
 *     → 驻留检测 (距离 < 0.3 持续 1.5s → dwellTriggered = true)
 */
export class TrackingController {
  // 原始目标点（直接由输入事件映射得到，无平滑）
  private rawTargetPos: THREE.Vector3;

  // 平滑后的目标点（供外部系统使用）
  private smoothedTargetPos: THREE.Vector3;

  // 驻留检测用：记录上一帧的目标位置
  private lastTargetPos: THREE.Vector3;

  // 驻留持续时间计时器（单位：秒）
  private dwellTimer: number;

  // 屏幕坐标映射到 3D 平面的范围
  private readonly PLANE_X_RANGE = 8;
  private readonly PLANE_Y_RANGE = 5;
  private readonly PLANE_Z = 0;

  // 驻留检测阈值
  private readonly DWELL_DISTANCE_THRESHOLD = 0.3;
  private readonly DWELL_TIME_THRESHOLD = 1.5;

  // 外部可读取的驻留状态
  public dwellTriggered: boolean;
  public dwellPosition: THREE.Vector3 | null;

  // 事件监听 DOM 元素引用
  private domElement: HTMLElement | null;

  // 绑定后的事件处理器引用（用于卸载）
  private boundMouseMoveHandler: ((e: MouseEvent) => void) | null;
  private boundTouchMoveHandler: ((e: TouchEvent) => void) | null;

  constructor() {
    // 初始位置：屏幕中心对应的 3D 坐标 (0, 0, 0)
    this.rawTargetPos = new THREE.Vector3(0, 0, this.PLANE_Z);
    this.smoothedTargetPos = new THREE.Vector3(0, 0, this.PLANE_Z);
    this.lastTargetPos = new THREE.Vector3(0, 0, this.PLANE_Z);

    this.dwellTimer = 0;
    this.dwellTriggered = false;
    this.dwellPosition = null;

    this.domElement = null;
    this.boundMouseMoveHandler = null;
    this.boundTouchMoveHandler = null;
  }

  /**
   * 绑定 DOM 元素并开始监听输入事件
   * @param element 要监听的 DOM 元素（通常是 canvas 或其容器）
   */
  public attach(element: HTMLElement): void {
    this.domElement = element;

    this.boundMouseMoveHandler = this.handleMouseMove.bind(this);
    this.boundTouchMoveHandler = this.handleTouchMove.bind(this);

    element.addEventListener('mousemove', this.boundMouseMoveHandler);
    element.addEventListener('touchmove', this.boundTouchMoveHandler, { passive: true });
  }

  /**
   * 解绑 DOM 元素并移除事件监听
   */
  public detach(): void {
    if (!this.domElement) return;

    if (this.boundMouseMoveHandler) {
      this.domElement.removeEventListener('mousemove', this.boundMouseMoveHandler);
    }
    if (this.boundTouchMoveHandler) {
      this.domElement.removeEventListener('touchmove', this.boundTouchMoveHandler);
    }

    this.domElement = null;
    this.boundMouseMoveHandler = null;
    this.boundTouchMoveHandler = null;
  }

  /**
   * 获取当前平滑后的目标位置
   * @returns 平滑后的 THREE.Vector3（注意：返回内部引用以减少 GC，如需修改请 clone）
   */
  public getTargetPosition(): THREE.Vector3 {
    return this.smoothedTargetPos;
  }

  /**
   * 重置驻留标志（外部消费完 dwell 事件后调用）
   */
  public resetDwell(): void {
    this.dwellTriggered = false;
    this.dwellPosition = null;
  }

  /**
   * 每帧更新：执行平滑阻尼积分、驻留检测、写入位置历史
   * @param dt 距上一帧的时间增量（秒）
   */
  public update(dt: number): void {
    // 从 store 读取平滑因子 (1..10)
    // 数值越大 → 阻尼越强 → 跟随越慢
    const smoothness = useAppStore.getState().smoothness;

    // 将 1..10 映射到合理的插值系数 t ∈ (0, 1]
    // smoothness=1  → t≈0.9  (跟随极快，几乎无滞后)
    // smoothness=10 → t≈0.05 (跟随极慢，强阻尼)
    const t = 1 / (smoothness * 2);

    // 指数平滑：smoothed = lerp(smoothed, raw, t)
    this.smoothedTargetPos.lerp(this.rawTargetPos, t);

    // ---- 驻留检测 ----
    // 计算当前平滑位置与上一帧位置的距离
    const distance = this.smoothedTargetPos.distanceTo(this.lastTargetPos);

    if (distance < this.DWELL_DISTANCE_THRESHOLD) {
      // 位置基本未变 → 累加计时
      this.dwellTimer += dt;

      if (this.dwellTimer >= this.DWELL_TIME_THRESHOLD && !this.dwellTriggered) {
        // 达到驻留阈值 → 触发 dwell 事件
        this.dwellTriggered = true;
        this.dwellPosition = this.smoothedTargetPos.clone();
      }
    } else {
      // 位置发生明显变化 → 重置计时
      this.dwellTimer = 0;
    }

    // 更新 lastTargetPos 供下一帧比较
    this.lastTargetPos.copy(this.smoothedTargetPos);

    // ---- 写入位置历史到 store ----
    useAppStore.getState().pushTargetPosition({
      x: this.smoothedTargetPos.x,
      y: this.smoothedTargetPos.y,
      z: this.smoothedTargetPos.z,
    });
  }

  // ============================================================
  // 私有方法：输入事件处理与坐标映射
  // ============================================================

  /**
   * 鼠标移动事件处理器
   */
  private handleMouseMove(e: MouseEvent): void {
    if (!this.domElement) return;

    const rect = this.domElement.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    this.updateRawTargetFromScreen(screenX, screenY, rect.width, rect.height);
  }

  /**
   * 触摸移动事件处理器（取第一个触点）
   */
  private handleTouchMove(e: TouchEvent): void {
    if (!this.domElement || e.touches.length === 0) return;

    const touch = e.touches[0];
    const rect = this.domElement.getBoundingClientRect();
    const screenX = touch.clientX - rect.left;
    const screenY = touch.clientY - rect.top;

    this.updateRawTargetFromScreen(screenX, screenY, rect.width, rect.height);
  }

  /**
   * 将屏幕像素坐标归一化并映射到 3D 平面
   * 归一化范围：x ∈ [-1, 1], y ∈ [-1, 1]（y 轴翻转：屏幕上方 = +y）
   * 3D 范围：x ∈ [-8, 8], y ∈ [-5, 5], z = 0
   */
  private updateRawTargetFromScreen(
    screenX: number,
    screenY: number,
    width: number,
    height: number
  ): void {
    // 防止除零
    if (width === 0 || height === 0) return;

    // 归一化到 [-1, 1]
    const normalizedX = (screenX / width) * 2 - 1;
    const normalizedY = -((screenY / height) * 2 - 1);

    // 映射到 3D 平面范围
    this.rawTargetPos.set(
      normalizedX * this.PLANE_X_RANGE,
      normalizedY * this.PLANE_Y_RANGE,
      this.PLANE_Z
    );
  }
}
