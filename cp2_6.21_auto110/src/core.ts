export interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
}

export interface Lens {
  x: number;
  y: number;
  radius: number;
  strength: number;
  ellipticity: number;
  rotation: number;
}

export interface VirtualImage {
  x: number;
  y: number;
  brightness: number;
  magnification: number;
  sourceIndex: number;
  imageType: 'primary' | 'secondary' | 'tangential' | 'radial';
}

const CANVAS_SIZE = 800;
const CANVAS_CENTER = CANVAS_SIZE / 2;

const SCHWARZSCHILD_FACTOR = 2.953;

export function generateStars(count: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * CANVAS_SIZE,
      y: Math.random() * CANVAS_SIZE,
      size: 1 + Math.random() * 2,
      brightness: 0.6 + Math.random() * 0.4
    });
  }
  return stars;
}

function computeSchwarzschildDeflection(
  starX: number,
  starY: number,
  lens: Lens
): {
  deflectionX: number;
  deflectionY: number;
  einsteinR: number;
  impactParam: number;
  mu: number;
} {
  const dx = starX - lens.x;
  const dy = starY - lens.y;

  const cosR = Math.cos(lens.rotation);
  const sinR = Math.sin(lens.rotation);
  let xRot = dx * cosR + dy * sinR;
  let yRot = -dx * sinR + dy * cosR;

  const ex = 1 - lens.ellipticity;
  const ey = 1 + lens.ellipticity;
  xRot = xRot / ex;
  yRot = yRot / ey;

  const impactParam = Math.sqrt(xRot * xRot + yRot * yRot);

  const massEquiv = lens.strength * 1e30;
  const schwarzschildR = (SCHWARZSCHILD_FACTOR * massEquiv) / 1e27;
  const einsteinR = Math.sqrt(schwarzschildR * 5000) * (lens.radius / 30);

  const b = Math.max(impactParam, 0.1);
  const deflectionAngle = (4 * Math.PI * schwarzschildR) / (b * 500);

  if (impactParam < 0.1) {
    return { deflectionX: 0, deflectionY: 0, einsteinR, impactParam, mu: 0 };
  }

  const nx = xRot / b;
  const ny = yRot / b;
  const deflXR = nx * deflectionAngle * einsteinR * 0.5;
  const deflYR = ny * deflectionAngle * einsteinR * 0.5;

  const deflXBack = cosR * deflXR - sinR * deflYR;
  const deflYBack = sinR * deflXR + cosR * deflYR;

  const u = impactParam / Math.max(einsteinR, 1);
  const denominator = 1 - 1 / (u * u * u * u);
  const magnification = Math.abs(1 / Math.max(denominator, 0.001));
  const mu = Math.min(magnification, 100);

  return {
    deflectionX: deflXBack,
    deflectionY: deflYBack,
    einsteinR,
    impactParam,
    mu
  };
}

interface LensRoot {
  bx: number;
  by: number;
  mu: number;
  type: string;
}

function solveLensEquation(
  sourceX: number,
  sourceY: number,
  einsteinR: number,
  ex: number,
  ey: number,
  angleTol: number = 0.001
): LensRoot[] {
  const results: LensRoot[] = [];

  const y = Math.sqrt(sourceX * sourceX + sourceY * sourceY);
  const thetaSource = Math.atan2(sourceY, sourceX);

  if (y < 0.001) {
    for (let k = 0; k < 72; k++) {
      const a = (k * Math.PI * 2) / 72;
      const bx = Math.cos(a) * einsteinR;
      const by = Math.sin(a) * einsteinR;
      results.push({
        bx: bx * ex,
        by: by * ey,
        mu: 8,
        type: 'tangential'
      });
    }
    return results;
  }

  const newtonSolve = (initial: number): number => {
    let b = initial;
    for (let iter = 0; iter < 50; iter++) {
      const f = b - y - (einsteinR * einsteinR) / b;
      const fPrime = 1 + (einsteinR * einsteinR) / (b * b);
      if (Math.abs(fPrime) < 1e-12) break;
      const delta = f / fPrime;
      b -= delta;
      if (Math.abs(delta) < angleTol) break;
    }
    return b;
  };

  const outer = newtonSolve(y + einsteinR + 0.01);
  if (outer > 0 && isFinite(outer)) {
    const magOuter = Math.abs(outer / (outer - y));
    if (magOuter > 0.01 && magOuter < 1000) {
      results.push({
        bx: Math.cos(thetaSource) * outer * ex,
        by: Math.sin(thetaSource) * outer * ey,
        mu: Math.min(magOuter, 50),
        type: 'primary'
      });
    }
  }

  const innerInit = -(einsteinR * 0.5);
  const innerVal = newtonSolve(Math.abs(innerInit));
  if (innerVal > 0 && isFinite(innerVal)) {
    const magInner = Math.abs(innerVal / (innerVal + y));
    if (magInner > 0.01 && magInner < 1000 && innerVal < outer) {
      results.push({
        bx: -Math.cos(thetaSource) * innerVal * ex,
        by: -Math.sin(thetaSource) * innerVal * ey,
        mu: Math.min(magInner, 50),
        type: 'secondary'
      });
    }
  }

  const causticThreshold = einsteinR * 0.08;
  if (y < causticThreshold) {
    const perpAngle = thetaSource + Math.PI / 2;
    for (let sign = -1; sign <= 1; sign += 2) {
      const tangentialB = einsteinR * 0.95;
      const causticDepth = 1 - y / causticThreshold;
      const magTan = 20 * causticDepth;
      if (magTan > 0.1) {
        results.push({
          bx: Math.cos(perpAngle + sign * 0.3) * tangentialB * ex,
          by: Math.sin(perpAngle + sign * 0.3) * tangentialB * ey,
          mu: Math.min(magTan, 30),
          type: 'tangential'
        });
      }
    }
  }

  if (lens.ellipticity > 0.2 && y < einsteinR * 0.5) {
    for (let radialSign = -1; radialSign <= 1; radialSign += 2) {
      const radialB = einsteinR * (0.6 + radialSign * 0.15);
      if (radialB > 0) {
        const magRadial = 5 * (1 - y / (einsteinR * 0.5));
        if (magRadial > 0.1) {
          const radialAngle = thetaSource + radialSign * 0.15;
          results.push({
            bx: Math.cos(radialAngle) * radialB * ex,
            by: Math.sin(radialAngle) * radialB * ey,
            mu: Math.min(magRadial, 15),
            type: 'radial'
          });
        }
      }
    }
  }

  return results;
}

export function generateVirtualImages(stars: Star[], lens: Lens): VirtualImage[] {
  const images: VirtualImage[] = [];

  const massEquiv = lens.strength * 1e30;
  const schwarzschildR = (SCHWARZSCHILD_FACTOR * massEquiv) / 1e27;
  const einsteinR = Math.sqrt(schwarzschildR * 5000) * (lens.radius / 30);

  const ex = 1 - lens.ellipticity;
  const ey = 1 + lens.ellipticity;
  const cosR = Math.cos(lens.rotation);
  const sinR = Math.sin(lens.rotation);

  for (let i = 0; i < stars.length; i++) {
    const star = stars[i];

    const relX = star.x - lens.x;
    const relY = star.y - lens.y;

    const relXR = relX * cosR + relY * sinR;
    const relYR = -relX * sinR + relY * cosR;

    const sourceX = relXR / ex;
    const sourceY = relYR / ey;

    const distance = Math.sqrt(sourceX * sourceX + sourceY * sourceY);

    if (distance < 0.5) {
      const deflectionData = computeSchwarzschildDeflection(
        star.x,
        star.y,
        lens
      );

      const pdx = (star.x + deflectionData.deflectionX) - lens.x;
      const pdy = (star.y + deflectionData.deflectionY) - lens.y;
      const primaryDist = Math.sqrt(pdx * pdx + pdy * pdy);
      const primaryNormDist = primaryDist / Math.max(einsteinR, 1);
      const primaryFalloff = Math.min(
        Math.exp(-0.6 * Math.max(0, primaryNormDist - 0.3)),
        1 / (1 + primaryNormDist * primaryNormDist * 0.5)
      );

      const primary: VirtualImage = {
        x: star.x + deflectionData.deflectionX,
        y: star.y + deflectionData.deflectionY,
        brightness: star.brightness * Math.min(deflectionData.mu * 0.8, 5) * primaryFalloff,
        magnification: deflectionData.mu,
        sourceIndex: i,
        imageType: 'primary'
      };
      images.push(primary);

      continue;
    }

    const solutions = solveLensEquation(
      sourceX,
      sourceY,
      einsteinR,
      ex,
      ey
    );

    for (const sol of solutions) {
      const imgXR = sol.bx;
      const imgYR = sol.by;

      const imgXBack = cosR * imgXR - sinR * imgYR + lens.x;
      const imgYBack = sinR * imgXR + cosR * imgYR + lens.y;

      const distFromLens = Math.sqrt(
        (imgXBack - lens.x) * (imgXBack - lens.x) +
          (imgYBack - lens.y) * (imgYBack - lens.y)
      );

      const normDist = distFromLens / Math.max(einsteinR, 1);
      const distanceFalloff = Math.exp(-0.6 * Math.max(0, normDist - 0.3));

      const r2Falloff = 1 / (1 + normDist * normDist * 0.5);

      const baseFalloff = Math.min(distanceFalloff, r2Falloff);

      let brightnessFactor: number;
      if (sol.type === 'tangential' && distance < einsteinR * 0.08) {
        const causticBoost = Math.max(
          0.0,
          1 - distance / (einsteinR * 0.08)
        );
        brightnessFactor =
          star.brightness *
          Math.min(sol.mu * (0.3 + causticBoost * 0.7), 4) *
          baseFalloff;
      } else if (sol.type === 'radial') {
        brightnessFactor =
          star.brightness * Math.min(sol.mu * 0.5, 3) *
          baseFalloff;
      } else {
        brightnessFactor =
          star.brightness * Math.min(sol.mu * 0.4, 6) *
          baseFalloff;
      }

      if (
        distFromLens > 5 &&
        isFinite(brightnessFactor) &&
        brightnessFactor > 0.03
      ) {
        images.push({
          x: imgXBack,
          y: imgYBack,
          brightness: brightnessFactor,
          magnification: sol.mu,
          sourceIndex: i,
          imageType: sol.type as VirtualImage['imageType']
        });
      }
    }

    if (solutions.length === 0 || distance > einsteinR * 3) {
      const deflectionData = computeSchwarzschildDeflection(
        star.x,
        star.y,
        lens
      );

      const fdx = (star.x + deflectionData.deflectionX) - lens.x;
      const fdy = (star.y + deflectionData.deflectionY) - lens.y;
      const fallbackDist = Math.sqrt(fdx * fdx + fdy * fdy);
      const fallbackNormDist = fallbackDist / Math.max(einsteinR, 1);
      const fallbackFalloff = Math.min(
        Math.exp(-0.6 * Math.max(0, fallbackNormDist - 0.3)),
        1 / (1 + fallbackNormDist * fallbackNormDist * 0.5)
      );

      const muFactor = 1 + deflectionData.mu * 0.1;
      images.push({
        x: star.x + deflectionData.deflectionX,
        y: star.y + deflectionData.deflectionY,
        brightness: star.brightness * Math.min(muFactor, 2) * fallbackFalloff,
        magnification: deflectionData.mu,
        sourceIndex: i,
        imageType: 'primary'
      });
    }
  }

  return images.filter(
    (img) =>
      img.x >= -100 &&
      img.x <= CANVAS_SIZE + 100 &&
      img.y >= -100 &&
      img.y <= CANVAS_SIZE + 100
  );
}

export interface EquipotentialSurface {
  radius: number;
  potential: number;
  gradient: number;
}

export function getEquipotentialSurfaces(
  lens: Lens
): EquipotentialSurface[] {
  const massEquiv = lens.strength * 1e30;
  const schwarzschildR = (SCHWARZSCHILD_FACTOR * massEquiv) / 1e27;
  const einsteinR = Math.sqrt(schwarzschildR * 5000) * (lens.radius / 30);

  const surfaces: EquipotentialSurface[] = [];

  const targetPotentials: number[] = [];
  for (let i = 1; i <= 12; i++) {
    targetPotentials.push(-1 / i);
  }

  const potentialAt = (r: number): number => {
    if (r < 0.1) return -1e10;
    return -einsteinR / r - (einsteinR * einsteinR) / (2 * r * r);
  };

  const gradientAt = (r: number): number => {
    if (r < 0.1) return 0;
    return einsteinR / (r * r) + (einsteinR * einsteinR) / (r * r * r);
  };

  for (const target of targetPotentials) {
    let low = 0.1;
    let high = einsteinR * 10;

    for (let iter = 0; iter < 100; iter++) {
      const mid = (low + high) / 2;
      if (potentialAt(mid) < target) {
        low = mid;
      } else {
        high = mid;
      }
      if (high - low < 0.01) break;
    }

    const radius = (low + high) / 2;
    if (radius > 0 && radius < einsteinR * 8 && isFinite(radius)) {
      surfaces.push({
        radius,
        potential: target,
        gradient: gradientAt(radius)
      });
    }
  }

  surfaces.sort((a, b) => a.radius - b.radius);

  const uniqueSurfaces: EquipotentialSurface[] = [];
  let lastR = 0;
  for (const s of surfaces) {
    if (s.radius - lastR > einsteinR * 0.3) {
      uniqueSurfaces.push(s);
      lastR = s.radius;
    }
  }

  return uniqueSurfaces.slice(
    0,
    Math.max(2, Math.floor(2 + lens.strength * 0.6))
  );
}

export function interpolateColor(t: number): string {
  const r1 = 0,
    g1 = 255,
    b1 = 255;
  const r2 = 255,
    g2 = 0,
    b2 = 255;
  const r3 = 255,
    g3 = 200,
    b3 = 0;

  if (t < 0.5) {
    const t2 = t * 2;
    const r = Math.round(r1 + (r2 - r1) * t2);
    const g = Math.round(g1 + (g2 - g1) * t2);
    const b = Math.round(b1 + (b2 - b1) * t2);
    return `rgb(${r},${g},${b})`;
  } else {
    const t2 = (t - 0.5) * 2;
    const r = Math.round(r2 + (r3 - r2) * t2);
    const g = Math.round(g2 + (g3 - g2) * t2);
    const b = Math.round(b2 + (b3 - b2) * t2);
    return `rgb(${r},${g},${b})`;
  }
}

export function checkLevelMatch(
  currentLens: Lens,
  targetLens: Partial<Lens>,
  tolerance: number = 0.05
): boolean {
  if (targetLens.x !== undefined && targetLens.y !== undefined) {
    const dx = Math.abs(currentLens.x - targetLens.x) / CANVAS_SIZE;
    const dy = Math.abs(currentLens.y - targetLens.y) / CANVAS_SIZE;
    if (dx > tolerance || dy > tolerance) return false;
  }

  if (targetLens.strength !== undefined) {
    const ds =
      Math.abs(currentLens.strength - targetLens.strength) / 10;
    if (ds > tolerance) return false;
  }

  if (targetLens.ellipticity !== undefined) {
    const de = Math.abs(currentLens.ellipticity - targetLens.ellipticity);
    if (de > tolerance) return false;
  }

  return true;
}

export function computeLensPotentialGradient(
  x: number,
  y: number,
  lens: Lens
): number {
  const dx = x - lens.x;
  const dy = y - lens.y;
  const cosR = Math.cos(lens.rotation);
  const sinR = Math.sin(lens.rotation);
  const rx = dx * cosR + dy * sinR;
  const ry = -dx * sinR + dy * cosR;
  const ex = 1 - lens.ellipticity;
  const ey = 1 + lens.ellipticity;
  const r = Math.sqrt(
    (rx * rx) / (ex * ex) + (ry * ry) / (ey * ey)
  );
  const massEquiv = lens.strength * 1e30;
  const schwarzschildR = (SCHWARZSCHILD_FACTOR * massEquiv) / 1e27;
  const einsteinR = Math.sqrt(schwarzschildR * 5000) * (lens.radius / 30);
  if (r < 1) return 0;
  return -einsteinR / r;
}

export { CANVAS_SIZE, CANVAS_CENTER };
