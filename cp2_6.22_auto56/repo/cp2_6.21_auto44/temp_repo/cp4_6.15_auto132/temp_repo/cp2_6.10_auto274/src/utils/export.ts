import html2canvas from 'html2canvas';

export const downloadImage = (canvas: HTMLCanvasElement, filename: string): void => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
};

export const exportAsImage = async (
  elementId: string,
  filename: string
): Promise<HTMLCanvasElement | null> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`Element with id "${elementId}" not found`);
    return null;
  }

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#f5e6c8',
      scale: 2,
      useCORS: true,
      logging: false,
    });

    downloadImage(canvas, filename);
    return canvas;
  } catch (error) {
    console.error('Failed to export image:', error);
    return null;
  }
};

export const generateScrollAnimation = async (element: HTMLElement): Promise<void> => {
  const originalTransform = element.style.transform;
  const originalOpacity = element.style.opacity;

  element.style.transform = 'scaleX(0)';
  element.style.opacity = '0';
  element.style.transformOrigin = 'center center';
  element.style.transition = 'none';

  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  element.style.transition = 'transform 0.8s ease-out, opacity 0.8s ease-out';
  element.style.transform = 'scaleX(1)';
  element.style.opacity = '1';

  await new Promise<void>((resolve) => {
    setTimeout(() => {
      element.style.transform = originalTransform;
      element.style.opacity = originalOpacity;
      element.style.transition = '';
      element.style.transformOrigin = '';
      resolve();
    }, 800);
  });
};

export const exportWithScrollEffect = async (
  elementId: string,
  filename: string
): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`Element with id "${elementId}" not found`);
    return;
  }

  await generateScrollAnimation(element);
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 300));
  await exportAsImage(elementId, filename);
};
