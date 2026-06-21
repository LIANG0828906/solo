import * as d3 from 'd3';
import type { ShadowGridData, HeatmapResult, HeatmapStats } from '@/types';

export async function generateHeatmap(gridData: ShadowGridData): Promise<HeatmapResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const cells = gridData.cells;
      const total = cells.length;

      let noShadowCount = 0;
      let partialShadowCount = 0;
      let fullShadowCount = 0;
      let totalShadowValue = 0;

      for (const cell of cells) {
        totalShadowValue += cell.shadowValue;
        if (cell.shadowValue < 0.1) {
          noShadowCount++;
        } else if (cell.shadowValue <= 0.7) {
          partialShadowCount++;
        } else {
          fullShadowCount++;
        }
      }

      const stats: HeatmapStats = {
        noShadowPercent: (noShadowCount / total) * 100,
        partialShadowPercent: (partialShadowCount / total) * 100,
        fullShadowPercent: (fullShadowCount / total) * 100,
      };

      const colorScale = d3.scaleLinear()
        .domain([0, 0.5, 1])
        .range(['#B8E4F0', '#FFD93D', '#C92A2A'] as unknown as number[])
        .interpolate(d3.interpolateRgb as unknown as d3.InterpolatorFactory<number, string>);

      const heatmapWidth = 500;
      const heatmapHeight = 500;
      const cellSize = 50;

      let heatmapSvgContent = '';
      for (const cell of cells) {
        const x = cell.x * cellSize;
        const y = cell.z * cellSize;
        const fill = colorScale(cell.shadowValue);
        heatmapSvgContent += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${fill}" opacity="0.6"/>`;
      }

      const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${heatmapWidth}" height="${heatmapHeight}" viewBox="0 0 ${heatmapWidth} ${heatmapHeight}">${heatmapSvgContent}</svg>`;

      const pieWidth = 220;
      const pieHeight = 220;
      const radius = Math.min(pieWidth, pieHeight) / 2 - 10;
      const cx = pieWidth / 2;
      const cy = pieHeight / 2;

      const pieData = [
        { label: 'noShadow', value: noShadowCount, color: '#5BC0EB' },
        { label: 'partialShadow', value: partialShadowCount, color: '#FFD93D' },
        { label: 'fullShadow', value: fullShadowCount, color: '#C92A2A' },
      ];

      const pieGenerator = d3.pie<typeof pieData[0]>()
        .value((d) => d.value)
        .sort(null);

      const arcGenerator = d3.arc<d3.PieArcDatum<typeof pieData[0]>>()
        .innerRadius(0)
        .outerRadius(radius);

      const arcs = pieGenerator(pieData);
      let pieSvgContent = '';
      for (const arc of arcs) {
        const pathData = arcGenerator(arc);
        if (pathData) {
          pieSvgContent += `<path d="${pathData}" fill="${arc.data.color}"/>`;
        }
      }

      const avgShadowPercent = ((totalShadowValue / total) * 100).toFixed(1);
      pieSvgContent += `<text x="${cx}" y="${cy - 5}" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="14" fill="#333" font-weight="bold">阴影占比</text>`;
      pieSvgContent += `<text x="${cx}" y="${cy + 15}" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="20" fill="#333" font-weight="bold">${avgShadowPercent}%</text>`;

      const pieSvgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${pieWidth}" height="${pieHeight}" viewBox="0 0 ${pieWidth} ${pieHeight}">${pieSvgContent}</svg>`;

      resolve({
        svgString,
        pieSvgString,
        stats,
        gridData,
      });
    }, 0);
  });
}

export function exportSVG(heatmapSvg: string, pieSvg: string): string {
  const heatmapMatch = heatmapSvg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
  const pieMatch = pieSvg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
  const heatmapContent = heatmapMatch ? heatmapMatch[1] : '';
  const pieContent = pieMatch ? pieMatch[1] : '';

  const heatmapWidth = 500;
  const heatmapHeight = 500;
  const pieWidth = 220;
  const pieHeight = 220;
  const padding = 30;
  const totalWidth = heatmapWidth + pieWidth + padding * 3;
  const totalHeight = Math.max(heatmapHeight, pieHeight) + padding * 2;
  const pieX = heatmapWidth + padding * 2;
  const pieY = padding + (Math.max(heatmapHeight, pieHeight) - pieHeight) / 2;

  const combinedContent = `
    <g transform="translate(${padding}, ${padding})">
      ${heatmapContent}
    </g>
    <g transform="translate(${pieX}, ${pieY})">
      ${pieContent}
    </g>
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">${combinedContent}</svg>`;
}
