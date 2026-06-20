import { useAppStore, getEmotionPercentages } from './stores/appStore';
import { analyzeText, getEmotionLabel, getEmotionHex } from './engine/sentimentEngine';
import { ParticleEngine } from './engine/particleEngine';
import { InteractionEngine } from './engine/interactionEngine';
import { SceneRenderer } from './renderer/sceneRenderer';
import type { EmotionType, EmotionSegment } from './types';
import { EMOTION_ORDER, EMOTION_COLORS } from './types';

const SAMPLE_TEXT = `今天阳光很好，我走在熟悉的街道上，心里充满了平静的喜悦，偶尔想起那些遗憾的往事，也只是微微一笑。
风轻轻吹过树梢，带来远方的花香。虽然生活中总有让人烦躁的时刻，但此刻我只想静静感受这份宁静与温柔。
有时候也会伤心，也会难过，但那些悲伤终将过去，就像乌云遮不住阳光。`;

function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Element #${id} not found`);
  return el;
}

class App {
  private particleEngine!: ParticleEngine;
  private renderer!: SceneRenderer;
  private interaction!: InteractionEngine;

  private textInput!: HTMLTextAreaElement;
  private submitBtn!: HTMLElement;
  private hoverLabel!: HTMLElement;
  private hoverTag!: HTMLElement;
  private hoverText!: HTMLElement;
  private ringSvg!: SVGSVGElement;

  private initialAnalysisDone = false;

  constructor() {
    this.init();
  }

  private init(): void {
    this.cacheDomElements();
    this.initEngines();
    this.bindUIEvents();
    this.initEmotionRing();
    this.renderer.start();

    setTimeout(() => {
      this.textInput.value = SAMPLE_TEXT;
      useAppStore.getState().actions.setText(SAMPLE_TEXT);
      this.runAnalysis(true);
      this.initialAnalysisDone = true;
    }, 150);
  }

  private cacheDomElements(): void {
    this.textInput = $('text-input') as HTMLTextAreaElement;
    this.submitBtn = $('submit-btn');
    this.hoverLabel = $('hover-label');
    this.hoverTag = $('hover-tag');
    this.hoverText = $('hover-text');
    this.ringSvg = $('ring-svg') as SVGSVGElement;
  }

  private initEngines(): void {
    const container = $('canvas-container');
    const store = useAppStore.getState();

    this.particleEngine = new ParticleEngine(store.particleConfig);

    this.renderer = new SceneRenderer(container, {
      onFrame: (delta) => this.onFrame(delta)
    });

    this.interaction = new InteractionEngine(
      container,
      this.renderer.getCamera(),
      {
        onHoverEmotion: (e) => this.onHoverEmotion(e),
        onHoverSegment: (seg, pos) => this.onHoverSegment(seg, pos),
        onSubmitBurst: () => {}
      }
    );

    this.interaction.setQueryFunction((ray) => {
      return this.particleEngine.queryHover(
        {
          origin: { x: ray.origin.x, y: ray.origin.y, z: ray.origin.z },
          direction: { x: ray.direction.x, y: ray.direction.y, z: ray.direction.z }
        },
        40
      );
    });
  }

  private bindUIEvents(): void {
    this.submitBtn.addEventListener('click', () => this.runAnalysis(false));

    this.textInput.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this.runAnalysis(false);
      }
    });

    this.textInput.addEventListener('input', () => {
      useAppStore.getState().actions.setText(this.textInput.value);
    });

    $('btn-reanalyze').addEventListener('click', () => {
      this.runAnalysis(false);
      this.flashButton('btn-reanalyze');
    });

    $('btn-screenshot').addEventListener('click', () => {
      this.renderer.captureScreenshot();
      this.flashButton('btn-screenshot');
    });

    $('btn-fullscreen').addEventListener('click', () => {
      useAppStore.getState().actions.toggleFullscreen();
      this.flashButton('btn-fullscreen');
    });

    $('btn-reset').addEventListener('click', () => {
      this.interaction.resetCamera();
      this.flashButton('btn-reset');
    });
  }

  private flashButton(id: string): void {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.style.transform = 'scale(1.25)';
    setTimeout(() => { btn.style.transform = ''; }, 180);
  }

  private runAnalysis(isInitial: boolean): void {
    const text = this.textInput.value.trim();
    if (!text) {
      this.animateSubmitFail();
      return;
    }

    this.animateSubmitSuccess();

    const result = analyzeText(text);
    useAppStore.getState().actions.setAnalysisResult(result);
    this.particleEngine.buildFromAnalysis(result);
    this.renderer.syncWithParticles(this.particleEngine);
    this.renderer.updateLightsFromClusters(this.particleEngine.getClusters());
    this.updateEmotionRing();

    if (!isInitial) {
      this.particleEngine.triggerBurst({ x: 0, y: 0, z: 0 });
    }
  }

  private animateSubmitSuccess(): void {
    this.submitBtn.animate(
      [
        { transform: 'scale(1) rotate(0deg)' },
        { transform: 'scale(1.15) rotate(120deg)' },
        { transform: 'scale(1) rotate(360deg)' }
      ],
      { duration: 600, easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' }
    );
  }

  private animateSubmitFail(): void {
    this.submitBtn.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-6px)' },
        { transform: 'translateX(6px)' },
        { transform: 'translateX(-4px)' },
        { transform: 'translateX(4px)' },
        { transform: 'translateX(0)' }
      ],
      { duration: 320, easing: 'ease-out' }
    );
    this.textInput.style.borderColor = 'rgba(255,107,107,0.6)';
    setTimeout(() => { this.textInput.style.borderColor = ''; }, 400);
  }

  private onFrame(delta: number): void {
    this.particleEngine.update(delta);
    this.renderer.updateParticleVisuals(this.particleEngine);
    this.interaction.tick();

    const burst = useAppStore.getState().burstPending;
    if (burst) {
      this.particleEngine.triggerBurst(burst.origin);
      useAppStore.getState().actions.consumeBurst();
    }

    const store = useAppStore.getState();
    const cam = this.interaction.getCameraState();
    if (
      Math.abs(cam.position.x - store.cameraState.position.x) > 0.05 ||
      Math.abs(cam.position.y - store.cameraState.position.y) > 0.05 ||
      Math.abs(cam.position.z - store.cameraState.position.z) > 0.05
    ) {
      store.actions.setCameraState({
        position: { x: cam.position.x, y: cam.position.y, z: cam.position.z },
        target: { x: cam.target.x, y: cam.target.y, z: cam.target.z }
      });
    }
  }

  private onHoverEmotion(emotion: EmotionType | null): void {
    useAppStore.getState().actions.setHoveredEmotion(emotion);
    this.particleEngine.setHoveredEmotion(emotion);
    this.updateRingHoverState(emotion);
  }

  private onHoverSegment(segment: EmotionSegment | null, pos: { x: number; y: number } | null): void {
    useAppStore.getState().actions.setHoveredSegment(segment);

    if (!segment || !pos) {
      this.hoverLabel.classList.remove('visible');
      return;
    }

    this.hoverTag.textContent = getEmotionLabel(segment.emotion);
    this.hoverTag.style.background = getEmotionHex(segment.emotion);
    this.hoverText.textContent = segment.text;

    this.hoverLabel.style.left = `${pos.x}px`;
    const labelHeight = 80;
    const topPos = Math.max(labelHeight, pos.y - 10);
    this.hoverLabel.style.top = `${topPos}px`;
    this.hoverLabel.classList.add('visible');
  }

  private initEmotionRing(): void {
    this.updateEmotionRing();
  }

  private updateEmotionRing(): void {
    const weights = useAppStore.getState().emotionWeights;
    const percents = getEmotionPercentages(weights);

    const cx = 50, cy = 50, r = 38;
    const strokeWidth = 8;

    const defs = `
      <defs>
        <filter id="ring-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <circle id="ring-flow-dot" r="3" fill="white" opacity="0.9">
          <animateMotion
            dur="2s"
            repeatCount="indefinite"
            path="M ${cx + r} ${cy}
                   A ${r} ${r} 0 1 1 ${cx - r} ${cy}
                   A ${r} ${r} 0 1 1 ${cx + r} ${cy}"
          />
        </circle>
      </defs>
    `;

    const inner = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    inner.innerHTML = defs;

    let startAngle = -Math.PI / 2;
    const totalPct = EMOTION_ORDER.reduce((s, e) => s + percents[e], 0) || 100;

    const arcs: string[] = [];

    for (const emotion of EMOTION_ORDER) {
      const pct = percents[emotion] / totalPct;
      const sweepAngle = pct * Math.PI * 2;
      const endAngle = startAngle + sweepAngle;

      const largeArc = sweepAngle > Math.PI ? 1 : 0;
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);

      const hex = EMOTION_COLORS[emotion].hex;

      const path = `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;

      const arcEl = `
        <path
          class="emotion-arc"
          data-emotion="${emotion}"
          d="${path}"
          stroke="${hex}"
          stroke-width="${strokeWidth}"
          stroke-linecap="round"
          fill="none"
          style="color:${hex}"
          filter="url(#ring-glow)"
        />
      `;
      arcs.push(arcEl);
      startAngle = endAngle;
    }

    const flowDots = EMOTION_ORDER.map((e, i) => {
      const hex = EMOTION_COLORS[e].hex;
      return `<use href="#ring-flow-dot" fill="${hex}" transform="rotate(${i * 15} ${cx} ${cy})"/>`;
    }).join('');

    const bgCircle = `<circle cx="${cx}" cy="${cy}" r="${r}" stroke="rgba(255,255,255,0.08)" stroke-width="${strokeWidth - 2}" fill="none"/>`;

    inner.innerHTML += bgCircle + arcs.join('') + flowDots;

    this.ringSvg.innerHTML = '';
    this.ringSvg.appendChild(inner);

    this.ringSvg.querySelectorAll<SVGPathElement>('.emotion-arc').forEach((el) => {
      const emotion = el.dataset.emotion as EmotionType;
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const current = useAppStore.getState().selectedEmotion;
        const next = current === emotion ? null : emotion;
        useAppStore.getState().actions.setSelectedEmotion(next);
        this.particleEngine.setSelectedEmotion(next);
        this.updateRingArcSelection();
      });
    });

    this.updateRingArcSelection();
  }

  private updateRingArcSelection(): void {
    const selected = useAppStore.getState().selectedEmotion;
    this.ringSvg.querySelectorAll<SVGPathElement>('.emotion-arc').forEach((el) => {
      const emo = el.dataset.emotion as EmotionType;
      el.classList.toggle('highlighted', selected === emo);
      el.classList.toggle('dimmed', selected !== null && selected !== emo);
    });
  }

  private updateRingHoverState(hovered: EmotionType | null): void {
    this.ringSvg.querySelectorAll<SVGPathElement>('.emotion-arc').forEach((el) => {
      const emo = el.dataset.emotion as EmotionType;
      if (hovered === null) return;
      if (emo === hovered) {
        el.setAttribute('filter', 'url(#ring-glow) brightness(1.3)');
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    new App();
  } catch (err) {
    console.error('App init failed:', err);
  }
});
