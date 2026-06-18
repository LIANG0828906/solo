function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return [h * 360, s * 100, l * 100];
}

function hueDifference(h1: number, h2: number): number {
  const diff = Math.abs(h1 - h2);
  return Math.min(diff, 360 - diff);
}

export function calculateColorHarmony(colors: string[]): number {
  if (colors.length < 2) return 100;

  const hslColors = colors.map(hexToHsl);
  
  let totalHueDiff = 0;
  let totalSatDiff = 0;
  let totalLightDiff = 0;
  let pairCount = 0;

  for (let i = 0; i < hslColors.length; i++) {
    for (let j = i + 1; j < hslColors.length; j++) {
      const [h1, s1, l1] = hslColors[i];
      const [h2, s2, l2] = hslColors[j];
      
      const hueDiff = hueDifference(h1, h2);
      const satDiff = Math.abs(s1 - s2);
      const lightDiff = Math.abs(l1 - l2);

      totalHueDiff += hueDiff;
      totalSatDiff += satDiff;
      totalLightDiff += lightDiff;
      pairCount++;
    }
  }

  const avgHueDiff = totalHueDiff / pairCount;
  const avgSatDiff = totalSatDiff / pairCount;
  const avgLightDiff = totalLightDiff / pairCount;

  let hueScore: number;
  if (avgHueDiff <= 30 || avgHueDiff >= 330) {
    hueScore = 90;
  } else if (avgHueDiff <= 60 || avgHueDiff >= 300) {
    hueScore = 80;
  } else if (avgHueDiff >= 90 && avgHueDiff <= 150) {
    hueScore = 70;
  } else if (avgHueDiff >= 170 && avgHueDiff <= 190) {
    hueScore = 50;
  } else {
    hueScore = 60;
  }

  const satScore = Math.max(0, 100 - avgSatDiff * 1.5);
  const lightScore = Math.max(0, 100 - avgLightDiff * 1.2);

  const finalScore = Math.round(
    hueScore * 0.5 + satScore * 0.25 + lightScore * 0.25
  );

  return Math.min(100, Math.max(0, finalScore));
}

export function getScoreColor(score: number): string {
  if (score < 40) return '#FF4444';
  if (score < 70) return '#FFA500';
  return '#44AA44';
}
