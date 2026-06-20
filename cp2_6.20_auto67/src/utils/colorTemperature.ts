export function kelvinToRGB(kelvin: number): [number, number, number] {
  const temp = Math.max(1000, Math.min(40000, kelvin)) / 100;
  let r: number;
  let g: number;
  let b: number;

  if (temp <= 66) {
    r = 255;
  } else {
    r = temp - 60;
    r = 329.698727446 * Math.pow(r, -0.1332047592);
    r = Math.max(0, Math.min(255, r));
  }

  if (temp <= 66) {
    g = temp;
    g = 99.4708025861 * Math.log(g) - 161.1195681661;
  } else {
    g = temp - 60;
    g = 288.1221695283 * Math.pow(g, -0.0755148492);
  }
  g = Math.max(0, Math.min(255, g));

  if (temp >= 66) {
    b = 255;
  } else if (temp <= 19) {
    b = 0;
  } else {
    b = temp - 10;
    b = 138.5177312231 * Math.log(b) - 305.0447927307;
    b = Math.max(0, Math.min(255, b));
  }

  return [r / 255, g / 255, b / 255];
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
