import { 
  CompassState, 
  RippleEffect,
  createCompassState, 
  updateCompassPhysics, 
  drawCompass, 
  drawRipple,
  getAngleFromPoint,
  isPointInCompass,
  getCurrentMountain,
  getCurrentTrigram
} from './compass';

import { 
  getCurrentConstellation, 
  Constellation,
  sevenPlanets,
  StarData
} from './stars';

const canvas = document.getElementById('compassCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

const celestialCanvas = document.getElementById('celestialIcon') as HTMLCanvasElement;
const celestialCtx = celestialCanvas.getContext('2d')!;

const divinationText = document.getElementById('divinationText') as HTMLDivElement;
const canvasWrapper = document.querySelector('.canvas-wrapper') as HTMLDivElement;

const compassState = createCompassState();
const ripples: RippleEffect[] = [];

let lastTime = performance.now();
let lastAngle = 0;
let isDragging = false;
let dragStartAngle = 0;
let currentRotationAtDragStart = 0;
let currentConstellation: Constellation | null = null;
let lastDivinationUpdate = 0;
let animationFrameId: number;

interface StarAnimation {
  baseSize: number;
  phase: number;
}

const starAnimations = new Map<string, StarAnimation>();

function initStarAnimations(): void {
  for (const range of getCurrentConstellation.toString().length ? [] : []) {
    // Will be populated dynamically
  }
}

function handleMouseDown(e: MouseEvent): void {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  if (isPointInCompass(x, y)) {
    isDragging = true;
    compassState.isDragging = true;
    dragStartAngle = getAngleFromPoint(x, y);
    currentRotationAtDragStart = compassState.rotation;
    canvas.style.cursor = 'grabbing';
  }
}

function handleMouseMove(e: MouseEvent): void {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  if (isDragging) {
    const currentAngle = getAngleFromPoint(x, y);
    let deltaAngle = currentAngle - dragStartAngle;
    
    if (deltaAngle > 180) deltaAngle -= 360;
    if (deltaAngle < -180) deltaAngle += 360;
    
    compassState.rotation = currentRotationAtDragStart + deltaAngle;
    compassState.highlightedAngle = compassState.rotation;
  }
  
  if (isPointInCompass(x, y)) {
    const angle = getAngleFromPoint(x, y);
    const adjustedAngle = (angle - compassState.rotation + 360) % 360;
    compassState.highlightedAngle = adjustedAngle;
  } else {
    compassState.highlightedAngle = null;
  }
}

function handleMouseUp(e: MouseEvent): void {
  if (isDragging) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const currentAngle = getAngleFromPoint(x, y);
    let deltaAngle = currentAngle - lastAngle;
    if (deltaAngle > 180) deltaAngle -= 360;
    if (deltaAngle < -180) deltaAngle += 360;
    
    compassState.angularVelocity = deltaAngle * 0.1;
    
    isDragging = false;
    compassState.isDragging = false;
    canvas.style.cursor = 'grab';
  }
}

function handleClick(e: MouseEvent): void {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  if (isPointInCompass(x, y)) {
    ripples.push({
      x,
      y,
      startTime: performance.now(),
      duration: 1200
    });
    
    const angle = getAngleFromPoint(x, y);
    const adjustedAngle = (angle - compassState.rotation + 360) % 360;
    
    const mountain = getCurrentMountain({ ...compassState, rotation: adjustedAngle });
    const trigram = getCurrentTrigram({ ...compassState, rotation: adjustedAngle });
    
    let explanation = '';
    if (mountain) {
      explanation = `${mountain.name}山属${mountain.element}，`;
      const elementMeanings: Record<string, string> = {
        '水': '主智，通达流变，宜求财谋事',
        '木': '主仁，生长发展，宜动土兴工',
        '火': '主礼，光明显赫，宜升迁考试',
        '金': '主义，刚健决断，宜诉讼征战',
        '土': '主信，厚重稳固，宜嫁娶安居'
      };
      explanation += elementMeanings[mountain.element] || '';
    } else if (trigram) {
      const trigramMeanings: Record<string, string> = {
        '乾': '乾为天，健行不息，君子以自强不息',
        '坤': '坤为地，厚德载物，君子以厚德载物',
        '坎': '坎为水，险难重重，君子以常德行习教事',
        '离': '离为火，光明丽日，君子以继明照于四方',
        '震': '震为雷，震动奋发，君子以恐惧修省',
        '巽': '巽为风，谦逊柔顺，君子以申命行事',
        '艮': '艮为山，静止笃实，君子以思不出其位',
        '兑': '兑为泽，喜悦和乐，君子以朋友讲习'
      };
      explanation = trigramMeanings[trigram.name] || '';
    }
    
    if (explanation) {
      updateDivinationText(explanation, true);
    }
  }
}

function handleMouseLeave(): void {
  if (isDragging) {
    isDragging = false;
    compassState.isDragging = false;
    canvas.style.cursor = 'grab';
  }
  compassState.highlightedAngle = null;
}

function updateDivinationText(text: string, animated: boolean = false): void {
  if (divinationText.textContent === text) return;
  
  if (animated) {
    divinationText.classList.remove('visible', 'slide-in-right');
    divinationText.classList.add('slide-out-left');
    
    setTimeout(() => {
      divinationText.textContent = text;
      divinationText.classList.remove('slide-out-left');
      divinationText.classList.add('slide-in-right');
    }, 600);
  } else {
    divinationText.classList.remove('visible');
    divinationText.textContent = text;
    requestAnimationFrame(() => {
      divinationText.classList.add('visible');
    });
  }
}

function drawConstellationLines(
  ctx: CanvasRenderingContext2D,
  constellation: Constellation,
  time: number
): void {
  const stars = constellation.stars;
  
  if (stars.length < 2) return;
  
  ctx.beginPath();
  ctx.moveTo(stars[0].x, stars[0].y);
  
  for (let i = 1; i < stars.length; i++) {
    ctx.lineTo(stars[i].x, stars[i].y);
  }
  
  ctx.strokeStyle = 'rgba(136, 204, 255, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  
  for (let i = 0; i < stars.length; i++) {
    const star = stars[i];
    const key = `${constellation.name}_${star.name}`;
    
    if (!starAnimations.has(key)) {
      starAnimations.set(key, {
        baseSize: 6,
        phase: Math.random() * Math.PI * 2
      });
    }
    
    const anim = starAnimations.get(key)!;
    const sizeAnim = Math.sin(time * 0.002 * Math.PI + anim.phase) * 2 + 6;
    
    const glowGradient = ctx.createRadialGradient(
      star.x, star.y, 0,
      star.x, star.y, sizeAnim + 4
    );
    glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    glowGradient.addColorStop(0.5, 'rgba(200, 220, 255, 0.4)');
    glowGradient.addColorStop(1, 'rgba(136, 204, 255, 0)');
    
    ctx.beginPath();
    ctx.arc(star.x, star.y, sizeAnim + 4, 0, Math.PI * 2);
    ctx.fillStyle = glowGradient;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(star.x, star.y, sizeAnim / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    
    if (i === 0 || i === stars.length - 1) {
      const endPulseSize = Math.sin(time * 0.002 * Math.PI * 2) * 2 + 6;
      
      ctx.beginPath();
      ctx.arc(star.x, star.y, endPulseSize, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(136, 204, 255, ${0.3 + Math.sin(time * 0.002 * Math.PI * 2) * 0.3})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

function drawPlanets(ctx: CanvasRenderingContext2D, time: number): void {
  for (const planet of sevenPlanets) {
    const twinkle = Math.sin(time * 0.001 + planet.x * 0.1) * 0.3 + 0.7;
    
    const glowGradient = ctx.createRadialGradient(
      planet.x, planet.y, 0,
      planet.x, planet.y, 15
    );
    glowGradient.addColorStop(0, planet.color);
    glowGradient.addColorStop(1, 'transparent');
    
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, 15, 0, Math.PI * 2);
    ctx.fillStyle = glowGradient;
    ctx.globalAlpha = twinkle * 0.5;
    ctx.fill();
    ctx.globalAlpha = 1;
    
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = planet.color;
    ctx.fill();
    
    ctx.font = '10px "STKaiti", "KaiTi", serif';
    ctx.fillStyle = planet.color;
    ctx.textAlign = 'center';
    ctx.fillText(planet.name, planet.x, planet.y - 12);
  }
}

function drawCelestialIcon(ctx: CanvasRenderingContext2D, time: number): void {
  ctx.clearRect(0, 0, 30, 30);
  
  const now = new Date();
  const hour = now.getHours();
  const isDaytime = hour >= 6 && hour < 18;
  
  ctx.save();
  ctx.translate(15, 15);
  
  if (isDaytime) {
    const sunGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 15);
    sunGradient.addColorStop(0, '#FFEB3B');
    sunGradient.addColorStop(0.7, '#FFD700');
    sunGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fillStyle = sunGradient;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD700';
    ctx.fill();
    
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#FFF176';
    ctx.fill();
    ctx.shadowBlur = 0;
    
    const rayCount = 8;
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2 + time * 0.0005;
      const innerR = 10;
      const outerR = 14;
      
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
      ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  } else {
    const dayOfMonth = now.getDate();
    const lunarPhase = (dayOfMonth % 30) / 30;
    
    ctx.save();
    
    const moonGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 15);
    moonGlow.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    moonGlow.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fillStyle = moonGlow;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#C0C0C0';
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(0, 0, 10, -Math.PI / 2, Math.PI / 2, true);
    ctx.fillStyle = '#E8E8E8';
    ctx.fill();
    
    const shadowOffset = (lunarPhase - 0.5) * 20;
    ctx.beginPath();
    ctx.arc(shadowOffset, 0, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#0A0E27';
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.strokeStyle = '#C0C0C0';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(-3, -3, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#A0A0A0';
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(2, 2, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = '#909090';
    ctx.fill();
    
    ctx.restore();
  }
  
  ctx.restore();
}

function gameLoop(currentTime: number): void {
  const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
  lastTime = currentTime;
  
  updateCompassPhysics(compassState, deltaTime);
  
  const constellation = getCurrentConstellation(compassState.rotation);
  if (constellation !== currentConstellation) {
    currentConstellation = constellation;
    if (currentTime - lastDivinationUpdate > 500) {
      updateDivinationText(constellation.omen, false);
      lastDivinationUpdate = currentTime;
    }
  }
  
  lastAngle = getAngleFromPoint(
    canvas.width / 2 + Math.cos((compassState.rotation - 90) * Math.PI / 180) * 100,
    canvas.height / 2 + Math.sin((compassState.rotation - 90) * Math.PI / 180) * 100
  );
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (currentConstellation) {
    drawPlanets(ctx, currentTime);
    drawConstellationLines(ctx, currentConstellation, currentTime);
  }
  
  drawCompass(ctx, compassState, currentTime);
  
  for (let i = ripples.length - 1; i >= 0; i--) {
    drawRipple(ctx, ripples[i], currentTime);
    if (currentTime - ripples[i].startTime > ripples[i].duration) {
      ripples.splice(i, 1);
    }
  }
  
  drawCelestialIcon(celestialCtx, currentTime);
  
  animationFrameId = requestAnimationFrame(gameLoop);
}

function handleResize(): void {
  const minWidth = 800;
  const windowWidth = Math.max(window.innerWidth, minWidth);
}

function init(): void {
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseup', handleMouseUp);
  canvas.addEventListener('mouseleave', handleMouseLeave);
  canvas.addEventListener('click', handleClick);
  
  canvas.addEventListener('touchstart', (e: TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    handleMouseDown(mouseEvent);
  }, { passive: false });
  
  canvas.addEventListener('touchmove', (e: TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    handleMouseMove(mouseEvent);
  }, { passive: false });
  
  canvas.addEventListener('touchend', (e: TouchEvent) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    const mouseEvent = new MouseEvent('mouseup', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    handleMouseUp(mouseEvent);
    const clickEvent = new MouseEvent('click', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    handleClick(clickEvent);
  }, { passive: false });
  
  window.addEventListener('resize', handleResize);
  
  setTimeout(() => {
    divinationText.classList.add('visible');
  }, 500);
  
  lastTime = performance.now();
  animationFrameId = requestAnimationFrame(gameLoop);
}

init();
