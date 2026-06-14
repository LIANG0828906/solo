const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;

const grad3: [number, number][] = [
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [0, 1], [0, -1],
];

function buildPermutationTable(seed: number) {
  const perm = new Uint8Array(512);
  const permMod8 = new Uint8Array(512);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;

  let s = seed;
  for (let i = 255; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    const tmp = p[i];
    p[i] = p[j];
    p[j] = tmp;
  }

  for (let i = 0; i < 512; i++) {
    perm[i] = p[i & 255];
    permMod8[i] = perm[i] % 8;
  }

  return { perm, permMod8 };
}

function contribute(gradX: number, gradY: number, x: number, y: number): number {
  let t = 0.5 - x * x - y * y;
  if (t < 0) return 0;
  t *= t;
  return t * t * (gradX * x + gradY * y);
}

export function createNoise2D(seed: number = 0): (x: number, y: number) => number {
  const { perm, permMod8 } = buildPermutationTable(seed);

  return (xin: number, yin: number): number => {
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const x0 = xin - i + t;
    const y0 = yin - j + t;

    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;

    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;

    const ii = i & 255;
    const jj = j & 255;

    const gi0 = permMod8[ii + perm[jj]];
    const gi1 = permMod8[ii + i1 + perm[jj + j1]];
    const gi2 = permMod8[ii + 1 + perm[jj + 1]];

    const n0 = contribute(grad3[gi0][0], grad3[gi0][1], x0, y0);
    const n1 = contribute(grad3[gi1][0], grad3[gi1][1], x1, y1);
    const n2 = contribute(grad3[gi2][0], grad3[gi2][1], x2, y2);

    return 70 * (n0 + n1 + n2);
  };
}
