import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

setTimeout(() => {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.classList.add('hidden');
  }
}, 500);

const canvas = document.getElementById('bg-gradient') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

let width: number;
let height: number;
let particles: Array<{
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
}> = [];

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}

function initParticles() {
  particles = [];
  const particleCount = Math.floor((width * height) / 15000);
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.15 + 0.05,
      life: Math.random() * 300 + 100,
      maxLife: Math.random() * 300 + 100,
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 1;

    if (p.x < 0) p.x = width;
    if (p.x > width) p.x = 0;
    if (p.y < 0) p.y = height;
    if (p.y > height) p.y = 0;

    if (p.life <= 0) {
      p.x = Math.random() * width;
      p.y = Math.random() * height;
      p.life = p.maxLife;
    }
  }
}

function drawNoise(time: number) {
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 8;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    data[i + 3] = 255;
  }

  ctx.globalAlpha = 0.03;
  ctx.putImageData(imageData, 0, 0);
  ctx.globalAlpha = 1;
}

function drawMechanicalTexture(time: number) {
  ctx.globalAlpha = 0.02;
  ctx.strokeStyle = '#39FF14';
  ctx.lineWidth = 1;

  for (let i = 0; i < 5; i++) {
    const y = (time * 0.02 + i * 200) % (height + 200) - 100;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < width; x += 20) {
      const offset = Math.sin((x + time * 0.05 + i * 100) * 0.01) * 10;
      ctx.lineTo(x, y + offset);
    }
    ctx.stroke();
  }

  for (let i = 0; i < 3; i++) {
    const x = (time * 0.015 + i * 300) % (width + 300) - 150;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    for (let y = 0; y < height; y += 20) {
      const offset = Math.cos((y + time * 0.03 + i * 80) * 0.008) * 8;
      ctx.lineTo(x + offset, y);
    }
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}

function drawGradient() {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#2E3B32');
  gradient.addColorStop(1, '#1E2B22');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawParticles() {
  for (const p of particles) {
    const lifeRatio = p.life / p.maxLife;
    const currentOpacity = p.opacity * Math.min(lifeRatio, 1 - lifeRatio) * 4;
    
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(57, 255, 20, ${currentOpacity})`;
    ctx.fill();
  }
}

function drawGrid(time: number) {
  ctx.globalAlpha = 0.03;
  ctx.strokeStyle = '#39FF14';
  ctx.lineWidth = 1;

  const gridSize = 80;
  const offset = (time * 0.1) % gridSize;

  for (let x = -gridSize + offset; x < width + gridSize; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = -gridSize + offset * 0.5; y < height + gridSize; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}

function animate(time: number) {
  drawGradient();
  drawGrid(time);
  drawMechanicalTexture(time);
  updateParticles();
  drawParticles();
  drawNoise(time);
  requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
  resize();
  initParticles();
});

resize();
initParticles();
requestAnimationFrame(animate);
