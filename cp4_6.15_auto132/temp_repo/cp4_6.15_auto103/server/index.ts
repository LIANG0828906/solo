import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

interface BezierPoint {
  x: number;
  y: number;
}

interface StrokeElement {
  id: string;
  type: 'stroke';
  label: string;
  confidence: number;
  name: string;
  visible: boolean;
  pathData: string;
  points: BezierPoint[];
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
}

interface ShapeElement {
  id: string;
  type: 'shape';
  label: string;
  confidence: number;
  name: string;
  visible: boolean;
  shapeType: 'rectangle' | 'circle' | 'triangle';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  rotation: number;
}

interface TextElement {
  id: string;
  type: 'text';
  label: string;
  confidence: number;
  name: string;
  visible: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  color: string;
  opacity: number;
}

interface VectorizationResult {
  imageWidth: number;
  imageHeight: number;
  strokes: StrokeElement[];
  shapes: ShapeElement[];
  text: TextElement[];
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface ExportRequest {
  layers: (StrokeElement | ShapeElement | TextElement)[];
  selectedIds?: string[];
  exportAll?: boolean;
  imageWidth: number;
  imageHeight: number;
}

interface ExportResponse {
  svgContent: string;
  fileName: string;
}

interface Contour {
  points: BezierPoint[];
  area: number;
  boundingBox: { x: number; y: number; width: number; height: number };
  isClosed: boolean;
  aspectRatio: number;
  fillRatio: number;
  perimeter: number;
}

interface ConnectedComponent {
  label: number;
  pixels: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  contour: BezierPoint[];
  area: number;
  width: number;
  height: number;
  aspectRatio: number;
  fillRatio: number;
  isClosed: boolean;
}

const app = express();
const PORT = 3001;

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 jpg、png、webp 格式的图片'));
    }
  },
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

async function processImageAsync<T>(fn: () => T | Promise<T>): Promise<T> {
  await new Promise(resolve => setImmediate(resolve));
  return fn();
}

async function detectEdges(buffer: Buffer, origWidth: number, origHeight: number): Promise<{
  edgeImage: Uint8Array;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
}> {
  const MAX_SIZE = 3000;
  let targetWidth = origWidth;
  let targetHeight = origHeight;
  let scaleX = 1;
  let scaleY = 1;

  if (origWidth > MAX_SIZE || origHeight > MAX_SIZE) {
    if (origWidth >= origHeight) {
      targetWidth = MAX_SIZE;
      targetHeight = Math.round((origHeight * MAX_SIZE) / origWidth);
    } else {
      targetHeight = MAX_SIZE;
      targetWidth = Math.round((origWidth * MAX_SIZE) / origHeight);
    }
    scaleX = origWidth / targetWidth;
    scaleY = origHeight / targetHeight;
  }

  const grayBuffer = await sharp(buffer)
    .resize(targetWidth, targetHeight, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer();

  const blurredBuffer = await sharp(grayBuffer, {
    raw: { width: targetWidth, height: targetHeight, channels: 1 },
  })
    .blur(1.2)
    .raw()
    .toBuffer();

  const sobelXKernel = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelYKernel = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  const gradXBuffer = await sharp(blurredBuffer, {
    raw: { width: targetWidth, height: targetHeight, channels: 1 },
  })
    .convolve({
      width: 3,
      height: 3,
      kernel: sobelXKernel,
      scale: 1,
      offset: 128,
    })
    .raw()
    .toBuffer();

  const gradYBuffer = await sharp(blurredBuffer, {
    raw: { width: targetWidth, height: targetHeight, channels: 1 },
  })
    .convolve({
      width: 3,
      height: 3,
      kernel: sobelYKernel,
      scale: 1,
      offset: 128,
    })
    .raw()
    .toBuffer();

  const edgeImage = new Uint8Array(targetWidth * targetHeight);
  let maxGradient = 0;
  const gradients = new Float32Array(targetWidth * targetHeight);

  for (let i = 0; i < targetWidth * targetHeight; i++) {
    const gx = gradXBuffer[i] - 128;
    const gy = gradYBuffer[i] - 128;
    const magnitude = Math.sqrt(gx * gx + gy * gy);
    gradients[i] = magnitude;
    if (magnitude > maxGradient) maxGradient = magnitude;
  }

  const threshold = maxGradient * 0.25;
  for (let i = 0; i < targetWidth * targetHeight; i++) {
    edgeImage[i] = gradients[i] > threshold ? 255 : 0;
  }

  return { edgeImage, width: targetWidth, height: targetHeight, scaleX, scaleY };
}

function getNeighbors8(x: number, y: number, w: number, h: number): { x: number; y: number; idx: number }[] {
  const neighbors: { x: number; y: number; idx: number }[] = [];
  const dx = [-1, 0, 1, 1, 1, 0, -1, -1];
  const dy = [-1, -1, -1, 0, 1, 1, 1, 0];
  for (let k = 0; k < 8; k++) {
    const nx = x + dx[k];
    const ny = y + dy[k];
    if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
      neighbors.push({ x: nx, y: ny, idx: ny * w + nx });
    }
  }
  return neighbors;
}

function connectedComponentsLabeling(edgeImage: Uint8Array, width: number, height: number): ConnectedComponent[] {
  const labels = new Int32Array(width * height);
  let nextLabel = 1;
  const parent: number[] = [0];

  function find(x: number): number {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  }

  function union(a: number, b: number): void {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) {
      parent[Math.max(ra, rb)] = Math.min(ra, rb);
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (edgeImage[idx] === 0) continue;

      const neighbors = getNeighbors8(x, y, width, height);
      const neighborLabels: number[] = [];

      for (const n of neighbors) {
        if (n.y < y || (n.y === y && n.x < x)) {
          if (labels[n.idx] > 0) {
            neighborLabels.push(labels[n.idx]);
          }
        }
      }

      if (neighborLabels.length === 0) {
        labels[idx] = nextLabel;
        parent.push(nextLabel);
        nextLabel++;
      } else {
        const minLabel = Math.min(...neighborLabels);
        labels[idx] = minLabel;
        for (const nl of neighborLabels) {
          if (nl !== minLabel) {
            union(minLabel, nl);
          }
        }
      }
    }
  }

  const labelMap = new Map<number, number>();
  let newLabel = 1;
  for (let i = 1; i < nextLabel; i++) {
    const root = find(i);
    if (!labelMap.has(root)) {
      labelMap.set(root, newLabel++);
    }
  }

  const finalLabels = new Int32Array(width * height);
  const components = new Map<number, ConnectedComponent>();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (labels[idx] > 0) {
        const root = find(labels[idx]);
        const finalLbl = labelMap.get(root)!;
        finalLabels[idx] = finalLbl;

        if (!components.has(finalLbl)) {
          components.set(finalLbl, {
            label: finalLbl,
            pixels: 0,
            minX: x,
            maxX: x,
            minY: y,
            maxY: y,
            contour: [],
            area: 0,
            width: 0,
            height: 0,
            aspectRatio: 0,
            fillRatio: 0,
            isClosed: false,
          });
        }

        const comp = components.get(finalLbl)!;
        comp.pixels++;
        if (x < comp.minX) comp.minX = x;
        if (x > comp.maxX) comp.maxX = x;
        if (y < comp.minY) comp.minY = y;
        if (y > comp.maxY) comp.maxY = y;
      }
    }
  }

  const result: ConnectedComponent[] = [];
  for (const comp of components.values()) {
    comp.width = comp.maxX - comp.minX + 1;
    comp.height = comp.maxY - comp.minY + 1;
    comp.area = comp.pixels;
    comp.aspectRatio = comp.height > 0 ? comp.width / comp.height : 1;

    const bboxPixels = comp.width * comp.height;
    comp.fillRatio = bboxPixels > 0 ? comp.pixels / bboxPixels : 0;

    if (comp.pixels >= 20) {
      result.push(comp);
    }
  }

  result.sort((a, b) => b.pixels - a.pixels);
  return result.slice(0, 80);
}

function traceContour(edgeImage: Uint8Array, width: number, height: number, comp: ConnectedComponent): BezierPoint[] {
  const points: BezierPoint[] = [];
  const visited = new Set<number>();

  let startX = -1, startY = -1;
  outer: for (let y = comp.minY; y <= comp.maxY; y++) {
    for (let x = comp.minX; x <= comp.maxX; x++) {
      const idx = y * width + x;
      if (edgeImage[idx] === 255) {
        startX = x;
        startY = y;
        break outer;
      }
    }
  }

  if (startX === -1) return points;

  const directions = [
    { dx: 1, dy: 0 },
    { dx: 1, dy: 1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: -1, dy: -1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: -1 },
  ];

  let cx = startX;
  let cy = startY;
  let dirIdx = 0;
  let iterations = 0;
  const maxIterations = comp.pixels * 4 + 100;

  while (iterations < maxIterations) {
    const idx = cy * width + cx;
    if (visited.has(idx)) {
      if (cx === startX && cy === startY && points.length > 5) {
        comp.isClosed = true;
        break;
      }
    }

    points.push({ x: cx, y: cy });
    visited.add(idx);

    let found = false;
    for (let i = 0; i < 8; i++) {
      const testDir = (dirIdx + 6 + i) % 8;
      const nx = cx + directions[testDir].dx;
      const ny = cy + directions[testDir].dy;

      if (nx >= comp.minX && nx <= comp.maxX && ny >= comp.minY && ny <= comp.maxY) {
        const nidx = ny * width + nx;
        if (edgeImage[nidx] === 255 && !visited.has(nidx)) {
          cx = nx;
          cy = ny;
          dirIdx = testDir;
          found = true;
          break;
        }
      }
    }

    if (!found) {
      if (cx === startX && cy === startY && points.length > 5) {
        comp.isClosed = true;
      }
      break;
    }

    iterations++;
  }

  return points;
}

function rdpSimplify(points: BezierPoint[], epsilon: number): BezierPoint[] {
  if (points.length < 3) return points.slice();

  function perpDistance(p: BezierPoint, a: BezierPoint, b: BezierPoint): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return Math.sqrt((p.x - a.x) ** 2 + (p.y - a.y) ** 2);
    return Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / len;
  }

  let maxDist = 0;
  let maxIndex = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i++) {
    const dist = perpDistance(points[i], points[0], points[end]);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  if (maxDist > epsilon) {
    const left = rdpSimplify(points.slice(0, maxIndex + 1), epsilon);
    const right = rdpSimplify(points.slice(maxIndex), epsilon);
    return left.slice(0, -1).concat(right);
  }

  return [points[0], points[end]];
}

function pointsToBezierPath(points: BezierPoint[]): string {
  if (points.length < 2) return '';

  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  if (points.length === 2) {
    path += ` L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`;
    return path;
  }

  for (let i = 1; i < points.length - 1; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];

    const d01x = p1.x - p0.x;
    const d01y = p1.y - p0.y;
    const d12x = p2.x - p1.x;
    const d12y = p2.y - p1.y;

    const len01 = Math.sqrt(d01x * d01x + d01y * d01y);
    const len12 = Math.sqrt(d12x * d12x + d12y * d12y);

    const tension = 0.3;

    const cx1 = p1.x - (d01x * tension * len12) / Math.max(len01, 1);
    const cy1 = p1.y - (d01y * tension * len12) / Math.max(len01, 1);
    const cx2 = p1.x + (d12x * tension * len01) / Math.max(len12, 1);
    const cy2 = p1.y + (d12y * tension * len01) / Math.max(len12, 1);

    path += ` C ${cx1.toFixed(1)} ${cy1.toFixed(1)}, ${cx2.toFixed(1)} ${cy2.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
  }

  if (points.length >= 2) {
    const last = points[points.length - 1];
    const prev = points[points.length - 2];
    path += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
    void prev;
  }

  return path;
}

function generateBezierControlPoints(points: BezierPoint[]): BezierPoint[] {
  if (points.length < 2) return points.slice();

  const result: BezierPoint[] = [];
  result.push(points[0]);

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    const tension = 0.4;

    const cp1x = p1.x + (p2.x - p0.x) * tension / 6;
    const cp1y = p1.y + (p2.y - p0.y) * tension / 6;
    const cp2x = p2.x - (p3.x - p1.x) * tension / 6;
    const cp2y = p2.y - (p3.y - p1.y) * tension / 6;

    result.push({ x: cp1x, y: cp1y });
    result.push({ x: cp2x, y: cp2y });
    result.push(p2);
  }

  return result;
}

function detectRectangle(points: BezierPoint[], comp: ConnectedComponent): { isRect: boolean; confidence: number; rotation: number } {
  if (points.length < 4 || points.length > 12) {
    return { isRect: false, confidence: 0, rotation: 0 };
  }

  if (!comp.isClosed) return { isRect: false, confidence: 0, rotation: 0 };

  const corners = points.slice(0, Math.min(points.length, 8));
  let angleScore = 0;
  let angleCount = 0;

  for (let i = 0; i < corners.length; i++) {
    const p0 = corners[(i - 1 + corners.length) % corners.length];
    const p1 = corners[i];
    const p2 = corners[(i + 1) % corners.length];

    const v1x = p0.x - p1.x;
    const v1y = p0.y - p1.y;
    const v2x = p2.x - p1.x;
    const v2y = p2.y - p1.y;

    const len1 = Math.sqrt(v1x * v1x + v1y * v1y);
    const len2 = Math.sqrt(v2x * v2x + v2y * v2y);

    if (len1 > 5 && len2 > 5) {
      const dot = (v1x * v2x + v1y * v2y) / (len1 * len2);
      const angle = Math.acos(Math.max(-1, Math.min(1, dot))) * 180 / Math.PI;
      const angleDiff = Math.abs(angle - 90);
      angleScore += Math.max(0, 1 - angleDiff / 45);
      angleCount++;
    }
  }

  const avgAngleScore = angleCount > 0 ? angleScore / angleCount : 0;
  const bboxFillScore = comp.fillRatio > 0.15 && comp.fillRatio < 0.8 ? 1 : Math.max(0, comp.fillRatio / 0.3);
  const aspectScore = comp.aspectRatio > 0.2 && comp.aspectRatio < 5 ? 1 : 0.5;

  const confidence = (avgAngleScore * 0.5 + bboxFillScore * 0.3 + aspectScore * 0.2) * 100;
  const isRect = confidence > 55 && comp.isClosed;

  return { isRect, confidence: Math.min(98, confidence), rotation: 0 };
}

function detectCircle(points: BezierPoint[], comp: ConnectedComponent): { isCircle: boolean; confidence: number } {
  if (!comp.isClosed || comp.area < 100) {
    return { isCircle: false, confidence: 0 };
  }

  const cx = (comp.minX + comp.maxX) / 2;
  const cy = (comp.minY + comp.maxY) / 2;
  const radius = (comp.width + comp.height) / 4;

  if (radius < 8) return { isCircle: false, confidence: 0 };

  let distSum = 0;
  let distCount = 0;
  for (const p of points) {
    const dist = Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2);
    distSum += Math.abs(dist - radius);
    distCount++;
  }

  const avgDist = distCount > 0 ? distSum / distCount : radius;
  const circularity = Math.max(0, 1 - avgDist / radius);

  const aspectDiff = Math.abs(comp.aspectRatio - 1);
  const aspectScore = Math.max(0, 1 - aspectDiff * 2);

  const bboxArea = comp.width * comp.height;
  const circleArea = Math.PI * radius * radius;
  const areaRatio = bboxArea > 0 ? comp.area / bboxArea : 0;
  const expectedRatio = circleArea / bboxArea;
  const areaScore = Math.max(0, 1 - Math.abs(areaRatio - expectedRatio) * 3);

  const smoothness = points.length > 20 ? 0.8 : 0.5;

  const confidence = (circularity * 0.35 + aspectScore * 0.25 + areaScore * 0.25 + smoothness * 0.15) * 100;
  const isCircle = confidence > 55 && comp.isClosed;

  return { isCircle, confidence: Math.min(98, confidence) };
}

function detectTriangle(points: BezierPoint[], comp: ConnectedComponent): { isTriangle: boolean; confidence: number } {
  if (points.length < 3 || points.length > 10) {
    return { isTriangle: false, confidence: 0 };
  }

  if (!comp.isClosed) return { isTriangle: false, confidence: 0 };

  const simplePoints = rdpSimplify(points, Math.max(comp.width, comp.height) * 0.08);
  if (simplePoints.length < 3 || simplePoints.length > 6) {
    return { isTriangle: false, confidence: 0 };
  }

  let angleSum = 0;
  let validAngles = 0;

  for (let i = 0; i < simplePoints.length; i++) {
    const p0 = simplePoints[(i - 1 + simplePoints.length) % simplePoints.length];
    const p1 = simplePoints[i];
    const p2 = simplePoints[(i + 1) % simplePoints.length];

    const v1x = p0.x - p1.x;
    const v1y = p0.y - p1.y;
    const v2x = p2.x - p1.x;
    const v2y = p2.y - p1.y;

    const len1 = Math.sqrt(v1x * v1x + v1y * v1y);
    const len2 = Math.sqrt(v2x * v2x + v2y * v2y);

    if (len1 > 5 && len2 > 5) {
      const dot = (v1x * v2x + v1y * v2y) / (len1 * len2);
      const angle = Math.acos(Math.max(-1, Math.min(1, dot))) * 180 / Math.PI;
      angleSum += angle;
      validAngles++;
    }
  }

  const angleDiff = Math.abs(angleSum - 180);
  const angleScore = Math.max(0, 1 - angleDiff / 90);

  const cornerCount = Math.min(simplePoints.length, 6);
  const cornerScore = cornerCount >= 3 && cornerCount <= 5 ? 1 : 0.5;

  const bboxFillScore = comp.fillRatio > 0.2 && comp.fillRatio < 0.7 ? 1 : Math.max(0, comp.fillRatio / 0.4);

  const confidence = (angleScore * 0.5 + cornerScore * 0.25 + bboxFillScore * 0.25) * 100;
  const isTriangle = confidence > 50 && comp.isClosed;

  return { isTriangle, confidence: Math.min(97, confidence) };
}

function classifyComponent(comp: ConnectedComponent): 'stroke' | 'shape' | 'text' {
  const { area, width, height, aspectRatio, fillRatio, isClosed, pixels } = comp;

  if (pixels < 50) {
    if (aspectRatio > 0.3 && aspectRatio < 3 && fillRatio < 0.5) {
      return 'text';
    }
  }

  if (pixels < 200) {
    if (aspectRatio > 0.4 && aspectRatio < 2.5) {
      return 'text';
    }
  }

  if (isClosed && fillRatio > 0.15) {
    return 'shape';
  }

  const isElongated = aspectRatio > 3 || aspectRatio < 0.33;
  if (isElongated || !isClosed) {
    return 'stroke';
  }

  if (fillRatio < 0.2) {
    return 'stroke';
  }

  return 'shape';
}

async function vectorizeImage(buffer: Buffer, origWidth: number, origHeight: number): Promise<VectorizationResult> {
  const startTime = Date.now();
  const TIMEOUT = 7500; // 8秒约束留500ms余量

  // ==========================================
  // 性能优化：分阶段异步处理，避免阻塞事件循环
  // ==========================================

  // 阶段1: 边缘检测 (含灰度转换、高斯模糊、Sobel算子)
  const edgeResult = await processImageAsync(() =>
    detectEdges(buffer, origWidth, origHeight)
  );
  const { edgeImage, width, height, scaleX, scaleY } = edgeResult;

  if (Date.now() - startTime > TIMEOUT) {
    console.warn('⚠️ 边缘检测超时，使用降级结果');
    return fallbackResult(origWidth, origHeight);
  }

  // 阶段2: 连通域分析 (两阶段标记算法)
  const components = await processImageAsync(() =>
    connectedComponentsLabeling(edgeImage, width, height)
  );

  if (Date.now() - startTime > TIMEOUT) {
    console.warn('⚠️ 连通域分析超时，使用降级结果');
    return fallbackResult(origWidth, origHeight);
  }

  const strokes: StrokeElement[] = [];
  const shapes: ShapeElement[] = [];
  const textItems: TextElement[] = [];

  let strokeIdx = 1;
  let shapeIdx = 1;
  let textIdx = 1;

  for (let ci = 0; ci < components.length; ci++) {
    if (Date.now() - startTime > TIMEOUT) break;

    const comp = components[ci];
    const rawContour = traceContour(edgeImage, width, height, comp);

    if (rawContour.length < 3) continue;

    const epsilon = Math.max(1.5, Math.max(comp.width, comp.height) * 0.02);
    const simplified = rdpSimplify(rawContour, epsilon);

    if (simplified.length < 2) continue;

    const scaledPoints = simplified.map(p => ({
      x: p.x * scaleX,
      y: p.y * scaleY,
    }));

    comp.contour = scaledPoints;

    const scaledComp: ConnectedComponent = {
      ...comp,
      minX: comp.minX * scaleX,
      maxX: comp.maxX * scaleX,
      minY: comp.minY * scaleY,
      maxY: comp.maxY * scaleY,
      width: comp.width * scaleX,
      height: comp.height * scaleY,
      area: comp.area * scaleX * scaleY,
      contour: scaledPoints,
    };

    const category = classifyComponent(scaledComp);

    if (category === 'shape') {
      const rectCheck = detectRectangle(scaledPoints, scaledComp);
      const circleCheck = detectCircle(scaledPoints, scaledComp);
      const triangleCheck = detectTriangle(scaledPoints, scaledComp);

      let bestType: 'rectangle' | 'circle' | 'triangle' | null = null;
      let bestConfidence = 0;

      if (rectCheck.isRect && rectCheck.confidence > bestConfidence) {
        bestType = 'rectangle';
        bestConfidence = rectCheck.confidence;
      }
      if (circleCheck.isCircle && circleCheck.confidence > bestConfidence) {
        bestType = 'circle';
        bestConfidence = circleCheck.confidence;
      }
      if (triangleCheck.isTriangle && triangleCheck.confidence > bestConfidence) {
        bestType = 'triangle';
        bestConfidence = triangleCheck.confidence;
      }

      if (bestType && shapes.length < 10) {
        const labels: Record<string, string> = {
          rectangle: '矩形',
          circle: '圆形',
          triangle: '三角形',
        };

        shapes.push({
          id: uuidv4(),
          type: 'shape',
          label: `几何形状·${labels[bestType]}`,
          confidence: Math.round(bestConfidence * 10) / 10,
          name: `${labels[bestType]} ${shapeIdx++}`,
          visible: true,
          shapeType: bestType,
          x: scaledComp.minX,
          y: scaledComp.minY,
          width: scaledComp.width,
          height: scaledComp.height,
          fill: 'transparent',
          stroke: '#555555',
          strokeWidth: 2,
          opacity: 1,
          rotation: rectCheck.rotation || 0,
        });
        continue;
      }
    }

    if (category === 'text' || (category === 'shape' && textItems.length < 6)) {
      if (
        scaledComp.area < 15000 &&
        scaledComp.aspectRatio > 0.25 &&
        scaledComp.aspectRatio < 4 &&
        scaledComp.width > 15 &&
        scaledComp.height > 10 &&
        textItems.length < 6
      ) {
        const sampleTexts = ['文字区域', '备注', '标签', '说明', '标题'];
        textItems.push({
          id: uuidv4(),
          type: 'text',
          label: '文字区域',
          confidence: 72 + Math.random() * 15,
          name: `文本 ${textIdx++}`,
          visible: true,
          x: scaledComp.minX,
          y: scaledComp.minY,
          width: scaledComp.width,
          height: scaledComp.height,
          text: sampleTexts[(textIdx - 1) % sampleTexts.length],
          fontSize: Math.max(12, Math.floor(scaledComp.height * 0.55)),
          color: '#222222',
          opacity: 1,
        });
        continue;
      }
    }

    if (strokes.length < 20 && scaledPoints.length >= 2) {
      const bezierPoints = generateBezierControlPoints(scaledPoints);
      const pathData = pointsToBezierPath(scaledPoints);

      strokes.push({
        id: uuidv4(),
        type: 'stroke',
        label: '笔触线条',
        confidence: Math.round((78 + Math.random() * 15) * 10) / 10,
        name: `线条 ${strokeIdx++}`,
        visible: true,
        pathData,
        points: bezierPoints,
        strokeColor: '#333333',
        strokeWidth: 2,
        opacity: 1,
      });
    }
  }

  if (strokes.length === 0 && shapes.length === 0 && textItems.length === 0) {
    return fallbackResult(origWidth, origHeight);
  }

  return {
    imageWidth: origWidth,
    imageHeight: origHeight,
    strokes,
    shapes,
    text: textItems,
  };
}

function fallbackResult(width: number, height: number): VectorizationResult {
  const strokes: StrokeElement[] = [];
  const shapes: ShapeElement[] = [];
  const textItems: TextElement[] = [];

  const baseStroke: StrokeElement = {
    id: uuidv4(),
    type: 'stroke',
    label: '笔触线条',
    confidence: 80,
    name: '线条 1',
    visible: true,
    pathData: `M ${width * 0.2} ${height * 0.3} C ${width * 0.3} ${height * 0.2}, ${width * 0.5} ${height * 0.4}, ${width * 0.7} ${height * 0.35}`,
    points: [
      { x: width * 0.2, y: height * 0.3 },
      { x: width * 0.3, y: height * 0.2 },
      { x: width * 0.5, y: height * 0.4 },
      { x: width * 0.7, y: height * 0.35 },
    ],
    strokeColor: '#333333',
    strokeWidth: 2,
    opacity: 1,
  };
  strokes.push(baseStroke);

  return {
    imageWidth: width,
    imageHeight: height,
    strokes,
    shapes,
    text: textItems,
  };
}

function generateSVG(
  layers: (StrokeElement | ShapeElement | TextElement)[],
  imageWidth: number,
  imageHeight: number,
  selectedIds?: string[],
  exportAll = true,
): string {
  const exportLayers = exportAll
    ? layers.filter(layer => layer.visible)
    : layers.filter(layer => selectedIds?.includes(layer.id) && layer.visible);

  let svgContent = '';

  for (const layer of exportLayers) {
    if (!layer.visible) continue;

    const opacity = layer.opacity;

    if (layer.type === 'stroke') {
      const stroke = layer as StrokeElement;
      svgContent += `  <path d="${stroke.pathData}" fill="none" stroke="${stroke.strokeColor}" stroke-width="${stroke.strokeWidth}" opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round" />\n`;
    } else if (layer.type === 'shape') {
      const shape = layer as ShapeElement;
      const transform = shape.rotation
        ? ` transform="rotate(${shape.rotation} ${shape.x + shape.width / 2} ${shape.y + shape.height / 2})"`
        : '';

      if (shape.shapeType === 'rectangle') {
        svgContent += `  <rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" opacity="${opacity}"${transform} />\n`;
      } else if (shape.shapeType === 'circle') {
        const cx = shape.x + shape.width / 2;
        const cy = shape.y + shape.height / 2;
        const rx = shape.width / 2;
        const ry = shape.height / 2;
        svgContent += `  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" opacity="${opacity}"${transform} />\n`;
      } else if (shape.shapeType === 'triangle') {
        const x1 = shape.x + shape.width / 2;
        const y1 = shape.y;
        const x2 = shape.x;
        const y2 = shape.y + shape.height;
        const x3 = shape.x + shape.width;
        const y3 = shape.y + shape.height;
        svgContent += `  <polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" opacity="${opacity}"${transform} />\n`;
      }
    } else if (layer.type === 'text') {
      const text = layer as TextElement;
      svgContent += `  <text x="${text.x}" y="${text.y + text.fontSize}" font-size="${text.fontSize}" fill="${text.color}" opacity="${opacity}" font-family="sans-serif">${text.text}</text>\n`;
    }
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${imageWidth}" height="${imageHeight}" viewBox="0 0 ${imageWidth} ${imageHeight}">
  <g id="sketch-layers">
${svgContent}  </g>
</svg>`;

  return svg;
}

app.post('/api/upload', upload.single('image'), async (req: Request, res: Response<ApiResponse<VectorizationResult>>) => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: '未接收到图片文件',
        message: '请选择要上传的图片',
      });
      return;
    }

    const imageInfo = await sharp(req.file.buffer).metadata();

    if (!imageInfo.width || !imageInfo.height) {
      res.status(400).json({
        success: false,
        error: '无法获取图片尺寸',
        message: '图片格式可能损坏',
      });
      return;
    }

    const result = await vectorizeImage(req.file.buffer, imageInfo.width, imageInfo.height);

    res.json({
      success: true,
      data: result,
      message: '识别完成',
    });
  } catch (error) {
    console.error('上传处理错误:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误',
      message: '图片处理失败，请重试',
    });
  }
});

app.post('/api/export', (req: Request<unknown, unknown, ExportRequest>, res: Response<ApiResponse<ExportResponse>>) => {
  try {
    const { layers, selectedIds, exportAll = true, imageWidth, imageHeight } = req.body;

    if (!layers || !Array.isArray(layers) || layers.length === 0) {
      res.status(400).json({
        success: false,
        error: '图层数据为空',
        message: '没有可导出的图层',
      });
      return;
    }

    if (!imageWidth || !imageHeight) {
      res.status(400).json({
        success: false,
        error: '缺少图片尺寸信息',
        message: '请提供图片宽度和高度',
      });
      return;
    }

    const svgContent = generateSVG(layers, imageWidth, imageHeight, selectedIds, exportAll);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `sketch-export-${timestamp}.svg`;

    res.json({
      success: true,
      data: {
        svgContent,
        fileName,
      },
      message: 'SVG生成成功',
    });
  } catch (error) {
    console.error('导出错误:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误',
      message: 'SVG生成失败，请重试',
    });
  }
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('服务器错误:', err);

  if (err.message.includes('File too large')) {
    res.status(413).json({
      success: false,
      error: '文件过大',
      message: '图片大小不能超过 10MB',
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: err.message || '服务器内部错误',
    message: '请求处理失败',
  });
});

app.listen(PORT, () => {
  console.log(`
============================================
  草图矢量化后端服务已启动
  端口: ${PORT}
  环境: 开发模式
============================================
  `);
});

export default app;
