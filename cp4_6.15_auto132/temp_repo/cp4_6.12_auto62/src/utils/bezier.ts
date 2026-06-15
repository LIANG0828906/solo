import type { FlowNode, Point, BezierPath } from '../types';

export function getNodeEdgePoint(node: FlowNode, targetX: number, targetY: number): Point {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  
  const dx = targetX - cx;
  const dy = targetY - cy;
  
  if (Math.abs(dx) * node.height > Math.abs(dy) * node.width) {
    return {
      x: dx > 0 ? node.x + node.width : node.x,
      y: cy + (dy / Math.abs(dx || 1)) * (node.width / 2)
    };
  } else {
    return {
      x: cx + (dx / Math.abs(dy || 1)) * (node.height / 2),
      y: dy > 0 ? node.y + node.height : node.y
    };
  }
}

export function computeBezierPath(source: FlowNode, target: FlowNode): BezierPath {
  const sourceCenter = {
    x: source.x + source.width / 2,
    y: source.y + source.height / 2
  };
  const targetCenter = {
    x: target.x + target.width / 2,
    y: target.y + target.height / 2
  };
  
  const startPoint = getNodeEdgePoint(source, targetCenter.x, targetCenter.y);
  const endPoint = getNodeEdgePoint(target, sourceCenter.x, sourceCenter.y);
  
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  const midX = (startPoint.x + endPoint.x) / 2;
  const midY = (startPoint.y + endPoint.y) / 2;
  
  const offset = distance * 0.2;
  const perpX = -dy / (distance || 1) * offset;
  const perpY = dx / (distance || 1) * offset;
  
  const controlPoint = {
    x: midX + perpX,
    y: midY + perpY
  };
  
  const midPoint = {
    x: midX + perpX * 0.5,
    y: midY + perpY * 0.5
  };
  
  const path = `M ${startPoint.x} ${startPoint.y} Q ${controlPoint.x} ${controlPoint.y} ${endPoint.x} ${endPoint.y}`;
  
  return { path, startPoint, endPoint, controlPoint, midPoint };
}

export function getArrowPoints(endPoint: Point, controlPoint: Point): string {
  const dx = endPoint.x - controlPoint.x;
  const dy = endPoint.y - controlPoint.y;
  const angle = Math.atan2(dy, dx);
  const arrowSize = 10;
  
  const p1 = {
    x: endPoint.x - arrowSize * Math.cos(angle - Math.PI / 6),
    y: endPoint.y - arrowSize * Math.sin(angle - Math.PI / 6)
  };
  const p2 = {
    x: endPoint.x - arrowSize * Math.cos(angle + Math.PI / 6),
    y: endPoint.y - arrowSize * Math.sin(angle + Math.PI / 6)
  };
  
  return `${endPoint.x},${endPoint.y} ${p1.x},${p1.y} ${p2.x},${p2.y}`;
}
