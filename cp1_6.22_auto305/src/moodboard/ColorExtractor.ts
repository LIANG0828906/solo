export class ColorExtractor {
  private static rgbToHex(r: number, g: number, b: number): string {
    return (
      '#' +
      [r, g, b]
        .map((x) => {
          const hex = Math.round(x).toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        })
        .join('')
    );
  }

  private static hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [0, 0, 0];
  }

  private static colorDistance(
    a: [number, number, number],
    b: [number, number, number]
  ): number {
    return (
      Math.pow(a[0] - b[0], 2) +
      Math.pow(a[1] - b[1], 2) +
      Math.pow(a[2] - b[2], 2)
    );
  }

  private static kMeansCluster(
    colors: [number, number, number][],
    k: number = 3,
    iterations: number = 10
  ): [number, number, number] {
    if (colors.length === 0) return [128, 128, 128];
    if (colors.length <= k) return colors[0];

    let centroids: [number, number, number][] = [];
    const step = Math.floor(colors.length / k);
    for (let i = 0; i < k; i++) {
      centroids.push(colors[i * step]);
    }

    for (let iter = 0; iter < iterations; iter++) {
      const clusters: [number, number, number][][] = Array.from(
        { length: k },
        () => []
      );

      for (const color of colors) {
        let minDist = Infinity;
        let clusterIndex = 0;
        for (let i = 0; i < k; i++) {
          const dist = this.colorDistance(color, centroids[i]);
          if (dist < minDist) {
            minDist = dist;
            clusterIndex = i;
          }
        }
        clusters[clusterIndex].push(color);
      }

      let converged = true;
      for (let i = 0; i < k; i++) {
        if (clusters[i].length === 0) continue;

        const sum = clusters[i].reduce(
          (acc, c) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]],
          [0, 0, 0]
        );
        const newCentroid: [number, number, number] = [
          sum[0] / clusters[i].length,
          sum[1] / clusters[i].length,
          sum[2] / clusters[i].length,
        ];

        if (this.colorDistance(newCentroid, centroids[i]) > 1) {
          converged = false;
        }
        centroids[i] = newCentroid;
      }

      if (converged) break;
    }

    let largestCluster = 0;
    for (let i = 1; i < k; i++) {
      if (centroids[i] && (!centroids[largestCluster] || i > largestCluster)) {
        largestCluster = i;
      }
    }

    return centroids[largestCluster] || centroids[0];
  }

  static extractFromImage(
    imageElement: HTMLImageElement,
    clickX: number,
    clickY: number,
    areaSize: number = 50
  ): string | null {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const naturalWidth = imageElement.naturalWidth;
      const naturalHeight = imageElement.naturalHeight;
      const displayedWidth = imageElement.width || imageElement.offsetWidth;
      const displayedHeight = imageElement.height || imageElement.offsetHeight;

      const scaleX = naturalWidth / displayedWidth;
      const scaleY = naturalHeight / displayedHeight;

      const sampleX = clickX * scaleX;
      const sampleY = clickY * scaleY;
      const sampleSize = areaSize * Math.max(scaleX, scaleY);

      const sourceX = Math.max(0, sampleX - sampleSize / 2);
      const sourceY = Math.max(0, sampleY - sampleSize / 2);
      const sourceWidth = Math.min(sampleSize, naturalWidth - sourceX);
      const sourceHeight = Math.min(sampleSize, naturalHeight - sourceY);

      const sampleCanvasSize = 60;
      canvas.width = sampleCanvasSize;
      canvas.height = sampleCanvasSize;

      ctx.drawImage(
        imageElement,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        sampleCanvasSize,
        sampleCanvasSize
      );

      const imageData = ctx.getImageData(0, 0, sampleCanvasSize, sampleCanvasSize);
      const data = imageData.data;
      const colors: [number, number, number][] = [];

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a > 128) {
          colors.push([r, g, b]);
        }
      }

      if (colors.length === 0) return null;

      const dominantColor = this.kMeansCluster(colors, 3, 8);
      return this.rgbToHex(dominantColor[0], dominantColor[1], dominantColor[2]);
    } catch (e) {
      return null;
    }
  }

  static generateId(): string {
    return `swatch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
