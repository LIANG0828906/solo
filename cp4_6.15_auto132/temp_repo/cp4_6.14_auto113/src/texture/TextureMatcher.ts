import * as THREE from 'three';
import { SceneManager } from '../scene/SceneManager';
import { globalEvents, MatchPair, FragmentData } from '../types';

type Histogram = number[][];

export class TextureMatcher {
  private sceneManager: SceneManager;
  private histogramCache: Map<string, Histogram> = new Map();
  private threshold: number = 0.6;

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    globalEvents.on('match:updated', (matches: Map<string, MatchPair>) => this.checkMatches(matches));
    globalEvents.on('fragment:added', (frag: FragmentData) => this.prepareFragment(frag));
  }

  private prepareFragment(frag: FragmentData): void {
    const histogram = this.extractHistogram(frag);
    if (histogram) this.histogramCache.set(frag.id, histogram);
  }

  private extractHistogram(frag: FragmentData): Histogram | null {
    let canvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let foundTexture = false;

    frag.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m: any) => {
          if (m.map && m.map.image) {
            const img = m.map.image;
            canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, 64, 64);
            foundTexture = true;
          }
        });
      }
    });

    if (!foundTexture || !canvas || !ctx) {
      const syntheticCanvas = document.createElement('canvas');
      syntheticCanvas.width = 64;
      syntheticCanvas.height = 64;
      const sctx = syntheticCanvas.getContext('2d')!;
      let avgColor = new THREE.Color(0x8b7355);
      frag.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((m: any) => {
            if (m.color) avgColor = m.color.clone();
          });
        }
      });
      sctx.fillStyle = `#${avgColor.getHexString()}`;
      sctx.fillRect(0, 0, 64, 64);
      canvas = syntheticCanvas;
      ctx = sctx;
    }

    const imageData = ctx.getImageData(0, 0, 64, 64);
    const bins = 16;
    const histogram: Histogram = [
      new Array(bins).fill(0),
      new Array(bins).fill(0),
      new Array(bins).fill(0),
    ];

    const data = imageData.data;
    const total = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      const r = Math.floor((data[i] / 255) * (bins - 1));
      const g = Math.floor((data[i + 1] / 255) * (bins - 1));
      const b = Math.floor((data[i + 2] / 255) * (bins - 1));
      histogram[0][r]++;
      histogram[1][g]++;
      histogram[2][b]++;
    }

    for (let c = 0; c < 3; c++) {
      for (let b = 0; b < bins; b++) {
        histogram[c][b] /= total;
      }
    }

    return histogram;
  }

  private histogramIntersection(h1: Histogram, h2: Histogram): number {
    let intersection = 0;
    const bins = h1[0].length;
    for (let c = 0; c < 3; c++) {
      for (let b = 0; b < bins; b++) {
        intersection += Math.min(h1[c][b], h2[c][b]);
      }
    }
    return intersection / 3;
  }

  private checkMatches(matches: Map<string, MatchPair>): void {
    this.sceneManager.clearTextureHighlights();

    matches.forEach((match, key) => {
      const fragA = this.sceneManager.fragments.get(match.fragmentA);
      const fragB = this.sceneManager.fragments.get(match.fragmentB);
      if (!fragA || !fragB) return;

      const histA = this.histogramCache.get(match.fragmentA);
      const histB = this.histogramCache.get(match.fragmentB);

      let similarity = 0;
      if (histA && histB) {
        similarity = this.histogramIntersection(histA, histB);
      }

      match.textureScore = Math.round(similarity * 100);

      if (similarity >= this.threshold) {
        const centerA = new THREE.Vector3();
        fragA.boundingBox.getCenter(centerA);
        const centerB = new THREE.Vector3();
        fragB.boundingBox.getCenter(centerB);
        this.sceneManager.addTextureHighlight(match.fragmentA, match.fragmentB, centerA, centerB);
      }

      const item = document.querySelector(`.match-item[data-key="${key}"]`);
      if (item) {
        const scoreSpan = item.querySelector('.match-score');
        if (scoreSpan) {
          const combinedScore = Math.round(match.score * 0.6 + match.textureScore * 0.4);
          let scoreClass = 'score-low';
          if (combinedScore >= 80) scoreClass = 'score-high';
          else if (combinedScore >= 50) scoreClass = 'score-mid';
          scoreSpan.className = `match-score ${scoreClass}`;
          scoreSpan.textContent = `${combinedScore}分 (T:${match.textureScore})`;
        }
      }
    });
  }
}
