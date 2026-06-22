function euclideanDistance(a, b) {
  const dims = ['fruit', 'acidity', 'tannin', 'body', 'sweetness', 'aftertaste'];
  let sum = 0;
  for (const d of dims) {
    sum += (a[d] - b[d]) ** 2;
  }
  return Math.sqrt(sum);
}

function cosineSimilarity(a, b) {
  const dims = ['fruit', 'acidity', 'tannin', 'body', 'sweetness', 'aftertaste'];
  let dot = 0, magA = 0, magB = 0;
  for (const d of dims) {
    dot += a[d] * b[d];
    magA += a[d] ** 2;
    magB += b[d] ** 2;
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export function findSimilarWines(target, candidates, topN = 5) {
  const scored = candidates.map(c => {
    const eucDist = euclideanDistance(target.flavors, c.flavors);
    const cosSim = cosineSimilarity(target.flavors, c.flavors);
    const combinedScore = cosSim - (eucDist / 20);
    return { ...c, eucDist, cosSim, combinedScore };
  });
  scored.sort((a, b) => b.combinedScore - a.combinedScore);
  return scored.slice(0, topN);
}
