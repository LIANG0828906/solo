import type { DataModel, Layer } from './DataModel';

const EXPORT_WIDTH = 1200;
const EXPORT_HEIGHT = 800;

export class ExportTool {
  private dataModel: DataModel;

  constructor(dataModel: DataModel) {
    this.dataModel = dataModel;
  }

  generateSVGString(): string {
    const project = this.dataModel.getProject();
    const layers = this.dataModel.getLayers().filter(l => l.visible);

    let svgContent = '';

    layers.forEach(layer => {
      svgContent += this.layerToSVGElement(layer);
    });

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${EXPORT_WIDTH}" 
     height="${EXPORT_HEIGHT}" 
     viewBox="0 0 ${EXPORT_WIDTH} ${EXPORT_HEIGHT}">
  <rect width="100%" height="100%" fill="${project.backgroundColor}"/>
  <g id="sketch-to-shape-export" name="${this.escapeXml(project.name)}">
${svgContent}  </g>
</svg>`;

    return svg;
  }

  private layerToSVGElement(layer: Layer): string {
    const { path, transform, name } = layer;
    const { bounds, pathString, color, strokeWidth } = path;
    const { tx, ty, scaleX, scaleY, rotation } = transform;

    const transformStr = [
      `translate(${tx.toFixed(2)}, ${ty.toFixed(2)})`,
      `rotate(${rotation.toFixed(2)}, ${bounds.centerX.toFixed(2)}, ${bounds.centerY.toFixed(2)})`,
      `scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)})`
    ].join(' ');

    return `    <g id="${layer.id}" name="${this.escapeXml(name)}">
      <path d="${pathString}" 
            fill="none" 
            stroke="${color}" 
            stroke-width="${strokeWidth}" 
            stroke-linecap="round" 
            stroke-linejoin="round"
            transform="${transformStr}"/>
    </g>
`;
  }

  async exportSVG(filename = 'sketch-to-shape.svg'): Promise<void> {
    const svgString = this.generateSVGString();
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    this.triggerDownload(blob, filename);
  }

  async exportPNG(filename = 'sketch-to-shape.png', scale = 2): Promise<void> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = EXPORT_WIDTH * scale;
      canvas.height = EXPORT_HEIGHT * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context not available'));
        return;
      }

      ctx.scale(scale, scale);
      const project = this.dataModel.getProject();
      ctx.fillStyle = project.backgroundColor;
      ctx.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);

      const svgString = this.generateSVGString();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => {
          if (blob) {
            this.triggerDownload(blob, filename);
            resolve();
          } else {
            reject(new Error('Failed to create PNG blob'));
          }
        }, 'image/png');
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load SVG for PNG export'));
      };
      img.src = url;
    });
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
