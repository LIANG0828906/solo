export function renderTextOnCanvas(
  canvas: HTMLCanvasElement,
  text: string,
  fontFamily: string,
  fontSize: number,
  lineHeight: number,
  color: string,
  backgroundColor: string
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const displayWidth = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;

  canvas.width = displayWidth * dpr;
  canvas.height = displayHeight * dpr;
  ctx.scale(dpr, dpr);

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, displayWidth, displayHeight);

  ctx.fillStyle = color;
  ctx.font = `${fontSize}px "${fontFamily}", sans-serif`;
  ctx.textBaseline = 'top';

  const lineHeightPx = fontSize * lineHeight;
  const padding = 8;
  const maxWidth = displayWidth - padding * 2;
  const words = text.split(' ');
  let line = '';
  let y = padding;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), padding, y);
      line = words[i] + ' ';
      y += lineHeightPx;
      if (y + fontSize > displayHeight) break;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), padding, y);
}

export function renderMiniPreview(
  canvas: HTMLCanvasElement,
  text: string,
  fontFamily: string,
  backgroundColor: string = '#FFFFFF'
) {
  renderTextOnCanvas(canvas, text, fontFamily, 16, 1.2, '#333333', backgroundColor);
}
