import { LocationNode, Connection, Point } from '@/types';

export const NODE_WIDTH = 180;
export const NODE_HEIGHT = 70;
export const NODE_ROUND_RADIUS = 12;

export function screenToWorld(
  screenX: number,
  screenY: number,
  panX: number,
  panY: number,
  scale: number
): Point {
  return {
    x: (screenX - panX) / scale,
    y: (screenY - panY) / scale,
  };
}

export function worldToScreen(
  worldX: number,
  worldY: number,
  panX: number,
  panY: number,
  scale: number
): Point {
  return {
    x: worldX * scale + panX,
    y: worldY * scale + panY,
  };
}

export function calculateHaversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function hitTestNode(
  clickX: number,
  clickY: number,
  node: LocationNode,
  panX: number,
  panY: number,
  scale: number
): boolean {
  const screenPos = worldToScreen(node.x, node.y, panX, panY, scale);
  const scaledWidth = NODE_WIDTH * scale;
  const scaledHeight = NODE_HEIGHT * scale;

  return (
    clickX >= screenPos.x - scaledWidth / 2 &&
    clickX <= screenPos.x + scaledWidth / 2 &&
    clickY >= screenPos.y - scaledHeight / 2 &&
    clickY <= screenPos.y + scaledHeight / 2
  );
}

export function hitTestConnectionHandle(
  clickX: number,
  clickY: number,
  node: LocationNode,
  panX: number,
  panY: number,
  scale: number
): boolean {
  const screenPos = worldToScreen(node.x, node.y, panX, panY, scale);
  const scaledWidth = NODE_WIDTH * scale;
  const handleRadius = 10 * scale;
  const handleX = screenPos.x + scaledWidth / 2;
  const handleY = screenPos.y;

  const dx = clickX - handleX;
  const dy = clickY - handleY;
  return Math.sqrt(dx * dx + dy * dy) <= handleRadius;
}

export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function drawNode(
  ctx: CanvasRenderingContext2D,
  node: LocationNode,
  panX: number,
  panY: number,
  scale: number,
  isSelected: boolean,
  pulsePhase: number,
  dayColor?: string
): void {
  const screenPos = worldToScreen(node.x, node.y, panX, panY, scale);
  const scaledWidth = NODE_WIDTH * scale;
  const scaledHeight = NODE_HEIGHT * scale;
  const scaledRadius = NODE_ROUND_RADIUS * scale;
  const fontSize = Math.max(10, 12 * scale);

  ctx.save();

  if (isSelected) {
    const pulseSize = 8 * scale * Math.abs(Math.sin(pulsePhase));
    ctx.shadowColor = dayColor || '#6B7F5E';
    ctx.shadowBlur = 15 + pulseSize;
  } else {
    ctx.shadowColor = 'rgba(74, 55, 40, 0.15)';
    ctx.shadowBlur = 12 * scale;
    ctx.shadowOffsetY = 4 * scale;
  }

  const gradient = ctx.createLinearGradient(
    screenPos.x - scaledWidth / 2,
    screenPos.y - scaledHeight / 2,
    screenPos.x + scaledWidth / 2,
    screenPos.y + scaledHeight / 2
  );

  if (dayColor) {
    gradient.addColorStop(0, dayColor + '15');
    gradient.addColorStop(1, dayColor + '08');
  } else {
    gradient.addColorStop(0, '#FAF7F2');
    gradient.addColorStop(1, '#F5F0E8');
  }

  ctx.fillStyle = gradient;
  drawRoundedRect(
    ctx,
    screenPos.x - scaledWidth / 2,
    screenPos.y - scaledHeight / 2,
    scaledWidth,
    scaledHeight,
    scaledRadius
  );
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = dayColor || '#4A3728';
  ctx.lineWidth = isSelected ? 2.5 * scale : 1.5 * scale;
  drawRoundedRect(
    ctx,
    screenPos.x - scaledWidth / 2,
    screenPos.y - scaledHeight / 2,
    scaledWidth,
    scaledHeight,
    scaledRadius
  );
  ctx.stroke();

  ctx.fillStyle = '#4A3728';
  ctx.font = `600 ${fontSize}px 'Noto Sans SC', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    node.name,
    screenPos.x,
    screenPos.y - scaledHeight / 2 + 22 * scale
  );

  ctx.fillStyle = '#8B7355';
  ctx.font = `${fontSize * 0.75}px 'Noto Sans SC', sans-serif`;
  const coordText = `${node.lat.toFixed(4)}°N, ${node.lng.toFixed(4)}°E`;
  ctx.fillText(coordText, screenPos.x, screenPos.y + 2 * scale);

  ctx.fillStyle = '#A08060';
  ctx.font = `${fontSize * 0.7}px 'Noto Sans SC', sans-serif`;
  const desc = node.description.length > 12 
    ? node.description.substring(0, 12) + '...' 
    : node.description;
  ctx.fillText(desc, screenPos.x, screenPos.y + scaledHeight / 2 - 18 * scale);

  if (isSelected) {
    const handleRadius = 8 * scale;
    ctx.fillStyle = '#6B7F5E';
    ctx.beginPath();
    ctx.arc(
      screenPos.x + scaledWidth / 2,
      screenPos.y,
      handleRadius,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2 * scale;
    ctx.stroke();
  }

  ctx.restore();
}

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string,
  lineWidth: number,
  isHighlighted: boolean,
  showDistance: boolean,
  distance: number
): void {
  ctx.save();

  const headLength = 12;
  const angle = Math.atan2(toY - fromY, toX - fromX);

  const startX = fromX + Math.cos(angle) * (NODE_WIDTH / 2);
  const startY = fromY + Math.sin(angle) * (NODE_HEIGHT / 4);
  const endX = toX - Math.cos(angle) * (NODE_WIDTH / 2 + 10);
  const endY = toY - Math.sin(angle) * (NODE_HEIGHT / 4);

  ctx.strokeStyle = isHighlighted ? color : 'rgba(74, 55, 40, 0.5)';
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';

  if (isHighlighted) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
  }

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = isHighlighted ? color : 'rgba(74, 55, 40, 0.5)';
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headLength * Math.cos(angle - Math.PI / 6),
    endY - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    endX - headLength * Math.cos(angle + Math.PI / 6),
    endY - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();

  if (showDistance) {
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    const perpAngle = angle + Math.PI / 2;
    const labelX = midX + Math.cos(perpAngle) * 15;
    const labelY = midY + Math.sin(perpAngle) * 15;

    ctx.fillStyle = '#FAF7F2';
    const distanceText = distance >= 1000 
      ? `${(distance / 1000).toFixed(1)} km` 
      : `${distance.toFixed(0)} m`;
    
    ctx.font = '12px "Noto Sans SC", sans-serif';
    const textWidth = ctx.measureText(distanceText).width;
    
    ctx.fillStyle = 'rgba(250, 247, 242, 0.95)';
    drawRoundedRect(ctx, labelX - textWidth / 2 - 6, labelY - 10, textWidth + 12, 20, 6);
    ctx.fill();
    
    ctx.strokeStyle = isHighlighted ? color : 'rgba(74, 55, 40, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#4A3728';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(distanceText, labelX, labelY);
  }

  ctx.restore();
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  panX: number,
  panY: number,
  scale: number
): void {
  ctx.save();

  const gridSize = 100 * scale;
  const startX = panX % gridSize;
  const startY = panY % gridSize;

  ctx.strokeStyle = 'rgba(107, 127, 94, 0.08)';
  ctx.lineWidth = 1;

  for (let x = startX; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = startY; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const majorGridSize = gridSize * 5;
  const majorStartX = panX % majorGridSize;
  const majorStartY = panY % majorGridSize;

  ctx.strokeStyle = 'rgba(107, 127, 94, 0.15)';
  ctx.lineWidth = 1.5;

  for (let x = majorStartX; x < width; x += majorGridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = majorStartY; y < height; y += majorGridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.restore();
}

export function findNearestNode(
  mouseX: number,
  mouseY: number,
  nodes: LocationNode[],
  excludeId: string,
  panX: number,
  panY: number,
  scale: number
): LocationNode | null {
  let nearestNode: LocationNode | null = null;
  let minDistance = Infinity;

  for (const node of nodes) {
    if (node.id === excludeId) continue;

    const screenPos = worldToScreen(node.x, node.y, panX, panY, scale);
    const dx = mouseX - screenPos.x;
    const dy = mouseY - screenPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < minDistance && distance < 150) {
      minDistance = distance;
      nearestNode = node;
    }
  }

  return nearestNode;
}

export function drawConnectionPreview(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  isSnapped: boolean,
  snapColor?: string
): void {
  ctx.save();

  ctx.strokeStyle = isSnapped ? (snapColor || '#6B7F5E') : 'rgba(107, 127, 94, 0.5)';
  ctx.lineWidth = isSnapped ? 3 : 2;
  ctx.setLineDash(isSnapped ? [] : [8, 4]);
  ctx.lineCap = 'round';

  if (isSnapped) {
    ctx.shadowColor = snapColor || '#6B7F5E';
    ctx.shadowBlur = 10;
  }

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  ctx.restore();
}
