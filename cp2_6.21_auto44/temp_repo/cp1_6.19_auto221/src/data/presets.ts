export interface PresetData {
  name: string;
  frames: string[];
}

const CHAR_RAMP = ' .:-=+*#%@';
const W = 60;
const H = 40;

function createFrame(draw: (x: number, y: number, frame: number) => number): string[] {
  const frames: string[] = [];
  for (let f = 0; f < 10; f++) {
    let frame = '';
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const val = draw(x, y, f);
        const idx = Math.max(0, Math.min(CHAR_RAMP.length - 1, Math.floor(val * (CHAR_RAMP.length - 1))));
        frame += CHAR_RAMP[idx];
      }
      if (y < H - 1) frame += '\n';
    }
    frames.push(frame);
  }
  return frames;
}

function rotatingCube(): PresetData {
  return {
    name: '旋转立方体',
    frames: createFrame((px, py, f) => {
      const cx = 30, cy = 20;
      const angle = (f / 10) * Math.PI * 2;
      const tilt = 0.6;
      const scale = 12;
      let minDist = 999;
      const verts = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
      const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
      const projected = verts.map(([x, y, z]) => {
        const rx = x * Math.cos(angle) - z * Math.sin(angle);
        const rz = x * Math.sin(angle) + z * Math.cos(angle);
        const ry2 = y * Math.cos(tilt) - rz * Math.sin(tilt);
        const rz2 = y * Math.sin(tilt) + rz * Math.cos(tilt);
        return [cx + rx * scale, cy + ry2 * scale, rz2];
      });
      for (const [a, b] of edges) {
        const [x1, y1] = projected[a];
        const [x2, y2] = projected[b];
        for (let t = 0; t <= 1; t += 0.02) {
          const ex = x1 + (x2 - x1) * t;
          const ey = y1 + (y2 - y1) * t;
          const dist = Math.sqrt((px - ex) ** 2 + (py - ey) ** 2);
          if (dist < minDist) minDist = dist;
        }
      }
      if (minDist < 1.5) return 1 - minDist / 1.5;
      return 0;
    }),
  };
}

function beatingHeart(): PresetData {
  return {
    name: '跳动的心',
    frames: createFrame((px, py, f) => {
      const cx = 30, cy = 18;
      const beat = 1 + 0.15 * Math.sin(f / 10 * Math.PI * 2);
      const x = (px - cx) / (10 * beat);
      const y = -(py - cy) / (10 * beat);
      const heartEq = (x * x + y * y - 1) ** 3 - x * x * y * y * y;
      if (heartEq <= 0) {
        const depth = Math.max(0, 1 - Math.sqrt(x * x + y * y) * 0.6);
        return depth;
      }
      return 0;
    }),
  };
}

function waveText(): PresetData {
  return {
    name: '波浪文字',
    frames: createFrame((px, py, f) => {
      const phase = (f / 10) * Math.PI * 2;
      const wave1 = Math.sin((px / 8) + phase) * 8;
      const wave2 = Math.sin((px / 5) - phase * 0.7) * 4;
      const targetY = 20 + wave1 + wave2;
      const dist = Math.abs(py - targetY);
      if (dist < 3) return 1 - dist / 3;
      return 0;
    }),
  };
}

function spiralPattern(): PresetData {
  return {
    name: '旋转螺旋',
    frames: createFrame((px, py, f) => {
      const cx = 30, cy = 20;
      const dx = px - cx, dy = py - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const phase = (f / 10) * Math.PI * 2;
      const spiral = Math.sin(dist * 0.5 - angle * 3 + phase);
      return Math.max(0, (spiral + 1) / 2) * Math.max(0, 1 - dist / 25);
    }),
  };
}

function digitalRain(): PresetData {
  const frames: string[] = [];
  const columns: number[] = Array.from({ length: W }, () => Math.floor(Math.random() * H));
  const speeds: number[] = Array.from({ length: W }, () => 1 + Math.floor(Math.random() * 3));
  for (let f = 0; f < 10; f++) {
    let frame = '';
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const head = columns[x];
        const trail = speeds[x] * 3;
        const dist = y - head;
        if (dist >= -trail && dist <= 0) {
          const brightness = (dist + trail) / trail;
          const idx = Math.max(0, Math.min(CHAR_RAMP.length - 1, Math.floor(brightness * (CHAR_RAMP.length - 1))));
          frame += CHAR_RAMP[idx];
        } else {
          frame += ' ';
        }
      }
      if (y < H - 1) frame += '\n';
    }
    for (let x = 0; x < W; x++) {
      columns[x] = (columns[x] + speeds[x]) % (H + 10);
    }
    frames.push(frame);
  }
  return { name: '数字雨', frames };
}

function diamondPulse(): PresetData {
  return {
    name: '菱形脉冲',
    frames: createFrame((px, py, f) => {
      const cx = 30, cy = 20;
      const dx = Math.abs(px - cx);
      const dy = Math.abs(py - cy);
      const manhattan = dx + dy;
      const phase = (f / 10) * Math.PI * 2;
      const ring = Math.sin(manhattan * 0.4 - phase) * 0.5 + 0.5;
      const fade = Math.max(0, 1 - manhattan / 35);
      return ring * fade;
    }),
  };
}

export const presets: PresetData[] = [
  rotatingCube(),
  beatingHeart(),
  waveText(),
  spiralPattern(),
  digitalRain(),
  diamondPulse(),
];
