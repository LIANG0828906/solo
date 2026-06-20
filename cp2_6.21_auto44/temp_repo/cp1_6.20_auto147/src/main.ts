import { PhysicsEngine } from './physics/physicsEngine';
import { EditorManager } from './editor/editorManager';
import { TerrainBlock, TerrainType } from './editor/terrainBlock';

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

function resizeCanvas(): void {
  const wrap = document.getElementById('canvas-wrap') as HTMLElement;
  const ratio = window.devicePixelRatio || 1;
  const w = wrap.clientWidth;
  const h = wrap.clientHeight;
  canvas.width = Math.floor(w * ratio);
  canvas.height = Math.floor(h * ratio);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  if (physics) {
    physics.setWorldSize(w, h);
  }
}

const physics = new PhysicsEngine(1000, 700, 100, 100);
const editor = new EditorManager();

resizeCanvas();
window.addEventListener('resize', resizeCanvas);
physics.setWorldSize(canvas.clientWidth, canvas.clientHeight);

editor.init(canvas, physics);

const btnToggle = document.getElementById('btn-toggle') as HTMLButtonElement;
const btnReset = document.getElementById('btn-reset') as HTMLButtonElement;
const btnExport = document.getElementById('btn-export') as HTMLButtonElement;
const btnImport = document.getElementById('btn-import') as HTMLButtonElement;
const btnClear = document.getElementById('btn-clear') as HTMLButtonElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const toast = document.getElementById('toast') as HTMLElement;
const fpsCounter = document.getElementById('fps-counter') as HTMLElement;

const terrainBtns = document.querySelectorAll<HTMLButtonElement>('.terrain-btn');
terrainBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    terrainBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const t = btn.getAttribute('data-type') as TerrainType;
    editor.setSelectedType(t);
  });
});

let running = false;

btnToggle.addEventListener('click', () => {
  running = !running;
  btnToggle.textContent = running ? '⏸ 暂停' : '▶ 运行';
  btnToggle.classList.toggle('warn', running);
  btnToggle.classList.toggle('primary', !running);
});

btnReset.addEventListener('click', () => {
  physics.reset();
  running = false;
  btnToggle.textContent = '▶ 运行';
  btnToggle.classList.remove('warn');
  btnToggle.classList.add('primary');
});

btnExport.addEventListener('click', () => {
  const json = editor.serialize();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `terrain-layout-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('保存成功');
});

btnImport.addEventListener('click', () => {
  fileInput.value = '';
  fileInput.click();
});

fileInput.addEventListener('change', () => {
  const f = fileInput.files?.[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      editor.deserialize(String(reader.result ?? ''));
      showToast('导入成功');
    } catch {
      showToast('导入失败：格式错误', true);
    }
  };
  reader.readAsText(f);
});

btnClear.addEventListener('click', () => {
  if (editor.blocks.length === 0 || confirm('确认清空所有地形块？')) {
    editor.clearAll();
  }
});

let toastTimer: number | null = null;
function showToast(msg: string, isError = false): void {
  toast.textContent = msg;
  toast.style.color = isError ? '#ff8888' : '#00ff88';
  toast.style.borderColor = isError ? '#ff4444' : '#00ff88';
  toast.style.background = isError ? 'rgba(255,68,68,0.15)' : 'rgba(0,255,136,0.15)';
  toast.classList.add('show');
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2000);
}

const infoEl = document.getElementById('selected-info') as HTMLElement;
const paramEditor = document.getElementById('param-editor') as HTMLElement;
const pW = document.getElementById('p-width') as HTMLInputElement;
const pH = document.getElementById('p-height') as HTMLInputElement;
const pPlatform = document.getElementById('p-platform') as HTMLElement;
const pConveyor = document.getElementById('p-conveyor') as HTMLElement;
const pBrick = document.getElementById('p-brick') as HTMLElement;
const pAxis = document.getElementById('p-axis') as HTMLSelectElement;
const pRange = document.getElementById('p-range') as HTMLInputElement;
const pSpeed = document.getElementById('p-speed') as HTMLInputElement;
const pDir = document.getElementById('p-dir') as HTMLSelectElement;
const pCspeed = document.getElementById('p-cspeed') as HTMLInputElement;
const pHealth = document.getElementById('p-health') as HTMLInputElement;

let suppressParamEvents = false;

editor.setSelectionCallback((b) => {
  if (!b) {
    infoEl.textContent = '未选中地形块，点击画布上的地形块可编辑参数';
    paramEditor.style.display = 'none';
    return;
  }
  infoEl.textContent = `已选中: ${typeLabel(b.type)} (${b.width}×${b.height})`;
  paramEditor.style.display = 'flex';
  suppressParamEvents = true;
  pW.value = String(b.width);
  pH.value = String(b.height);
  pPlatform.style.display = b.type === 'movingPlatform' ? 'flex' : 'none';
  pConveyor.style.display = b.type === 'conveyor' ? 'flex' : 'none';
  pBrick.style.display = b.type === 'brickWall' ? 'flex' : 'none';
  pAxis.value = b.moveAxis;
  pRange.value = String(b.moveRange);
  pSpeed.value = String(b.moveSpeed);
  pDir.value = String(b.conveyorDirection);
  pCspeed.value = String(b.conveyorSpeed);
  pHealth.value = String(b.health);
  suppressParamEvents = false;
});

function typeLabel(t: TerrainType): string {
  if (t === 'movingPlatform') return '移动平台';
  if (t === 'conveyor') return '传送带';
  return '砖墙';
}

function bindParam(el: HTMLElement, handler: (block: TerrainBlock, val: string) => void): void {
  el.addEventListener('input', () => {
    if (suppressParamEvents) return;
    const b = editor.getSelectedBlock();
    if (!b) return;
    const v = (el as HTMLInputElement | HTMLSelectElement).value;
    handler(b, v);
    editor.applyParamChange((bl) => { handler(bl, v); });
    infoEl.textContent = `已选中: ${typeLabel(b.type)} (${b.width}×${b.height})`;
  });
}

bindParam(pW, (b, v) => { b.width = Math.max(40, Number(v) || 40); });
bindParam(pH, (b, v) => { b.height = Math.max(20, Number(v) || 20); });
bindParam(pAxis, (b, v) => { b.moveAxis = v as 'x' | 'y'; });
bindParam(pRange, (b, v) => { b.moveRange = Math.max(40, Number(v) || 40); });
bindParam(pSpeed, (b, v) => { b.moveSpeed = Math.max(20, Number(v) || 20); });
bindParam(pDir, (b, v) => { b.conveyorDirection = Number(v) === -1 ? -1 : 1; });
bindParam(pCspeed, (b, v) => { b.conveyorSpeed = Math.max(20, Number(v) || 20); });
bindParam(pHealth, (b, v) => { b.health = Math.max(1, Math.min(10, Number(v) || 1)); });

const valueCells = document.querySelectorAll<HTMLElement>('.status-row .value');
const prevValues: Record<string, string> = {};
const flashTimers: Record<string, number> = {};

function updateStatusPanel(state: ReturnType<PhysicsEngine['getPlayerState']>): void {
  const vals: Record<string, string> = {
    x: state.x.toFixed(2),
    y: state.y.toFixed(2),
    vx: state.vx.toFixed(2),
    vy: state.vy.toFixed(2),
    ax: state.ax.toFixed(2),
    ay: state.ay.toFixed(2),
    onGround: state.onGround ? 'true' : 'false',
  };
  valueCells.forEach((cell) => {
    const key = cell.getAttribute('data-key') ?? '';
    const nv = vals[key] ?? '--';
    if (prevValues[key] !== nv) {
      prevValues[key] = nv;
      cell.textContent = nv;
      cell.classList.add('flash');
      if (flashTimers[key]) window.clearTimeout(flashTimers[key]);
      flashTimers[key] = window.setTimeout(() => cell.classList.remove('flash'), 100);
    }
  });
}

let lastTime = performance.now();
let fpsSmooth = 60;
let fpsLowFrames = 0;
let fpsTimerAcc = 0;

function drawPlayer(ctx: CanvasRenderingContext2D, state: ReturnType<PhysicsEngine['getPlayerState']>): void {
  for (const p of state.trail) {
    ctx.save();
    ctx.globalAlpha = p.alpha * 0.8;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, state.radius * (0.3 + p.alpha), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.shadowColor = 'rgba(255,255,255,0.4)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(state.x, state.y, state.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#000000';
  ctx.stroke();
  ctx.restore();
}

function frame(now: number): void {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  fpsSmooth = fpsSmooth * 0.9 + (1 / Math.max(dt, 0.001)) * 0.1;
  fpsTimerAcc += dt;
  if (fpsSmooth < 55) {
    fpsLowFrames += 1;
  } else {
    fpsLowFrames = Math.max(0, fpsLowFrames - 2);
  }
  if (fpsTimerAcc > 0.25) {
    fpsTimerAcc = 0;
    if (fpsSmooth < 55 || fpsLowFrames > 10) {
      fpsCounter.textContent = `FPS: ${fpsSmooth.toFixed(0)}`;
      fpsCounter.classList.add('show');
    } else {
      fpsCounter.classList.remove('show');
    }
  }

  if (running) {
    editor.updateTerrain(dt, true);
    physics.update(dt);
  } else {
    editor.updateTerrain(dt, false);
  }

  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, w, h);

  editor.render(ctx);
  drawPlayer(ctx, physics.getPlayerState());

  updateStatusPanel(physics.getPlayerState());

  requestAnimationFrame(frame);
}

function createDemoScene(): void {
  const demoGround = new TerrainBlock({
    type: 'conveyor',
    x: 0, y: 520, width: 480, height: 24,
    conveyorDirection: 1, conveyorSpeed: 180,
  });
  const demoPlatform = new TerrainBlock({
    type: 'movingPlatform',
    x: 520, y: 420, width: 160, height: 20,
    moveAxis: 'y', moveRange: 200, moveSpeed: 140, movePhase: 0,
  });
  demoPlatform.refreshBase();
  const demoWall = new TerrainBlock({
    type: 'brickWall',
    x: 760, y: 440, width: 80, height: 100, health: 4,
  });
  const demoCeil = new TerrainBlock({
    type: 'conveyor',
    x: 560, y: 260, width: 240, height: 20,
    conveyorDirection: -1, conveyorSpeed: 200,
  });
  editor.blocks.push(demoGround, demoPlatform, demoWall, demoCeil);
  editor.syncPhysics();
}

createDemoScene();
requestAnimationFrame((t) => { lastTime = t; frame(t); });
