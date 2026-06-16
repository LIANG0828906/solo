import { SceneManager } from './scene/SceneManager';
import { AudioEngine } from './interaction/AudioEngine';
import { PlayerModule, MelodyType } from './interaction/PlayerModule';
import { useAppStore } from './store/AppState';

async function bootstrap() {
  const container = document.getElementById('app');
  if (!container) throw new Error('Container not found');

  const audioEngine = new AudioEngine();
  const player = new PlayerModule(audioEngine);
  await player.init();

  const scene = new SceneManager(container, audioEngine, player);
  scene.start();

  const noteNameEl = document.getElementById('noteName')!;
  const progressFill = document.getElementById('progressFill')!;
  const progressLabel = document.getElementById('progressLabel')!;
  const modeGroup = document.getElementById('modeGroup')!;
  const windSlider = document.getElementById('windSlider') as HTMLInputElement;
  const windValue = document.getElementById('windValue')!;
  const melodySelect = document.getElementById('melodySelect') as HTMLSelectElement;
  const melodySelectWrap = document.getElementById('melodySelectWrap')!;

  let lastMode: 'free' | 'auto' = 'free';

  function updateUI() {
    const state = useAppStore.getState();
    noteNameEl.textContent = state.currentNoteName;

    if (state.playMode === 'auto' && state.melodyTotal > 0) {
      const pct = Math.min(100, (state.melodyProgress / state.melodyTotal) * 100);
      progressFill.style.width = `${pct}%`;
      const melodyNames: Record<MelodyType, string> = {
        polka: '波尔卡',
        tango: '探戈',
        folk: '民谣',
      };
      progressLabel.textContent = `${melodyNames[state.currentMelody]} · ${pct.toFixed(0)}%`;
    } else {
      progressFill.style.width = '0%';
      progressLabel.textContent = '自由模式';
    }

    if (state.playMode !== lastMode) {
      lastMode = state.playMode;
      const btns = modeGroup.querySelectorAll('.btn');
      btns.forEach((b) => {
        const btn = b as HTMLButtonElement;
        btn.classList.toggle('active', btn.dataset.mode === state.playMode);
      });
      melodySelectWrap.style.display = state.playMode === 'auto' ? 'flex' : 'none';
    }

    requestAnimationFrame(updateUI);
  }
  updateUI();

  modeGroup.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('.btn') as HTMLButtonElement | null;
    if (!target) return;
    const mode = target.dataset.mode as 'free' | 'auto';

    void audioEngine.resume();

    if (mode === 'auto') {
      const type = melodySelect.value as MelodyType;
      const points = player.getMelodyPathPoints(type);
      scene.setMelodyPath(points);
    } else {
      scene.clearMelodyPath();
    }
    player.setMode(mode);
  });

  melodySelect.addEventListener('change', () => {
    if (useAppStore.getState().playMode === 'auto') {
      const type = melodySelect.value as MelodyType;
      const points = player.getMelodyPathPoints(type);
      scene.setMelodyPath(points);
      player.startMelody(type);
    }
  });

  windSlider.addEventListener('input', () => {
    const v = parseFloat(windSlider.value);
    useAppStore.getState().setWindSpeed(v);
    windValue.textContent = `${v.toFixed(1)}x`;
  });

  const resumeFromIdle = () => {
    void audioEngine.resume();
  };
  document.addEventListener('click', resumeFromIdle, { once: true });
  document.addEventListener('keydown', resumeFromIdle, { once: true });
  document.addEventListener('touchstart', resumeFromIdle, { once: true });
}

void bootstrap();
