import { v4 as uuidv4 } from 'uuid';
import {
  AreaInfo,
  AreaState,
  ElementType,
  Position,
  Rune,
} from './types';

const AREA_DEFINITIONS: AreaInfo[] = [
  {
    id: 'fire_courtyard',
    name: '火之庭院',
    gradientColors: ['#FF4500', '#FF8C00'],
    boundaries: { x: 0, y: 0, width: 1280, height: 720 },
    runePositions: [
      { x: 300, y: 200 }, { x: 600, y: 400 }, { x: 900, y: 250 },
      { x: 450, y: 550 },
    ],
    portalPosition: { x: 640, y: 360 },
  },
  {
    id: 'water_corridor',
    name: '水之回廊',
    gradientColors: ['#4169E1', '#8A2BE2'],
    boundaries: { x: 0, y: 0, width: 1280, height: 720 },
    runePositions: [
      { x: 250, y: 350 }, { x: 700, y: 200 }, { x: 500, y: 500 },
      { x: 950, y: 400 },
    ],
    portalPosition: { x: 640, y: 360 },
  },
  {
    id: 'wind_tower',
    name: '风之塔',
    gradientColors: ['#00CED1', '#32CD32'],
    boundaries: { x: 0, y: 0, width: 1280, height: 720 },
    runePositions: [
      { x: 400, y: 150 }, { x: 800, y: 350 }, { x: 350, y: 500 },
      { x: 700, y: 550 }, { x: 1000, y: 200 },
    ],
    portalPosition: { x: 640, y: 360 },
  },
  {
    id: 'earth_chamber',
    name: '土之密室',
    gradientColors: ['#8B4513', '#DAA520'],
    boundaries: { x: 0, y: 0, width: 1280, height: 720 },
    runePositions: [
      { x: 500, y: 300 }, { x: 300, y: 450 }, { x: 800, y: 200 },
      { x: 650, y: 550 },
    ],
    portalPosition: { x: 640, y: 360 },
  },
  {
    id: 'light_dome',
    name: '光之穹顶',
    gradientColors: ['#FFFACD', '#FFD700'],
    boundaries: { x: 0, y: 0, width: 1280, height: 720 },
    runePositions: [
      { x: 350, y: 250 }, { x: 700, y: 450 }, { x: 900, y: 300 },
      { x: 500, y: 150 },
    ],
    portalPosition: { x: 640, y: 360 },
  },
  {
    id: 'central_hall',
    name: '中央大厅',
    gradientColors: ['#F5E6C8', '#B8860B'],
    boundaries: { x: 0, y: 0, width: 1280, height: 720 },
    runePositions: [
      { x: 300, y: 300 }, { x: 900, y: 300 }, { x: 600, y: 200 },
    ],
    portalPosition: { x: 640, y: 360 },
  },
];

const AREA_ELEMENT_MAP: Record<string, ElementType> = {
  fire_courtyard: ElementType.FIRE,
  water_corridor: ElementType.WATER,
  wind_tower: ElementType.WIND,
  earth_chamber: ElementType.EARTH,
  light_dome: ElementType.LIGHT,
  central_hall: ElementType.ARCANE,
};

const AREA_CONNECTIONS: Record<string, string[]> = {
  central_hall: ['fire_courtyard', 'water_corridor', 'wind_tower', 'earth_chamber', 'light_dome'],
  fire_courtyard: ['central_hall', 'water_corridor'],
  water_corridor: ['central_hall', 'fire_courtyard', 'wind_tower'],
  wind_tower: ['central_hall', 'water_corridor', 'earth_chamber'],
  earth_chamber: ['central_hall', 'wind_tower', 'light_dome'],
  light_dome: ['central_hall', 'earth_chamber'],
};

export function getAreaInfo(areaId: string): AreaInfo | undefined {
  return AREA_DEFINITIONS.find(a => a.id === areaId);
}

export function getAllAreaInfos(): AreaInfo[] {
  return [...AREA_DEFINITIONS];
}

export function getAreaElement(areaId: string): ElementType {
  return AREA_ELEMENT_MAP[areaId] || ElementType.ARCANE;
}

export function getConnectedAreas(areaId: string): string[] {
  return AREA_CONNECTIONS[areaId] || [];
}

export function generateRunes(areaId: string): Rune[] {
  const info = getAreaInfo(areaId);
  if (!info) return [];
  const element = AREA_ELEMENT_MAP[areaId];
  const count = 3 + Math.floor(Math.random() * 3);
  const positions = info.runePositions.slice(0, count);
  return positions.map((pos, i) => ({
    id: uuidv4(),
    element,
    position: { x: pos.x + (Math.random() - 0.5) * 60, y: pos.y + (Math.random() - 0.5) * 60 },
    collected: false,
    rotation: 0,
    collectAnimProgress: 0,
    orbitAngle: (Math.PI * 2 * i) / count,
  }));
}

export function checkPortalTrigger(
  playerPos: Position,
  areaState: AreaState
): boolean {
  if (!areaState.allCollected || !areaState.info.portalPosition) return false;
  const portal = areaState.info.portalPosition;
  const dx = playerPos.x - portal.x;
  const dy = playerPos.y - portal.y;
  return Math.sqrt(dx * dx + dy * dy) < 60;
}

export function createAreaState(areaId: string): AreaState {
  const info = getAreaInfo(areaId)!;
  const runes = generateRunes(areaId);
  return {
    info,
    runes,
    allCollected: false,
    hasPortal: false,
    visited: true,
  };
}

export function switchArea(fromArea: string, _toArea: string): AreaState {
  return createAreaState(_toArea);
}

export function checkAllCollected(runes: Rune[]): boolean {
  return runes.length > 0 && runes.every(r => r.collected);
}
