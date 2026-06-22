import { VenueConfig, VenueTemplate, VenueWall } from '@/types';

const generateWallLayout = (layoutIndex: number, template: VenueTemplate): VenueWall[] => {
  const baseHeight = 5;
  const wallHeight = 3.5;
  const layouts: VenueWall[][] = [];

  if (template === 'white_gallery') {
    layouts.push([
      { position: [0, wallHeight / 2, -8], rotation: [0, 0, 0], width: 14, height: wallHeight },
      { position: [-8, wallHeight / 2, 0], rotation: [0, Math.PI / 2, 0], width: 14, height: wallHeight },
      { position: [0, wallHeight / 2, 8], rotation: [0, Math.PI, 0], width: 14, height: wallHeight },
      { position: [8, wallHeight / 2, 0], rotation: [0, -Math.PI / 2, 0], width: 14, height: wallHeight },
    ]);
    layouts.push([
      { position: [0, wallHeight / 2, -9], rotation: [0, 0, 0], width: 16, height: wallHeight },
      { position: [-9, wallHeight / 2, -3], rotation: [0, Math.PI / 2, 0], width: 10, height: wallHeight },
      { position: [-9, wallHeight / 2, 3], rotation: [0, Math.PI / 2, 0], width: 10, height: wallHeight },
      { position: [0, wallHeight / 2, 9], rotation: [0, Math.PI, 0], width: 16, height: wallHeight },
      { position: [9, wallHeight / 2, 3], rotation: [0, -Math.PI / 2, 0], width: 10, height: wallHeight },
      { position: [9, wallHeight / 2, -3], rotation: [0, -Math.PI / 2, 0], width: 10, height: wallHeight },
    ]);
    layouts.push([
      { position: [0, wallHeight / 2, -10], rotation: [0, 0, 0], width: 8, height: wallHeight },
      { position: [-6, wallHeight / 2, -10], rotation: [0, 0, 0], width: 5, height: wallHeight },
      { position: [6, wallHeight / 2, -10], rotation: [0, 0, 0], width: 5, height: wallHeight },
      { position: [-10, wallHeight / 2, 0], rotation: [0, Math.PI / 2, 0], width: 12, height: wallHeight },
      { position: [0, wallHeight / 2, 10], rotation: [0, Math.PI, 0], width: 8, height: wallHeight },
      { position: [-6, wallHeight / 2, 10], rotation: [0, Math.PI, 0], width: 5, height: wallHeight },
      { position: [6, wallHeight / 2, 10], rotation: [0, Math.PI, 0], width: 5, height: wallHeight },
      { position: [10, wallHeight / 2, 0], rotation: [0, -Math.PI / 2, 0], width: 12, height: wallHeight },
    ]);
  } else if (template === 'industrial_warehouse') {
    layouts.push([
      { position: [0, wallHeight / 2, -10], rotation: [0, 0, 0], width: 18, height: wallHeight + 1 },
      { position: [-10, wallHeight / 2, 0], rotation: [0, Math.PI / 2, 0], width: 18, height: wallHeight + 1 },
      { position: [0, wallHeight / 2, 10], rotation: [0, Math.PI, 0], width: 18, height: wallHeight + 1 },
      { position: [10, wallHeight / 2, 0], rotation: [0, -Math.PI / 2, 0], width: 18, height: wallHeight + 1 },
    ]);
    layouts.push([
      { position: [0, wallHeight / 2, -11], rotation: [0, 0, 0], width: 10, height: wallHeight + 1 },
      { position: [-5, wallHeight / 2, -8], rotation: [0, 0, 0], width: 6, height: wallHeight + 1 },
      { position: [5, wallHeight / 2, -8], rotation: [0, 0, 0], width: 6, height: wallHeight + 1 },
      { position: [-11, wallHeight / 2, 0], rotation: [0, Math.PI / 2, 0], width: 14, height: wallHeight + 1 },
      { position: [0, wallHeight / 2, 11], rotation: [0, Math.PI, 0], width: 10, height: wallHeight + 1 },
      { position: [11, wallHeight / 2, 0], rotation: [0, -Math.PI / 2, 0], width: 14, height: wallHeight + 1 },
    ]);
    layouts.push([
      { position: [-7, wallHeight / 2, -10], rotation: [0, 0, 0], width: 8, height: wallHeight + 1 },
      { position: [7, wallHeight / 2, -10], rotation: [0, 0, 0], width: 8, height: wallHeight + 1 },
      { position: [-12, wallHeight / 2, -4], rotation: [0, Math.PI / 2, 0], width: 8, height: wallHeight + 1 },
      { position: [-12, wallHeight / 2, 4], rotation: [0, Math.PI / 2, 0], width: 8, height: wallHeight + 1 },
      { position: [-7, wallHeight / 2, 10], rotation: [0, Math.PI, 0], width: 8, height: wallHeight + 1 },
      { position: [7, wallHeight / 2, 10], rotation: [0, Math.PI, 0], width: 8, height: wallHeight + 1 },
      { position: [12, wallHeight / 2, 4], rotation: [0, -Math.PI / 2, 0], width: 8, height: wallHeight + 1 },
      { position: [12, wallHeight / 2, -4], rotation: [0, -Math.PI / 2, 0], width: 8, height: wallHeight + 1 },
    ]);
  } else {
    layouts.push([
      { position: [0, baseHeight / 2 + 0.5, -10], rotation: [0, 0, 0], width: 16, height: baseHeight },
      { position: [-10, baseHeight / 2 + 0.5, 0], rotation: [0, Math.PI / 2, 0], width: 16, height: baseHeight },
      { position: [0, baseHeight / 2 + 0.5, 10], rotation: [0, Math.PI, 0], width: 16, height: baseHeight },
      { position: [10, baseHeight / 2 + 0.5, 0], rotation: [0, -Math.PI / 2, 0], width: 16, height: baseHeight },
    ]);
    layouts.push([
      { position: [0, baseHeight / 2 + 0.5, -12], rotation: [0, 0, 0], width: 10, height: baseHeight },
      { position: [-12, baseHeight / 2 + 0.5, -5], rotation: [0, Math.PI / 2, 0], width: 8, height: baseHeight },
      { position: [-12, baseHeight / 2 + 0.5, 5], rotation: [0, Math.PI / 2, 0], width: 8, height: baseHeight },
      { position: [0, baseHeight / 2 + 0.5, 12], rotation: [0, Math.PI, 0], width: 10, height: baseHeight },
      { position: [12, baseHeight / 2 + 0.5, 5], rotation: [0, -Math.PI / 2, 0], width: 8, height: baseHeight },
      { position: [12, baseHeight / 2 + 0.5, -5], rotation: [0, -Math.PI / 2, 0], width: 8, height: baseHeight },
    ]);
    layouts.push([
      { position: [0, baseHeight / 2 + 0.5, -13], rotation: [0, 0, 0], width: 7, height: baseHeight },
      { position: [-6, baseHeight / 2 + 0.5, -13], rotation: [0, 0, 0], width: 5, height: baseHeight },
      { position: [6, baseHeight / 2 + 0.5, -13], rotation: [0, 0, 0], width: 5, height: baseHeight },
      { position: [-13, baseHeight / 2 + 0.5, 0], rotation: [0, Math.PI / 2, 0], width: 14, height: baseHeight },
      { position: [0, baseHeight / 2 + 0.5, 13], rotation: [0, Math.PI, 0], width: 7, height: baseHeight },
      { position: [-6, baseHeight / 2 + 0.5, 13], rotation: [0, Math.PI, 0], width: 5, height: baseHeight },
      { position: [6, baseHeight / 2 + 0.5, 13], rotation: [0, Math.PI, 0], width: 5, height: baseHeight },
      { position: [13, baseHeight / 2 + 0.5, 0], rotation: [0, -Math.PI / 2, 0], width: 14, height: baseHeight },
    ]);
  }

  const idx = layoutIndex % layouts.length;
  return layouts[idx];
};

const generate9Layouts = (template: VenueTemplate): VenueWall[][] => {
  const result: VenueWall[][] = [];
  for (let i = 0; i < 9; i++) {
    result.push(generateWallLayout(i % 3, template));
  }
  return result;
};

export const VENUE_CONFIGS: Record<VenueTemplate, VenueConfig> = {
  white_gallery: {
    name: '白色画廊',
    thumbnail: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 50%, #CBD5E1 100%)',
    bgColor: '#F1F5F9',
    wallColor: '#FFFFFF',
    floorColor: '#E2E8F0',
    ambientIntensity: 0.85,
    directionalIntensity: 0.6,
    layouts: generate9Layouts('white_gallery'),
  },
  industrial_warehouse: {
    name: '工业仓库',
    thumbnail: 'linear-gradient(135deg, #44403C 0%, #57534E 50%, #78716C 100%)',
    bgColor: '#292524',
    wallColor: '#57534E',
    floorColor: '#44403C',
    ambientIntensity: 0.45,
    directionalIntensity: 0.9,
    layouts: generate9Layouts('industrial_warehouse'),
  },
  outdoor_park: {
    name: '露天公园',
    thumbnail: 'linear-gradient(135deg, #86EFAC 0%, #4ADE80 50%, #22C55E 100%)',
    bgColor: '#0C4A6E',
    wallColor: '#FEF3C7',
    floorColor: '#166534',
    ambientIntensity: 0.75,
    directionalIntensity: 1.1,
    layouts: generate9Layouts('outdoor_park'),
  },
};

export const getWallsForVenue = (template: VenueTemplate, layoutIndex: number): VenueWall[] => {
  const config = VENUE_CONFIGS[template];
  const idx = Math.max(0, Math.min(layoutIndex, config.layouts.length - 1));
  return config.layouts[idx];
};
