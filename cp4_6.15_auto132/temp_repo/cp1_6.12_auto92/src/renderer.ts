export interface RoomParams {
  length: number;
  width: number;
  wallColorIndex: number;
  floorMaterial: 'wood' | 'tile' | 'carpet';
}

export interface WindowParams {
  id: string;
  orientation: 'east' | 'south' | 'west' | 'north';
  width: number;
  height: number;
  sillHeight: number;
  transmittance: number;
}

export interface LightParams {
  timeHour: number;
  timeMinute: number;
  windows: WindowParams[];
}

export interface Scheme {
  id: string;
  label: string;
  room: RoomParams;
  light: LightParams;
  thumbnail: string;
}

export type ViewMode = 'top' | 'perspective';

export interface RenderParams {
  room: RoomParams;
  light: LightParams;
  viewMode: ViewMode;
  canvasWidth: number;
  canvasHeight: number;
}

const WALL_COLORS = [
  '#F5F0EB', '#E8E4DE', '#D4CFC8', '#B8B3AB',
  '#F2E8D5', '#E6D5B8', '#C8BFA8', '#A8D8E8',
  '#88C8D8', '#A8D0A0', '#90B880', '#D0A8B8'
];

const WALL_COLOR_NAMES = [
  '暖白', '米白', '浅灰', '中灰',
  '浅米黄', '米黄', '深米黄', '雾蓝',
  '天蓝', '豆绿', '森绿', '烟粉'
];

export { WALL_COLORS, WALL_COLOR_NAMES };

interface FloorMaterialDef {
  baseColor: string;
  roughness: number;
  patternType: 'wood' | 'tile' | 'carpet';
}

const FLOOR_MATERIALS: Record<string, FloorMaterialDef> = {
  wood: { baseColor: '#8B6914', roughness: 0.4, patternType: 'wood' },
  tile: { baseColor: '#D8D0C8', roughness: 0.1, patternType: 'tile' },
  carpet: { baseColor: '#6B5B4F', roughness: 0.85, patternType: 'carpet' },
};

interface SunPosition {
  altitude: number;
  azimuth: number;
  intensity: number;
}

function calculateSunPosition(hour: number, minute: number, latitude: number = 40): SunPosition {
  const dayOfYear = 172;
  const declinationDeg = 23.45 * Math.sin((2 * Math.PI / 365) * (284 + dayOfYear));
  const declination = declinationDeg * Math.PI / 180;
  const latRad = latitude * Math.PI / 180;

  const solarTime = hour + minute / 60;
  const hourAngle = (15 * (solarTime - 12)) * Math.PI / 180;

  const sinAltitude = Math.sin(latRad) * Math.sin(declination) +
    Math.cos(latRad) * Math.cos(declination) * Math.cos(hourAngle);

  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAltitude)));

  const cosAltitude = Math.cos(altitude);
  let azimuth = 0;
  if (cosAltitude > 0.001) {
    const cosAzimuth = (Math.sin(declination) - Math.sin(altitude) * Math.sin(latRad)) /
      (cosAltitude * Math.cos(latRad));
    azimuth = Math.acos(Math.max(-1, Math.min(1, cosAzimuth)));
    if (hourAngle > 0) azimuth = 2 * Math.PI - azimuth;
  }

  const altitudeDeg = altitude * 180 / Math.PI;
  let intensity = 0;
  if (altitudeDeg > 0) {
    intensity = Math.min(1, Math.sin(altitude) * 1.5);
    if (altitudeDeg < 10) {
      intensity *= altitudeDeg / 10 * 0.6 + 0.4;
    }
  }

  return {
    altitude: altitudeDeg,
    azimuth: azimuth * 180 / Math.PI,
    intensity,
  };
}

function getWindowLightContribution(
  win: WindowParams,
  sun: SunPosition,
  roomLength: number,
  roomWidth: number,
): { direction: { x: number; y: number }; intensity: number; lightAngle: number } | null {
  if (sun.altitude <= 0 || sun.intensity <= 0) return null;

  const sunAzimuthRad = sun.azimuth * Math.PI / 180;

  let wallNormalX = 0, wallNormalY = 0;
  let wallCenterX = 0, wallCenterY = 0;

  switch (win.orientation) {
    case 'south':
      wallNormalY = -1; wallCenterX = roomLength / 2; wallCenterY = 0;
      break;
    case 'north':
      wallNormalY = 1; wallCenterX = roomLength / 2; wallCenterY = roomWidth;
      break;
    case 'east':
      wallNormalX = 1; wallCenterX = roomLength; wallCenterY = roomWidth / 2;
      break;
    case 'west':
      wallNormalX = -1; wallCenterX = 0; wallCenterY = roomWidth / 2;
      break;
  }

  const sunDirX = -Math.sin(sunAzimuthRad);
  const sunDirY = -Math.cos(sunAzimuthRad);

  const dot = sunDirX * wallNormalX + sunDirY * wallNormalY;
  if (dot <= 0) return null;

  const effectiveIntensity = sun.intensity * dot * win.transmittance;
  const lightAngle = Math.atan2(sunDirY, sunDirX);

  return {
    direction: { x: sunDirX, y: sunDirY },
    intensity: effectiveIntensity,
    lightAngle,
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return '#' + [r, g, b].map(v => clamp(v).toString(16).padStart(2, '0')).join('');
}

function blendColor(baseHex: string, lightColor: [number, number, number], factor: number): string {
  const [r, g, b] = hexToRgb(baseHex);
  const lr = r + (lightColor[0] - r) * factor;
  const lg = g + (lightColor[1] - g) * factor;
  const lb = b + (lightColor[2] - b) * factor;
  return rgbToHex(lr, lg, lb);
}

function drawRoomTopView(
  ctx: CanvasRenderingContext2D,
  params: RenderParams,
  sun: SunPosition,
): void {
  const { room, light, canvasWidth, canvasHeight } = params;
  const padding = 60;
  const availW = canvasWidth - padding * 2;
  const availH = canvasHeight - padding * 2;
  const scale = Math.min(availW / room.length, availH / room.width) * 0.85;
  const offsetX = (canvasWidth - room.length * scale) / 2;
  const offsetY = (canvasHeight - room.width * scale) / 2;

  ctx.save();
  ctx.translate(offsetX, offsetY);

  const floorMat = FLOOR_MATERIALS[room.floorMaterial];
  ctx.fillStyle = floorMat.baseColor;
  ctx.fillRect(0, 0, room.length * scale, room.width * scale);

  drawFloorPatternTop(ctx, room.floorMaterial, room.length, room.width, scale);

  if (sun.altitude > 0 && sun.intensity > 0) {
    for (const win of light.windows) {
      const contrib = getWindowLightContribution(win, sun, room.length, room.width);
      if (!contrib) continue;

      drawLightPatchTop(
        ctx, win, contrib, sun, room.length, room.width, scale
      );
    }
  }

  const wallColor = WALL_COLORS[room.wallColorIndex] || WALL_COLORS[0];
  ctx.strokeStyle = wallColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, room.length * scale, room.width * scale);

  for (const win of light.windows) {
    drawWindowTopView(ctx, win, room.length, room.width, scale);
  }

  drawCompass(ctx, canvasWidth - offsetX, canvasHeight - offsetY);

  ctx.restore();
}

function drawFloorPatternTop(
  ctx: CanvasRenderingContext2D,
  material: string,
  roomL: number,
  roomW: number,
  scale: number,
): void {
  ctx.save();
  ctx.globalAlpha = 0.15;
  const w = roomL * scale;
  const h = roomW * scale;

  if (material === 'wood') {
    ctx.strokeStyle = '#5A4010';
    ctx.lineWidth = 0.5;
    const plankWidth = 0.15 * scale;
    for (let x = 0; x < w; x += plankWidth) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
  } else if (material === 'tile') {
    ctx.strokeStyle = '#A09890';
    ctx.lineWidth = 0.5;
    const tileSize = 0.6 * scale;
    for (let y = 0; y < h; y += tileSize) {
      for (let x = 0; x < w; x += tileSize) {
        ctx.strokeRect(x, y, tileSize, tileSize);
      }
    }
  } else if (material === 'carpet') {
    ctx.fillStyle = '#4A3A2F';
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const s = 1 + Math.random() * 2;
      ctx.fillRect(x, y, s, s);
    }
  }

  ctx.restore();
}

function drawWindowTopView(
  ctx: CanvasRenderingContext2D,
  win: WindowParams,
  roomL: number,
  roomW: number,
  scale: number,
): void {
  ctx.save();
  const winW = win.width * scale;
  const wallThickness = 6;

  let x = 0, y = 0, w = 0, h = 0;
  switch (win.orientation) {
    case 'south':
      x = (roomL / 2 - win.width / 2) * scale;
      y = -wallThickness / 2;
      w = winW;
      h = wallThickness;
      break;
    case 'north':
      x = (roomL / 2 - win.width / 2) * scale;
      y = roomW * scale - wallThickness / 2;
      w = winW;
      h = wallThickness;
      break;
    case 'east':
      x = roomL * scale - wallThickness / 2;
      y = (roomW / 2 - win.width / 2) * scale;
      w = wallThickness;
      h = winW;
      break;
    case 'west':
      x = -wallThickness / 2;
      y = (roomW / 2 - win.width / 2) * scale;
      w = wallThickness;
      h = winW;
      break;
  }

  ctx.fillStyle = '#4A90D9';
  ctx.globalAlpha = 0.8;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#5BA3EC';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);

  ctx.restore();
}

function drawLightPatchTop(
  ctx: CanvasRenderingContext2D,
  win: WindowParams,
  contrib: { direction: { x: number; y: number }; intensity: number; lightAngle: number },
  sun: SunPosition,
  roomL: number,
  roomW: number,
  scale: number,
): void {
  ctx.save();

  const altRad = sun.altitude * Math.PI / 180;
  const tanAlt = Math.tan(altRad);

  let winCenterX = 0, winCenterY = 0;
  const winW = win.width;

  switch (win.orientation) {
    case 'south':
      winCenterX = roomL / 2; winCenterY = 0;
      break;
    case 'north':
      winCenterX = roomL / 2; winCenterY = roomW;
      break;
    case 'east':
      winCenterX = roomL; winCenterY = roomW / 2;
      break;
    case 'west':
      winCenterX = 0; winCenterY = roomW / 2;
      break;
  }

  const depth = win.height / Math.max(0.1, tanAlt);
  const patchDepth = Math.min(depth, 20);

  const dx = contrib.direction.x;
  const dy = contrib.direction.y;
  const perpX = -dy;
  const perpY = dx;

  const halfW = winW / 2;

  const p1x = (winCenterX - perpX * halfW) * scale;
  const p1y = (winCenterY - perpY * halfW) * scale;
  const p2x = (winCenterX + perpX * halfW) * scale;
  const p2y = (winCenterY + perpY * halfW) * scale;
  const p3x = (winCenterX + dx * patchDepth + perpX * halfW * 0.7) * scale;
  const p3y = (winCenterY + dy * patchDepth + perpY * halfW * 0.7) * scale;
  const p4x = (winCenterX + dx * patchDepth - perpX * halfW * 0.7) * scale;
  const p4y = (winCenterY + dy * patchDepth - perpY * halfW * 0.7) * scale;

  const windowArea = win.width * win.height;
  const maxArea = 2.5 * 2.5;
  const softnessRatio = windowArea / maxArea;
  const blurRadius = 2 + softnessRatio * 10;

  const warmLight: [number, number, number] = [
    255, 240 + sun.altitude * 0.1, 200 + sun.altitude * 0.3
  ];

  ctx.beginPath();
  ctx.moveTo(p1x, p1y);
  ctx.lineTo(p2x, p2y);
  ctx.lineTo(p3x, p3y);
  ctx.lineTo(p4x, p4y);
  ctx.closePath();

  const lightColor = rgbToHex(
    Math.min(255, warmLight[0]),
    Math.min(255, warmLight[1]),
    Math.min(255, warmLight[2])
  );

  const grad = ctx.createLinearGradient(p1x, p1y, (p3x + p4x) / 2, (p3y + p4y) / 2);
  const alpha = Math.min(0.55, contrib.intensity * 0.6);
  grad.addColorStop(0, `rgba(${warmLight[0]},${Math.min(255, warmLight[1])},${Math.min(255, warmLight[2])},${alpha})`);
  grad.addColorStop(0.5, `rgba(${warmLight[0]},${Math.min(255, warmLight[1])},${Math.min(255, warmLight[2])},${alpha * 0.5})`);
  grad.addColorStop(1, `rgba(${warmLight[0]},${Math.min(255, warmLight[1])},${Math.min(255, warmLight[2])},0)`);

  ctx.fillStyle = grad;
  ctx.filter = `blur(${blurRadius}px)`;
  ctx.fill();
  ctx.filter = 'none';

  ctx.restore();
}

function drawCompass(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  const size = 30;
  ctx.translate(x - 40, y - 40);

  ctx.beginPath();
  ctx.arc(0, 0, size, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(45, 45, 45, 0.8)';
  ctx.fill();
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#CCC';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('N', 0, -size + 10);
  ctx.fillText('S', 0, size - 10);
  ctx.fillText('E', size - 10, 0);
  ctx.fillText('W', -size + 10, 0);

  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.lineTo(-4, -6);
  ctx.lineTo(0, -2);
  ctx.lineTo(4, -6);
  ctx.closePath();
  ctx.fillStyle = '#4A90D9';
  ctx.fill();

  ctx.restore();
}

function drawRoomPerspectiveView(
  ctx: CanvasRenderingContext2D,
  params: RenderParams,
  sun: SunPosition,
): void {
  const { room, light, canvasWidth, canvasHeight } = params;
  const wallHeight = 3.0;

  ctx.save();

  const vanishingX = canvasWidth / 2;
  const vanishingY = canvasHeight * 0.42;

  const margin = 40;
  const maxDrawW = canvasWidth - margin * 2;
  const maxDrawH = canvasHeight - margin * 2;

  const depthScale = maxDrawW / (room.length * 1.2);
  const widthScale = maxDrawH / (room.width * 0.8 + wallHeight * 1.2);
  const pScale = Math.min(depthScale, widthScale) * 0.6;

  const eyeHeight = 1.5;
  const nearClip = 0.5;

  function project(px: number, py: number, pz: number): [number, number] {
    const z = Math.max(nearClip, px);
    const perspective = pScale / (z + pScale * 0.3);
    const screenX = vanishingX + (py - room.length / 2) * perspective * pScale * 0.8;
    const screenY = vanishingY + (eyeHeight - pz) * perspective * pScale * 0.5
      + (room.width / 2) * perspective * pScale * 0.2;
    return [screenX, screenY];
  }

  const floorMat = FLOOR_MATERIALS[room.floorMaterial];
  const wallColor = WALL_COLORS[room.wallColorIndex] || WALL_COLORS[0];

  const bl = project(0, 0, 0);
  const br = project(0, room.length, 0);
  const tr = project(0, room.length, wallHeight);
  const tl = project(0, 0, wallHeight);

  const bld = project(room.width, 0, 0);
  const brd = project(room.width, room.length, 0);
  const trd = project(room.width, room.length, wallHeight);
  const tld = project(room.width, 0, wallHeight);

  drawFloorPerspective(ctx, floorMat, bl, br, brd, bld);

  drawWallPerspective(ctx, wallColor, room.wallColorIndex, bl, br, tr, tl, 'back', sun);

  drawWallPerspective(ctx, wallColor, room.wallColorIndex, br, brd, trd, tr, 'right', sun);

  drawWallPerspective(ctx, wallColor, room.wallColorIndex, bld, bl, tl, tld, 'left', sun);

  drawCeilingPerspective(ctx, tl, tr, trd, tld);

  for (const win of light.windows) {
    drawWindowPerspective(ctx, win, room.length, room.width, wallHeight, project, sun, light);
  }

  if (sun.altitude > 0 && sun.intensity > 0) {
    drawShadowsPerspective(ctx, light.windows, sun, room, wallHeight, project);
  }

  ctx.restore();
}

function drawFloorPerspective(
  ctx: CanvasRenderingContext2D,
  floorMat: FloorMaterialDef,
  bl: [number, number],
  br: [number, number],
  brd: [number, number],
  bld: [number, number],
): void {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(bl[0], bl[1]);
  ctx.lineTo(br[0], br[1]);
  ctx.lineTo(brd[0], brd[1]);
  ctx.lineTo(bld[0], bld[1]);
  ctx.closePath();
  ctx.fillStyle = floorMat.baseColor;
  ctx.fill();

  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = floorMat.patternType === 'wood' ? '#5A4010' :
    floorMat.patternType === 'tile' ? '#A09890' : '#4A3A2F';
  ctx.lineWidth = 0.5;

  const steps = 10;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const lx = bl[0] + (bld[0] - bl[0]) * t;
    const ly = bl[1] + (bld[1] - bl[1]) * t;
    const rx = br[0] + (brd[0] - br[0]) * t;
    const ry = br[1] + (brd[1] - br[1]) * t;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(rx, ry);
    ctx.stroke();
  }

  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const bx = bl[0] + (br[0] - bl[0]) * t;
    const by = bl[1] + (br[1] - bl[1]) * t;
    const tx = bld[0] + (brd[0] - bld[0]) * t;
    const ty = bld[1] + (brd[1] - bld[1]) * t;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(tx, ty);
    ctx.stroke();
  }

  ctx.restore();
}

function drawWallPerspective(
  ctx: CanvasRenderingContext2D,
  wallColor: string,
  _colorIndex: number,
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  p4: [number, number],
  side: string,
  sun: SunPosition,
): void {
  ctx.save();

  let lightFactor = 0.7;
  if (side === 'back') {
    lightFactor = 0.85;
  } else if (side === 'right') {
    lightFactor = sun.azimuth > 90 && sun.azimuth < 270 ? 0.9 : 0.6;
  } else if (side === 'left') {
    lightFactor = sun.azimuth > 90 && sun.azimuth < 270 ? 0.6 : 0.9;
  }

  if (sun.altitude <= 0) lightFactor = 0.3;
  lightFactor *= sun.intensity * 0.6 + 0.4;

  const litColor = blendColor(wallColor, [255, 248, 230], (lightFactor - 0.5) * 0.6);

  ctx.beginPath();
  ctx.moveTo(p1[0], p1[1]);
  ctx.lineTo(p2[0], p2[1]);
  ctx.lineTo(p3[0], p3[1]);
  ctx.lineTo(p4[0], p4[1]);
  ctx.closePath();
  ctx.fillStyle = litColor;
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

function drawCeilingPerspective(
  ctx: CanvasRenderingContext2D,
  tl: [number, number],
  tr: [number, number],
  trd: [number, number],
  tld: [number, number],
): void {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(tl[0], tl[1]);
  ctx.lineTo(tr[0], tr[1]);
  ctx.lineTo(trd[0], trd[1]);
  ctx.lineTo(tld[0], tld[1]);
  ctx.closePath();
  ctx.fillStyle = '#E8E4DE';
  ctx.fill();
  ctx.restore();
}

function drawWindowPerspective(
  ctx: CanvasRenderingContext2D,
  win: WindowParams,
  roomL: number,
  roomW: number,
  wallH: number,
  project: (x: number, y: number, z: number) => [number, number],
  sun: SunPosition,
  _light: LightParams,
): void {
  ctx.save();

  let winCenterY = 0, winCenterZ = 0;
  let wallSide = '';
  const winHW = win.width / 2;
  const winHH = win.height / 2;
  const winMidZ = win.sillHeight + win.height / 2;

  switch (win.orientation) {
    case 'south':
      winCenterY = roomL / 2; winCenterZ = winMidZ; wallSide = 'back';
      break;
    case 'north':
      winCenterY = roomL / 2; winCenterZ = winMidZ; wallSide = 'back';
      break;
    case 'east':
      winCenterY = roomL; winCenterZ = winMidZ; wallSide = 'right';
      break;
    case 'west':
      winCenterY = 0; winCenterZ = winMidZ; wallSide = 'left';
      break;
  }

  let corners: [number, number][];
  if (wallSide === 'back') {
    const nearX = win.orientation === 'south' ? 0.05 : roomW - 0.05;
    const cy = winCenterY;
    const p1 = project(nearX, cy - winHW, win.sillHeight);
    const p2 = project(nearX, cy + winHW, win.sillHeight);
    const p3 = project(nearX, cy + winHW, win.sillHeight + win.height);
    const p4 = project(nearX, cy - winHW, win.sillHeight + win.height);
    corners = [p1, p2, p3, p4];
  } else if (wallSide === 'right') {
    const p1 = project(roomW - 0.05, roomL, win.sillHeight);
    const p2 = project(0.05, roomL, win.sillHeight);
    const p3 = project(0.05, roomL, win.sillHeight + win.height);
    const p4 = project(roomW - 0.05, roomL, win.sillHeight + win.height);
    corners = [p1, p2, p3, p4];
  } else {
    const p1 = project(0.05, 0, win.sillHeight);
    const p2 = project(roomW - 0.05, 0, win.sillHeight);
    const p3 = project(roomW - 0.05, 0, win.sillHeight + win.height);
    const p4 = project(0.05, 0, win.sillHeight + win.height);
    corners = [p1, p2, p3, p4];
  }

  const isLit = sun.altitude > 0 && sun.intensity > 0;
  const contrib = isLit ? getWindowLightContribution(win, sun, roomL, roomW) : null;

  ctx.beginPath();
  ctx.moveTo(corners[0][0], corners[0][1]);
  ctx.lineTo(corners[1][0], corners[1][1]);
  ctx.lineTo(corners[2][0], corners[2][1]);
  ctx.lineTo(corners[3][0], corners[3][1]);
  ctx.closePath();

  if (contrib) {
    const skyColor = sun.altitude < 15 ? '#FFD080' : '#A0D8FF';
    ctx.fillStyle = skyColor;
    ctx.globalAlpha = win.transmittance * 0.8;
  } else {
    ctx.fillStyle = '#1a2a3a';
    ctx.globalAlpha = 0.7;
  }
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = '#5BA3EC';
  ctx.lineWidth = 2;
  ctx.stroke();

  const midX = (corners[0][0] + corners[2][0]) / 2;
  const midY = (corners[0][1] + corners[2][1]) / 2;
  ctx.beginPath();
  ctx.moveTo(corners[0][0], corners[0][1]);
  ctx.lineTo(corners[2][0], corners[2][1]);
  ctx.moveTo(corners[1][0], corners[1][1]);
  ctx.lineTo(corners[3][0], corners[3][1]);
  ctx.strokeStyle = 'rgba(74, 144, 217, 0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

function drawShadowsPerspective(
  ctx: CanvasRenderingContext2D,
  windows: WindowParams[],
  sun: SunPosition,
  room: RoomParams,
  wallH: number,
  project: (x: number, y: number, z: number) => [number, number],
): void {
  ctx.save();

  for (const win of windows) {
    const contrib = getWindowLightContribution(win, sun, room.length, room.width);
    if (!contrib) continue;

    const altRad = sun.altitude * Math.PI / 180;
    const tanAlt = Math.tan(altRad);
    const shadowDepth = wallH / Math.max(0.1, tanAlt);

    const windowArea = win.width * win.height;
    const maxArea = 2.5 * 2.5;
    const softnessRatio = windowArea / maxArea;
    const blurRadius = 2 + softnessRatio * 10;

    ctx.filter = `blur(${blurRadius}px)`;
    ctx.globalAlpha = contrib.intensity * 0.3;

    const warmLight: [number, number, number] = [
      255, Math.min(255, 240 + sun.altitude * 0.1), Math.min(255, 200 + sun.altitude * 0.3)
    ];

    let winX = 0, winY = 0;
    switch (win.orientation) {
      case 'south': winX = 0.05; winY = room.length / 2; break;
      case 'north': winX = room.width - 0.05; winY = room.length / 2; break;
      case 'east': winX = room.width / 2; winY = room.length - 0.05; break;
      case 'west': winX = room.width / 2; winY = 0.05; break;
    }

    const shadowPoints: [number, number][] = [];
    const steps = 8;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const sx = winX + contrib.direction.x * shadowDepth * t;
      const sy = winY + contrib.direction.y * shadowDepth * t;
      const clampedX = Math.max(0, Math.min(room.width, sx));
      const clampedY = Math.max(0, Math.min(room.length, sy));
      shadowPoints.push(project(clampedX, clampedY, 0.01));
    }

    if (shadowPoints.length >= 2) {
      const lightColorStr = `rgba(${warmLight[0]},${warmLight[1]},${warmLight[2]},0.4)`;
      ctx.beginPath();
      ctx.moveTo(shadowPoints[0][0], shadowPoints[0][1]);
      for (let i = 1; i < shadowPoints.length; i++) {
        ctx.lineTo(shadowPoints[i][0], shadowPoints[i][1]);
      }
      for (let i = shadowPoints.length - 1; i >= 0; i--) {
        const spread = (1 - i / steps) * win.width * 0.3;
        const perpX = -contrib.direction.y * spread;
        const perpY = contrib.direction.x * spread;
        const px = shadowPoints[i][0] + perpX * 10;
        const py = shadowPoints[i][1] + perpY * 10;
        ctx.lineTo(px, py);
      }
      ctx.closePath();

      const grad = ctx.createLinearGradient(
        shadowPoints[0][0], shadowPoints[0][1],
        shadowPoints[shadowPoints.length - 1][0], shadowPoints[shadowPoints.length - 1][1]
      );
      grad.addColorStop(0, lightColorStr);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }

  ctx.filter = 'none';
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function renderScene(
  ctx: CanvasRenderingContext2D,
  params: RenderParams,
): void {
  ctx.clearRect(0, 0, params.canvasWidth, params.canvasHeight);

  ctx.fillStyle = '#1E1E1E';
  ctx.fillRect(0, 0, params.canvasWidth, params.canvasHeight);

  const sun = calculateSunPosition(params.light.timeHour, params.light.timeMinute);

  if (params.viewMode === 'top') {
    drawRoomTopView(ctx, params, sun);
  } else {
    drawRoomPerspectiveView(ctx, params, sun);
  }

  drawSunInfo(ctx, sun, params.canvasWidth, params.canvasHeight);
}

function drawSunInfo(
  ctx: CanvasRenderingContext2D,
  sun: SunPosition,
  cw: number,
  ch: number,
): void {
  ctx.save();
  ctx.fillStyle = 'rgba(45, 45, 45, 0.85)';
  const boxW = 140;
  const boxH = 60;
  const bx = cw - boxW - 12;
  const by = 12;
  ctx.beginPath();
  ctx.roundRect(bx, by, boxW, boxH, 6);
  ctx.fill();

  ctx.fillStyle = '#AAA';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`太阳高度角: ${sun.altitude.toFixed(1)}°`, bx + 10, by + 20);
  ctx.fillText(`太阳方位角: ${sun.azimuth.toFixed(1)}°`, bx + 10, by + 36);
  ctx.fillText(`光照强度: ${(sun.intensity * 100).toFixed(0)}%`, bx + 10, by + 52);

  ctx.restore();
}

export function renderToThumbnail(
  params: RenderParams,
  thumbWidth: number,
  thumbHeight: number,
): string {
  const offscreen = document.createElement('canvas');
  offscreen.width = thumbWidth;
  offscreen.height = thumbHeight;
  const offCtx = offscreen.getContext('2d')!;

  const thumbParams: RenderParams = {
    ...params,
    canvasWidth: thumbWidth,
    canvasHeight: thumbHeight,
  };

  renderScene(offCtx, thumbParams);
  return offscreen.toDataURL('image/png');
}

export function renderWithWatermark(
  ctx: CanvasRenderingContext2D,
  params: RenderParams,
): void {
  renderScene(ctx, params);

  ctx.save();
  const text = `${params.room.length}m×${params.room.width}m | ${WALL_COLOR_NAMES[params.room.wallColorIndex]} | ${params.room.floorMaterial === 'wood' ? '木地板' : params.room.floorMaterial === 'tile' ? '瓷砖' : '地毯'} | ${String(params.light.timeHour).padStart(2, '0')}:${String(params.light.timeMinute).padStart(2, '0')}`;
  ctx.fillStyle = 'rgba(160, 160, 160, 0.5)';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(text, 12, params.canvasHeight - 12);
  ctx.restore();
}

export function exportToPNG(
  params: RenderParams,
  width: number,
  height: number,
): void {
  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const offCtx = offscreen.getContext('2d')!;

  const exportParams: RenderParams = {
    ...params,
    canvasWidth: width,
    canvasHeight: height,
  };

  renderWithWatermark(offCtx, exportParams);

  const link = document.createElement('a');
  link.download = `lightshadow-${Date.now()}.png`;
  link.href = offscreen.toDataURL('image/png');
  link.click();
}

export { calculateSunPosition };
