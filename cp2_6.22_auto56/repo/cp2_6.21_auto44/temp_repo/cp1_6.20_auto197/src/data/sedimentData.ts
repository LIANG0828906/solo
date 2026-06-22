export interface SedimentLayer {
  id: string;
  name: string;
  thickness: number;
  color: string;
  textureType: 'granite' | 'sandstone' | 'limestone' | 'clay' | 'topsoil';
  density: number;
  geologicalAge: string;
  yStart: number;
  yEnd: number;
}

export const presetLayers: Omit<SedimentLayer, 'thickness' | 'yStart' | 'yEnd'>[] = [
  {
    id: 'granite',
    name: '花岗岩',
    color: '#4f4f4f',
    textureType: 'granite',
    density: 2.7,
    geologicalAge: '前寒武纪'
  },
  {
    id: 'sandstone',
    name: '砂岩',
    color: '#d4b88c',
    textureType: 'sandstone',
    density: 2.3,
    geologicalAge: '古生代'
  },
  {
    id: 'limestone',
    name: '石灰岩',
    color: '#e8e5d6',
    textureType: 'limestone',
    density: 2.6,
    geologicalAge: '中生代'
  },
  {
    id: 'clay',
    name: '粘土层',
    color: '#a0522d',
    textureType: 'clay',
    density: 1.8,
    geologicalAge: '新生代'
  },
  {
    id: 'topsoil',
    name: '表土层',
    color: '#7a9c5d',
    textureType: 'topsoil',
    density: 1.3,
    geologicalAge: '现代'
  }
];

const MIN_THICKNESS = 2;
const MAX_THICKNESS = 3;
const BLOCK_SIZE = 10;

function generateLayersWithThickness(): SedimentLayer[] {
  const layers: SedimentLayer[] = [];
  let remainingHeight = BLOCK_SIZE;
  const layerCount = presetLayers.length;

  for (let i = 0; i < layerCount; i++) {
    const preset = presetLayers[i];
    let thickness: number;

    if (i === layerCount - 1) {
      thickness = remainingHeight;
    } else {
      const minRemaining = (layerCount - i - 1) * MIN_THICKNESS;
      const maxAvailable = remainingHeight - minRemaining;
      const maxThickness = Math.min(MAX_THICKNESS, maxAvailable);
      thickness = MIN_THICKNESS + Math.random() * (maxThickness - MIN_THICKNESS);
    }

    const yStart = BLOCK_SIZE - remainingHeight;
    const yEnd = yStart + thickness;

    layers.push({
      ...preset,
      thickness,
      yStart,
      yEnd
    });

    remainingHeight -= thickness;
  }

  return layers;
}

export function generateSedimentLayers(): SedimentLayer[] {
  let layers = generateLayersWithThickness();
  const totalThickness = layers.reduce((sum, l) => sum + l.thickness, 0);
  
  if (Math.abs(totalThickness - BLOCK_SIZE) > 0.01) {
    const lastLayer = layers[layers.length - 1];
    const diff = BLOCK_SIZE - totalThickness;
    lastLayer.thickness += diff;
    lastLayer.yEnd += diff;
  }
  
  return layers;
}
