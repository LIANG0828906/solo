import type { Node, Edge } from 'reactflow';

const NODE_PADDING_X = 32;
const NODE_PADDING_Y = 24;
const NODE_MIN_WIDTH = 120;
const NODE_MIN_HEIGHT = 48;
const FONT_SIZE_DEFAULT = 16;

const estimateTextWidth = (text: string, fontSize: number): number => {
  const avgCharWidth = fontSize * 0.6;
  return text.length * avgCharWidth;
};

const getNodeDimensions = (node: Node): { width: number; height: number } => {
  const fontSize = node.data?.fontSize || FONT_SIZE_DEFAULT;
  const title = node.data?.title || node.data?.label || '';
  const textWidth = estimateTextWidth(title, fontSize);
  const width = Math.max(NODE_MIN_WIDTH, textWidth + NODE_PADDING_X);
  const height = NODE_MIN_HEIGHT;
  return { width, height };
};

const calculateCanvasBounds = (nodes: Node[]) => {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 800, maxY: 600, width: 800, height: 600 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach((node) => {
    const { width, height } = getNodeDimensions(node);
    const x = node.position.x;
    const y = node.position.y;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  });

  const padding = 50;
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

const generateBezierPath = (
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number
): string => {
  const dx = Math.abs(targetX - sourceX);
  const controlOffset = Math.max(dx * 0.5, 50);

  const sourceCtrlX = sourceX + controlOffset;
  const sourceCtrlY = sourceY;
  const targetCtrlX = targetX - controlOffset;
  const targetCtrlY = targetY;

  return `M ${sourceX} ${sourceY} C ${sourceCtrlX} ${sourceCtrlY}, ${targetCtrlX} ${targetCtrlY}, ${targetX} ${targetY}`;
};

export const exportToSVG = (
  nodes: Node[],
  edges: Edge[],
  title: string = 'mindmap'
): string => {
  const bounds = calculateCanvasBounds(nodes);
  const offsetX = -bounds.minX;
  const offsetY = -bounds.minY;

  let svgContent = '';

  edges.forEach((edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);

    if (!sourceNode || !targetNode) return;

    const sourceDims = getNodeDimensions(sourceNode);
    const targetDims = getNodeDimensions(targetNode);

    const sourceX = sourceNode.position.x + sourceDims.width + offsetX;
    const sourceY = sourceNode.position.y + sourceDims.height / 2 + offsetY;
    const targetX = targetNode.position.x + offsetX;
    const targetY = targetNode.position.y + targetDims.height / 2 + offsetY;

    const path = generateBezierPath(sourceX, sourceY, targetX, targetY);

    svgContent += `    <path d="${path}" fill="none" stroke="#d1d5db" stroke-width="2" stroke-linecap="round" />\n`;
  });

  nodes.forEach((node) => {
    const { width, height } = getNodeDimensions(node);
    const x = node.position.x + offsetX;
    const y = node.position.y + offsetY;
    const color = node.data?.color || '#ffffff';
    const fontSize = node.data?.fontSize || FONT_SIZE_DEFAULT;
    const label = node.data?.title || node.data?.label || '';

    svgContent += `    <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8" ry="8" fill="${color}" stroke="#e5e7eb" stroke-width="1" />\n`;

    const textX = x + width / 2;
    const textY = y + height / 2 + fontSize / 3;

    const escapedLabel = label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    svgContent += `    <text x="${textX}" y="${textY}" text-anchor="middle" fill="#1f2937" font-size="${fontSize}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif">${escapedLabel}</text>\n`;
  });

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${bounds.width}" height="${bounds.height}" viewBox="0 0 ${bounds.width} ${bounds.height}" style="background-color: #ffffff;">
  <rect width="100%" height="100%" fill="#ffffff" />
${svgContent}
</svg>`;

  return svg;
};

interface MarkdownNode {
  id: string;
  title: string;
  note: string;
  children: MarkdownNode[];
}

const buildNodeTree = (nodes: Node[], edges: Edge[]): MarkdownNode[] => {
  const nodeMap = new Map<string, MarkdownNode>();
  const childIds = new Set<string>();

  nodes.forEach((node) => {
    nodeMap.set(node.id, {
      id: node.id,
      title: node.data?.title || node.data?.label || '',
      note: node.data?.note || '',
      children: [],
    });
  });

  edges.forEach((edge) => {
    const parent = nodeMap.get(edge.source);
    const child = nodeMap.get(edge.target);
    if (parent && child) {
      parent.children.push(child);
      childIds.add(child.id);
    }
  });

  const roots: MarkdownNode[] = [];
  nodes.forEach((node) => {
    if (!childIds.has(node.id)) {
      const mdNode = nodeMap.get(node.id);
      if (mdNode) {
        roots.push(mdNode);
      }
    }
  });

  return roots;
};

const renderMarkdownTree = (nodes: MarkdownNode[], depth: number = 0): string => {
  let result = '';
  const indent = '  '.repeat(depth);

  nodes.forEach((node) => {
    result += `${indent}- ${node.title}\n`;

    if (node.note && node.note.trim()) {
      const noteLines = node.note.split('\n');
      noteLines.forEach((line) => {
        result += `${indent}  > ${line}\n`;
      });
    }

    if (node.children.length > 0) {
      result += renderMarkdownTree(node.children, depth + 1);
    }
  });

  return result;
};

export const exportToMarkdown = (
  nodes: Node[],
  edges: Edge[],
  title: string = '思维导图'
): string => {
  const roots = buildNodeTree(nodes, edges);

  let markdown = `# ${title}\n\n`;
  markdown += renderMarkdownTree(roots);

  return markdown;
};

export const downloadSVG = (
  nodes: Node[],
  edges: Edge[],
  filename: string = 'mindmap.svg'
) => {
  const svgContent = exportToSVG(nodes, edges, filename);
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadMarkdown = (
  nodes: Node[],
  edges: Edge[],
  filename: string = 'mindmap.md'
) => {
  const mdContent = exportToMarkdown(nodes, edges, filename.replace('.md', ''));
  const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.md') ? filename : `${filename}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
