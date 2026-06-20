export function setupExportAction(canvas: HTMLCanvasElement, button: HTMLElement): void {
  button.addEventListener('click', () => {
    try {
      const dataURL = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .replace('T', '_')
        .slice(0, 19);
      link.download = `sculpture_${timestamp}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('导出截图失败:', err);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            alert('截图导出失败，请重试');
            return;
          }
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          const timestamp = new Date()
            .toISOString()
            .replace(/[:.]/g, '-')
            .replace('T', '_')
            .slice(0, 19);
          link.download = `sculpture_${timestamp}.png`;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 2000);
        },
        'image/png',
        0.95
      );
    }
  });
}
