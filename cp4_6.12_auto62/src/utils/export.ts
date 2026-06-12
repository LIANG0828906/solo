import type { FlowNode, FlowEdge } from '../types';

export interface ExportData {
  version: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  exportedAt: string;
}

export function exportToJSON(nodes: FlowNode[], edges: FlowEdge[]): string {
  const data: ExportData = {
    version: '1.0.0',
    nodes,
    edges,
    exportedAt: new Date().toISOString()
  };
  return JSON.stringify(data, null, 2);
}

export function downloadJSON(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function importFromJSON(file: File): Promise<ExportData> {
  return new Promise((resolve, reject) => {
    if (!file.name.endsWith('.json')) {
      reject(new Error('请选择JSON文件'));
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as ExportData;
        
        if (!data.nodes || !Array.isArray(data.nodes)) {
          reject(new Error('JSON格式无效：缺少nodes字段'));
          return;
        }
        if (!data.edges || !Array.isArray(data.edges)) {
          reject(new Error('JSON格式无效：缺少edges字段'));
          return;
        }
        
        resolve(data);
      } catch (err) {
        reject(new Error('JSON解析失败'));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}

export interface FitViewResult {
  pan: { x: number; y: number };
  zoom: number;
}

export function calculateFitView(
  nodes: FlowNode[],
  viewportWidth: number,
  viewportHeight: number
): FitViewResult {
  if (nodes.length === 0) {
    return { pan: { x: 0, y: 0 }, zoom: 1 };
  }
  
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  for (const node of nodes) {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + node.width);
    maxY = Math.max(maxY, node.y + node.height);
  }
  
  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;
  const contentCenterX = (minX + maxX) / 2;
  const contentCenterY = (minY + maxY) / 2;
  
  const padding = 80;
  const availableWidth = viewportWidth - padding * 2;
  const availableHeight = viewportHeight - padding * 2;
  
  const scaleX = availableWidth / (contentWidth || 1);
  const scaleY = availableHeight / (contentHeight || 1);
  let zoom = Math.min(scaleX, scaleY, 1);
  zoom = Math.max(0.5, Math.min(3, zoom));
  
  const pan = {
    x: viewportWidth / 2 - contentCenterX * zoom,
    y: viewportHeight / 2 - contentCenterY * zoom
  };
  
  return { pan, zoom };
}
