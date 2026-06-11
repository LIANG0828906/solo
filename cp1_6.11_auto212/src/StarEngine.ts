export enum EvolutionStage {
  NebulaCondensation = 0,
  MainSequence = 1,
  RedGiant = 2,
  WhiteDwarf = 3,
  NeutronStar = 4,
  BlackHole = 5
}

export interface StarProperties {
  radius3D: number;
  radiusSolar: number;
  temperature: number;
  colorR: number;
  colorG: number;
  colorB: number;
  luminosity: number;
  nebulaDensity: number;
  rotationPeriod: number;
  stage: EvolutionStage;
  stageName: string;
  elapsedMyr: number;
  particleCount: number;
  isPulsing: boolean;
  pulsePhase: number;
  isBlackHole: boolean;
  nebulaRingMode: boolean;
}

function temperatureToColor(tempK: number): [number, number, number] {
  let r: number, g: number, b: number;
  const t = tempK / 100;

  if (t <= 66) {
    r = 255;
  } else {
    r = t - 60;
    r = 329.698727446 * Math.pow(r, -0.1332047592);
    r = Math.max(0, Math.min(255, r));
  }

  if (t <= 66) {
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
    g = Math.max(0, Math.min(255, g));
  } else {
    g = t - 60;
    g = 288.1221695283 * Math.pow(g, -0.0755148492);
    g = Math.max(0, Math.min(255, g));
  }

  if (t >= 66) {
    b = 255;
  } else if (t <= 19) {
    b = 0;
  } else {
    b = t - 10;
    b = 138.5177312231 * Math.log(b) - 305.0447927307;
    b = Math.max(0, Math.min(255, b));
  }

  return [r / 255, g / 255, b / 255];
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export class StarEngine {
  private mass: number = 1.0;
  private timeProgress: number = 0;
  private pulseTime: number = 0;

  constructor(mass: number = 1.0) {
    this.mass = mass;
  }

  setMass(mass: number): void {
    this.mass = Math.max(0.5, Math.min(30, mass));
  }

  getMass(): number {
    return this.mass;
  }

  setTimeProgress(progress: number): void {
    this.timeProgress = Math.max(0, Math.min(1, progress));
  }

  getTimeProgress(): number {
    return this.timeProgress;
  }

  update(dt: number): void {
    this.pulseTime += dt;
  }

  getProperties(): StarProperties {
    const p = this.timeProgress;
    const M = this.mass;

    const mainSequenceRadius = 0.5 + 2.0 * Math.pow(M / 30, 0.57);
    const mainSequenceTemp = 5778 * Math.pow(M, 0.57);
    const mainSequenceLuminosity = Math.pow(M, 3.5);
    const totalLifetimeMyr = 10000 / Math.pow(M, 2.0);

    let radius3D: number;
    let radiusSolar: number;
    let temperature: number;
    let luminosity: number;
    let stage: EvolutionStage;
    let stageName: string;
    let nebulaDensity: number = 0;
    let rotationPeriod: number = 6;
    let particleCount: number = 0;
    let isPulsing = false;
    let pulsePhase = 0;
    let isBlackHole = false;
    let nebulaRingMode = false;

    if (p < 0.05) {
      stage = EvolutionStage.NebulaCondensation;
      stageName = '星云凝聚';

      const np = p / 0.05;
      const snp = smoothstep(0, 1, np);

      radius3D = lerp(0.15, mainSequenceRadius, snp);
      radiusSolar = lerp(0.1, Math.pow(M, 0.8), snp);
      temperature = lerp(1500, mainSequenceTemp * 0.6, snp);
      luminosity = lerp(0.01, mainSequenceLuminosity * 0.3, snp);
      nebulaDensity = lerp(1.0, 0.3, snp);
      particleCount = Math.floor(lerp(5000, 2500, snp));
      rotationPeriod = lerp(3, 6, snp);

    } else if (p < 0.70) {
      stage = EvolutionStage.MainSequence;
      stageName = '主序星';

      const mp = (p - 0.05) / 0.65;
      const smp = smoothstep(0, 1, mp);

      radius3D = mainSequenceRadius * lerp(0.95, 1.05, smp);
      radiusSolar = Math.pow(M, 0.8) * lerp(0.95, 1.05, smp);
      temperature = mainSequenceTemp * lerp(1.0, 0.9, smp);
      luminosity = mainSequenceLuminosity * lerp(0.8, 1.2, smp);
      nebulaDensity = lerp(0.15, 0.02, smp);
      particleCount = Math.floor(lerp(2000, 800, smp));
      rotationPeriod = lerp(5, 8, smp);

    } else if (p < 0.85) {
      stage = EvolutionStage.RedGiant;
      stageName = M >= 8 ? '红超巨星' : '红巨星';

      const rp = (p - 0.70) / 0.15;
      const srp = smoothstep(0, 1, rp);

      const expansionFactor = M < 8 ? lerp(1, 12, srp) : lerp(1, 18, srp);
      radius3D = mainSequenceRadius * expansionFactor;
      radius3D = Math.min(radius3D, 8.0);

      radiusSolar = Math.pow(M, 0.8) * expansionFactor;
      temperature = lerp(mainSequenceTemp * 0.85, 3200, srp);
      luminosity = mainSequenceLuminosity * lerp(1.5, Math.pow(expansionFactor, 1.8), srp);
      nebulaDensity = lerp(0.05, 0.3, srp);
      particleCount = Math.floor(lerp(1000, 3000, srp));
      rotationPeriod = lerp(8, 20, srp);

    } else {
      const fp = (p - 0.85) / 0.15;
      const sfp = smoothstep(0, 1, fp);

      if (M < 8) {
        stage = EvolutionStage.WhiteDwarf;
        stageName = '白矮星';

        radius3D = lerp(mainSequenceRadius * 3, 0.3, sfp);
        radiusSolar = lerp(Math.pow(M, 0.8) * 5, 0.01, sfp);
        temperature = lerp(3200, 15000 * Math.pow(M, -0.3), sfp);
        luminosity = lerp(mainSequenceLuminosity * 2, 0.01, sfp);
        nebulaDensity = lerp(0.3, 0.5, sfp);
        particleCount = Math.floor(lerp(2000, 4000, sfp));
        rotationPeriod = lerp(20, 10, sfp);
        nebulaRingMode = true;

      } else if (M < 20) {
        stage = EvolutionStage.NeutronStar;
        stageName = '中子星';

        radius3D = lerp(mainSequenceRadius * 5, 0.05, sfp);
        radiusSolar = lerp(Math.pow(M, 0.8) * 10, 0.00001, sfp);
        temperature = lerp(4000, 600000, sfp);
        luminosity = lerp(mainSequenceLuminosity * 5, 0.001, sfp);
        nebulaDensity = lerp(0.4, 0.2, sfp);
        particleCount = Math.floor(lerp(3000, 1500, sfp));
        rotationPeriod = lerp(20, 0.5, sfp);
        isPulsing = true;
        pulsePhase = (this.pulseTime % 0.5) / 0.5;

      } else {
        stage = EvolutionStage.BlackHole;
        stageName = '黑洞';

        radius3D = lerp(mainSequenceRadius * 8, 0.08, sfp);
        radiusSolar = lerp(Math.pow(M, 0.8) * 15, 0.000001, sfp);
        temperature = lerp(3500, 0, sfp);
        luminosity = lerp(mainSequenceLuminosity * 10, 0, sfp);
        nebulaDensity = lerp(0.5, 0.4, sfp);
        particleCount = Math.floor(lerp(3000, 2000, sfp));
        rotationPeriod = 999;
        isBlackHole = true;
      }
    }

    const [colorR, colorG, colorB] = temperatureToColor(temperature);

    if (stage === EvolutionStage.WhiteDwarf && sfp !== undefined) {
      const wdFp = (p - 0.85) / 0.15;
      const wdSfp = smoothstep(0, 1, wdFp);
      const blendFactor = wdSfp > 0.7 ? (wdSfp - 0.7) / 0.3 : 0;
      if (blendFactor > 0) {
        const targetR = 0xF5 / 255;
        const targetG = 0xF5 / 255;
        const targetB = 0xDC / 255;
        const finalR = lerp(colorR, targetR, blendFactor);
        const finalG = lerp(colorG, targetG, blendFactor);
        const finalB = lerp(colorB, targetB, blendFactor);
        return {
          radius3D, radiusSolar, temperature,
          colorR: finalR, colorG: finalG, colorB: finalB,
          luminosity, nebulaDensity, rotationPeriod,
          stage, stageName, elapsedMyr: p * totalLifetimeMyr,
          particleCount, isPulsing, pulsePhase, isBlackHole, nebulaRingMode
        };
      }
    }

    if (stage === EvolutionStage.NeutronStar) {
      const nsFp = (p - 0.85) / 0.15;
      const nsSfp = smoothstep(0, 1, nsFp);
      const blendFactor = nsSfp > 0.5 ? (nsSfp - 0.5) / 0.5 : 0;
      if (blendFactor > 0) {
        const targetR = 0x8A / 255;
        const targetG = 0x2B / 255;
        const targetB = 0xE2 / 255;
        return {
          radius3D, radiusSolar, temperature,
          colorR: lerp(colorR, targetR, blendFactor),
          colorG: lerp(colorG, targetG, blendFactor),
          colorB: lerp(colorB, targetB, blendFactor),
          luminosity, nebulaDensity, rotationPeriod,
          stage, stageName, elapsedMyr: p * totalLifetimeMyr,
          particleCount, isPulsing, pulsePhase, isBlackHole, nebulaRingMode
        };
      }
    }

    return {
      radius3D, radiusSolar, temperature,
      colorR, colorG, colorB,
      luminosity, nebulaDensity, rotationPeriod,
      stage, stageName, elapsedMyr: p * totalLifetimeMyr,
      particleCount, isPulsing, pulsePhase, isBlackHole, nebulaRingMode
    };
  }
}
