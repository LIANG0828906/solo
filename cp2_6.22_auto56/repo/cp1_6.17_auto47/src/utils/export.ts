import { ChartNode, ChartEdge, CONFIG } from '@/types';
import { drawNode, drawEdge, drawGrid, getNodesBounds } from './canvas';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportToPNG = async (
  nodes: ChartNode[],
  edges: ChartEdge[],
  canvasRef: React.RefObject<HTMLCanvasElement>
): Promise<void> => {
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = CONFIG.EXPORT_WIDTH;
  exportCanvas.height = CONFIG.EXPORT_HEIGHT;
  const ctx = exportCanvas.getContext('2d');

  if (!ctx) return;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, CONFIG.EXPORT_WIDTH, CONFIG.EXPORT_HEIGHT);

  const bounds = getNodesBounds(nodes);
  const contentWidth = bounds.maxX - bounds.minX;
  const contentHeight = bounds.maxY - bounds.minY;

  const scaleX = (CONFIG.EXPORT_WIDTH - 100) / contentWidth;
  const scaleY = (CONFIG.EXPORT_HEIGHT - 100) / contentHeight;
  const scale = Math.min(scaleX, scaleY, 2);

  const offsetX = (CONFIG.EXPORT_WIDTH - contentWidth * scale) / 2 - bounds.minX * scale;
  const offsetY = (CONFIG.EXPORT_HEIGHT - contentHeight * scale) / 2 - bounds.minY * scale;

  drawGrid(ctx, CONFIG.EXPORT_WIDTH, CONFIG.EXPORT_HEIGHT, 0, 0, 1);

  for (const edge of edges) {
    drawEdge(ctx, edge, nodes, false, offsetX, offsetY, scale);
  }

  for (const node of nodes) {
    drawNode(ctx, node, false, false, false, offsetX, offsetY, scale);
  }

  const dataURL = exportCanvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `infographic-${Date.now()}.png`;
  link.href = dataURL;
  link.click();
};

export const exportToPDF = async (
  nodes: ChartNode[],
  edges: ChartEdge[],
  canvasRef: React.RefObject<HTMLCanvasElement>
): Promise<void> => {
  if (!canvasRef.current) return;

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = CONFIG.EXPORT_WIDTH;
  exportCanvas.height = CONFIG.EXPORT_HEIGHT;
  const ctx = exportCanvas.getContext('2d');

  if (!ctx) return;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, CONFIG.EXPORT_WIDTH, CONFIG.EXPORT_HEIGHT);

  const bounds = getNodesBounds(nodes);
  const contentWidth = bounds.maxX - bounds.minX;
  const contentHeight = bounds.maxY - bounds.minY;

  const scaleX = (CONFIG.EXPORT_WIDTH - 100) / contentWidth;
  const scaleY = (CONFIG.EXPORT_HEIGHT - 100) / contentHeight;
  const scale = Math.min(scaleX, scaleY, 2);

  const offsetX = (CONFIG.EXPORT_WIDTH - contentWidth * scale) / 2 - bounds.minX * scale;
  const offsetY = (CONFIG.EXPORT_HEIGHT - contentHeight * scale) / 2 - bounds.minY * scale;

  drawGrid(ctx, CONFIG.EXPORT_WIDTH, CONFIG.EXPORT_HEIGHT, 0, 0, 1);

  for (const edge of edges) {
    drawEdge(ctx, edge, nodes, false, offsetX, offsetY, scale);
  }

  for (const node of nodes) {
    drawNode(ctx, node, false, false, false, offsetX, offsetY, scale);
  }

  const imgData = exportCanvas.toDataURL('image/png');

  const pdf = new jsPDF({
    orientation: CONFIG.EXPORT_WIDTH > CONFIG.EXPORT_HEIGHT ? 'landscape' : 'portrait',
    unit: 'px',
    format: [CONFIG.EXPORT_WIDTH, CONFIG.EXPORT_HEIGHT],
  });

  pdf.addImage(imgData, 'PNG', 0, 0, CONFIG.EXPORT_WIDTH, CONFIG.EXPORT_HEIGHT);
  pdf.save(`infographic-${Date.now()}.pdf`);
};

export const generatePreviewDataURL = (
  nodes: ChartNode[],
  edges: ChartEdge[]
): string => {
  const previewWidth = 800;
  const previewHeight = 450;

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = previewWidth;
  exportCanvas.height = previewHeight;
  const ctx = exportCanvas.getContext('2d');

  if (!ctx) return '';

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, previewWidth, previewHeight);

  if (nodes.length === 0) {
    return exportCanvas.toDataURL('image/png');
  }

  const bounds = getNodesBounds(nodes);
  const contentWidth = bounds.maxX - bounds.minX;
  const contentHeight = bounds.maxY - bounds.minY;

  const scaleX = (previewWidth - 40) / contentWidth;
  const scaleY = (previewHeight - 40) / contentHeight;
  const scale = Math.min(scaleX, scaleY, 1);

  const offsetX = (previewWidth - contentWidth * scale) / 2 - bounds.minX * scale;
  const offsetY = (previewHeight - contentHeight * scale) / 2 - bounds.minY * scale;

  drawGrid(ctx, previewWidth, previewHeight, 0, 0, 1);

  for (const edge of edges) {
    drawEdge(ctx, edge, nodes, false, offsetX, offsetY, scale);
  }

  for (const node of nodes) {
    drawNode(ctx, node, false, false, false, offsetX, offsetY, scale);
  }

  return exportCanvas.toDataURL('image/png');
};

export const downloadDataURL = (dataURL: string, filename: string): void => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataURL;
  link.click();
};
