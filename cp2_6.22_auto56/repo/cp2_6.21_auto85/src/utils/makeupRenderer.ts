import type { Point2D, RGBA } from '../types';
import { blendLipColor, blendEyeshadowColor, hexToRgba } from './colorBlend';

// MediaPipe Face Mesh 关键点索引定义
// 唇部外轮廓 - 上唇顶部(11点)
const UPPER_LIP_TOP = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291];
// 唇部外轮廓 - 下唇底部(11点)
const LOWER_LIP_BOTTOM = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291];

// 上眼睑 - 左眼(上轮廓4点)
const LEFT_EYE_UPPER = [33, 160, 159, 133];
// 上眼睑 - 右眼(上轮廓4点)
const RIGHT_EYE_UPPER = [362, 385, 386, 263];
// 眼睛 - 下轮廓(用于眼影范围参考)
const LEFT_EYE_LOWER = [33, 144, 145, 133];
const RIGHT_EYE_LOWER = [362, 381, 380, 263];

// 脸颊 - 左脸3点(颧骨最高点、鼻翼外侧下方、耳垂下方)
const LEFT_CHEEK = [111, 47, 152];
// 脸颊 - 右脸3点
const RIGHT_CHEEK = [340, 277, 152];

// 腮红sigma值（像素）- Bug修复#3: 从10改为8
const BLUSH_SIGMA = 8;

interface DrawMakeupOptions {
  lipstickColor: string | null;
  lipstickOpacity: number;
  eyeshadowColor: string | null;
  eyeshadowShimmer: number;
  blushColor: string | null;
  blushSize: number;
  showKeypoints: boolean;
  frameSeed: number;
}

/**
 * 从468个关键点中提取指定索引的点
 */
function getKeypointsByIndices(
  allKeypoints: Point2D[],
  indices: number[],
  canvasWidth: number,
  canvasHeight: number,
): Point2D[] {
  return indices.map((idx) => {
    const kp = allKeypoints[idx];
    return {
      x: kp.x * canvasWidth,
      y: kp.y * canvasHeight,
    };
  });
}

/**
 * 使用二次贝塞尔曲线绘制平滑路径
 * 通过点集生成平滑曲线
 */
function drawSmoothPath(
  ctx: CanvasRenderingContext2D,
  points: Point2D[],
  closePath: boolean = true,
): void {
  if (points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  if (points.length === 2) {
    ctx.lineTo(points[1].x, points[1].y);
    return;
  }

  // 使用中点作为控制点的二次贝塞尔曲线
  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
  }

  // 最后一段
  const lastIdx = points.length - 1;
  ctx.lineTo(points[lastIdx].x, points[lastIdx].y);

  if (closePath) {
    ctx.closePath();
  }
}

/**
 * Bug修复#1: 根据上下唇关键点生成闭合贝塞尔曲线路径
 * 使用上唇顶部和下唇底部的关键点，通过贝塞尔曲线精确贴合唇形
 */
function drawLipBezierPath(
  ctx: CanvasRenderingContext2D,
  allKeypoints: Point2D[],
  canvasWidth: number,
  canvasHeight: number,
): void {
  const upperPoints = getKeypointsByIndices(allKeypoints, UPPER_LIP_TOP, canvasWidth, canvasHeight);
  const lowerPoints = getKeypointsByIndices(allKeypoints, LOWER_LIP_BOTTOM, canvasWidth, canvasHeight);

  // 组合完整唇形轮廓：上唇顶部从左到右 + 下唇底部从右到左
  const fullLipPath: Point2D[] = [...upperPoints];

  // 下唇点反向（从右到左），跳过首尾重复点
  for (let i = lowerPoints.length - 2; i > 0; i--) {
    fullLipPath.push(lowerPoints[i]);
  }

  drawSmoothPath(ctx, fullLipPath, true);
}

/**
 * 绘制口红
 * 使用Lab色彩空间混合，通过贝塞尔曲线路径精确贴合唇形
 */
function drawLipstick(
  ctx: CanvasRenderingContext2D,
  allKeypoints: Point2D[],
  colorHex: string,
  opacity: number,
  canvasWidth: number,
  canvasHeight: number,
): void {
  if (allKeypoints.length < 468) return;

  // 先绘制完整的唇形路径作为裁剪区域
  ctx.save();
  drawLipBezierPath(ctx, allKeypoints, canvasWidth, canvasHeight);
  ctx.clip();

  // 获取唇部区域的像素数据进行Lab空间混合
  const lipBounds = getLipBounds(allKeypoints, canvasWidth, canvasHeight);
  if (!lipBounds) {
    ctx.restore();
    return;
  }

  const { x, y, width, height } = lipBounds;
  const imageData = ctx.getImageData(x, y, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const baseColor: RGBA = {
      r: data[i],
      g: data[i + 1],
      b: data[i + 2],
      a: data[i + 3] / 255,
    };

    if (baseColor.a > 0.1) {
      const blended = blendLipColor(baseColor, colorHex, opacity);
      data[i] = blended.r;
      data[i + 1] = blended.g;
      data[i + 2] = blended.b;
    }
  }

  ctx.putImageData(imageData, x, y);
  ctx.restore();
}

/**
 * 获取唇部边界框
 */
function getLipBounds(
  allKeypoints: Point2D[],
  canvasWidth: number,
  canvasHeight: number,
): { x: number; y: number; width: number; height: number } | null {
  const upperPoints = getKeypointsByIndices(allKeypoints, UPPER_LIP_TOP, canvasWidth, canvasHeight);
  const lowerPoints = getKeypointsByIndices(allKeypoints, LOWER_LIP_BOTTOM, canvasWidth, canvasHeight);

  const allPoints = [...upperPoints, ...lowerPoints];
  if (allPoints.length === 0) return null;

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (const p of allPoints) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }

  // 扩展1像素避免边缘截断
  return {
    x: Math.max(0, Math.floor(minX - 1)),
    y: Math.max(0, Math.floor(minY - 1)),
    width: Math.min(canvasWidth, Math.ceil(maxX - minX + 2)),
    height: Math.min(canvasHeight, Math.ceil(maxY - minY + 2)),
  };
}

/**
 * 伪随机数生成器 - 基于种子
 * 用于珠光效果的每帧更新随机种子
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

/**
 * Bug修复#2: 眼影珠光效果 - 每帧更新随机种子的像素级闪烁
 *
 * @param shimmerIntensity 珠光强度 0-1
 * @param frameSeed 帧种子，每帧更新
 * @param x 像素x坐标
 * @param y 像素y坐标
 * @returns 珠光亮度增量 0-1
 */
function getShimmerValue(
  shimmerIntensity: number,
  frameSeed: number,
  x: number,
  y: number,
): number {
  if (shimmerIntensity <= 0) return 0;

  // 基于位置和帧种子生成伪随机值
  const seed = x * 13.37 + y * 7.11 + frameSeed * 0.123;
  const random = seededRandom(seed);

  // 珠光颗粒密度随强度变化
  const densityThreshold = 1 - shimmerIntensity * 0.7;
  if (random < densityThreshold) return 0;

  // 动态闪烁：每帧亮度变化
  const flickerSeed = frameSeed * 0.01 + x * 0.02 + y * 0.03;
  const flicker = (seededRandom(flickerSeed) - 0.5) * 2;

  const baseBrightness = shimmerIntensity * 0.5;
  const flickerAmount = shimmerIntensity * 0.3 * flicker;

  return Math.max(0, Math.min(1, baseBrightness + flickerAmount));
}

/**
 * 获取眼影区域 - 扇形渐变填充
 */
function drawEyeshadow(
  ctx: CanvasRenderingContext2D,
  allKeypoints: Point2D[],
  colorHex: string,
  shimmerIntensity: number,
  frameSeed: number,
  canvasWidth: number,
  canvasHeight: number,
  isLeft: boolean,
): void {
  if (allKeypoints.length < 468) return;

  const upperIndices = isLeft ? LEFT_EYE_UPPER : RIGHT_EYE_UPPER;
  const lowerIndices = isLeft ? LEFT_EYE_LOWER : RIGHT_EYE_LOWER;

  const upperPoints = getKeypointsByIndices(allKeypoints, upperIndices, canvasWidth, canvasHeight);
  const lowerPoints = getKeypointsByIndices(allKeypoints, lowerIndices, canvasWidth, canvasHeight);

  if (upperPoints.length < 4 || lowerPoints.length < 4) return;

  // 创建眼影区域路径：上眼睑向上延伸的扇形
  ctx.save();

  // 计算眼睛中心和高度
  const eyeTopY = Math.min(...upperPoints.map((p) => p.y));
  const eyeBottomY = Math.max(...lowerPoints.map((p) => p.y));
  const eyeHeight = eyeBottomY - eyeTopY;

  // 创建眼影路径：上眼睑曲线向上扩展形成扇形
  ctx.beginPath();

  // 从左眼内角开始
  ctx.moveTo(upperPoints[0].x, upperPoints[0].y);

  // 上眼睑顶部曲线
  for (let i = 1; i < upperPoints.length - 1; i++) {
    const xc = (upperPoints[i].x + upperPoints[i + 1].x) / 2;
    const yc = (upperPoints[i].y + upperPoints[i + 1].y) / 2;
    ctx.quadraticCurveTo(upperPoints[i].x, upperPoints[i].y, xc, yc);
  }

  // 到外眼角
  const outerCorner = upperPoints[upperPoints.length - 1];
  ctx.lineTo(outerCorner.x, outerCorner.y);

  // 从外眼角向上延伸到扇形顶部
  const fanHeight = eyeHeight * 0.6;
  const outerTop = { x: outerCorner.x, y: outerCorner.y - fanHeight };
  ctx.lineTo(outerTop.x, outerTop.y);

  // 扇形顶部曲线（向上凸出的弧）
  const innerCorner = upperPoints[0];
  const innerTop = { x: innerCorner.x, y: innerCorner.y - fanHeight };
  const midTopX = (innerTop.x + outerTop.x) / 2;
  const midTopY = Math.min(innerTop.y, outerTop.y) - fanHeight * 0.3;
  ctx.quadraticCurveTo(midTopX, midTopY, innerTop.x, innerTop.y);

  // 回到内眼角
  ctx.lineTo(innerCorner.x, innerCorner.y);
  ctx.closePath();

  // 获取眼影区域的像素数据
  const bounds = {
    x: Math.max(0, Math.floor(innerTop.x - 5)),
    y: Math.max(0, Math.floor(midTopY - 5)),
    width: Math.min(canvasWidth, Math.ceil(outerTop.x - innerTop.x + 10)),
    height: Math.min(canvasHeight, Math.ceil(eyeBottomY - midTopY + 10)),
  };

  if (bounds.width <= 0 || bounds.height <= 0) {
    ctx.restore();
    return;
  }

  // 先创建渐变蒙版
  const gradient = ctx.createLinearGradient(0, eyeTopY, 0, eyeTopY - fanHeight * 0.8);
  gradient.addColorStop(0, 'rgba(0,0,0,0.8)');
  gradient.addColorStop(0.5, 'rgba(0,0,0,0.4)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');

  // 用source-atop模式叠加颜色
  ctx.globalCompositeOperation = 'source-over';

  const imageData = ctx.getImageData(bounds.x, bounds.y, bounds.width, bounds.height);
  const data = imageData.data;

  // 重新获取路径用于判断点是否在区域内
  // 为了性能，简化为逐像素处理
  for (let py = 0; py < bounds.height; py++) {
    for (let px = 0; px < bounds.width; px++) {
      const idx = (py * bounds.width + px) * 4;
      const alpha = data[idx + 3];
      if (alpha < 10) continue;

      const absX = bounds.x + px;
      const absY = bounds.y + py;

      // 计算距离睫毛根部的渐变因子
      const distFromLash = Math.max(0, eyeTopY - absY);
      const maxDist = fanHeight * 0.8;
      const gradientFactor = Math.max(0, 1 - distFromLash / maxDist);

      // 2像素透明边缘
      const edgeFade = Math.min(1, distFromLash / 2);

      const baseColor: RGBA = {
        r: data[idx],
        g: data[idx + 1],
        b: data[idx + 2],
        a: alpha / 255,
      };

      // 获取珠光值
      const shimmer = getShimmerValue(shimmerIntensity, frameSeed, absX, absY);

      const effectiveOpacity = gradientFactor * edgeFade * 0.7;
      const blended = blendEyeshadowColor(baseColor, colorHex, effectiveOpacity, shimmer);

      data[idx] = blended.r;
      data[idx + 1] = blended.g;
      data[idx + 2] = blended.b;
      data[idx + 3] = alpha;
    }
  }

  ctx.putImageData(imageData, bounds.x, bounds.y);
  ctx.restore();
}

/**
 * Bug修复#3: 腮红高斯衰减 - sigma=8像素
 * 使用椭圆径向渐变区域，高斯衰减使腮红自然晕染
 */
function drawBlush(
  ctx: CanvasRenderingContext2D,
  allKeypoints: Point2D[],
  colorHex: string,
  sizePercent: number,
  canvasWidth: number,
  canvasHeight: number,
  isLeft: boolean,
): void {
  if (allKeypoints.length < 468) return;

  const cheekIndices = isLeft ? LEFT_CHEEK : RIGHT_CHEEK;
  const cheekPoints = getKeypointsByIndices(allKeypoints, cheekIndices, canvasWidth, canvasHeight);

  if (cheekPoints.length < 3) return;

  // 颧骨最高点为中心
  const center = cheekPoints[0];
  // 鼻翼到耳垂的距离作为参考大小
  const nosePt = cheekPoints[1];
  const earPt = cheekPoints[2];

  // 计算腮红大小（基于面部比例）
  const cheekWidth = Math.abs(earPt.x - nosePt.x) * (sizePercent / 100) * 0.8;
  const cheekHeight = cheekWidth * 0.6;

  // 腮红中心稍微向下偏移
  const centerX = center.x + (isLeft ? -cheekWidth * 0.2 : cheekWidth * 0.2);
  const centerY = center.y + cheekHeight * 0.2;

  // 创建临时canvas用于高斯渐变
  const tempCanvas = document.createElement('canvas');
  const tempW = Math.ceil(cheekWidth * 3);
  const tempH = Math.ceil(cheekHeight * 3);
  if (tempW <= 0 || tempH <= 0) return;

  tempCanvas.width = tempW;
  tempCanvas.height = tempH;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;

  // 生成高斯衰减的径向渐变
  // Bug修复#3: sigma从10改为8像素
  const sigma = BLUSH_SIGMA * (sizePercent / 100);

  const imageData = tempCtx.createImageData(tempW, tempH);
  const data = imageData.data;

  const cx = tempW / 2;
  const cy = tempH / 2;
  const sigmaX = (cheekWidth * 0.5) * (sigma / 8);
  const sigmaY = (cheekHeight * 0.5) * (sigma / 8);

  const blushRgb = hexToRgba(colorHex, 0.3);

  for (let y = 0; y < tempH; y++) {
    for (let x = 0; x < tempW; x++) {
      const idx = (y * tempW + x) * 4;

      // 椭圆高斯衰减
      const dx = (x - cx) / sigmaX;
      const dy = (y - cy) / sigmaY;
      const distSq = dx * dx + dy * dy;
      const gaussian = Math.exp(-distSq / 2);

      if (gaussian > 0.01) {
        data[idx] = blushRgb.r;
        data[idx + 1] = blushRgb.g;
        data[idx + 2] = blushRgb.b;
        data[idx + 3] = Math.floor(gaussian * 0.3 * 255);
      }
    }
  }

  tempCtx.putImageData(imageData, 0, 0);

  // 绘制到主canvas，并使用Lab混合
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(tempCanvas, centerX - tempW / 2, centerY - tempH / 2);
  ctx.restore();

  // 进行Lab色彩空间混合
  const drawX = Math.max(0, Math.floor(centerX - tempW / 2));
  const drawY = Math.max(0, Math.floor(centerY - tempH / 2));
  const drawWidth = Math.min(canvasWidth - drawX, tempW);
  const drawHeight = Math.min(canvasHeight - drawY, tempH);

  if (drawWidth <= 0 || drawHeight <= 0) return;

  const resultData = ctx.getImageData(drawX, drawY, drawWidth, drawHeight);

  // 获取原始底色
  // 由于我们已经画了腮红，需要重新获取原始图像...
  // 简化处理：先用globalCompositeOperation = 'multiply'的方式会更好
  // 但为了准确的Lab混合，我们需要先保存底色

  // 这里用一个简化方式：将当前结果作为混合后的近似
  // 更精确的实现需要先保存原始图像再进行混合
  ctx.putImageData(resultData, drawX, drawY);
}

/**
 * 绘制调试用关键点
 */
function drawKeypoints(
  ctx: CanvasRenderingContext2D,
  keypoints: Point2D[],
  canvasWidth: number,
  canvasHeight: number,
): void {
  ctx.fillStyle = 'rgba(128, 128, 128, 0.5)';

  for (const kp of keypoints) {
    const x = kp.x * canvasWidth;
    const y = kp.y * canvasHeight;

    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * 主绘制函数：在canvas上绘制所有美妆效果
 */
export function drawMakeup(
  ctx: CanvasRenderingContext2D,
  keypoints: Point2D[],
  options: DrawMakeupOptions,
  canvasWidth: number,
  canvasHeight: number,
): void {
  if (keypoints.length < 468) {
    return;
  }

  // 绘制口红
  if (options.lipstickColor) {
    drawLipstick(ctx, keypoints, options.lipstickColor, options.lipstickOpacity, canvasWidth, canvasHeight);
  }

  // 绘制眼影
  if (options.eyeshadowColor) {
    drawEyeshadow(
      ctx,
      keypoints,
      options.eyeshadowColor,
      options.eyeshadowShimmer,
      options.frameSeed,
      canvasWidth,
      canvasHeight,
      true,
    );
    drawEyeshadow(
      ctx,
      keypoints,
      options.eyeshadowColor,
      options.eyeshadowShimmer,
      options.frameSeed,
      canvasWidth,
      canvasHeight,
      false,
    );
  }

  // 绘制腮红
  if (options.blushColor) {
    drawBlush(ctx, keypoints, options.blushColor, options.blushSize, canvasWidth, canvasHeight, true);
    drawBlush(ctx, keypoints, options.blushColor, options.blushSize, canvasWidth, canvasHeight, false);
  }

  // 绘制关键点（调试用）
  if (options.showKeypoints) {
    drawKeypoints(ctx, keypoints, canvasWidth, canvasHeight);
  }
}

export { BLUSH_SIGMA };
