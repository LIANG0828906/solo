export interface Point {
  x: number;
  y: number;
}

export interface RoomData {
  name: string;
  polygon: Point[];
  defaultWallColor: string;
  defaultFloorColor: string;
  defaultFurnitureColor: string;
}

export interface FloorplanData {
  id: string;
  name: string;
  rooms: RoomData[];
}

const DEFAULT_FLOORPLAN: FloorplanData = {
  id: 'default',
  name: '默认户型 - 五居室',
  rooms: [
    {
      name: '客厅',
      polygon: [
        { x: 320, y: 220 },
        { x: 580, y: 220 },
        { x: 580, y: 480 },
        { x: 320, y: 480 },
        { x: 320, y: 220 }
      ],
      defaultWallColor: '#e8e0d8',
      defaultFloorColor: '#c4a882',
      defaultFurnitureColor: '#8b7355'
    },
    {
      name: '卧室',
      polygon: [
        { x: 580, y: 100 },
        { x: 780, y: 100 },
        { x: 780, y: 300 },
        { x: 580, y: 300 },
        { x: 580, y: 100 }
      ],
      defaultWallColor: '#d4c4b0',
      defaultFloorColor: '#b8a080',
      defaultFurnitureColor: '#7a6548'
    },
    {
      name: '厨房',
      polygon: [
        { x: 780, y: 300 },
        { x: 920, y: 300 },
        { x: 920, y: 480 },
        { x: 780, y: 480 },
        { x: 780, y: 300 }
      ],
      defaultWallColor: '#f0ece4',
      defaultFloorColor: '#a89878',
      defaultFurnitureColor: '#6b5b45'
    },
    {
      name: '卫生间',
      polygon: [
        { x: 120, y: 300 },
        { x: 320, y: 300 },
        { x: 320, y: 480 },
        { x: 120, y: 480 },
        { x: 120, y: 300 }
      ],
      defaultWallColor: '#e0e8ec',
      defaultFloorColor: '#90a0a8',
      defaultFurnitureColor: '#607080'
    },
    {
      name: '阳台',
      polygon: [
        { x: 320, y: 480 },
        { x: 580, y: 480 },
        { x: 580, y: 580 },
        { x: 320, y: 580 },
        { x: 320, y: 480 }
      ],
      defaultWallColor: '#dce8d4',
      defaultFloorColor: '#b0c8a0',
      defaultFurnitureColor: '#708060'
    }
  ]
};

export function getFloorplan(id?: string): FloorplanData {
  if (!id || id === 'default') {
    return DEFAULT_FLOORPLAN;
  }
  return DEFAULT_FLOORPLAN;
}

export function getAllFloorplans(): FloorplanData[] {
  return [DEFAULT_FLOORPLAN];
}

export function validateFloorplan(fp: FloorplanData): boolean {
  for (const room of fp.rooms) {
    const poly = room.polygon;
    if (poly.length < 3) return false;
    const first = poly[0];
    const last = poly[poly.length - 1];
    if (Math.abs(first.x - last.x) > 0.5 || Math.abs(first.y - last.y) > 0.5) {
      return false;
    }
    for (const p of poly) {
      if (p.x < 0 || p.y < 0 || p.x > 1100 || p.y > 700) {
        return false;
      }
    }
  }
  return true;
}

if (!validateFloorplan(DEFAULT_FLOORPLAN)) {
  console.error('Floorplan validation failed: polygons not closed or out of bounds');
}
