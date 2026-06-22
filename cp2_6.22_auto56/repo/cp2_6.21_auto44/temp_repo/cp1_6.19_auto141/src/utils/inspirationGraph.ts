import type { GraphNode, GraphEdge } from './types';

const REPULSION_STRENGTH = 2500;
const ATTRACTION_STRENGTH = 0.015;
const CENTER_STRENGTH = 0.003;
const DAMPING = 0.82;
const MAX_VELOCITY = 12;
const NODE_RADIUS_MIN = 8;
const NODE_RADIUS_MAX = 18;
const EDGE_COLOR = '#636E72';
const EDGE_LINE_WIDTH = 1.5;

export function getNodeRadius(relevance: number): number {
  return NODE_RADIUS_MIN + (relevance / 100) * (NODE_RADIUS_MAX - NODE_RADIUS_MIN);
}

export function applyRepulsion(nodes: GraphNode[]): void {
  const len = nodes.length;
  for (let i = 0; i < len; i++) {
    const n1 = nodes[i];
    if (n1.isDragging) continue;

    for (let j = i + 1; j < len; j++) {
      const n2 = nodes[j];
      if (n2.isDragging) continue;

      const dx = n1.x - n2.x;
      const dy = n1.y - n2.y;
      let distSq = dx * dx + dy * dy;

      if (distSq < 100) distSq = 100;
      const dist = Math.sqrt(distSq);

      const force = REPULSION_STRENGTH / distSq;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      n1.vx += fx;
      n1.vy += fy;
      n2.vx -= fx;
      n2.vy -= fy;
    }
  }
}

export function applyAttraction(nodes: GraphNode[], edges: GraphEdge[]): void {
  const nodeMap = new Map<string, GraphNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));

  for (const edge of edges) {
    const n1 = nodeMap.get(edge.source);
    const n2 = nodeMap.get(edge.target);
    if (!n1 || !n2) continue;

    const dx = n2.x - n1.x;
    const dy = n2.y - n1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) continue;

    const restLength = 100 + (100 - edge.similarity) * 0.5;
    const force = (dist - restLength) * ATTRACTION_STRENGTH;
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;

    if (!n1.isDragging) {
      n1.vx += fx;
      n1.vy += fy;
    }
    if (!n2.isDragging) {
      n2.vx -= fx;
      n2.vy -= fy;
    }
  }
}

export function applyCenter(nodes: GraphNode[], centerX: number, centerY: number): void {
  for (const node of nodes) {
    if (node.isDragging) continue;
    node.vx += (centerX - node.x) * CENTER_STRENGTH;
    node.vy += (centerY - node.y) * CENTER_STRENGTH;
  }
}

export function integrate(nodes: GraphNode[], dt: number = 1): void {
  for (const node of nodes) {
    if (node.isDragging) {
      node.vx = 0;
      node.vy = 0;
      continue;
    }

    node.vx *= DAMPING;
    node.vy *= DAMPING;

    const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
    if (speed > MAX_VELOCITY) {
      node.vx = (node.vx / speed) * MAX_VELOCITY;
      node.vy = (node.vy / speed) * MAX_VELOCITY;
    }

    node.x += node.vx * dt;
    node.y += node.vy * dt;
  }
}

export function clampToBounds(nodes: GraphNode[], width: number, height: number, padding: number = 20): void {
  for (const node of nodes) {
    if (node.isDragging) continue;
    const r = getNodeRadius(node.relevance);
    node.x = Math.max(padding + r, Math.min(width - padding - r, node.x));
    node.y = Math.max(padding + r, Math.min(height - padding - r, node.y));
  }
}

export function forceLayoutStep(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number
): void {
  const centerX = width / 2;
  const centerY = height / 2;

  applyRepulsion(nodes);
  applyAttraction(nodes, edges);
  applyCenter(nodes, centerX, centerY);
  integrate(nodes);
  clampToBounds(nodes, width, height);
}

export function runForceLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number,
  iterations: number = 50
): void {
  for (let i = 0; i < iterations; i++) {
    forceLayoutStep(nodes, edges, width, height);
  }
}

export function render(
  ctx: CanvasRenderingContext2D,
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number,
  selectedNodeId: string | null,
  hoveredNodeId: string | null,
  time: number
): void {
  ctx.clearRect(0, 0, width, height);

  const nodeMap = new Map<string, GraphNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));

  for (const edge of edges) {
    const n1 = nodeMap.get(edge.source);
    const n2 = nodeMap.get(edge.target);
    if (!n1 || !n2) continue;

    const isConnectedToSelected = selectedNodeId && 
      (edge.source === selectedNodeId || edge.target === selectedNodeId);

    ctx.beginPath();
    ctx.moveTo(n1.x, n1.y);
    ctx.lineTo(n2.x, n2.y);
    ctx.strokeStyle = isConnectedToSelected ? '#FD79A8' : EDGE_COLOR;
    ctx.globalAlpha = isConnectedToSelected ? 0.8 : 0.4;
    ctx.lineWidth = isConnectedToSelected ? 2 : EDGE_LINE_WIDTH;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  for (const node of nodes) {
    const r = getNodeRadius(node.relevance);
    const isSelected = node.id === selectedNodeId;
    const isHovered = node.id === hoveredNodeId;
    const displayRadius = isSelected ? r * 1.2 : isHovered ? r * 1.1 : r;

    if (node.isNew) {
      const age = (time - node.createdAt) / 500;
      const scale = Math.min(1, age);
      const alpha = Math.min(1, age);
      if (scale < 1) {
        ctx.globalAlpha = alpha;
        const pulseR = displayRadius * (1 + (1 - scale) * 0.5);
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseR, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.globalAlpha = alpha * 0.3;
        ctx.fill();
        ctx.globalAlpha = alpha;
      }
    }

    if (isSelected || node.isDragging) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, displayRadius + 6, 0, Math.PI * 2);
      ctx.strokeStyle = '#FD79A8';
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.beginPath();
    ctx.arc(node.x, node.y, displayRadius, 0, Math.PI * 2);
    
    const gradient = ctx.createRadialGradient(
      node.x - r * 0.3, node.y - r * 0.3, 0,
      node.x, node.y, displayRadius
    );
    gradient.addColorStop(0, lightenColor(node.color, 30));
    gradient.addColorStop(1, node.color);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (isHovered || isSelected) {
      ctx.fillStyle = '#ECF0F1';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      const text = node.name.length > 8 ? node.name.slice(0, 8) + '...' : node.name;
      ctx.fillText(text, node.x, node.y + displayRadius + 8);
    }
  }
  ctx.globalAlpha = 1;
}

function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

export function findNodeAt(
  nodes: GraphNode[],
  x: number,
  y: number
): GraphNode | null {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    const r = getNodeRadius(node.relevance);
    const dx = x - node.x;
    const dy = y - node.y;
    if (dx * dx + dy * dy <= r * r * 1.44) {
      return node;
    }
  }
  return null;
}
