export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
        break;
      case gn:
        h = ((bn - rn) / d + 2) * 60;
        break;
      case bn:
        h = ((rn - gn) / d + 4) * 60;
        break;
    }
  }

  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;

  let rn = 0;
  let gn = 0;
  let bn = 0;

  if (h < 60) {
    rn = c; gn = x; bn = 0;
  } else if (h < 120) {
    rn = x; gn = c; bn = 0;
  } else if (h < 180) {
    rn = 0; gn = c; bn = x;
  } else if (h < 240) {
    rn = 0; gn = x; bn = c;
  } else if (h < 300) {
    rn = x; gn = 0; bn = c;
  } else {
    rn = c; gn = 0; bn = x;
  }

  return [
    Math.round((rn + m) * 255),
    Math.round((gn + m) * 255),
    Math.round((bn + m) * 255),
  ];
}

export function hueDifference(h1: number, h2: number): number {
  const diff = Math.abs(h1 - h2);
  return Math.min(diff, 360 - diff);
}

export function classifyHarmony(hues: number[]): { type: string; description: string } {
  if (hues.length < 2) {
    return { type: '自由配色', description: '颜色数量不足，无法判断和谐类型' };
  }

  const sorted = [...hues].sort((a, b) => a - b);
  const diffs: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    diffs.push(hueDifference(sorted[i - 1], sorted[i]));
  }
  diffs.push(hueDifference(sorted[sorted.length - 1], sorted[0]));

  const maxDiff = Math.max(...diffs);
  const minDiff = Math.min(...diffs);

  if (hues.length === 2) {
    const diff = hueDifference(hues[0], hues[1]);
    if (diff >= 150 && diff <= 210) {
      return {
        type: '互补',
        description: '两种颜色在色轮上相对，形成强烈的视觉对比，充满活力与张力',
      };
    }
    if (diff <= 30) {
      return {
        type: '类似',
        description: '两种颜色在色轮上非常接近，形成柔和协调的视觉效果',
      };
    }
  }

  if (hues.length === 3) {
    const isTriadic = diffs.every((d) => Math.abs(d - 120) < 25);
    if (isTriadic) {
      return {
        type: '三角',
        description: '三种颜色在色轮上均匀分布，形成丰富而平衡的配色方案',
      };
    }

    if (hues.length >= 2) {
      const mainDiff = hueDifference(hues[0], hues[1]);
      const isComplement = mainDiff >= 150 && mainDiff <= 210;
      if (isComplement) {
        const otherDiffs = hues.slice(2).map((h) => hueDifference(hues[0], h));
        const nearComplement = otherDiffs.some((d) => d >= 150 && d <= 210);
        if (nearComplement) {
          return {
            type: '分裂互补',
            description: '一种颜色与其互补色两侧的颜色搭配，既有对比又有和谐',
          };
        }
      }
    }
  }

  if (maxDiff <= 60) {
    return {
      type: '类似',
      description: '所有颜色在色轮上相近区域，营造统一温和的氛围',
    };
  }

  if (hues.length >= 3 && maxDiff - minDiff < 30) {
    return {
      type: '三角',
      description: '颜色在色轮上均匀分布，形成活泼均衡的视觉效果',
    };
  }

  const hasComplementPair = diffs.some((d) => d >= 150 && d <= 210);
  if (hasComplementPair) {
    return {
      type: '分裂互补',
      description: '包含互补关系的同时兼具邻近色的柔和，对比与协调并存',
    };
  }

  return {
    type: '自由配色',
    description: '颜色关系自由多变，适合表达个性与创意，需注意平衡与重点',
  };
}

export function getColorName(h: number, s: number, l: number): string {
  const hueNames: [number, string][] = [
    [0, '赤红'],
    [15, '橙红'],
    [30, '橙色'],
    [45, '橙黄'],
    [60, '金黄'],
    [75, '黄绿'],
    [90, '翠绿'],
    [105, '草绿'],
    [120, '正绿'],
    [135, '深绿'],
    [150, '薄荷'],
    [165, '青绿'],
    [180, '天青'],
    [195, '青蓝'],
    [210, '钴蓝'],
    [225, '蔚蓝'],
    [240, '靛蓝'],
    [255, '蓝紫'],
    [270, '紫色'],
    [285, '紫红'],
    [300, '品红'],
    [315, '玫红'],
    [330, '夕阳红'],
    [345, '绯红'],
  ];

  const normalizedH = ((h % 360) + 360) % 360;

  let name = hueNames[0][1];
  let minDist = 360;
  for (const [hue, hueName] of hueNames) {
    const dist = hueDifference(normalizedH, hue);
    if (dist < minDist) {
      minDist = dist;
      name = hueName;
    }
  }

  if (s < 10) {
    if (l < 15) return '黑色';
    if (l < 35) return '深灰';
    if (l < 65) return '灰色';
    if (l < 85) return '浅灰';
    return '白色';
  }

  let prefix = '';
  if (l < 25) prefix = '深';
  else if (l > 75) prefix = '浅';

  return prefix + name;
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return '#' + toHex(r) + toHex(g) + toHex(b);
}
