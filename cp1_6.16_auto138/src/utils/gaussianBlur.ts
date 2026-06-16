function generateGaussianKernel(radius: number): number[] {
  const sigma = radius / 3;
  const kernelSize = radius * 2 + 1;
  const kernel: number[] = [];
  let sum = 0;

  for (let i = 0; i < kernelSize; i++) {
    const x = i - radius;
    const value = Math.exp(-(x * x) / (2 * sigma * sigma));
    kernel.push(value);
    sum += value;
  }

  for (let i = 0; i < kernelSize; i++) {
    kernel[i] /= sum;
  }

  return kernel;
}

export function gaussianBlur(imageData: ImageData, radius: number): ImageData {
  if (radius <= 0) {
    return imageData;
  }

  const { width, height, data } = imageData;
  const kernel = generateGaussianKernel(radius);
  const kernelSize = kernel.length;
  const halfKernel = Math.floor(kernelSize / 2);

  const tempData = new Uint8ClampedArray(data);
  const resultData = new Uint8ClampedArray(data);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      for (let k = 0; k < kernelSize; k++) {
        const pixelX = Math.max(0, Math.min(width - 1, x + k - halfKernel));
        const index = (y * width + pixelX) * 4;

        r += data[index] * kernel[k];
        g += data[index + 1] * kernel[k];
        b += data[index + 2] * kernel[k];
        a += data[index + 3] * kernel[k];
      }

      const destIndex = (y * width + x) * 4;
      tempData[destIndex] = r;
      tempData[destIndex + 1] = g;
      tempData[destIndex + 2] = b;
      tempData[destIndex + 3] = a;
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      for (let k = 0; k < kernelSize; k++) {
        const pixelY = Math.max(0, Math.min(height - 1, y + k - halfKernel));
        const index = (pixelY * width + x) * 4;

        r += tempData[index] * kernel[k];
        g += tempData[index + 1] * kernel[k];
        b += tempData[index + 2] * kernel[k];
        a += tempData[index + 3] * kernel[k];
      }

      const destIndex = (y * width + x) * 4;
      resultData[destIndex] = r;
      resultData[destIndex + 1] = g;
      resultData[destIndex + 2] = b;
      resultData[destIndex + 3] = a;
    }
  }

  return new ImageData(resultData, width, height);
}
