import { useRef, useState, useCallback } from 'react';
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ColorExtractorProps {
  onColorsExtracted: (colors: string[]) => void;
  onImageProcessed?: (imageUrl: string) => void;
}

interface Pixel {
  r: number;
  g: number;
  b: number;
}

interface ColorBucket {
  pixels: Pixel[];
  rMin: number; rMax: number;
  gMin: number; gMax: number;
  bMin: number; bMax: number;
}

const hexToRgb = (hex: string): Pixel => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

const rgbToHex = (r: number, g: number, b: number): string => {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
};

const createBucket = (pixels: Pixel[]): ColorBucket => {
  let rMin = 255, rMax = 0, gMin = 255, gMax = 0, bMin = 255, bMax = 0;
  for (const p of pixels) {
    if (p.r < rMin) rMin = p.r;
    if (p.r > rMax) rMax = p.r;
    if (p.g < gMin) gMin = p.g;
    if (p.g > gMax) gMax = p.g;
    if (p.b < bMin) bMin = p.b;
    if (p.b > bMax) bMax = p.b;
  }
  return { pixels, rMin, rMax, gMin, gMax, bMin, bMax };
};

const getBucketRange = (bucket: ColorBucket): { channel: 'r' | 'g' | 'b'; range: number } => {
  const rRange = bucket.rMax - bucket.rMin;
  const gRange = bucket.gMax - bucket.gMin;
  const bRange = bucket.bMax - bucket.bMin;

  if (rRange >= gRange && rRange >= bRange) return { channel: 'r', range: rRange };
  if (gRange >= rRange && gRange >= bRange) return { channel: 'g', range: gRange };
  return { channel: 'b', range: bRange };
};

const getBucketAverage = (bucket: ColorBucket): Pixel => {
  const len = bucket.pixels.length;
  let rSum = 0, gSum = 0, bSum = 0;
  for (const p of bucket.pixels) {
    rSum += p.r;
    gSum += p.g;
    bSum += p.b;
  }
  return {
    r: Math.round(rSum / len),
    g: Math.round(gSum / len),
    b: Math.round(bSum / len),
  };
};

const splitBucket = (bucket: ColorBucket, channel: 'r' | 'g' | 'b'): [ColorBucket, ColorBucket] | null => {
  if (bucket.pixels.length < 2) return null;

  const sorted = [...bucket.pixels].sort((a, b) => a[channel] - b[channel]);
  const mid = Math.floor(sorted.length / 2);

  const leftPixels = sorted.slice(0, mid);
  const rightPixels = sorted.slice(mid);

  if (leftPixels.length === 0 || rightPixels.length === 0) return null;

  return [createBucket(leftPixels), createBucket(rightPixels)];
};

const medianCutRecursive = (bucket: ColorBucket, depth: number, targetDepth: number): ColorBucket[] => {
  if (depth >= targetDepth || bucket.pixels.length < 2) {
    return [bucket];
  }

  const { channel, range } = getBucketRange(bucket);
  if (range < 10) {
    return [bucket];
  }

  const split = splitBucket(bucket, channel);
  if (!split) return [bucket];

  const [left, right] = split;
  const leftResult = medianCutRecursive(left, depth + 1, targetDepth);
  const rightResult = medianCutRecursive(right, depth + 1, targetDepth);

  return [...leftResult, ...rightResult];
};

const medianCut = (pixels: Pixel[], numColors: number): string[] => {
  if (pixels.length === 0) return [];

  const initialBucket = createBucket(pixels);
  const targetDepth = Math.ceil(Math.log2(Math.max(2, numColors)));
  const buckets = medianCutRecursive(initialBucket, 0, targetDepth);

  const validBuckets = buckets.filter((b) => b.pixels.length > 0);
  validBuckets.sort((a, b) => b.pixels.length - a.pixels.length);

  const selected = validBuckets.slice(0, numColors);
  const colors = selected.map((bucket) => {
    const avg = getBucketAverage(bucket);
    return rgbToHex(avg.r, avg.g, avg.b);
  });

  return colors;
};

const sortColors = (colors: string[]): string[] => {
  const colorObjs = colors.map(hexToRgb);
  const withLuminance = colorObjs.map((c, i) => ({
    hex: colors[i],
    luminance: 0.299 * c.r + 0.587 * c.g + 0.114 * c.b,
  }));
  withLuminance.sort((a, b) => b.luminance - a.luminance);
  return withLuminance.map((c) => c.hex);
};

const colorDistance = (c1: string, c2: string): number => {
  const rgb1 = hexToRgb(c1);
  const rgb2 = hexToRgb(c2);
  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) + Math.pow(rgb1.g - rgb2.g, 2) + Math.pow(rgb1.b - rgb2.b, 2)
  );
};

const removeSimilarColors = (colors: string[], minDistance: number = 35): string[] => {
  const result: string[] = [];
  for (const color of colors) {
    const isSimilar = result.some((c) => colorDistance(c, color) < minDistance);
    if (!isSimilar) {
      result.push(color);
    }
  }
  return result;
};

const compressImageWithCanvas = (file: File, maxWidth: number = 800): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
};

export default function ColorExtractor({ onColorsExtracted, onImageProcessed }: ColorExtractorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const extractColorsFromImage = useCallback(
    (imageSrc: string) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
          setIsProcessing(false);
          return;
        }

        const maxSize = 400;
        let width = img.width;
        let height = img.height;

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          setIsProcessing(false);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        const pixels: Pixel[] = [];
        const step = Math.max(1, Math.floor(data.length / 4 / 20000));

        for (let i = 0; i < data.length; i += 4 * step) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a > 128 && !(r > 252 && g > 252 && b > 252) && !(r < 3 && g < 3 && b < 3)) {
            pixels.push({ r, g, b });
          }
        }

        if (pixels.length === 0) {
          setError('图片中没有可提取的有效色彩');
          setIsProcessing(false);
          return;
        }

        const numColors = Math.min(8, Math.max(5, Math.ceil(Math.sqrt(pixels.length) / 8)));
        let colors = medianCut(pixels, numColors);
        colors = removeSimilarColors(colors, 40);
        colors = sortColors(colors);

        onColorsExtracted(colors);
        setIsProcessing(false);
      };

      img.onerror = () => {
        setError('图片加载失败');
        setIsProcessing(false);
      };

      img.src = imageSrc;
    },
    [onColorsExtracted]
  );

  const processImage = useCallback(
    async (file: File) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setError('只支持 JPG 和 PNG 格式的图片');
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        let finalImageSrc: string;

        if (file.size > 5 * 1024 * 1024) {
          finalImageSrc = await compressImageWithCanvas(file, 800);
        } else {
          finalImageSrc = URL.createObjectURL(file);
        }

        setPreviewUrl(finalImageSrc);
        onImageProcessed?.(finalImageSrc);
        extractColorsFromImage(finalImageSrc);
      } catch (err) {
        setError('处理图片时出错');
        setIsProcessing(false);
      }
    },
    [extractColorsFromImage, onImageProcessed]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processImage(file);
      }
    },
    [processImage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        processImage(file);
      }
    },
    [processImage]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <canvas ref={canvasRef} className="hidden" />

      <div
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
          isDragging
            ? 'border-gray-800 bg-gray-50 scale-[1.02]'
            : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          onChange={handleFileChange}
          className="hidden"
        />

        {isProcessing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
            <p className="text-gray-500">正在提取色彩...</p>
          </div>
        ) : previewUrl ? (
          <div className="relative">
            <img
              src={previewUrl}
              alt="预览"
              className="max-h-64 mx-auto rounded-xl shadow-lg"
            />
            <p className="mt-4 text-sm text-gray-500">点击或拖拽更换图片</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-700">上传图片提取色彩</p>
              <p className="text-sm text-gray-500 mt-1">支持 JPG / PNG 格式，超过5MB自动压缩</p>
            </div>
            <div className="flex items-center gap-2 mt-4 text-gray-400">
              <ImageIcon className="w-5 h-5" />
              <span className="text-sm">拖拽图片到此处或点击上传</span>
            </div>
          </div>
        )}
      </div>

      {error && <p className="mt-3 text-red-500 text-sm">{error}</p>}
    </div>
  );
}
