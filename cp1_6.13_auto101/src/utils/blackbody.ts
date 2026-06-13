const H = 6.626e-34;
const C = 3e8;
const K = 1.38e-23;

export function blackbodyIntensity(wavelength: number, temperature: number): number {
  const lambda = wavelength * 1e-9;
  const exponent = (H * C) / (lambda * K * temperature);
  const denominator = Math.pow(lambda, 5) * (Math.exp(exponent) - 1);
  if (denominator === 0 || !isFinite(denominator)) return 0;
  return (2 * H * C * C) / denominator;
}

export function generateSpectrumData(
  temperature: number,
  startWavelength: number = 380,
  endWavelength: number = 780,
  steps: number = 100
): { wavelength: number; intensity: number }[] {
  const data: { wavelength: number; intensity: number }[] = [];
  const step = (endWavelength - startWavelength) / steps;

  let maxIntensity = 0;
  for (let i = 0; i <= steps; i++) {
    const wavelength = startWavelength + i * step;
    const intensity = blackbodyIntensity(wavelength, temperature);
    data.push({ wavelength, intensity });
    if (intensity > maxIntensity) maxIntensity = intensity;
  }

  if (maxIntensity > 0) {
    for (const point of data) {
      point.intensity /= maxIntensity;
    }
  }

  return data;
}

export function wavelengthToRGB(wavelength: number): { r: number; g: number; b: number } {
  let r = 0;
  let g = 0;
  let b = 0;

  if (wavelength >= 380 && wavelength < 440) {
    r = -(wavelength - 440) / (440 - 380);
    g = 0;
    b = 1;
  } else if (wavelength >= 440 && wavelength < 490) {
    r = 0;
    g = (wavelength - 440) / (490 - 440);
    b = 1;
  } else if (wavelength >= 490 && wavelength < 510) {
    r = 0;
    g = 1;
    b = -(wavelength - 510) / (510 - 490);
  } else if (wavelength >= 510 && wavelength < 580) {
    r = (wavelength - 510) / (580 - 510);
    g = 1;
    b = 0;
  } else if (wavelength >= 580 && wavelength < 645) {
    r = 1;
    g = -(wavelength - 645) / (645 - 580);
    b = 0;
  } else if (wavelength >= 645 && wavelength <= 780) {
    r = 1;
    g = 0;
    b = 0;
  }

  let factor: number;
  if (wavelength >= 380 && wavelength < 420) {
    factor = 0.3 + (0.7 * (wavelength - 380)) / (420 - 380);
  } else if (wavelength >= 420 && wavelength < 701) {
    factor = 1;
  } else if (wavelength >= 701 && wavelength <= 780) {
    factor = 0.3 + (0.7 * (780 - wavelength)) / (780 - 700);
  } else {
    factor = 0;
  }

  const gamma = 0.8;
  r = r > 0 ? Math.pow(r * factor, gamma) : 0;
  g = g > 0 ? Math.pow(g * factor, gamma) : 0;
  b = b > 0 ? Math.pow(b * factor, gamma) : 0;

  return { r, g, b };
}
