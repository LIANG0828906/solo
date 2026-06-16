interface EntanglementMeterResult {
  update: (targetValue: number) => void;
  resize: () => void;
  getValue: () => number;
}

const METER_WIDTH = 200;
const METER_HEIGHT = 120;
const ANIMATION_DURATION = 0.5;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  
  return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

export function createEntanglementMeter(canvasId: string): EntanglementMeterResult {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  if (!canvas) {
    throw new Error(`Canvas with id "${canvasId}" not found`);
  }
  
  const ctx = canvas.getContext('2d')!;
  
  let currentValue = 75;
  let targetValue = 75;
  let startValue = 75;
  let animationProgress = 1;
  let isAnimating = false;
  let glowIntensity = 0;
  let glowDirection = 1;
  
  function drawBackground(): void {
    const centerX = METER_WIDTH / 2;
    const centerY = METER_HEIGHT - 15;
    const radius = METER_WIDTH / 2 - 15;
    
    const arcGradient = ctx.createRadialGradient(centerX, centerY, radius * 0.5, centerX, centerY, radius * 1.2);
    arcGradient.addColorStop(0, 'rgba(155, 89, 182, 0.1)');
    arcGradient.addColorStop(1, 'rgba(26, 188, 156, 0.05)');
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 1.2, Math.PI, 0);
    ctx.fillStyle = arcGradient;
    ctx.fill();
  }
  
  function drawScale(): void {
    const centerX = METER_WIDTH / 2;
    const centerY = METER_HEIGHT - 15;
    const outerRadius = METER_WIDTH / 2 - 15;
    const innerRadius = outerRadius - 12;
    
    for (let i = 0; i <= 100; i += 2) {
      const angle = Math.PI + (i / 100) * Math.PI;
      const isMajor = i % 10 === 0;
      const tickInnerRadius = isMajor ? innerRadius : innerRadius + 5;
      
      const x1 = centerX + Math.cos(angle) * tickInnerRadius;
      const y1 = centerY + Math.sin(angle) * tickInnerRadius;
      const x2 = centerX + Math.cos(angle) * outerRadius;
      const y2 = centerY + Math.sin(angle) * outerRadius;
      
      const colorT = i / 100;
      const color = lerpColor('#FF6B6B', '#FFD700', colorT);
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = isMajor ? color : 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = isMajor ? 2 : 1;
      ctx.stroke();
    }
    
    ctx.font = '10px Arial, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const labelPositions = [0, 25, 50, 75, 100];
    labelPositions.forEach((value) => {
      const angle = Math.PI + (value / 100) * Math.PI;
      const labelRadius = innerRadius - 10;
      const x = centerX + Math.cos(angle) * labelRadius;
      const y = centerY + Math.sin(angle) * labelRadius;
      ctx.fillText(value.toString(), x, y);
    });
  }
  
  function drawColoredArc(value: number): void {
    const centerX = METER_WIDTH / 2;
    const centerY = METER_HEIGHT - 15;
    const radius = METER_WIDTH / 2 - 15;
    const arcWidth = 6;
    
    const endAngle = Math.PI + (value / 100) * Math.PI;
    
    const gradient = ctx.createLinearGradient(centerX - radius, centerY, centerX + radius, centerY);
    gradient.addColorStop(0, '#FF6B6B');
    gradient.addColorStop(0.5, '#FFA500');
    gradient.addColorStop(1, '#FFD700');
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - arcWidth / 2, Math.PI, endAngle);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = arcWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  
  function drawPointer(value: number): void {
    const centerX = METER_WIDTH / 2;
    const centerY = METER_HEIGHT - 15;
    const radius = METER_WIDTH / 2 - 15;
    const pointerLength = radius - 20;
    
    const angle = Math.PI + (value / 100) * Math.PI;
    
    const endX = centerX + Math.cos(angle) * pointerLength;
    const endY = centerY + Math.sin(angle) * pointerLength;
    
    const colorT = value / 100;
    const pointerColor = lerpColor('#FF6B6B', '#FFD700', colorT);
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = pointerColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
    ctx.fillStyle = pointerColor;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
  
  function drawValue(value: number): void {
    const centerX = METER_WIDTH / 2;
    const centerY = METER_HEIGHT - 15;
    
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    const colorT = value / 100;
    const valueColor = lerpColor('#FF6B6B', '#FFD700', colorT);
    
    ctx.fillStyle = valueColor;
    ctx.fillText(`${Math.round(value)}%`, centerX, centerY + 8);
    
    ctx.font = '10px Arial, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('纠缠度', centerX, centerY + 30);
  }
  
  function drawGlow(value: number): void {
    if (value < 80) return;
    
    const centerX = METER_WIDTH / 2;
    const centerY = METER_HEIGHT - 15;
    const radius = METER_WIDTH / 2 - 15;
    
    const glowAlpha = 0.2 + glowIntensity * 0.3;
    
    const endAngle = Math.PI + (value / 100) * Math.PI;
    
    const glowGradient = ctx.createRadialGradient(
      centerX + Math.cos(endAngle) * (radius - 10),
      centerY + Math.sin(endAngle) * (radius - 10),
      0,
      centerX + Math.cos(endAngle) * (radius - 10),
      centerY + Math.sin(endAngle) * (radius - 10),
      30
    );
    glowGradient.addColorStop(0, `rgba(255, 215, 0, ${glowAlpha})`);
    glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    
    ctx.beginPath();
    ctx.arc(
      centerX + Math.cos(endAngle) * (radius - 10),
      centerY + Math.sin(endAngle) * (radius - 10),
      30,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = glowGradient;
    ctx.fill();
  }
  
  function draw(): void {
    ctx.clearRect(0, 0, METER_WIDTH, METER_HEIGHT);
    
    drawBackground();
    drawScale();
    drawColoredArc(currentValue);
    drawGlow(currentValue);
    drawPointer(currentValue);
    drawValue(currentValue);
  }
  
  function update(newTargetValue: number): void {
    targetValue = Math.max(0, Math.min(100, newTargetValue));
    startValue = currentValue;
    animationProgress = 0;
    isAnimating = true;
  }
  
  function animate(deltaTime: number): void {
    if (isAnimating) {
      animationProgress += deltaTime / ANIMATION_DURATION;
      
      if (animationProgress >= 1) {
        animationProgress = 1;
        isAnimating = false;
        currentValue = targetValue;
      } else {
        const easedProgress = easeOutCubic(animationProgress);
        currentValue = startValue + (targetValue - startValue) * easedProgress;
      }
    }
    
    glowIntensity += deltaTime * glowDirection * 2;
    if (glowIntensity >= 1) {
      glowIntensity = 1;
      glowDirection = -1;
    } else if (glowIntensity <= 0) {
      glowIntensity = 0;
      glowDirection = 1;
    }
    
    draw();
  }
  
  function getValue(): number {
    return targetValue;
  }
  
  function resize(): void {
    canvas.width = METER_WIDTH;
    canvas.height = METER_HEIGHT;
  }
  
  let lastTime = performance.now();
  
  function animationLoop(): void {
    const now = performance.now();
    const deltaTime = (now - lastTime) / 1000;
    lastTime = now;
    
    animate(deltaTime);
    requestAnimationFrame(animationLoop);
  }
  
  resize();
  draw();
  animationLoop();
  
  return {
    update,
    resize,
    getValue
  };
}
