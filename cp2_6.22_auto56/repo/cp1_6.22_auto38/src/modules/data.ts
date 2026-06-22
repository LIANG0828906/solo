import { FlavorNode, FlavorLogItem } from './api';

export interface HierarchyDatum {
  id: string;
  name: string;
  description?: string;
  roastLevel?: ('light' | 'medium' | 'dark')[];
  origin?: ('africa' | 'central_south_america' | 'asia')[];
  intensity?: number;
  depth: number;
  children?: HierarchyDatum[];
}

export function flatToHierarchy(root: FlavorNode): HierarchyDatum {
  const convert = (node: FlavorNode, depth: number): HierarchyDatum => ({
    id: node.id,
    name: node.name,
    description: node.description,
    roastLevel: node.roastLevel,
    origin: node.origin,
    intensity: node.intensity,
    depth,
    children: node.children?.map((child) => convert(child, depth + 1)),
  });
  return convert(root, 0);
}

export function filterByRoastAndOrigin(
  root: HierarchyDatum,
  roastFilter: ('light' | 'medium' | 'dark')[] | null,
  originFilter: ('africa' | 'central_south_america' | 'asia')[] | null
): HierarchyDatum {
  if (!roastFilter && !originFilter) return root;

  const filterNode = (node: HierarchyDatum): HierarchyDatum | null => {
    if (!node.children || node.children.length === 0) {
      if (!node.roastLevel && !node.origin) return node;
      const roastMatch = !roastFilter || roastFilter.length === 0 || !node.roastLevel || node.roastLevel.some((r) => roastFilter.includes(r));
      const originMatch = !originFilter || originFilter.length === 0 || !node.origin || node.origin.some((o) => originFilter.includes(o));
      return roastMatch && originMatch ? node : null;
    }

    const filteredChildren = node.children
      .map(filterNode)
      .filter((child): child is HierarchyDatum => child !== null);

    if (filteredChildren.length === 0 && node.depth > 1) {
      if (!node.roastLevel && !node.origin) return null;
      const roastMatch = !roastFilter || roastFilter.length === 0 || !node.roastLevel || node.roastLevel.some((r) => roastFilter.includes(r));
      const originMatch = !originFilter || originFilter.length === 0 || !node.origin || node.origin.some((o) => originFilter.includes(o));
      return roastMatch && originMatch ? { ...node, children: [] } : null;
    }

    return { ...node, children: filteredChildren };
  };

  const result = filterNode(root);
  return result || { ...root, children: [] };
}

export function calculateHappiness(flavors: FlavorLogItem[]): number {
  if (flavors.length === 0) return 0;
  const totalIntensity = flavors.reduce((sum, f) => sum + (f.intensity || 3), 0);
  const avgIntensity = totalIntensity / flavors.length;
  const countBonus = Math.min(flavors.length * 5, 30);
  return Math.min(100, Math.round(avgIntensity * 12 + countBonus));
}

export function getHappinessEmoji(happiness: number): string {
  if (happiness >= 66) return '😊';
  if (happiness >= 33) return '😐';
  return '😢';
}

export function getHappinessLabel(happiness: number): string {
  if (happiness >= 66) return '非常满意';
  if (happiness >= 33) return '中等满意';
  return '有待提升';
}

export const flavorColors: Record<string, string> = {
  root: '#6D4C41',
  sour: '#E57373',
  sweet: '#FFB74D',
  bitter: '#795548',
  citrus: '#FFCC02',
  berry: '#E91E63',
  stone_fruit: '#FF8A65',
  chocolate: '#5D4037',
  caramel: '#FF6F00',
  nutty: '#8D6E63',
  roasted: '#424242',
  spice: '#BF360C',
  earthy: '#607D8B',
  default: '#8D6E63',
};

export function getFlavorColor(id: string, depth: number): string {
  const baseColor = flavorColors[id] || flavorColors[id.split('_').slice(0, -1).join('_')] || flavorColors.default;
  const alpha = Math.max(0.4, 1 - depth * 0.2);
  return hexToRgba(baseColor, alpha);
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
