import type { PointCloudPoint } from '@/stores/appStore';

export interface EdgePoint {
  x: number;
  y: number;
}

export async function processImage(file: File): Promise<PointCloudPoint[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const points = extractEdgePoints(img);
        const pointCloud = generateSkeletonPoints(points, img.width, img.height);
        resolve(pointCloud);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function extractEdgePoints(img: HTMLImageElement): EdgePoint[] {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const maxSize = 300;
  const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
  const width = Math.floor(img.width * scale);
  const height = Math.floor(img.height * scale);

  canvas.width = width;
  canvas.height = height;

  ctx.drawImage(img, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const grayscale: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    grayscale.push(gray);
  }

  const edges: EdgePoint[] = [];
  const threshold = 30;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const gx =
        grayscale[idx - width - 1] +
        2 * grayscale[idx - 1] +
        grayscale[idx + width - 1] -
        grayscale[idx - width + 1] -
        2 * grayscale[idx + 1] -
        grayscale[idx + width + 1];

      const gy =
        grayscale[idx - width - 1] +
        2 * grayscale[idx - width] +
        grayscale[idx - width + 1] -
        grayscale[idx + width - 1] -
        2 * grayscale[idx + width] -
        grayscale[idx + width + 1];

      const magnitude = Math.sqrt(gx * gx + gy * gy);

      if (magnitude > threshold) {
        edges.push({ x, y });
      }
    }
  }

  return edges;
}

function generateSkeletonPoints(
  edges: EdgePoint[],
  imgWidth: number,
  imgHeight: number
): PointCloudPoint[] {
  if (edges.length === 0) return [];

  const points: PointCloudPoint[] = [];

  const centerX = imgWidth / 2;
  const centerY = imgHeight / 2;
  const scale = 4 / Math.max(imgWidth, imgHeight);

  const step = Math.max(1, Math.floor(edges.length / 500));

  for (let i = 0; i < edges.length; i += step) {
    const edge = edges[i];
    const x = (edge.x - centerX) * scale;
    const y = -(edge.y - centerY) * scale;
    const z = (Math.random() - 0.5) * 0.3;

    points.push({
      position: [x, y, z],
    });
  }

  const spineY = [-1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5];
  const spineX = 0;
  spineY.forEach((y) => {
    points.push({
      position: [spineX, y, 0],
    });
  });

  const limbCount = 4;
  for (let i = 0; i < limbCount; i++) {
    const side = i < 2 ? -1 : 1;
    const isFront = i % 2 === 0;
    const baseY = isFront ? 0.5 : -0.5;
    const length = isFront ? 1.0 : 1.2;

    for (let j = 0; j < 5; j++) {
      const t = j / 4;
      const x = side * 0.5 + side * length * t;
      const y = baseY - 0.3 * t;
      points.push({
        position: [x, y, 0],
      });
    }
  }

  points.push({ position: [0, 1.8, 0] });

  return points;
}
