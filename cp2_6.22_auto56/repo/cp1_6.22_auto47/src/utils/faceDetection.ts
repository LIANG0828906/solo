import type { Results } from '@mediapipe/face_mesh';

export interface MakeupColors {
  lipstick: string | null;
  eyeshadow: string | null;
  blush: string | null;
}

export interface FaceLandmarks {
  lips: { x: number; y: number }[];
  leftEye: { x: number; y: number }[];
  rightEye: { x: number; y: number }[];
  leftCheek: { x: number; y: number };
  rightCheek: { x: number; y: number };
  allPoints: { x: number; y: number }[];
}

const LIP_UPPER_OUTER = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291];
const LIP_LOWER_OUTER = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291];

const LEFT_EYE_LANDMARKS = [
  33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7
];
const RIGHT_EYE_LANDMARKS = [
  362, 398, 384, 385, 386, 387, 388, 466, 263, 355, 354, 353, 345, 344, 382, 380
];

const LEFT_CHEEK_INDEX = 234;
const RIGHT_CHEEK_INDEX = 454;

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null;
}

export function extractFaceLandmarks(results: Results): FaceLandmarks | null {
  if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
    return null;
  }

  const landmarks = results.multiFaceLandmarks[0];

  const getPoint = (index: number) => ({
    x: landmarks[index].x,
    y: landmarks[index].y
  });

  const lips: { x: number; y: number }[] = [];
  for (let i = 0; i < LIP_UPPER_OUTER.length; i++) {
    lips.push(getPoint(LIP_UPPER_OUTER[i]));
  }
  for (let i = LIP_LOWER_OUTER.length - 2; i >= 1; i--) {
    lips.push(getPoint(LIP_LOWER_OUTER[i]));
  }

  const leftEye = LEFT_EYE_LANDMARKS.map(i => getPoint(i));
  const rightEye = RIGHT_EYE_LANDMARKS.map(i => getPoint(i));

  const leftCheek = getPoint(LEFT_CHEEK_INDEX);
  const rightCheek = getPoint(RIGHT_CHEEK_INDEX);

  const allPoints: { x: number; y: number }[] = [];
  for (let i = 0; i < landmarks.length; i++) {
    allPoints.push({ x: landmarks[i].x, y: landmarks[i].y });
  }

  return {
    lips,
    leftEye,
    rightEye,
    leftCheek,
    rightCheek,
    allPoints
  };
}

export function drawLandmarkPoints(
  ctx: CanvasRenderingContext2D,
  landmarks: FaceLandmarks,
  width: number,
  height: number
): void {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

  landmarks.allPoints.forEach(point => {
    const x = point.x * width;
    const y = point.y * height;
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  });
}

export function drawLipstick(
  ctx: CanvasRenderingContext2D,
  landmarks: FaceLandmarks,
  color: string,
  width: number,
  height: number
): void {
  const rgb = hexToRgb(color);
  if (!rgb) return;

  ctx.save();
  ctx.beginPath();

  const lips = landmarks.lips;
  if (lips.length < 3) return;

  ctx.moveTo(lips[0].x * width, lips[0].y * height);

  for (let i = 1; i < lips.length; i++) {
    ctx.lineTo(lips[i].x * width, lips[i].y * height);
  }
  ctx.closePath();

  ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`;
  ctx.fill();

  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`;
  ctx.fill();

  ctx.restore();
}

export function drawEyeshadow(
  ctx: CanvasRenderingContext2D,
  landmarks: FaceLandmarks,
  color: string,
  width: number,
  height: number
): void {
  const rgb = hexToRgb(color);
  if (!rgb) return;

  ctx.save();

  const drawEyeShadow = (eyeLandmarks: { x: number; y: number }[]) => {
    if (eyeLandmarks.length < 3) return;

    ctx.beginPath();

    const topPoints: { x: number; y: number }[] = [];
    for (let i = 0; i <= Math.floor(eyeLandmarks.length / 2); i++) {
      topPoints.push(eyeLandmarks[i]);
    }

    const browOffset = -0.025;

    ctx.moveTo(topPoints[0].x * width, topPoints[0].y * height);

    for (let i = 1; i < topPoints.length; i++) {
      const p = topPoints[i];
      const offsetY = p.y * height + browOffset * height * Math.sin((i / topPoints.length) * Math.PI);
      ctx.lineTo(p.x * width, offsetY);
    }

    for (let i = topPoints.length - 2; i >= 1; i--) {
      ctx.lineTo(topPoints[i].x * width, topPoints[i].y * height);
    }

    ctx.closePath();

    const gradient = ctx.createLinearGradient(
      eyeLandmarks[0].x * width,
      eyeLandmarks[0].y * height,
      eyeLandmarks[0].x * width,
      eyeLandmarks[0].y * height - 40
    );
    gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.55)`);
    gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05)`);

    ctx.fillStyle = gradient;
    ctx.fill();
  };

  drawEyeShadow(landmarks.leftEye);
  drawEyeShadow(landmarks.rightEye);

  ctx.restore();
}

export function drawBlush(
  ctx: CanvasRenderingContext2D,
  landmarks: FaceLandmarks,
  color: string,
  width: number,
  height: number
): void {
  const rgb = hexToRgb(color);
  if (!rgb) return;

  ctx.save();

  const drawCheekBlush = (cheekPoint: { x: number; y: number }, side: 'left' | 'right') => {
    const centerX = cheekPoint.x * width;
    const centerY = cheekPoint.y * height;
    const radiusX = width * 0.07;
    const radiusY = height * 0.05;

    const offsetX = side === 'left' ? -width * 0.015 : width * 0.015;

    const gradient = ctx.createRadialGradient(
      centerX + offsetX,
      centerY,
      0,
      centerX + offsetX,
      centerY,
      radiusX
    );

    gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.45)`);
    gradient.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`);
    gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

    ctx.beginPath();
    ctx.ellipse(centerX + offsetX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  };

  drawCheekBlush(landmarks.leftCheek, 'left');
  drawCheekBlush(landmarks.rightCheek, 'right');

  ctx.restore();
}

export function drawMakeup(
  ctx: CanvasRenderingContext2D,
  landmarks: FaceLandmarks,
  makeup: MakeupColors,
  width: number,
  height: number,
  fadeOpacity: number = 1
): void {
  ctx.save();
  ctx.globalAlpha = fadeOpacity;

  if (makeup.eyeshadow) {
    drawEyeshadow(ctx, landmarks, makeup.eyeshadow, width, height);
  }

  if (makeup.blush) {
    drawBlush(ctx, landmarks, makeup.blush, width, height);
  }

  if (makeup.lipstick) {
    drawLipstick(ctx, landmarks, makeup.lipstick, width, height);
  }

  ctx.restore();
}
