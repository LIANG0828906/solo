import { useState } from 'react';
import { Download } from 'lucide-react';
import type { CanvasElement } from '@/types';
import { generateSVGString, downloadSVG } from '@/utils/svgUtils';

interface SVGExporterProps {
  elements: CanvasElement[];
}

export function SVGExporter({ elements }: SVGExporterProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (isExporting) return;

    setIsExporting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 100));

      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

      elements.forEach((el) => {
        const halfSize = 50 * el.scale;
        minX = Math.min(minX, el.x - halfSize);
        minY = Math.min(minY, el.y - halfSize);
        maxX = Math.max(maxX, el.x + halfSize);
        maxY = Math.max(maxY, el.y + halfSize);
      });

      if (elements.length === 0) {
        minX = 0;
        minY = 0;
        maxX = 1200;
        maxY = 800;
      } else {
        const padding = 50;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;
      }

      const width = Math.ceil(maxX - minX);
      const height = Math.ceil(maxY - minY);

      const shiftedElements = elements.map((el) => ({
        ...el,
        x: el.x - minX,
        y: el.y - minY,
      }));

      const svgString = generateSVGString(shiftedElements, width, height);
      downloadSVG(svgString);
    } finally {
      setTimeout(() => {
        setIsExporting(false);
      }, 500);
    }
  };

  return (
    <button className="export-btn" onClick={handleExport} disabled={isExporting}>
      <Download size={18} />
      {isExporting ? '导出中...' : '导出 SVG'}
    </button>
  );
}
