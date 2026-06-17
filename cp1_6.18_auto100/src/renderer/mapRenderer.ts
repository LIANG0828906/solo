import * as d3Force from 'd3-force';
import type { Dream } from '../stores/dreamStore';

export interface MapNode {
  id: string;
  dreamId: string;
  x: number;
  y: number;
  radius: number;
  color: string;
}

export interface MapLink {
  source: string;
  target: string;
  strength: number;
}

export interface MapData {
  nodes: MapNode[];
  links: MapLink[];
}

const COLOR_CALM = { r: 78, g: 205, b: 196 };
const COLOR_NEUTRAL = { r: 255, g: 230, b: 109 };
const COLOR_INTENSE = { r: 255, g: 107, b: 107 };

function interpolateColor(color1: { r: number; g: number; b: number }, color2: { r: number; g: number; b: number }, t: number): string {
  const r = Math.round(color1.r + (color2.r - color1.r) * t);
  const g = Math.round(color1.g + (color2.g - color1.g) * t);
  const b = Math.round(color1.b + (color2.b - color1.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function getEmotionColor(rating: number): string {
  if (rating <= 3) {
    const t = (rating - 1) / 2;
    return interpolateColor(COLOR_CALM, COLOR_NEUTRAL, t);
  } else {
    const t = (rating - 3) / 2;
    return interpolateColor(COLOR_NEUTRAL, COLOR_INTENSE, t);
  }
}

function getNodeRadius(rating: number): number {
  return 25 + (rating - 1) * ((50 - 25) / 4);
}

function calculateLinks(dreams: Dream[]): MapLink[] {
  const links: MapLink[] = [];

  for (let i = 0; i < dreams.length; i++) {
    for (let j = i + 1; j < dreams.length; j++) {
      const dreamA = dreams[i];
      const dreamB = dreams[j];

      const sharedTags = dreamA.tags.filter(tagA =>
        dreamB.tags.some(tagB => tagA.id === tagB.id)
      );

      if (sharedTags.length > 0) {
        links.push({
          source: dreamA.id,
          target: dreamB.id,
          strength: sharedTags.length * 0.3
        });
      }
    }
  }

  return links;
}

export function generateMapData(dreams: Dream[], width: number, height: number): MapData {
  if (dreams.length === 0) {
    return { nodes: [], links: [] };
  }

  const links = calculateLinks(dreams);

  const initialNodes = dreams.map(dream => ({
    id: dream.id,
    dreamId: dream.id,
    x: width / 2 + (Math.random() - 0.5) * 100,
    y: height / 2 + (Math.random() - 0.5) * 100,
    radius: getNodeRadius(dream.emotionRating),
    color: getEmotionColor(dream.emotionRating)
  }));

  const simulation = d3Force.forceSimulation(initialNodes as d3Force.SimulationNodeDatum[])
    .force('link', d3Force.forceLink(links).id((d: any) => d.id).strength((d: any) => d.strength).distance(100))
    .force('charge', d3Force.forceManyBody().strength(-300))
    .force('center', d3Force.forceCenter(width / 2, height / 2).strength(0.1))
    .force('collision', d3Force.forceCollide().radius((d: any) => d.radius + 20).strength(0.8))
    .stop();

  for (let i = 0; i < 50; ++i) {
    simulation.tick();
  }

  const nodes: MapNode[] = (simulation.nodes() as MapNode[]).map(node => ({
    ...node,
    x: Math.max(node.radius, Math.min(width - node.radius, node.x)),
    y: Math.max(node.radius, Math.min(height - node.radius, node.y))
  }));

  return { nodes, links };
}
