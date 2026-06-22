import * as THREE from 'three';
import { CONSTELLATION_TEMPLATES } from './constellationData';
import type {
  ConstellationTemplate,
  DrawnStar,
  ConnectionLine,
  MatchedConstellation,
  StarTemplate,
} from './types';

interface NormalizedShape {
  points: THREE.Vector2[];
  center: THREE.Vector2;
  scale: number;
}

function normalizePoints(points: THREE.Vector3[]): NormalizedShape {
  const p2 = points.map((p) => new THREE.Vector2(p.x, p.y));
  const center = new THREE.Vector2(0, 0);
  p2.forEach((p) => center.add(p));
  center.divideScalar(p2.length);

  const translated = p2.map((p) => p.clone().sub(center));
  let maxDist = 0;
  translated.forEach((p) => {
    const d = p.length();
    if (d > maxDist) maxDist = d;
  });
  const scale = maxDist > 0 ? 1 / maxDist : 1;
  const scaled = translated.map((p) => p.multiplyScalar(scale));

  return { points: scaled, center, scale: 1 / scale };
}

function procrustesDistance(shape1: NormalizedShape, shape2: NormalizedShape): number {
  const n1 = shape1.points.length;
  const n2 = shape2.points.length;
  const n = Math.min(n1, n2);

  let cost = 0;
  for (let i = 0; i < n; i++) {
    const d = shape1.points[i].distanceTo(shape2.points[i]);
    cost += d * d;
  }
  const avgCost = cost / n;
  return Math.max(0, 1 - avgCost * 1.5);
}

function greedyMatch(
  userPoints: THREE.Vector3[],
  template: ConstellationTemplate
): { score: number; mapping: Map<number, number> } {
  const userNorm = normalizePoints(userPoints);
  const tplVectors = template.stars.map(
    (s) => new THREE.Vector3(s.position[0], s.position[1], s.position[2])
  );
  const tplNorm = normalizePoints(tplVectors);

  const usedTpl = new Set<number>();
  const mapping = new Map<number, number>();
  let totalScore = 0;

  for (let i = 0; i < userNorm.points.length; i++) {
    let bestDist = Infinity;
    let bestIdx = -1;
    for (let j = 0; j < tplNorm.points.length; j++) {
      if (usedTpl.has(j)) continue;
      const d = userNorm.points[i].distanceTo(tplNorm.points[j]);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = j;
      }
    }
    if (bestIdx >= 0) {
      usedTpl.add(bestIdx);
      mapping.set(i, bestIdx);
      totalScore += Math.max(0, 1 - bestDist * 2);
    }
  }

  const starCountMatch =
    1 - Math.abs(userPoints.length - template.stars.length) / Math.max(userPoints.length, template.stars.length);
  const positionalScore = totalScore / Math.max(userNorm.points.length, 1);
  const shapeScore = procrustesDistance(userNorm, tplNorm);

  const score = positionalScore * 0.5 + shapeScore * 0.3 + starCountMatch * 0.2;
  return { score, mapping };
}

function matchConstellation(points: THREE.Vector3[]): {
  template: ConstellationTemplate | null;
  score: number;
  mapping: Map<number, number>;
} {
  let bestTemplate: ConstellationTemplate | null = null;
  let bestScore = 0;
  let bestMapping = new Map<number, number>();

  for (const tpl of CONSTELLATION_TEMPLATES) {
    const result = greedyMatch(points, tpl);
    if (result.score > bestScore) {
      bestScore = result.score;
      bestTemplate = tpl;
      bestMapping = result.mapping;
    }
  }

  return { template: bestScore > 0.7 ? bestTemplate : null, score: bestScore, mapping: bestMapping };
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export class ConstellationManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private labelRenderer: { domElement: HTMLElement; render: (scene: THREE.Scene, camera: THREE.Camera) => void };
  private drawnStars: DrawnStar[] = [];
  private drawnLines: ConnectionLine[] = [];
  private matchedConstellations: MatchedConstellation[] = [];
  private isDrawing = false;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private clickPlane: THREE.Plane;
  private tempVector = new THREE.Vector3();
  private onConstellationClick: (c: MatchedConstellation) => void;
  private labelOffsetAnim = new Map<HTMLElement, { baseY: number; phase: number }>();
  private clickState = { lastClickTime: 0, clicks: 0 };

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    labelRenderer: { domElement: HTMLElement; render: (scene: THREE.Scene, camera: THREE.Camera) => void },
    onConstellationClick: (c: MatchedConstellation) => void
  ) {
    this.scene = scene;
    this.camera = camera;
    this.labelRenderer = labelRenderer;
    this.onConstellationClick = onConstellationClick;
    this.clickPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const canvas = document.querySelector('#canvas-container canvas') as HTMLCanvasElement | null;
    const target = canvas ?? window;

    target.addEventListener('pointermove', (e) => {
      const rect = (canvas ?? document.body).getBoundingClientRect();
      this.mouse.x = ((e as PointerEvent).clientX - rect.left) / rect.width * 2 - 1;
      this.mouse.y = -((e as PointerEvent).clientY - rect.top) / rect.height * 2 + 1;
    });

    target.addEventListener('pointerdown', (e) => {
      if ((e as PointerEvent).button !== 0) return;

      const now = Date.now();
      if (now - this.clickState.lastClickTime < 350) {
        this.clickState.clicks++;
      } else {
        this.clickState.clicks = 1;
      }
      this.clickState.lastClickTime = now;

      if (this.clickState.clicks >= 2) {
        this.clickState.clicks = 0;
        this.finishDrawing();
        return;
      }

      setTimeout(() => {
        if (this.clickState.clicks === 1 && Date.now() - this.clickState.lastClickTime > 280) {
          this.tryHandleClick();
        }
      }, 300);
    });
  }

  private tryHandleClick(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    for (const c of this.matchedConstellations) {
      const intersects = this.raycaster.intersectObject(c.group, true);
      if (intersects.length > 0) {
        this.onConstellationClick(c);
        return;
      }
    }

    this.raycaster.ray.intersectPlane(this.clickPlane, this.tempVector);
    if (this.tempVector) {
      this.addStar(this.tempVector.clone());
    }
  }

  private addStar(position: THREE.Vector3): void {
    const sphereGeo = new THREE.SphereGeometry(0.2, 32, 32);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 1,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.copy(position);

    const haloGeo = new THREE.SphereGeometry(0.35, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.25,
      side: THREE.BackSide,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.copy(position);

    this.scene.add(sphere);
    this.scene.add(halo);

    const star: DrawnStar = {
      id: generateId(),
      position: position.clone(),
      mesh: sphere,
      halo,
    };

    this.drawnStars.push(star);
    this.isDrawing = true;

    if (this.drawnStars.length >= 2) {
      const prev = this.drawnStars[this.drawnStars.length - 2];
      this.addLine(prev, star);
    }
  }

  private addLine(from: DrawnStar, to: DrawnStar): void {
    const points = [from.position.clone(), to.position.clone()];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0xe0e0ff,
      transparent: true,
      opacity: 0.7,
      linewidth: 1,
    });
    const line = new THREE.Line(geometry, material);
    this.scene.add(line);

    this.drawnLines.push({
      id: generateId(),
      from: from.id,
      to: to.id,
      mesh: line,
    });
  }

  private clearDrawing(): void {
    this.drawnStars.forEach((s) => {
      this.scene.remove(s.mesh);
      if (s.halo) this.scene.remove(s.halo);
      s.mesh.geometry.dispose();
      (s.mesh.material as THREE.Material).dispose();
      if (s.halo) {
        s.halo.geometry.dispose();
        (s.halo.material as THREE.Material).dispose();
      }
    });
    this.drawnLines.forEach((l) => {
      this.scene.remove(l.mesh);
      if (l.mesh instanceof THREE.Line) {
        l.mesh.geometry.dispose();
        (l.mesh.material as THREE.Material).dispose();
      }
    });
    this.drawnStars = [];
    this.drawnLines = [];
    this.isDrawing = false;
  }

  private finishDrawing(): void {
    if (this.drawnStars.length < 3) {
      this.clearDrawing();
      return;
    }

    const positions = this.drawnStars.map((s) => s.position.clone());
    const result = matchConstellation(positions);

    if (result.template && result.mapping.size > 0) {
      this.createMatchedConstellation(result.template, result.mapping);
    }
    this.clearDrawing();
  }

  private createMatchedConstellation(
    template: ConstellationTemplate,
    mapping: Map<number, number>
  ): void {
    const group = new THREE.Group();

    const userPoints = Array.from(mapping.keys()).map((k) => this.drawnStars[k].position);
    const userCenter = new THREE.Vector3();
    userPoints.forEach((p) => userCenter.add(p));
    userCenter.divideScalar(userPoints.length);

    const userScale = userPoints.reduce((acc, p) => {
      return Math.max(acc, p.distanceTo(userCenter));
    }, 0);

    const tplCenter = new THREE.Vector3();
    template.stars.forEach((s) => {
      tplCenter.x += s.position[0];
      tplCenter.y += s.position[1];
      tplCenter.z += s.position[2];
    });
    tplCenter.divideScalar(template.stars.length);

    const tplScale = template.stars.reduce((acc, s) => {
      const v = new THREE.Vector3(s.position[0], s.position[1], s.position[2]).sub(tplCenter);
      return Math.max(acc, v.length());
    }, 0);

    const scale = tplScale > 0 ? userScale / tplScale : 1;

    const createdStars: DrawnStar[] = [];
    for (let i = 0; i < template.stars.length; i++) {
      const starTpl = template.stars[i];
      const pos = new THREE.Vector3(
        (starTpl.position[0] - tplCenter.x) * scale + userCenter.x,
        (starTpl.position[1] - tplCenter.y) * scale + userCenter.y,
        (starTpl.position[2] - tplCenter.z) * scale + userCenter.z
      );

      const isAccent = i % 2 === 1;
      const color = new THREE.Color(isAccent ? template.accentColor : template.color);

      const radius = isAccent ? 0.1 : 0.18;
      const sphereGeo = new THREE.SphereGeometry(radius, 32, 32);
      const sphereMat = new THREE.MeshBasicMaterial({ color });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.copy(pos);
      sphere.userData.starIndex = i;
      group.add(sphere);

      const haloGeo = new THREE.SphereGeometry(radius * 1.8, 32, 32);
      const haloMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.copy(pos);
      group.add(halo);

      createdStars.push({
        id: generateId(),
        position: pos.clone(),
        mesh: sphere,
        halo,
      });
    }

    const createdLines: ConnectionLine[] = [];
    for (const [a, b] of template.connections) {
      if (a >= createdStars.length || b >= createdStars.length) continue;
      const from = createdStars[a];
      const to = createdStars[b];
      const points = [from.position.clone(), to.position.clone()];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: new THREE.Color(template.color),
        transparent: true,
        opacity: 0.85,
      });
      const line = new THREE.Line(geometry, material);
      group.add(line);
      createdLines.push({ id: generateId(), from: from.id, to: to.id, mesh: line });
    }

    this.scene.add(group);

    const label = this.createLabel(template, group);

    const constellation: MatchedConstellation = {
      template,
      stars: createdStars,
      connections: createdLines,
      labelElement: label,
      group,
      pulsePhase: Math.random() * Math.PI * 2,
    };

    group.userData.constellation = constellation;
    this.matchedConstellations.push(constellation);
  }

  private createLabel(template: ConstellationTemplate, group: THREE.Group): HTMLElement {
    const div = document.createElement('div');
    div.className = 'constellation-label';
    div.innerHTML = `
      <div class="name-cn">${template.name}</div>
      <div class="name-en">${template.nameEn}</div>
      <div class="meta">
        最佳观测: ${template.bestMonth} · 纬度: ${template.latitudeRange}
      </div>
      <div class="mythology">${template.mythology}</div>
    `;

    const labelContainer = document.getElementById('label-container');
    if (labelContainer) {
      labelContainer.appendChild(div);
    }

    let labelPos: THREE.Vector3 | null = null;
    for (const s of group.children) {
      if (s instanceof THREE.Mesh && s.userData.starIndex !== undefined) {
        if (!labelPos || s.position.y > labelPos.y) {
          labelPos = s.position.clone();
        }
      }
    }
    if (!labelPos) labelPos = new THREE.Vector3(0, 3, 0);
    labelPos = labelPos.clone();
    labelPos.y += 1.5;

    const update = () => {
      if (!div.isConnected) return;
      const v = labelPos!.clone().project(this.camera);
      const x = (v.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-v.y * 0.5 + 0.5) * window.innerHeight;
      const anim = this.labelOffsetAnim.get(div);
      const offset = anim ? Math.sin(performance.now() / 1500 + anim.phase) * 5 : 0;
      div.style.transform = `translate(-50%, calc(-100% + ${offset}px))`;
      div.style.left = `${x}px`;
      div.style.top = `${y}px`;
    };

    this.labelOffsetAnim.set(div, { baseY: 0, phase: Math.random() * Math.PI * 2 });

    const intervalId = window.setInterval(update, 50);
    update();

    div.addEventListener('click', (e) => {
      e.stopPropagation();
      const c = this.matchedConstellations.find((m) => m.labelElement === div);
      if (c) this.onConstellationClick(c);
    });

    const observer = new MutationObserver(() => {
      if (!div.isConnected) {
        window.clearInterval(intervalId);
        observer.disconnect();
        this.labelOffsetAnim.delete(div);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return div;
  }

  public highlightConstellation(id: string): void {
    const target = this.matchedConstellations.find((c) => c.template.id === id);
    if (target) {
      target.pulsePhase = 0;
    } else {
      const template = CONSTELLATION_TEMPLATES.find((t) => t.id === id);
      if (template) {
        const group = new THREE.Group();
        const stars: DrawnStar[] = [];
        const lines: ConnectionLine[] = [];
        const scale = 1.2;
        const offsetX = (Math.random() - 0.5) * 6;
        const offsetY = (Math.random() - 0.5) * 4;

        for (let i = 0; i < template.stars.length; i++) {
          const s = template.stars[i];
          const pos = new THREE.Vector3(
            s.position[0] * scale + offsetX,
            s.position[1] * scale + offsetY,
            s.position[2] * scale
          );
          const isAccent = i % 2 === 1;
          const color = new THREE.Color(isAccent ? template.accentColor : template.color);
          const radius = isAccent ? 0.1 : 0.18;
          const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(radius, 32, 32),
            new THREE.MeshBasicMaterial({ color })
          );
          mesh.position.copy(pos);
          mesh.userData.starIndex = i;
          group.add(mesh);
          stars.push({ id: generateId(), position: pos.clone(), mesh });
        }

        for (const [a, b] of template.connections) {
          if (a >= stars.length || b >= stars.length) continue;
          const pts = [stars[a].position.clone(), stars[b].position.clone()];
          const line = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(pts),
            new THREE.LineBasicMaterial({
              color: new THREE.Color(template.color),
              transparent: true,
              opacity: 0.85,
            })
          );
          group.add(line);
          lines.push({ id: generateId(), from: stars[a].id, to: stars[b].id, mesh: line });
        }

        this.scene.add(group);
        const label = this.createLabel(template, group);
        const constellation: MatchedConstellation = {
          template,
          stars,
          connections: lines,
          labelElement: label,
          group,
          pulsePhase: 0,
        };
        group.userData.constellation = constellation;
        this.matchedConstellations.push(constellation);
      }
    }
  }

  public update(time: number): void {
    for (const c of this.matchedConstellations) {
      c.pulsePhase += 0.04;
      const pulse = 1 + Math.sin(c.pulsePhase) * 0.15;
      for (const s of c.stars) {
        s.mesh.scale.setScalar(pulse);
        if (s.halo) {
          const haloPulse = 1 + Math.sin(c.pulsePhase + 0.5) * 0.25;
          s.halo.scale.setScalar(haloPulse);
        }
      }
    }
  }

  public getAllTemplates(): ConstellationTemplate[] {
    return CONSTELLATION_TEMPLATES;
  }
}
