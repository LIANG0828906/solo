import { WOODS, METALS, STYLES } from '../data/catalog';
import type { StyleId } from '../types';

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 0, g: 0, b: 0 };
};

const lightenColor = (hex: string, percent: number): string => {
  const { r, g, b } = hexToRgb(hex);
  const nr = Math.min(255, Math.round(r + (255 - r) * percent));
  const ng = Math.min(255, Math.round(g + (255 - g) * percent));
  const nb = Math.min(255, Math.round(b + (255 - b) * percent));
  return `rgb(${nr}, ${ng}, ${nb})`;
};

const darkenColor = (hex: string, percent: number): string => {
  const { r, g, b } = hexToRgb(hex);
  const nr = Math.max(0, Math.round(r * (1 - percent)));
  const ng = Math.max(0, Math.round(g * (1 - percent)));
  const nb = Math.max(0, Math.round(b * (1 - percent)));
  return `rgb(${nr}, ${ng}, ${nb})`;
};

const generateGrainDefs = (woodId: string, baseColor: string): string => {
  const light = lightenColor(baseColor, 0.15);
  const dark = darkenColor(baseColor, 0.12);
  const wood = WOODS.find((w) => w.id === woodId);
  const pattern = wood?.grainPattern || 'vertical';

  let lines = '';
  switch (pattern) {
    case 'vertical':
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * 100;
        const width = 0.5 + Math.random() * 2;
        const color = Math.random() > 0.5 ? light : dark;
        lines += `<line x1="${x}" y1="0" x2="${x + (Math.random() - 0.5) * 3}" y2="100" stroke="${color}" stroke-width="${width}" opacity="0.3" />`;
      }
      break;
    case 'wave':
      lines = `<path d="M0,50 Q25,30 50,50 T100,50" stroke="${dark}" stroke-width="1.5" fill="none" opacity="0.4" />
               <path d="M0,70 Q25,50 50,70 T100,70" stroke="${light}" stroke-width="1" fill="none" opacity="0.3" />
               <path d="M0,30 Q25,10 50,30 T100,30" stroke="${dark}" stroke-width="1" fill="none" opacity="0.35" />`;
      break;
    case 'horizontal':
      for (let i = 0; i < 15; i++) {
        const y = Math.random() * 100;
        const height = 0.5 + Math.random() * 1.5;
        const color = Math.random() > 0.5 ? light : dark;
        lines += `<line x1="0" y1="${y}" x2="100" y2="${y + (Math.random() - 0.5) * 2}" stroke="${color}" stroke-width="${height}" opacity="0.25" />`;
      }
      break;
    case 'diagonal':
      for (let i = -10; i < 10; i++) {
        const offset = i * 12;
        const color = i % 2 === 0 ? light : dark;
        lines += `<line x1="${offset}" y1="0" x2="${offset + 50}" y2="100" stroke="${color}" stroke-width="0.8" opacity="0.3" />`;
      }
      break;
    case 'fine':
      for (let i = 0; i < 30; i++) {
        const x = Math.random() * 100;
        const width = 0.3 + Math.random() * 0.8;
        lines += `<line x1="${x}" y1="0" x2="${x + (Math.random() - 0.5) * 1}" y2="100" stroke="${dark}" stroke-width="${width}" opacity="0.2" />`;
      }
      break;
    case 'bold':
      for (let i = 0; i < 8; i++) {
        const x = 5 + i * 12 + Math.random() * 3;
        const width = 1.5 + Math.random() * 2;
        lines += `<line x1="${x}" y1="0" x2="${x + (Math.random() - 0.5) * 5}" y2="100" stroke="${light}" stroke-width="${width}" opacity="0.35" />`;
      }
      break;
  }

  return `<pattern id="grain-${woodId}" patternUnits="userSpaceOnUse" width="100" height="100">
    <rect width="100" height="100" fill="${baseColor}" />
    ${lines}
  </pattern>`;
};

const generateMetalGradient = (metalId: string, baseColor: string): string => {
  const metal = METALS.find((m) => m.id === metalId);
  const shine = metal?.shine || 'matte';

  let stops = '';
  switch (shine) {
    case 'warm':
      stops = `<stop offset="0%" stop-color="${lightenColor(baseColor, 0.3)}" />
               <stop offset="50%" stop-color="${baseColor}" />
               <stop offset="100%" stop-color="${darkenColor(baseColor, 0.2)}" />`;
      break;
    case 'matte':
      stops = `<stop offset="0%" stop-color="${lightenColor(baseColor, 0.1)}" />
               <stop offset="50%" stop-color="${baseColor}" />
               <stop offset="100%" stop-color="${darkenColor(baseColor, 0.1)}" />`;
      break;
    case 'dark':
      stops = `<stop offset="0%" stop-color="${lightenColor(baseColor, 0.2)}" />
               <stop offset="70%" stop-color="${baseColor}" />
               <stop offset="100%" stop-color="${darkenColor(baseColor, 0.3)}" />`;
      break;
    case 'golden':
      stops = `<stop offset="0%" stop-color="${lightenColor(baseColor, 0.4)}" />
               <stop offset="30%" stop-color="${lightenColor(baseColor, 0.1)}" />
               <stop offset="70%" stop-color="${baseColor}" />
               <stop offset="100%" stop-color="${darkenColor(baseColor, 0.15)}" />`;
      break;
    case 'antique':
      stops = `<stop offset="0%" stop-color="${lightenColor(baseColor, 0.15)}" />
               <stop offset="40%" stop-color="${baseColor}" />
               <stop offset="60%" stop-color="${darkenColor(baseColor, 0.08)}" />
               <stop offset="100%" stop-color="${lightenColor(baseColor, 0.05)}" />`;
      break;
  }

  return `<linearGradient id="metal-${metalId}" x1="0%" y1="0%" x2="100%" y2="100%">
    ${stops}
  </linearGradient>`;
};

export const generateLeatherSVG = (
  styleId: StyleId,
  woodId: string,
  metalId: string,
  size: { width: number; height: number } = { width: 300, height: 250 }
): string => {
  const style = STYLES.find((s) => s.id === styleId) || STYLES[0];
  const wood = WOODS.find((w) => w.id === woodId) || WOODS[0];
  const metal = METALS.find((m) => m.id === metalId) || METALS[0];

  const scale = Math.min(
    (size.width - 40) / style.width,
    (size.height - 40) / style.height
  );
  const w = style.width * scale;
  const h = style.height * scale;
  const x = (size.width - w) / 2;
  const y = (size.height - h) / 2;
  const rx = style.corners * scale;

  const stitchOffset = 6 * scale;
  const stitchLength = 4 * scale;
  const stitchGap = 3 * scale;

  let stitches = '';
  const perimeterStitches = Math.floor(
    ((w - 2 * stitchOffset) * 2 + (h - 2 * stitchOffset) * 2) /
      (stitchLength + stitchGap)
  );
  for (let i = 0; i < perimeterStitches; i++) {
    const pos =
      (i * (stitchLength + stitchGap)) /
      (((w - 2 * stitchOffset) * 2 + (h - 2 * stitchOffset) * 2) /
        perimeterStitches);
    stitches += `<circle cx="${x + stitchOffset + pos * 10}" cy="${y + stitchOffset}" r="0.8" fill="${darkenColor( wood.color, 0.3 )}" opacity="0.6" />`;
  }

  const metalParts = generateMetalParts(
    styleId,
    metalId,
    { x, y, w, h },
    scale
  );

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}">
    <defs>
      ${generateGrainDefs(woodId, wood.color)}
      ${generateMetalGradient(metalId, metal.color)}
      <filter id="shadow-${styleId}" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="${4 * scale}" stdDeviation="${6 * scale}" flood-color="#000" flood-opacity="0.15" />
      </filter>
    </defs>
    
    <rect 
      x="${x}" y="${y}" 
      width="${w}" height="${h}" 
      rx="${rx}" ry="${rx}"
      fill="url(#grain-${woodId})"
      filter="url(#shadow-${styleId})"
    />
    
    <rect 
      x="${x + stitchOffset}" y="${y + stitchOffset}" 
      width="${w - 2 * stitchOffset}" height="${h - 2 * stitchOffset}" 
      rx="${Math.max(0, rx - stitchOffset)}" ry="${Math.max(0, rx - stitchOffset)}"
      fill="none"
      stroke="${darkenColor(wood.color, 0.25)}"
      stroke-width="0.5"
      stroke-dasharray="${stitchLength} ${stitchGap}"
      opacity="0.7"
    />
    
    ${metalParts}
  </svg>`;

  return svg;
};

const generateMetalParts = (
  styleId: StyleId,
  metalId: string,
  rect: { x: number; y: number; w: number; h: number },
  scale: number
): string => {
  const { x, y, w, h } = rect;
  const metalFill = `url(#metal-${metalId})`;

  switch (styleId) {
    case 'short-wallet': {
      const snapDiameter = 16 * scale;
      const snapX = x + w / 2;
      const snapY = y + h * 0.35;
      const strapW = 24 * scale;
      const strapH = 12 * scale;

      return `
        <rect x="${snapX - strapW / 2}" y="${snapY - strapH / 2}" width="${strapW}" height="${strapH}" 
              rx="${4 * scale}" fill="${metalFill}" opacity="0.9" />
        <circle cx="${snapX}" cy="${snapY}" r="${snapDiameter / 2}" fill="${metalFill}" />
        <circle cx="${snapX}" cy="${snapY}" r="${snapDiameter / 3}" fill="none" stroke="${darkenColor(
        METALS.find((m) => m.id === metalId)?.color || '#B87333',
        0.3
      )}" stroke-width="1" opacity="0.5" />
        <circle cx="${snapX - snapDiameter / 4}" cy="${snapY - snapDiameter / 4}" r="${2 * scale}" 
                fill="${lightenColor(METALS.find((m) => m.id === metalId)?.color || '#B87333', 0.5)}" opacity="0.6" />
      `;
    }
    case 'long-wallet': {
      const snapDiameter = 14 * scale;
      const snapX = x + w - 25 * scale;
      const snapY = y + h * 0.5;
      const cornerSize = 8 * scale;

      return `
        <circle cx="${x + 20 * scale}" cy="${y + h * 0.3}" r="${snapDiameter / 2}" fill="${metalFill}" />
        <circle cx="${x + 20 * scale}" cy="${y + h * 0.7}" r="${snapDiameter / 2}" fill="${metalFill}" />
        <rect x="${snapX - 6 * scale}" y="${snapY - 18 * scale}" width="${12 * scale}" height="${36 * scale}" 
              rx="${3 * scale}" fill="${metalFill}" />
        <circle cx="${snapX}" cy="${snapY}" r="${snapDiameter / 2}" fill="${metalFill}" />
        <rect x="${x + cornerSize / 2}" y="${y + cornerSize / 2}" width="${cornerSize}" height="${cornerSize}" 
              fill="none" stroke="${metalFill}" stroke-width="${2 * scale}" rx="${2 * scale}" />
        <rect x="${x + w - cornerSize - cornerSize / 2}" y="${y + cornerSize / 2}" width="${cornerSize}" height="${cornerSize}" 
              fill="none" stroke="${metalFill}" stroke-width="${2 * scale}" rx="${2 * scale}" />
      `;
    }
    case 'key-case': {
      const ringR = 10 * scale;
      const ringX = x + w / 2;
      const ringY = y - ringR + 2 * scale;
      const snapDiameter = 12 * scale;

      return `
        <circle cx="${ringX}" cy="${ringY}" r="${ringR}" fill="none" stroke="${metalFill}" stroke-width="${3 * scale}" />
        <rect x="${ringX - 4 * scale}" y="${y - 2 * scale}" width="${8 * scale}" height="${10 * scale}" 
              rx="${2 * scale}" fill="${metalFill}" />
        <circle cx="${x + w * 0.3}" cy="${y + h * 0.6}" r="${snapDiameter / 2}" fill="${metalFill}" />
        <circle cx="${x + w * 0.7}" cy="${y + h * 0.6}" r="${snapDiameter / 2}" fill="${metalFill}" />
      `;
    }
    default:
      return '';
  }
};

export const generateThumbnailSVG = (
  woodId: string,
  metalId: string,
  size: number = 40
): string => {
  const wood = WOODS.find((w) => w.id === woodId) || WOODS[0];
  const metal = METALS.find((m) => m.id === metalId) || METALS[0];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="4" fill="${wood.color}" />
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 5}" fill="${metal.color}" />
  </svg>`;
};

export const getWoodColor = (woodId: string): string => {
  return WOODS.find((w) => w.id === woodId)?.color || '#8B5E3C';
};

export const getMetalColor = (metalId: string): string => {
  return METALS.find((m) => m.id === metalId)?.color || '#B87333';
};

export const getWoodName = (woodId: string): string => {
  return WOODS.find((w) => w.id === woodId)?.name || '橡木';
};

export const getMetalName = (metalId: string): string => {
  return METALS.find((m) => m.id === metalId)?.name || '复古铜';
};

export const getStyleName = (styleId: StyleId): string => {
  return STYLES.find((s) => s.id === styleId)?.name || '短夹';
};
