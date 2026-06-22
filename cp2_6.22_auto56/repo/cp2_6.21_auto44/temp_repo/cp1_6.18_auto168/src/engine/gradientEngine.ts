export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface ColorStop {
  id: string;
  position: number;
  color: HSL;
}

export interface GeneratedVariant {
  id: string;
  stops: ColorStop[];
  cssValue: string;
}

export function hslToString(c: HSL): string {
  return `hsl(${Math.round(c.h)}, ${Math.round(c.s)}%, ${Math.round(c.l)}%)`;
}

export function hslToHex(c: HSL): string {
  const { h, s, l } = c;
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l / 100 - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function rotateHue(color: HSL, degrees: number): HSL {
  return {
    ...color,
    h: ((color.h + degrees) % 360 + 360) % 360,
  };
}

export function clampHSL(c: HSL): HSL {
  return {
    h: ((c.h % 360) + 360) % 360,
    s: Math.max(0, Math.min(100, c.s)),
    l: Math.max(0, Math.min(100, c.l)),
  };
}

export function interpolateColor(stops: ColorStop[], position: number): HSL {
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  if (position <= sorted[0].position) return { ...sorted[0].color };
  if (position >= sorted[sorted.length - 1].position)
    return { ...sorted[sorted.length - 1].color };

  for (let i = 0; i < sorted.length - 1; i++) {
    if (position >= sorted[i].position && position <= sorted[i + 1].position) {
      const range = sorted[i + 1].position - sorted[i].position;
      const t = range === 0 ? 0 : (position - sorted[i].position) / range;
      let dh = sorted[i + 1].color.h - sorted[i].color.h;
      if (dh > 180) dh -= 360;
      if (dh < -180) dh += 360;
      return clampHSL({
        h: sorted[i].color.h + t * dh,
        s: sorted[i].color.s + t * (sorted[i + 1].color.s - sorted[i].color.s),
        l: sorted[i].color.l + t * (sorted[i + 1].color.l - sorted[i].color.l),
      });
    }
  }
  return { ...sorted[sorted.length - 1].color };
}

export function formatGradientCSS(stops: ColorStop[]): string {
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  const parts = sorted.map(
    (s) => `${hslToString(s.color)} ${Math.round(s.position * 100)}%`
  );
  return `linear-gradient(to right, ${parts.join(', ')})`;
}

export function generateVariants(
  stops: ColorStop[],
  hueIncrement: number = 30,
  count: number = 6
): GeneratedVariant[] {
  const variants: GeneratedVariant[] = [];
  for (let i = 0; i < count; i++) {
    const hueShift = (i + 1) * hueIncrement;
    const newStops: ColorStop[] = stops.map((stop) => {
      const rotated = rotateHue(stop.color, hueShift);
      const fluctS = (Math.random() - 0.5) * 10;
      const fluctL = (Math.random() - 0.5) * 10;
      const adjusted = clampHSL({
        h: rotated.h,
        s: rotated.s + fluctS,
        l: rotated.l + fluctL,
      });
      return {
        id: `v${i}-${stop.id}`,
        position: stop.position,
        color: adjusted,
      };
    });
    variants.push({
      id: `variant-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      stops: newStops,
      cssValue: formatGradientCSS(newStops),
    });
  }
  return variants;
}
