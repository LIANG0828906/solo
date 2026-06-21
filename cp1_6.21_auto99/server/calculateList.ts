import type { CalculateRequest, MaterialListItem, MaterialList } from '../src/types.js';

const PRICES = {
  'paint': 35,
  'wallpaper': 80,
  'tile': 120,
  'wood': 180,
  'solid-wood': 2000,
  'metal': 1500,
  'fabric': 1200,
} as const;

const NAMES: Record<string, string> = {
  'paint': '乳胶漆',
  'wallpaper': '墙纸',
  'tile': '瓷砖',
  'wood': '木地板',
  'solid-wood': '实木家具',
  'metal': '金属家具',
  'fabric': '布艺家具',
};

const UNITS: Record<string, string> = {
  'paint': '元/平方米',
  'wallpaper': '元/平方米',
  'tile': '元/平方米',
  'wood': '元/平方米',
  'solid-wood': '元/件',
  'metal': '元/件',
  'fabric': '元/件',
};

export function calculateMaterialList(req: CalculateRequest): MaterialList {
  const { roomWidth, roomDepth, roomHeight, furnitureCount, config } = req;
  const wallArea = parseFloat((2 * (roomWidth + roomDepth) * roomHeight).toFixed(2));
  const floorArea = parseFloat((roomWidth * roomDepth).toFixed(2));

  const items: MaterialListItem[] = [];

  const wallType = config.wall.type;
  const wallUnitPrice = PRICES[wallType];
  const wallQty = wallArea;
  items.push({
    name: NAMES[wallType],
    unit: UNITS[wallType],
    unitPrice: wallUnitPrice,
    quantity: wallQty,
    subtotal: parseFloat((wallUnitPrice * wallQty).toFixed(2)),
  });

  const floorType = config.floor.type;
  const floorUnitPrice = PRICES[floorType];
  const floorQty = floorArea;
  items.push({
    name: NAMES[floorType],
    unit: UNITS[floorType],
    unitPrice: floorUnitPrice,
    quantity: floorQty,
    subtotal: parseFloat((floorUnitPrice * floorQty).toFixed(2)),
  });

  const furnType = config.furniture.type;
  const furnUnitPrice = PRICES[furnType];
  items.push({
    name: NAMES[furnType],
    unit: UNITS[furnType],
    unitPrice: furnUnitPrice,
    quantity: furnitureCount,
    subtotal: parseFloat((furnUnitPrice * furnitureCount).toFixed(2)),
  });

  const total = parseFloat(items.reduce((s, i) => s + i.subtotal, 0).toFixed(2));

  return { items, total };
}
