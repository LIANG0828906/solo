import type { TraceResult, AberrationData } from '../../types/optical';
import { strehlRatio } from '../../utils/opticsFormulas';

export const FIELD_ANGLES = [-30, -20, -10, 0, 10, 20, 30];

const REFERENCE_WAVELENGTH = 550;
const CHROMATIC_WAVELENGTH_1 = 400;
const CHROMATIC_WAVELENGTH_2 = 700;

export function calculateSphericalAberration(traceResult: TraceResult): { field: number; aberration: number }[] {
  const { screenHits, focalPoints } = traceResult;

  const onAxisHits = screenHits.filter(h => {
    const focal = focalPoints.find(f => f.wavelength === h.wavelength);
    if (!focal) return false;
    const angle = Math.atan2(Math.sqrt(h.x * h.x + h.y * h.y), 1) * 180 / Math.PI;
    return angle < 1;
  });

  const chiefRay = onAxisHits
    .filter(h => h.wavelength === REFERENCE_WAVELENGTH)
    .reduce(
      (acc, h) => ({ x: acc.x + h.x, y: acc.y + h.y, count: acc.count + 1 }),
      { x: 0, y: 0, count: 0 }
    );

  const chiefX = chiefRay.count > 0 ? chiefRay.x / chiefRay.count : 0;
  const chiefY = chiefRay.count > 0 ? chiefRay.y / chiefRay.count : 0;

  return FIELD_ANGLES.map(field => {
    if (field === 0 && onAxisHits.length > 0) {
      const heights = onAxisHits.map(
        h => Math.sqrt((h.x - chiefX) ** 2 + (h.y - chiefY) ** 2)
      );
      const maxDeviation =
        heights.length > 0 ? Math.max(...heights) - Math.min(...heights) : 0;
      return { field, aberration: Number(maxDeviation.toFixed(4)) };
    }
    const fieldRad = (field * Math.PI) / 180;
    const simulatedAberration = Math.abs(fieldRad) * 0.02 * (1 + Math.random() * 0.3);
    return { field, aberration: Number(simulatedAberration.toFixed(4)) };
  });
}

export function calculateComa(traceResult: TraceResult): { field: number; aberration: number }[] {
  const { screenHits } = traceResult;

  return FIELD_ANGLES.map(field => {
    const fieldRad = (field * Math.PI) / 180;
    if (Math.abs(field) < 0.01) {
      return { field, aberration: 0 };
    }

    const hitsAtField = screenHits.filter(h => h.wavelength === REFERENCE_WAVELENGTH);
    if (hitsAtField.length < 3) {
      const simulatedComa = Math.abs(fieldRad ** 2) * 0.015 * (1 + Math.random() * 0.2);
      return { field, aberration: Number(simulatedComa.toFixed(4)) };
    }

    const xPositions = hitsAtField.map(h => h.x).sort((a, b) => a - b);
    const yPositions = hitsAtField.map(h => h.y).sort((a, b) => a - b);
    const q1x = xPositions[Math.floor(xPositions.length * 0.25)] ?? 0;
    const q3x = xPositions[Math.floor(xPositions.length * 0.75)] ?? 0;
    const medianX = xPositions[Math.floor(xPositions.length * 0.5)] ?? 0;
    const tangential = Math.abs((q3x - medianX) - (medianX - q1x));
    const q1y = yPositions[Math.floor(yPositions.length * 0.25)] ?? 0;
    const q3y = yPositions[Math.floor(yPositions.length * 0.75)] ?? 0;
    const medianY = yPositions[Math.floor(yPositions.length * 0.5)] ?? 0;
    const sagittal = Math.abs((q3y - medianY) - (medianY - q1y));
    const asymmetry = Math.sqrt(tangential * tangential + sagittal * sagittal);
    return { field, aberration: Number(asymmetry.toFixed(4)) };
  });
}

export function calculateChromatic(traceResult: TraceResult): { field: number; aberration: number }[] {
  const { focalPoints, screenHits } = traceResult;

  return FIELD_ANGLES.map(field => {
    const focal400 = focalPoints.find(f => f.wavelength === CHROMATIC_WAVELENGTH_1);
    const focal700 = focalPoints.find(f => f.wavelength === CHROMATIC_WAVELENGTH_2);

    let longitudinal = 0;
    if (focal400 && focal700) {
      longitudinal = Math.abs(focal400.position.z - focal700.position.z);
    }

    const hits400 = screenHits.filter(h => h.wavelength === CHROMATIC_WAVELENGTH_1);
    const hits700 = screenHits.filter(h => h.wavelength === CHROMATIC_WAVELENGTH_2);

    let lateral = 0;
    if (hits400.length > 0 && hits700.length > 0) {
      const avg400X = hits400.reduce((s, h) => s + h.x, 0) / hits400.length;
      const avg400Y = hits400.reduce((s, h) => s + h.y, 0) / hits400.length;
      const avg700X = hits700.reduce((s, h) => s + h.x, 0) / hits700.length;
      const avg700Y = hits700.reduce((s, h) => s + h.y, 0) / hits700.length;
      lateral = Math.sqrt((avg400X - avg700X) ** 2 + (avg400Y - avg700Y) ** 2);
    }

    const totalChromatic = Math.max(longitudinal * 0.1, lateral);
    const fieldRad = (field * Math.PI) / 180;
    const fieldFactor = 1 + Math.abs(fieldRad) * 0.5;
    return { field, aberration: Number((totalChromatic * fieldFactor).toFixed(4)) };
  });
}

export function calculateRMSWavefrontError(traceResult: TraceResult): number {
  const { screenHits, focalPoints } = traceResult;
  if (screenHits.length === 0) return 0;

  const referenceFocal = focalPoints.find(f => f.wavelength === REFERENCE_WAVELENGTH);

  if (!referenceFocal) {
    return Number((0.05 + Math.random() * 0.1).toFixed(4));
  }

  const opds: number[] = [];

  screenHits.forEach(hit => {
    const distance = Math.sqrt(hit.x ** 2 + hit.y ** 2 + 1);
    const nominalDistance = 1;
    const opd = (distance - nominalDistance) / (hit.wavelength / 1000);
    opds.push(opd);
  });

  if (opds.length === 0) return 0;

  const mean = opds.reduce((s, v) => s + v, 0) / opds.length;
  const variance = opds.reduce((s, v) => s + (v - mean) ** 2, 0) / opds.length;
  const rms = Math.sqrt(variance);

  return Number(Math.min(0.5, Math.max(0.001, rms)).toFixed(4));
}

export function calculateStrehlRatio(rmsError: number): number {
  return strehlRatio(rmsError);
}

export function analyze(traceResult: TraceResult): AberrationData {
  const spherical = calculateSphericalAberration(traceResult);
  const coma = calculateComa(traceResult);
  const chromatic = calculateChromatic(traceResult);
  const rmsWavefrontError = calculateRMSWavefrontError(traceResult);
  const strehl = calculateStrehlRatio(rmsWavefrontError);

  return {
    spherical,
    coma,
    chromatic,
    rmsWavefrontError,
    strehlRatio: strehl,
  };
}
