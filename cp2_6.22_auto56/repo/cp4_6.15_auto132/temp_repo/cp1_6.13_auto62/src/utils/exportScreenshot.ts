export interface ExportOptions {
  width: number;
  height: number;
  format: 'png';
}

export function exportScreenshot(
  canvas: HTMLCanvasElement,
  options: ExportOptions,
  onComplete: () => void
): void {
  const originalWidth = canvas.width;
  const originalHeight = canvas.height;

  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  if (!gl) {
    onComplete();
    return;
  }

  const renderer = (canvas as unknown as Record<string, unknown>).__renderer as {
    setSize: (w: number, h: number) => void;
    render: (scene: unknown, camera: unknown) => void;
    domElement: HTMLCanvasElement;
  } | undefined;

  if (renderer) {
    renderer.setSize(options.width, options.height, false);
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      try {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `style-viewer-${Date.now()}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch {
        // silently handle
      }

      if (renderer) {
        renderer.setSize(originalWidth, originalHeight, false);
      }

      onComplete();
    });
  });
}

export function captureCanvasScreenshot(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  canvas: HTMLCanvasElement,
  onComplete: () => void
): void {
  try {
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `style-viewer-${Date.now()}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch {
    // silently handle
  }
  onComplete();
}
