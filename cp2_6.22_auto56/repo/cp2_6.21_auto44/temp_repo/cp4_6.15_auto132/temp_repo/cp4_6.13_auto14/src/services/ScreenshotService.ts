export class ScreenshotService {
  private static uiElements: HTMLElement[] = [];

  public static registerUIElement(element: HTMLElement): void {
    this.uiElements.push(element);
  }

  public static capture(
    canvas: HTMLCanvasElement,
    filename: string = 'molecule.png'
  ): void {
    const uiLayer = document.getElementById('ui-layer');

    if (uiLayer) {
      uiLayer.style.display = 'none';
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          const dataURL = canvas.toDataURL('image/png');

          const link = document.createElement('a');
          link.download = filename;
          link.href = dataURL;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } finally {
          if (uiLayer) {
            uiLayer.style.display = '';
          }
        }
      });
    });
  }

  public static captureWithBackground(
    canvas: HTMLCanvasElement,
    bgColor: string,
    filename: string = 'molecule.png'
  ): void {
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d')!;

    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    ctx.drawImage(canvas, 0, 0);

    const dataURL = tempCanvas.toDataURL('image/png');

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
