import p5 from 'p5';
import { FluidSolver } from './fluid/fluidSolver';
import { ParticleSystem } from './particle/particleSystem';
import { UIController } from './ui/uiController';

const sketch = (p: p5) => {
  let solver: FluidSolver;
  let particles: ParticleSystem;
  let ui: UIController;

  let prevMouseX = 0;
  let prevMouseY = 0;
  let smoothMouseX = 0;
  let smoothMouseY = 0;
  let isDragging = false;

  let fpsValues: number[] = [];
  let currentFps = 60;
  let perfLastLogTime = 0;
  const PERF_LOG_INTERVAL = 5000;

  p.setup = () => {
    const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
    canvas.parent('canvas-container');
    p.frameRate(60);
    p.pixelDensity(1);

    solver = new FluidSolver();
    particles = new ParticleSystem(solver, 2000);
    ui = new UIController();

    smoothMouseX = p.width / 2;
    smoothMouseY = p.height / 2;

    console.log('[FluidCanvas] Performance baseline starting...');
    console.log('[FluidCanvas] Grid size:', solver.N, 'x', solver.N);
    console.log('[FluidCanvas] Particle count:', particles.particles.length);
    perfLastLogTime = performance.now();
  };

  p.draw = () => {
    const frameStart = performance.now();

    drawBackground();

    handleMouseInput();

    solver.step();
    particles.update(p.width, p.height);

    renderDensityField();
    particles.render(p);

    drawMouseGlow();

    updateAndDrawFps(frameStart);

    const now = performance.now();
    if (now - perfLastLogTime > PERF_LOG_INTERVAL) {
      logPerformanceMetrics(now);
      perfLastLogTime = now;
    }
  };

  function logPerformanceMetrics(now: number): void {
    const avgFps = currentFps;
    const gridSize = solver.N;
    const pCount = particles.particles.length;
    const mode = particles.skipUpdate ? 'half-rate' : 'full-rate';
    console.log(
      `[Perf] FPS: ${avgFps.toFixed(1)} | Grid: ${gridSize}x${gridSize} | Particles: ${pCount} | Update: ${mode}`
    );
  }

  function drawBackground(): void {
    const ctx = p.drawingContext as CanvasRenderingContext2D;
    const gradient = ctx.createLinearGradient(0, 0, 0, p.height);
    gradient.addColorStop(0, '#000000');
    gradient.addColorStop(1, '#0A0A1A');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, p.width, p.height);
  }

  function handleMouseInput(): void {
    const lerpFactor = 0.15;
    smoothMouseX += (p.mouseX - smoothMouseX) * lerpFactor;
    smoothMouseY += (p.mouseY - smoothMouseY) * lerpFactor;

    if (p.mouseIsPressed && p.mouseButton === p.LEFT) {
      if (!isDragging) {
        prevMouseX = p.mouseX;
        prevMouseY = p.mouseY;
        isDragging = true;
      }

      const dx = p.mouseX - prevMouseX;
      const dy = p.mouseY - prevMouseY;
      const speed = Math.sqrt(dx * dx + dy * dy);
      const MAX_VELOCITY = 10;
      const MIN_VELOCITY = 0.5;
      const SPEED_SCALE = 0.35;

      let velX = 0;
      let velY = 0;

      if (speed > 0.1) {
        const dirX = dx / speed;
        const dirY = dy / speed;
        let magnitude = speed * SPEED_SCALE;
        magnitude = Math.max(MIN_VELOCITY, Math.min(magnitude, MAX_VELOCITY));
        velX = dirX * magnitude;
        velY = dirY * magnitude;
      }

      const gridI = Math.floor((p.mouseX / p.width) * solver.N) + 1;
      const gridJ = Math.floor((p.mouseY / p.height) * solver.N) + 1;
      const radius = 3;

      const color = ui.getSelectedColor();
      const strength = ui.getDensityStrength();

      solver.injectVelocity(gridI, gridJ, radius, velX, velY);
      solver.injectDensity(
        gridI, gridJ, radius,
        color.r / 255, color.g / 255, color.b / 255,
        strength
      );

      const injectNx = p.mouseX / p.width;
      const injectNy = p.mouseY / p.height;
      const numToReset = Math.max(1, Math.min(5, Math.ceil(speed / 3)));
      for (let i = 0; i < numToReset; i++) {
        const offsetNx = injectNx + (Math.random() - 0.5) * 0.02;
        const offsetNy = injectNy + (Math.random() - 0.5) * 0.02;
        particles.resetParticleAt(offsetNx, offsetNy);
      }

      prevMouseX = p.mouseX;
      prevMouseY = p.mouseY;
    } else {
      isDragging = false;
    }
  }

  function renderDensityField(): void {
    const ctx = p.drawingContext as CanvasRenderingContext2D;
    const cellW = p.width / solver.N;
    const cellH = p.height / solver.N;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (let j = 1; j <= solver.N; j++) {
      for (let i = 1; i <= solver.N; i++) {
        const idx = i + (solver.N + 2) * j;
        const r = solver.densR[idx];
        const g = solver.densG[idx];
        const b = solver.densB[idx];
        const totalDens = r + g + b;

        if (totalDens < 0.005) continue;

        const x = (i - 1) * cellW;
        const y = (j - 1) * cellH;
        const alpha = Math.min(0.7, totalDens * 0.8);

        const cr = Math.min(255, r * 300);
        const cg = Math.min(255, g * 300);
        const cb = Math.min(255, b * 300);

        ctx.fillStyle = `rgba(${Math.floor(cr)},${Math.floor(cg)},${Math.floor(cb)},${alpha})`;
        ctx.fillRect(x, y, cellW + 1, cellH + 1);

        if (totalDens > 0.1) {
          const glowR = cellW * 2;
          const cx = x + cellW / 2;
          const cy = y + cellH / 2;
          const radGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
          radGrad.addColorStop(0, `rgba(${Math.floor(cr)},${Math.floor(cg)},${Math.floor(cb)},${alpha * 0.3})`);
          radGrad.addColorStop(1, `rgba(${Math.floor(cr)},${Math.floor(cg)},${Math.floor(cb)},0)`);
          ctx.fillStyle = radGrad;
          ctx.fillRect(cx - glowR, cy - glowR, glowR * 2, glowR * 2);
        }
      }
    }

    ctx.restore();
  }

  function drawMouseGlow(): void {
    const ctx = p.drawingContext as CanvasRenderingContext2D;
    const radius = 20;

    const radGrad = ctx.createRadialGradient(smoothMouseX, smoothMouseY, 0, smoothMouseX, smoothMouseY, radius);
    radGrad.addColorStop(0, 'rgba(255,255,255,0.3)');
    radGrad.addColorStop(0.5, 'rgba(255,255,255,0.1)');
    radGrad.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(smoothMouseX, smoothMouseY, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function updateAndDrawFps(frameStart: number): void {
    const fps = p.frameRate();
    fpsValues.push(fps);
    if (fpsValues.length > 30) fpsValues.shift();
    currentFps = fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length;

    const frameMs = performance.now() - frameStart;

    p.push();
    p.noStroke();
    p.fill(255, 255, 255, 128);
    p.textSize(12);
    p.textAlign(p.RIGHT, p.BOTTOM);

    const lines = [
      `FPS: ${Math.round(currentFps)}`,
      `Frame: ${frameMs.toFixed(1)}ms`,
      `Particles: ${particles.particles.length}`,
      `Grid: ${solver.N}x${solver.N}`,
    ];

    for (let i = 0; i < lines.length; i++) {
      p.text(lines[i], p.width - 10, p.height - 10 - i * 14);
    }
    p.pop();
  }

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
};

new p5(sketch);
