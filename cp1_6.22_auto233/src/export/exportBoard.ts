export async function exportBoardAsPNG(
  canvas: HTMLCanvasElement,
  projectName: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const exportWidth = 2000;
      const exportHeight = Math.floor(canvas.height * (exportWidth / canvas.width));

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = exportWidth;
      tempCanvas.height = exportHeight;
      const ctx = tempCanvas.getContext('2d');

      if (!ctx) {
        reject(new Error('无法创建画布上下文'));
        return;
      }

      ctx.clearRect(0, 0, exportWidth, exportHeight);
      ctx.drawImage(canvas, 0, 0, exportWidth, exportHeight);

      tempCanvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('导出失败'));
            return;
          }

          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;

          const now = new Date();
          const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
          const fileName = `${projectName}_${timestamp}.png`;

          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          resolve();
        },
        'image/png'
      );
    } catch (error) {
      reject(error);
    }
  });
}
