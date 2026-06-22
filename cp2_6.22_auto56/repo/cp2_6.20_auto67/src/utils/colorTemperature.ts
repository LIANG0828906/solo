export function kelvinToRGB(kelvin: number): [number, number, number] {
  const T = Math.max(1667, Math.min(25000, kelvin));

  let x: number;
  let y: number;

  if (T <= 4000) {
    x = -0.2661239 * Math.pow(10, 9) / Math.pow(T, 3)
        - 0.2343589 * Math.pow(10, 6) / Math.pow(T, 2)
        + 0.8776956 * Math.pow(10, 3) / T
        + 0.179910;
    y = -1.1063814 * Math.pow(x, 3)
        - 1.34811020 * Math.pow(x, 2)
        + 2.18555832 * x
        - 0.20219683;
  } else {
    x = -3.0258469 * Math.pow(10, 9) / Math.pow(T, 3)
        + 2.1070379 * Math.pow(10, 6) / Math.pow(T, 2)
        + 0.2226347 * Math.pow(10, 3) / T
        + 0.240390;
    y = -0.9549476 * Math.pow(x, 3)
        - 1.37418593 * Math.pow(x, 2)
        + 2.09137015 * x
        - 0.16748867;
  }

  const Y = 1.0;
  const X = x * Y / y;
  const Z = (1 - x - y) * Y / y;

  const xyzToRgb = (X: number, Y: number, Z: number): [number, number, number] => {
    let r = 3.2406 * X - 1.5372 * Y - 0.4986 * Z;
    let g = -0.9689 * X + 1.8758 * Y + 0.0415 * Z;
    let b = 0.0557 * X - 0.2040 * Y + 1.0570 * Z;

    const gammaCorrect = (c: number): number => {
      if (c <= 0.0031308) {
        return 12.92 * c;
      }
      return 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    };

    r = gammaCorrect(r);
    g = gammaCorrect(g);
    b = gammaCorrect(b);

    const max = Math.max(r, g, b);
    if (max > 1) {
      r /= max;
      g /= max;
      b /= max;
    }

    return [
      Math.max(0, Math.min(1, r)),
      Math.max(0, Math.min(1, g)),
      Math.max(0, Math.min(1, b))
    ];
  };

  return xyzToRgb(X, Y, Z);
}

export function getSpectralType(temperature: number): string {
  if (temperature >= 30000) return 'O';
  if (temperature >= 10000) return 'B';
  if (temperature >= 7500) return 'A';
  if (temperature >= 6000) return 'F';
  if (temperature >= 5200) return 'G';
  if (temperature >= 3700) return 'K';
  return 'M';
}

export function temperatureToColorHex(temperature: number): string {
  const [r, g, b] = kelvinToRGB(temperature);
  const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
