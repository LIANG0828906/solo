import sharp from 'sharp';

export interface AnchorPoint {
  x: number;
  y: number;
}

export interface SvgPath {
  id: string;
  d: string;
  type: 'outline' | 'shadow' | 'highlight';
  name: string;
  stroke: string;
  strokeWidth: number;
  fill: string;
  anchors: AnchorPoint[];
}

export interface ConvertResult {
  paths: SvgPath[];
  width: number;
  height: number;
  layers: string[];
}

const generatePathFromPoints = (points: AnchorPoint[]): string => {
  if (points.length < 2) return '';
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    const cpy = (prev.y + curr.y) / 2;
    d += ` Q ${prev.x.toFixed(2)} ${prev.y.toFixed(2)} ${cpx.toFixed(2)} ${cpy.toFixed(2)}`;
  }
  return d;
};

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 10);
};

export const convertImage = async (base64Image: string, fineness: number): Promise<ConvertResult> => {
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  const metadata = await sharp(buffer).metadata();
  const width = metadata.width || 800;
  const height = metadata.height || 800;

  const edgeBuffer = await sharp(buffer)
    .grayscale()
    .modulate({ brightness: 1.2 })
    .convolve({
      width: 3,
      height: 3,
      kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
    })
    .threshold(128)
    .raw()
    .toBuffer();

  const sampleRate = Math.max(1, Math.floor((11 - fineness) * 3));
  const step = Math.max(2, sampleRate);

  const outlinePoints: AnchorPoint[] = [];
  const shadowPoints: AnchorPoint[] = [];
  const highlightPoints: AnchorPoint[] = [];

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const idx = y * width + x;
      const pixel = edgeBuffer[idx];
      if (pixel > 128) {
        const centerX = width / 2;
        const centerY = height / 2;
        const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        const maxDist = Math.sqrt(centerX ** 2 + centerY ** 2);
        const rel = distFromCenter / maxDist;

        if (rel > 0.6) {
          outlinePoints.push({ x, y });
        } else if (rel > 0.3) {
          shadowPoints.push({ x, y });
        } else {
          highlightPoints.push({ x, y });
        }
      }
    }
  }

  const reducePoints = (points: AnchorPoint[], target: number): AnchorPoint[] => {
    if (points.length <= target) return points;
    const result: AnchorPoint[] = [];
    const step = Math.ceil(points.length / target);
    for (let i = 0; i < points.length; i += step) {
      result.push(points[i]);
    }
    return result;
  };

  const targetCount = Math.floor(20 + fineness * 15);

  const outlineReduced = reducePoints(outlinePoints, targetCount);
  const shadowReduced = reducePoints(shadowPoints, Math.floor(targetCount * 0.7));
  const highlightReduced = reducePoints(highlightPoints, Math.floor(targetCount * 0.5));

  const layers: SvgPath[] = [];

  if (outlineReduced.length > 2) {
    layers.push({
      id: generateId(),
      d: generatePathFromPoints(outlineReduced),
      type: 'outline',
      name: '轮廓线层',
      stroke: '#222222',
      strokeWidth: 2,
      fill: 'none',
      anchors: outlineReduced,
    });
  }

  if (shadowReduced.length > 2) {
    layers.push({
      id: generateId(),
      d: generatePathFromPoints(shadowReduced),
      type: 'shadow',
      name: '阴影层',
      stroke: '#666666',
      strokeWidth: 1.5,
      fill: 'none',
      anchors: shadowReduced,
    });
  }

  if (highlightReduced.length > 2) {
    layers.push({
      id: generateId(),
      d: generatePathFromPoints(highlightReduced),
      type: 'highlight',
      name: '高光层',
      stroke: '#AAAAAA',
      strokeWidth: 1,
      fill: 'none',
      anchors: highlightReduced,
    });
  }

  if (layers.length === 0) {
    const defaultPoints: AnchorPoint[] = [
      { x: width * 0.2, y: height * 0.5 },
      { x: width * 0.3, y: height * 0.2 },
      { x: width * 0.5, y: height * 0.15 },
      { x: width * 0.7, y: height * 0.25 },
      { x: width * 0.8, y: height * 0.5 },
      { x: width * 0.7, y: height * 0.75 },
      { x: width * 0.5, y: height * 0.85 },
      { x: width * 0.3, y: height * 0.8 },
      { x: width * 0.2, y: height * 0.5 },
    ];
    layers.push({
      id: generateId(),
      d: generatePathFromPoints(defaultPoints),
      type: 'outline',
      name: '轮廓线层',
      stroke: '#222222',
      strokeWidth: 2,
      fill: 'none',
      anchors: defaultPoints,
    });
  }

  return {
    paths: layers,
    width,
    height,
    layers: layers.map(l => l.name),
  };
};
