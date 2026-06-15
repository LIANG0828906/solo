import { Molecule, Atom, ComparisonResult } from '../types';

export function calculateDistance(
  a: [number, number, number],
  b: [number, number, number]
): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function getCenterOfMass(atoms: Atom[]): [number, number, number] {
  if (atoms.length === 0) return [0, 0, 0];
  let x = 0, y = 0, z = 0;
  atoms.forEach((a) => {
    x += a.position[0];
    y += a.position[1];
    z += a.position[2];
  });
  return [x / atoms.length, y / atoms.length, z / atoms.length];
}

export function translateToOrigin(atoms: Atom[]): Atom[] {
  const [cx, cy, cz] = getCenterOfMass(atoms);
  return atoms.map((a) => ({
    ...a,
    position: [
      a.position[0] - cx,
      a.position[1] - cy,
      a.position[2] - cz,
    ] as [number, number, number],
  }));
}

export function matchAtomsByElement(
  atomsA: Atom[],
  atomsB: Atom[]
): Array<{ atomA: string; atomB: string; distance: number }> {
  const matchedPairs: Array<{ atomA: string; atomB: string; distance: number }> = [];
  const usedB = new Set<string>();

  const elements = new Set([...atomsA.map((a) => a.element), ...atomsB.map((b) => b.element)]);

  elements.forEach((element) => {
    const listA = atomsA.filter((a) => a.element === element);
    const listB = atomsB.filter((b) => b.element === element);

    const pairs: Array<{ aIdx: number; bIdx: number; distance: number }> = [];
    listA.forEach((a, ai) => {
      listB.forEach((b, bi) => {
        if (!usedB.has(b.id)) {
          pairs.push({
            aIdx: ai,
            bIdx: bi,
            distance: calculateDistance(a.position, b.position),
          });
        }
      });
    });

    pairs.sort((x, y) => x.distance - y.distance);

    const usedAIdx = new Set<number>();
    const usedBIdx = new Set<number>();

    for (const p of pairs) {
      if (!usedAIdx.has(p.aIdx) && !usedBIdx.has(p.bIdx)) {
        matchedPairs.push({
          atomA: listA[p.aIdx].id,
          atomB: listB[p.bIdx].id,
          distance: p.distance,
        });
        usedAIdx.add(p.aIdx);
        usedBIdx.add(p.bIdx);
        usedB.add(listB[p.bIdx].id);
      }
    }
  });

  return matchedPairs;
}

export function calculateRMSD(
  atomsA: Atom[],
  atomsB: Atom[],
  pairs: Array<{ atomA: string; atomB: string }>
): number {
  if (pairs.length === 0) return Infinity;

  const mapA = atomsA.reduce<Record<string, Atom>>((acc, a) => {
    acc[a.id] = a;
    return acc;
  }, {});
  const mapB = atomsB.reduce<Record<string, Atom>>((acc, b) => {
    acc[b.id] = b;
    return acc;
  }, {});

  let sumSq = 0;
  for (const pair of pairs) {
    const a = mapA[pair.atomA];
    const b = mapB[pair.atomB];
    if (a && b) {
      const d = calculateDistance(a.position, b.position);
      sumSq += d * d;
    }
  }

  return Math.sqrt(sumSq / pairs.length);
}

export function computeSimilarity(rmsd: number, matchedCount: number, totalA: number, totalB: number): number {
  if (matchedCount === 0) return 0;

  const atomCoverage = (2 * matchedCount) / (totalA + totalB);

  const rmsdFactor = Math.exp(-rmsd * 0.5);

  const similarity = atomCoverage * rmsdFactor * 100;

  return Math.min(100, Math.max(0, similarity));
}

export function compareMolecules(
  molA: Molecule,
  molB: Molecule
): ComparisonResult {
  const atomsA = translateToOrigin(molA.atoms);
  const atomsB = translateToOrigin(molB.atoms);

  const pairs = matchAtomsByElement(atomsA, atomsB);

  const matchedPairs = pairs.map((p) => ({ atomA: p.atomA, atomB: p.atomB }));

  const matchedIdsA = new Set(pairs.map((p) => p.atomA));
  const matchedIdsB = new Set(pairs.map((p) => p.atomB));

  const unmatchedA = atomsA.filter((a) => !matchedIdsA.has(a.id)).map((a) => a.id);
  const unmatchedB = atomsB.filter((b) => !matchedIdsB.has(b.id)).map((b) => b.id);

  const rmsd = calculateRMSD(atomsA, atomsB, matchedPairs);

  const similarity = computeSimilarity(
    isFinite(rmsd) ? rmsd : 10,
    matchedPairs.length,
    atomsA.length,
    atomsB.length
  );

  return {
    rmsd: isFinite(rmsd) ? rmsd : 999,
    similarity: Number(similarity.toFixed(2)),
    matchedPairs,
    unmatchedA,
    unmatchedB,
    matchedCount: matchedPairs.length,
    totalAtomsA: atomsA.length,
    totalAtomsB: atomsB.length,
  };
}
