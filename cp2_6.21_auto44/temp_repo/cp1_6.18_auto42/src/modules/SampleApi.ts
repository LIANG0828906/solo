export interface PathPoint {
  x: number;
  y: number;
}

export interface SketchSample {
  id: string;
  name: string;
  paths: PathPoint[][];
  thumbnail: string;
}

export function getSamples(): SketchSample[] {
  return [
    {
      id: 'wave',
      name: '波浪线',
      thumbnail: '〰️',
      paths: [generateWavePath()]
    },
    {
      id: 'spiral',
      name: '螺旋线',
      thumbnail: '🌀',
      paths: [generateSpiralPath()]
    },
    {
      id: 'star',
      name: '星芒',
      thumbnail: '⭐',
      paths: generateStarPaths()
    },
    {
      id: 'heart',
      name: '心跳',
      thumbnail: '💓',
      paths: [generateHeartbeatPath()]
    }
  ];
}

function generateWavePath(): PathPoint[] {
  const points: PathPoint[] = [];
  const width = 800;
  const height = 600;
  const centerY = height / 2;
  
  for (let x = 100; x <= 700; x += 8) {
    const t = (x - 100) / 600;
    const y = centerY + Math.sin(t * Math.PI * 4) * 150 + Math.sin(t * Math.PI * 8) * 50;
    points.push({ x, y });
  }
  
  return points;
}

function generateSpiralPath(): PathPoint[] {
  const points: PathPoint[] = [];
  const centerX = 400;
  const centerY = 300;
  const maxRadius = 250;
  const turns = 5;
  
  for (let i = 0; i <= 1000; i++) {
    const t = i / 1000;
    const angle = t * Math.PI * 2 * turns;
    const radius = t * maxRadius;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    
    if (points.length === 0 || 
        Math.hypot(points[points.length - 1].x - x, points[points.length - 1].y - y) >= 8) {
      points.push({ x, y });
    }
  }
  
  return points;
}

function generateStarPaths(): PathPoint[][] {
  const paths: PathPoint[][] = [];
  const centerX = 400;
  const centerY = 300;
  const outerRadius = 200;
  const innerRadius = 80;
  const pointsCount = 5;
  
  for (let i = 0; i < pointsCount; i++) {
    const path: PathPoint[] = [];
    const angle1 = (i * 2 * Math.PI) / pointsCount - Math.PI / 2;
    const angle2 = ((i + 1) * 2 * Math.PI) / pointsCount - Math.PI / 2;
    const midAngle = (angle1 + angle2) / 2;
    
    const outerX = centerX + Math.cos(angle1) * outerRadius;
    const outerY = centerY + Math.sin(angle1) * outerRadius;
    const innerX = centerX + Math.cos(midAngle) * innerRadius;
    const innerY = centerY + Math.sin(midAngle) * innerRadius;
    const nextOuterX = centerX + Math.cos(angle2) * outerRadius;
    const nextOuterY = centerY + Math.sin(angle2) * outerRadius;
    
    const steps = 20;
    for (let j = 0; j <= steps; j++) {
      const t = j / steps;
      const x = outerX + (innerX - outerX) * t;
      const y = outerY + (innerY - outerY) * t;
      if (path.length === 0 || 
          Math.hypot(path[path.length - 1].x - x, path[path.length - 1].y - y) >= 8) {
        path.push({ x, y });
      }
    }
    
    for (let j = 1; j <= steps; j++) {
      const t = j / steps;
      const x = innerX + (nextOuterX - innerX) * t;
      const y = innerY + (nextOuterY - innerY) * t;
      if (path.length === 0 || 
          Math.hypot(path[path.length - 1].x - x, path[path.length - 1].y - y) >= 8) {
        path.push({ x, y });
      }
    }
    
    paths.push(path);
  }
  
  return paths;
}

function generateHeartbeatPath(): PathPoint[] {
  const points: PathPoint[] = [];
  const width = 800;
  const height = 600;
  const baseY = height / 2;
  
  for (let x = 50; x <= 750; x += 6) {
    const t = (x - 50) / 700;
    let y = baseY;
    
    const cycle = t % 0.2;
    
    if (cycle < 0.03) {
      y = baseY;
    } else if (cycle < 0.06) {
      const localT = (cycle - 0.03) / 0.03;
      y = baseY - localT * 80;
    } else if (cycle < 0.09) {
      const localT = (cycle - 0.06) / 0.03;
      y = baseY - 80 + localT * 140;
    } else if (cycle < 0.12) {
      const localT = (cycle - 0.09) / 0.03;
      y = baseY + 60 - localT * 60;
    } else {
      y = baseY;
    }
    
    if (points.length === 0 || 
        Math.hypot(points[points.length - 1].x - x, points[points.length - 1].y - y) >= 8) {
      points.push({ x, y });
    }
  }
  
  return points;
}
