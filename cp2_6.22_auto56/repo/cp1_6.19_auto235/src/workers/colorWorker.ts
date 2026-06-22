interface WorkerMessage {
  type: 'extract';
  imageData: string;
  primaryCount: number;
  accentCount: number;
}

interface WorkerResponse {
  type: 'success' | 'error';
  primaryColors?: string[];
  accentColors?: string[];
  error?: string;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
}

function compressImage(imageData: string, maxSize: number = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageData;
  });
}

async function extractColors(
  imageData: string,
  primaryCount: number,
  accentCount: number
): Promise<{ primary: string[]; accent: string[] }> {
  const compressedData = await compressImage(imageData, 400);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);

        const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixelCount = imageDataObj.data.length / 4;
        const colorMap = new Map<string, number>();

        const step = Math.max(1, Math.floor(pixelCount / 10000));

        for (let i = 0; i < pixelCount; i += step) {
          const r = imageDataObj.data[i * 4];
          const g = imageDataObj.data[i * 4 + 1];
          const b = imageDataObj.data[i * 4 + 2];
          const a = imageDataObj.data[i * 4 + 3];

          if (a < 128) continue;

          const rQuant = Math.round(r / 10) * 10;
          const gQuant = Math.round(g / 10) * 10;
          const bQuant = Math.round(b / 10) * 10;
          const key = `${rQuant},${gQuant},${bQuant}`;

          colorMap.set(key, (colorMap.get(key) || 0) + 1);
        }

        const sortedColors = Array.from(colorMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, primaryCount + accentCount + 5);

        const colors: string[] = [];
        for (const [key] of sortedColors) {
          const [r, g, b] = key.split(',').map(Number);
          const hex = rgbToHex(r, g, b);
          if (!colors.includes(hex)) {
            colors.push(hex);
          }
          if (colors.length >= primaryCount + accentCount) break;
        }

        while (colors.length < primaryCount + accentCount) {
          colors.push('#808080');
        }

        const primary = colors.slice(0, primaryCount);
        const accent = colors.slice(primaryCount, primaryCount + accentCount);

        resolve({ primary, accent });
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image for color extraction'));
    img.src = compressedData;
  });
}

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { type, imageData, primaryCount, accentCount } = e.data;

  if (type === 'extract') {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Color extraction timed out')), 800);
      });

      const result = await Promise.race([
        extractColors(imageData, primaryCount, accentCount),
        timeoutPromise
      ]);

      const response: WorkerResponse = {
        type: 'success',
        primaryColors: result.primary,
        accentColors: result.accent
      };
      self.postMessage(response);
    } catch (error) {
      const fallbackPrimary = ['#4A90D9', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];
      const fallbackAccent = ['#FFEAA7', '#DDA0DD', '#98D8C8'];

      const response: WorkerResponse = {
        type: 'success',
        primaryColors: fallbackPrimary.slice(0, primaryCount),
        accentColors: fallbackAccent.slice(0, accentCount)
      };
      self.postMessage(response);
    }
  }
};

export {};
