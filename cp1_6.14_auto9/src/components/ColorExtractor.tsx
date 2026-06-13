import { useRef, useState, useCallback } from 'react';
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ColorExtractorProps {
  onColorsExtracted: (colors: string[]) => void;
  onImageProcessed?: (imageUrl: string) => void;
}

interface ColorBucket {
  r: number[];
  g: number[];
  b: number[];
}

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
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

const getColorRange = (bucket: ColorBucket): { channel: 'r' | 'g' | 'b'; range: number } => {
  const rRange = Math.max(...bucket.r) - Math.min(...bucket.r);
  const gRange = Math.max(...bucket.g) - Math.min(...bucket.g);
  const bRange = Math.max(...bucket.b) - Math.min(...bucket.b);

  if (rRange >= gRange && rRange >= bRange) return { channel: 'r', range: rRange };
  if (gRange >= rRange && gRange >= bRange) return { channel: 'g', range: gRange };
  return { channel: 'b', range: bRange };
};

const getBucketAverage = (bucket: ColorBucket): { r: number; g: number; b: number } => {
  const r = bucket.r.reduce((a, b) => a + b, 0) / bucket.r.length;
  const g = bucket.g.reduce((a, b) => a + b, 0) / bucket.g.length;
  const b = bucket.b.reduce((a, b) => a + b, 0) / bucket.b.length;
  return { r, g, b };
};

const medianCut = (pixels: { r: number; g: number; b: number }[], numColors: number): string[] => {
  let buckets: ColorBucket[] = [
    {
      r: pixels.map((p) => p.r),
      g: pixels.map((p) => p.g),
      b: pixels.map((p) => p.b),
    },
  ];

  while (buckets.length < numColors) {
    let maxRange = -1;
    let maxBucketIndex = -1;
    let maxChannel: 'r' | 'g' | 'b' = 'r';

    buckets.forEach((bucket, index) => {
      if (bucket.r.length < 2) return;
      const { channel, range } = getColorRange(bucket);
      if (range > maxRange) {
        maxRange = range;
        maxBucketIndex = index;
        maxChannel = channel;
      }
    });

    if (maxBucketIndex === -1 || maxRange <= 10) break;

    const bucket = buckets[maxBucketIndex];
    const values = bucket[maxChannel].slice().sort((a, b) => a - b);
    const median = values[Math.floor(values.length / 2)];

    const left: ColorBucket = { r: [], g: [], b: [] };
    const right: ColorBucket = { r: [], g: [], b: [] };

    for (let i = 0; i < bucket.r.length; i++) {
      if (bucket[maxChannel][i] < median) {
        left.r.push(bucket.r[i]);
        left.g.push(bucket.g[i]);
        left.b.push(bucket.b[i]);
      } else {
        right.r.push(bucket.r[i]);
        right.g.push(bucket.g[i]);
        right.b.push(bucket.b[i]);
      }
    }

    if (left.r.length === 0 || right.r.length === 0) break;

    buckets.splice(maxBucketIndex, 1, left, right);
  }

  const colors = buckets.map((bucket) => {
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

const removeSimilarColors = (colors: string[], minDistance: number = 30): string[] => {
  const result: string[] = [];
  for (const color of colors) {
    const isSimilar = result.some((c) => colorDistance(c, color) < minDistance);
    if (!isSimilar) {
      result.push(color);
    }
  }
  return result;
};

export default function ColorExtractor({ onColorsExtracted, onImageProcessed }: ColorExtractorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const processImage = useCallback(
    async (file: File) => {
      if (file.size > 5 * 1024 * 1024) {
        setError('图片大小不能超过5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError('请上传图片文件');
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas) return;

          const maxSize = 800;
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
          if (!ctx) return;

          ctx.drawImage(img, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;

          const pixels: { r: number; g: number; b: number }[] = [];
          const step = Math.max(1, Math.floor(data.length / 4 / 10000));

          for (let i = 0; i < data.length; i += 4 * step) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            if (a > 128 && !(r > 250 && g > 250 && b > 250) && !(r < 5 && g < 5 && b < 5)) {
              pixels.push({ r, g, b });
            }
          }

          const numColors = Math.min(8, Math.max(5, Math.ceil(pixels.length / 2000)));
          let colors = medianCut(pixels, numColors);
          colors = removeSimilarColors(colors, 30);
          colors = sortColors(colors);

          onColorsExtracted(colors);
          onImageProcessed?.(objectUrl);
          setIsProcessing(false);
        };

        img.onerror = () => {
          setError('图片加载失败');
          setIsProcessing(false);
        };

        img.src = objectUrl;
      } catch (err) {
        setError('处理图片时出错');
        setIsProcessing(false);
      }
    },
    [onColorsExtracted, onImageProcessed]
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
              <p className="text-sm text-gray-500 mt-1">支持 JPG / PNG 格式，最大 5MB</p>
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
