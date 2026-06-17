import { v4 as uuidv4 } from 'uuid';
import { Idea, Cluster, ClusterResult, THEME_COLORS } from '../shared/types';

function simpleHash(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function textToVector(text: string): number[] {
  const vector = new Array(32).fill(0);
  const words = text.toLowerCase().split(/[\s,，。.！!？?、；;：:""'']+/);
  
  for (const word of words) {
    if (word.length === 0) continue;
    const hash1 = simpleHash(word);
    const hash2 = simpleHash(word + '_salt');
    for (let i = 0; i < vector.length; i++) {
      const noise = Math.sin(hash1 * (i + 1) + hash2 * 0.1) * 0.5 + 0.5;
      vector[i] += noise;
    }
  }
  
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vector.map(v => v / magnitude);
}

function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export function determineClusterCount(ideaCount: number): number {
  if (ideaCount <= 2) return 1;
  if (ideaCount <= 5) return 2;
  if (ideaCount <= 10) return 3;
  return Math.max(3, Math.ceil(Math.sqrt(ideaCount / 2)));
}

export function kmeansClustering(
  ideas: Idea[],
  canvasWidth: number,
  canvasHeight: number,
  existingClusters: Cluster[] = []
): ClusterResult {
  if (ideas.length === 0) {
    return { clusters: [], ideas: [] };
  }

  const k = determineClusterCount(ideas.length);
  const vectors = ideas.map(idea => idea.vector.length > 0 ? idea.vector : textToVector(idea.text));

  let centroids: number[][];
  let clusters: Cluster[];

  if (existingClusters.length >= k && existingClusters.length > 0) {
    centroids = existingClusters.slice(0, k).map(() => new Array(32).fill(0));
    clusters = existingClusters.slice(0, k).map(c => ({
      ...c,
      ideaIds: [],
      center: c.center
    }));
  } else {
    const shuffledIndices = [...Array(ideas.length).keys()].sort(() => Math.random() - 0.5);
    centroids = shuffledIndices.slice(0, k).map(i => [...vectors[i]]);
    clusters = centroids.map((_, idx) => ({
      id: uuidv4(),
      name: `星群 ${idx + 1}`,
      color: THEME_COLORS[idx % THEME_COLORS.length],
      center: [0, 0] as [number, number],
      ideaIds: []
    }));
  }

  const maxIterations = 100;
  const threshold = 1e-6;

  for (let iter = 0; iter < maxIterations; iter++) {
    clusters.forEach(c => c.ideaIds = []);

    ideas.forEach((idea, idx) => {
      let minDist = Infinity;
      let closestCluster = 0;
      for (let c = 0; c < centroids.length; c++) {
        const dist = euclideanDistance(vectors[idx], centroids[c]);
        if (dist < minDist) {
          minDist = dist;
          closestCluster = c;
        }
      }
      clusters[closestCluster].ideaIds.push(idea.id);
    });

    let maxShift = 0;
    for (let c = 0; c < centroids.length; c++) {
      if (clusters[c].ideaIds.length === 0) continue;
      const clusterVectors = clusters[c].ideaIds
        .map(id => ideas.findIndex(i => i.id === id))
        .filter(idx => idx >= 0)
        .map(idx => vectors[idx]);

      const newCentroid = new Array(32).fill(0);
      for (const v of clusterVectors) {
        for (let j = 0; j < v.length; j++) {
          newCentroid[j] += v[j];
        }
      }
      for (let j = 0; j < newCentroid.length; j++) {
        newCentroid[j] /= clusterVectors.length;
      }

      const shift = euclideanDistance(centroids[c], newCentroid);
      maxShift = Math.max(maxShift, shift);
      centroids[c] = newCentroid;
    }

    if (maxShift < threshold) break;
  }

  const updatedIdeas = ideas.map(idea => {
    for (let c = 0; c < clusters.length; c++) {
      if (clusters[c].ideaIds.includes(idea.id)) {
        return { ...idea, clusterId: clusters[c].id, color: clusters[c].color };
      }
    }
    return idea;
  });

  const margin = 80;
  const validClusters = clusters.filter(c => c.ideaIds.length > 0);
  
  validClusters.forEach((cluster, idx) => {
    const clusterIdeas = updatedIdeas.filter(i => i.clusterId === cluster.id);
    const angle = (idx / Math.max(validClusters.length, 1)) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const radius = Math.min(canvasWidth, canvasHeight) * 0.25 + (Math.random() - 0.5) * 50;
    const centerX = canvasWidth / 2 + Math.cos(angle) * radius;
    const centerY = canvasHeight / 2 + Math.sin(angle) * radius;
    cluster.center = [centerX, centerY];

    clusterIdeas.forEach(idea => {
      const jitterX = (Math.random() - 0.5) * 120;
      const jitterY = (Math.random() - 0.5) * 120;
      idea.x = Math.max(margin, Math.min(canvasWidth - margin, centerX + jitterX));
      idea.y = Math.max(margin, Math.min(canvasHeight - margin, centerY + jitterY));
    });
  });

  return { clusters: validClusters, ideas: updatedIdeas };
}

export function incrementalCluster(
  newIdea: Idea,
  existingIdeas: Idea[],
  existingClusters: Cluster[],
  canvasWidth: number,
  canvasHeight: number
): ClusterResult {
  const newVector = newIdea.vector.length > 0 ? newIdea.vector : textToVector(newIdea.text);
  newIdea.vector = newVector;

  if (existingClusters.length === 0) {
    const firstCluster: Cluster = {
      id: uuidv4(),
      name: '星群 1',
      color: THEME_COLORS[0],
      center: [canvasWidth / 2, canvasHeight / 2],
      ideaIds: [newIdea.id]
    };
    newIdea.clusterId = firstCluster.id;
    newIdea.color = firstCluster.color;
    newIdea.x = canvasWidth / 2;
    newIdea.y = canvasHeight / 2;
    return { clusters: [firstCluster], ideas: [...existingIdeas, newIdea] };
  }

  const clusterVectors = existingClusters.map(cluster => {
    const clusterIdeas = existingIdeas.filter(i => i.clusterId === cluster.id);
    if (clusterIdeas.length === 0) return new Array(32).fill(0);
    const avg = new Array(32).fill(0);
    for (const idea of clusterIdeas) {
      for (let j = 0; j < idea.vector.length; j++) {
        avg[j] += idea.vector[j] || 0;
      }
    }
    return avg.map(v => v / clusterIdeas.length);
  });

  let minDist = Infinity;
  let closestClusterIdx = 0;
  for (let c = 0; c < clusterVectors.length; c++) {
    const dist = euclideanDistance(newVector, clusterVectors[c]);
    if (dist < minDist) {
      minDist = dist;
      closestClusterIdx = c;
    }
  }

  const assignedCluster = existingClusters[closestClusterIdx];
  newIdea.clusterId = assignedCluster.id;
  newIdea.color = assignedCluster.color;

  const margin = 80;
  const jitterX = (Math.random() - 0.5) * 100;
  const jitterY = (Math.random() - 0.5) * 100;
  newIdea.x = Math.max(margin, Math.min(canvasWidth - margin, assignedCluster.center[0] + jitterX));
  newIdea.y = Math.max(margin, Math.min(canvasHeight - margin, assignedCluster.center[1] + jitterY));

  const updatedClusters = existingClusters.map((c, idx) => {
    if (idx === closestClusterIdx) {
      return { ...c, ideaIds: [...c.ideaIds, newIdea.id] };
    }
    return c;
  });

  return { clusters: updatedClusters, ideas: [...existingIdeas, newIdea] };
}

export { textToVector };
