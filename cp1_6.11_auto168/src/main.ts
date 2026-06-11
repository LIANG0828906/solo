import { RuneDisc, drawRuneDisc, type Rune, type RunePosition } from './noteRune';
import { EffectManager } from './effectManager';

const MAX_SEQUENCE = 8;
const PLAY_INTERVAL = 500;
const REMOVE_INTERVAL = 50;

const canvas = document.getElementById('stageCanvas') as HTMLCanvasElement | null;
const sequenceTrack = document.getElementById('sequenceTrack') as HTMLDivElement | null;
const btnPlay = document.getElementById('btnPlay') as HTMLButtonElement | null;
const btnClear = document.getElementById('btnClear') as HTMLButtonElement | null;

if (!canvas || !sequenceTrack || !btnPlay || !btnClear) {
  throw new Error('Required DOM elements not found');
}

const ctx = canvas.getContext('2d');
if (!ctx) {
  throw new Error('Canvas 2D context unavailable');
}

const $canvas: HTMLCanvasElement = canvas;
const $track: HTMLDivElement = sequenceTrack;
const $btnPlay: HTMLButtonElement = btnPlay;
const $btnClear: HTMLButtonElement = btnClear;
const $ctx: CanvasRenderingContext2D = ctx;

const effectManager = new EffectManager();

let sequence: Rune[] = [];
let isPlaying = false;
let lastFrameTime = 0;
let animationFrameId = 0;

function getCanvasSize(): { w: number; h: number } {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const cssW = window.innerWidth;
  const cssH = window.innerHeight;
  return { w: Math.floor(cssW * dpr), h: Math.floor(cssH * dpr) };
}

function applyCanvasSize() {
  const { w, h } = getCanvasSize();
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  $canvas.width = w;
  $canvas.height = h;
  $canvas.style.width = window.innerWidth + 'px';
  $canvas.style.height = window.innerHeight + 'px';
  $ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

const runeDisc = new RuneDisc(window.innerWidth, window.innerHeight);
applyCanvasSize();

function cssToCanvasCoord(clientX: number, clientY: number): { x: number; y: number } {
  const rect = $canvas.getBoundingClientRect();
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

function updateButtons() {
  const hasItems = sequence.length > 0 && !isPlaying;
  $btnPlay.disabled = !hasItems;
  $btnClear.disabled = sequence.length === 0 || isPlaying;
}

function renderSequenceDot(rune: Rune, index: number): HTMLDivElement {
  const wrap = document.createElement('div');
  wrap.className = 'seq-dot-wrap';
  wrap.style.transitionDelay = `${index * 10}ms`;
  wrap.dataset.index = String(index);

  const dot = document.createElement('div');
  dot.className = 'seq-dot';
  dot.style.background = rune.color;
  dot.style.color = rune.color;

  wrap.appendChild(dot);
  return wrap;
}

function renderSequenceLine(): HTMLDivElement {
  const line = document.createElement('div');
  line.className = 'seq-line';
  return line;
}

function rebuildSequenceUI() {
  $track.innerHTML = '';
  if (sequence.length === 0) {
    return;
  }
  sequence.forEach((rune, idx) => {
    if (idx > 0) {
      $track.appendChild(renderSequenceLine());
    }
    $track.appendChild(renderSequenceDot(rune, idx));
  });
}

function addToSequence(rune: Rune) {
  if (sequence.length >= MAX_SEQUENCE) {
    sequence.shift();
  }
  sequence.push(rune);
  rebuildSequenceUI();
  updateButtons();
}

function clearSequence() {
  if (sequence.length === 0) return;
  const wraps = Array.from($track.querySelectorAll<HTMLDivElement>('.seq-dot-wrap'));
  const lines = Array.from($track.querySelectorAll<HTMLDivElement>('.seq-line'));
  const ordered = wraps.sort((a, b) => {
    return (parseInt(a.dataset.index ?? '0', 10) || 0) - (parseInt(b.dataset.index ?? '0', 10) || 0);
  });

  ordered.forEach((wrap, i) => {
    setTimeout(() => {
      wrap.classList.add('removing');
      const prevLine = wrap.previousElementSibling as HTMLDivElement | null;
      if (prevLine && prevLine.classList.contains('seq-line')) {
        prevLine.classList.add('hidden');
      }
    }, i * REMOVE_INTERVAL);
  });

  lines.forEach((ln, i) => {
    if (!ln.classList.contains('hidden')) {
      setTimeout(() => ln.classList.add('hidden'), i * REMOVE_INTERVAL);
    }
  });

  const totalTime = ordered.length * REMOVE_INTERVAL + 180;
  setTimeout(() => {
    sequence = [];
    rebuildSequenceUI();
    updateButtons();
  }, totalTime);
}

function triggerRuneAt(pos: RunePosition, withSound: boolean = true) {
  effectManager.triggerExplosion(pos.rune, pos.cx, pos.cy);
  const idx = runeDisc.findIndexByRuneId(pos.rune.id);
  if (idx >= 0) {
    runeDisc.setClickAnim(idx);
  }
  if (withSound) {
    effectManager.playNote(pos.rune.pitch, 0.3);
  }
}

async function playSequence() {
  if (isPlaying || sequence.length === 0) return;
  isPlaying = true;
  updateButtons();

  for (let i = 0; i < sequence.length; i++) {
    const rune = sequence[i];
    const pos = runeDisc.getPositionByRuneId(rune.id);
    if (pos) {
      triggerRuneAt(pos, true);
    }
    if (i < sequence.length - 1) {
      await new Promise<void>((resolve) => setTimeout(resolve, PLAY_INTERVAL));
    }
  }

  isPlaying = false;
  updateButtons();
}

function handlePointerDown(clientX: number, clientY: number) {
  const { x, y } = cssToCanvasCoord(clientX, clientY);
  const hit = runeDisc.hitTest(x, y);
  if (hit) {
    triggerRuneAt(hit, true);
    addToSequence(hit.rune);
  }
}

function handlePointerMove(clientX: number, clientY: number) {
  const { x, y } = cssToCanvasCoord(clientX, clientY);
  const hit = runeDisc.hitTest(x, y);
  if (hit) {
    const idx = runeDisc.findIndexByRuneId(hit.rune.id);
    runeDisc.setHoverIndex(idx);
    $canvas.style.cursor = 'pointer';
  } else {
    runeDisc.setHoverIndex(-1);
    $canvas.style.cursor = 'default';
  }
}

$canvas.addEventListener('mousedown', (e) => {
  handlePointerDown(e.clientX, e.clientY);
});
$canvas.addEventListener('mousemove', (e) => {
  handlePointerMove(e.clientX, e.clientY);
});
$canvas.addEventListener('mouseleave', () => {
  runeDisc.setHoverIndex(-1);
});

$canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const touch = e.changedTouches[0];
  if (touch) handlePointerDown(touch.clientX, touch.clientY);
}, { passive: false });

$canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const touch = e.changedTouches[0];
  if (touch) handlePointerMove(touch.clientX, touch.clientY);
}, { passive: false });

$btnPlay.addEventListener('click', () => {
  void playSequence();
});
$btnClear.addEventListener('click', () => {
  clearSequence();
});

window.addEventListener('resize', () => {
  applyCanvasSize();
  runeDisc.resize(window.innerWidth, window.innerHeight);
});

function drawBackground() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  $ctx.save();
  $ctx.clearRect(0, 0, w, h);
  const bg = $ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
  bg.addColorStop(0, '#1A1530');
  bg.addColorStop(1, '#0D0A16');
  $ctx.fillStyle = bg;
  $ctx.fillRect(0, 0, w, h);
  $ctx.restore();
}

function frame(now: number) {
  const dt = Math.min(50, now - lastFrameTime);
  lastFrameTime = now;

  effectManager.update(dt);

  drawBackground();
  drawRuneDisc($ctx, runeDisc, now);
  effectManager.draw($ctx);

  animationFrameId = requestAnimationFrame(frame);
}

lastFrameTime = performance.now();
animationFrameId = requestAnimationFrame(frame);

void animationFrameId;
void getCanvasSize;

updateButtons();
