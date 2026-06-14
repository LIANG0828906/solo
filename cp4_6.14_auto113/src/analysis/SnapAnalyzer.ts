import * as THREE from 'three';
import { SceneManager } from '../scene/SceneManager';
import { globalEvents, MatchPair, FragmentData } from '../types';

export class SnapAnalyzer {
  private sceneManager: SceneManager;
  private checkInterval: number = 300;
  private lastCheck: number = 0;
  public currentMatches: Map<string, MatchPair> = new Map();
  private groupCounter: number = 0;

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    globalEvents.on('fragment:transformed', () => this.forceCheck());
  }

  private boxDistance(a: THREE.Box3, b: THREE.Box3): number {
    const d1 = a.min.x - b.max.x;
    const d2 = b.min.x - a.max.x;
    const d3 = a.min.y - b.max.y;
    const d4 = b.min.y - a.max.y;
    const d5 = a.min.z - b.max.z;
    const d6 = b.min.z - a.max.z;
    const dx = Math.max(d1, d2, 0);
    const dy = Math.max(d3, d4, 0);
    const dz = Math.max(d5, d6, 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  public update(now: number): void {
    if (now - this.lastCheck >= this.checkInterval) {
      this.lastCheck = now;
      this.checkAllFragments();
    }
  }

  public forceCheck(): void {
    this.checkAllFragments();
  }

  private checkAllFragments(): void {
    const frags: FragmentData[] = [];
    this.sceneManager.fragments.forEach((f) => frags.push(f));

    const newMatches = new Map<string, MatchPair>();

    for (let i = 0; i < frags.length; i++) {
      for (let j = i + 1; j < frags.length; j++) {
        const a = frags[i];
        const b = frags[j];

        if (this.boxDistance(a.boundingBox, b.boundingBox) > 2.0) continue;

        const { distance, normalAngle } = this.computeSnapMetrics(a, b);

        if (distance < 0.1 && normalAngle < 15) {
          const key = `${a.id}_${b.id}`;
          const prev = this.currentMatches.get(key);
          const score = this.computeScore(distance, normalAngle);

          const centerA = new THREE.Vector3();
          a.boundingBox.getCenter(centerA);
          const centerB = new THREE.Vector3();
          b.boundingBox.getCenter(centerB);

          this.sceneManager.addMatchLine(key, centerA, centerB);

          const commonGroup = this.assignGroup(a, b);

          newMatches.set(key, {
            fragmentA: a.id,
            fragmentB: b.id,
            distance,
            normalAngle,
            score,
            textureScore: prev?.textureScore ?? 0,
            line: this.sceneManager.matchLines.get(key) ?? null,
          });

          void commonGroup;
        }
      }
    }

    this.currentMatches.forEach((_m, key) => {
      if (!newMatches.has(key)) {
        this.sceneManager.removeMatchLine(key);
      }
    });

    this.currentMatches = newMatches;
    this.updateMatchPanel();
    globalEvents.emit('match:updated', this.currentMatches);
  }

  private computeSnapMetrics(a: FragmentData, b: FragmentData): { distance: number; normalAngle: number } {
    let minDist = Infinity;
    const worldEdgesA = a.edgeVertices.map((v) => {
      const wv = v.clone();
      a.mesh.localToWorld(wv);
      return wv;
    });
    const worldEdgesB = b.edgeVertices.map((v) => {
      const wv = v.clone();
      b.mesh.localToWorld(wv);
      return wv;
    });

    const sampleA = this.sampleEdges(worldEdgesA, 40);
    const sampleB = this.sampleEdges(worldEdgesB, 40);

    for (const va of sampleA) {
      for (const vb of sampleB) {
        const d = va.distanceTo(vb);
        if (d < minDist) minDist = d;
      }
    }

    const normalA = a.averageNormal.clone().applyQuaternion(a.mesh.quaternion).normalize();
    const normalB = b.averageNormal.clone().applyQuaternion(b.mesh.quaternion).normalize();
    const dot = Math.max(-1, Math.min(1, normalA.dot(normalB)));
    const angle = Math.abs(Math.acos(dot) * (180 / Math.PI));
    const angleComplement = Math.min(angle, 180 - angle);

    return { distance: minDist, normalAngle: angleComplement };
  }

  private sampleEdges(vertices: THREE.Vector3[], count: number): THREE.Vector3[] {
    if (vertices.length <= count) return vertices;
    const step = Math.floor(vertices.length / count);
    const result: THREE.Vector3[] = [];
    for (let i = 0; i < vertices.length; i += step) {
      result.push(vertices[i]);
    }
    return result.slice(0, count);
  }

  private computeScore(distance: number, normalAngle: number): number {
    const distScore = Math.max(0, 1 - distance / 0.1) * 50;
    const angleScore = Math.max(0, 1 - normalAngle / 15) * 50;
    return Math.round(distScore + angleScore);
  }

  private assignGroup(a: FragmentData, b: FragmentData): number {
    if (a.groupId !== null && b.groupId !== null) {
      const targetGroup = a.groupId;
      this.sceneManager.fragments.forEach((f) => {
        if (f.groupId === b.groupId) f.groupId = targetGroup;
      });
      return targetGroup;
    }
    if (a.groupId !== null) {
      b.groupId = a.groupId;
      return a.groupId;
    }
    if (b.groupId !== null) {
      a.groupId = b.groupId;
      return b.groupId;
    }
    const newGroup = ++this.groupCounter;
    a.groupId = newGroup;
    b.groupId = newGroup;
    return newGroup;
  }

  private updateMatchPanel(): void {
    const list = document.getElementById('match-list');
    if (!list) return;
    list.innerHTML = '';

    if (this.currentMatches.size === 0) {
      list.innerHTML = '<div class="empty-hint">暂无匹配</div>';
      return;
    }

    this.currentMatches.forEach((match, key) => {
      const item = document.createElement('div');
      item.className = 'match-item';
      item.dataset.key = key;

      let scoreClass = 'score-low';
      if (match.score >= 80) scoreClass = 'score-high';
      else if (match.score >= 50) scoreClass = 'score-mid';

      item.innerHTML = `
        <span class="match-pair">${match.fragmentA} ↔ ${match.fragmentB}</span>
        <span class="match-score ${scoreClass}">${match.score}分</span>
      `;

      item.addEventListener('click', () => {
        document.querySelectorAll('.match-item').forEach((el) => el.classList.remove('highlight'));
        item.classList.add('highlight');
        this.sceneManager.highlightMatchLine(key, true);
      });

      list.appendChild(item);
    });
  }
}
