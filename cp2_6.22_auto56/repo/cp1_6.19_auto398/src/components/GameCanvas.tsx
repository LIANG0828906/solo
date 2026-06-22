import { useEffect, useRef } from 'react';
import {
  TILE_SIZE,
  GRID_SIZE,
  CANVAS_SIZE,
  PLAYER_SIZE,
  MONSTER_SIZE,
  TORCH_RADIUS,
  LANTERN_RADIUS,
  type Monster
} from '../types';
import { useGameStore } from '../store/gameStore';
import { getLightTexture, calculateLighting } from '../game/lighting';

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lightCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const stateIconAnimRef = useRef<{ progress: number; lastState: string }>({ progress: 1, lastState: 'bright' });
  const exitParticlesRef = useRef<{ angle: number; dist: number; speed: number }[]>([]);
  
  const tick = useGameStore(s => s.tick);
  const defeatTransition = useGameStore(s => s.defeatTransition);
  
  useEffect(() => {
    const particles: { angle: number; dist: number; speed: number }[] = [];
    for (let i = 0; i < 12; i++) {
      particles.push({
        angle: (i / 12) * Math.PI * 2,
        dist: 20 + Math.random() * 10,
        speed: 0.5 + Math.random() * 1
      });
    }
    exitParticlesRef.current = particles;
  }, []);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const lightCanvas = document.createElement('canvas');
    lightCanvas.width = CANVAS_SIZE;
    lightCanvas.height = CANVAS_SIZE;
    lightCanvasRef.current = lightCanvas;
    
    const lightTex = getLightTexture();
    
    const loop = (time: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = time;
      const dt = Math.min(0.05, (time - lastTimeRef.current) / 1000);
      lastTimeRef.current = time;
      
      tick(dt);
      
      const store = useGameStore.getState();
      const { state } = store;
      const { map, player, monsters, torches, exitPosition, battleAnimation, phase, time: gameTime } = state;
      
      const aliveMonsters = monsters.filter(m => m.alive).length;
      const allDead = aliveMonsters === 0;
      
      if (player.state !== stateIconAnimRef.current.lastState) {
        stateIconAnimRef.current.progress = 0;
        stateIconAnimRef.current.lastState = player.state;
      }
      if (stateIconAnimRef.current.progress < 1) {
        stateIconAnimRef.current.progress = Math.min(1, stateIconAnimRef.current.progress + dt / 0.3);
      }
      
      const lighting = calculateLighting(torches, player.position, player.hasLantern);
      
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      
      ctx.fillStyle = '#0A0A0A';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          const tile = map[y][x];
          const px = x * TILE_SIZE;
          const py = y * TILE_SIZE;
          
          if (tile.type === 'wall') {
            ctx.fillStyle = '#2A2A2A';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#1A1A1A';
            ctx.lineWidth = 1;
            ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
            ctx.fillStyle = '#333333';
            ctx.fillRect(px + 4, py + 4, 8, 8);
            ctx.fillRect(px + TILE_SIZE - 12, py + TILE_SIZE - 12, 8, 8);
          } else {
            let baseColor = '#3D3D3D';
            if (tile.type === 'room') baseColor = '#3A3A3A';
            if (tile.type === 'corridor') baseColor = '#353535';
            if (tile.type === 'exit') baseColor = '#3D3D3D';
            
            ctx.fillStyle = baseColor;
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.lineWidth = 1;
            ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
          }
        }
      }
      
      if (allDead) {
        const ex = exitPosition.x * TILE_SIZE + TILE_SIZE / 2;
        const ey = exitPosition.y * TILE_SIZE + TILE_SIZE / 2;
        
        for (const p of exitParticlesRef.current) {
          p.angle += dt * p.speed;
          const offsetX = Math.cos(p.angle) * p.dist;
          const offsetY = Math.sin(p.angle) * p.dist;
          const alpha = 0.6 + 0.4 * Math.sin(p.angle * 2);
          
          ctx.beginPath();
          ctx.arc(ex + offsetX, ey + offsetY, 4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 193, 7, ${alpha})`;
          ctx.fill();
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#FFC107';
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        
        const gradient = ctx.createRadialGradient(ex, ey, 5, ex, ey, 25);
        gradient.addColorStop(0, 'rgba(255, 235, 59, 0.9)');
        gradient.addColorStop(0.5, 'rgba(255, 193, 7, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 152, 0, 0)');
        ctx.beginPath();
        ctx.arc(ex, ey, 25, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.save();
        ctx.translate(ex, ey);
        ctx.rotate(gameTime * 2);
        ctx.strokeStyle = '#FFD54F';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.arc(0, 0, 18 + i * 3, (i * Math.PI / 2), (i * Math.PI / 2) + Math.PI / 3);
          ctx.stroke();
        }
        ctx.restore();
      }
      
      for (const torch of torches) {
        const flicker = 0.9 + 0.1 * Math.sin(gameTime * 15 + torch.position.x);
        const tx = torch.position.x;
        const ty = torch.position.y;
        
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(tx - 3, ty - 2, 6, 14);
        
        const glowGrad = ctx.createRadialGradient(tx, ty - 5, 0, tx, ty - 5, 12);
        glowGrad.addColorStop(0, `rgba(255, 213, 79, ${flicker})`);
        glowGrad.addColorStop(0.4, `rgba(255, 152, 0, ${0.7 * flicker})`);
        glowGrad.addColorStop(1, 'rgba(255, 87, 34, 0)');
        ctx.beginPath();
        ctx.arc(tx, ty - 5, 12, 0, Math.PI * 2);
        ctx.fillStyle = glowGrad;
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(tx, ty - 4, 3, 7, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 235, 59, ${flicker})`;
        ctx.fill();
      }
      
      const lightCtx = lightCanvas.getContext('2d')!;
      lightCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      lightCtx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      lightCtx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      
      lightCtx.globalCompositeOperation = 'destination-out';
      
      for (const torch of torches) {
        const flicker = 0.92 + 0.08 * Math.sin(gameTime * 12 + torch.position.x);
        const r = TORCH_RADIUS * flicker;
        lightCtx.drawImage(
          lightTex,
          torch.position.x - r,
          torch.position.y - r,
          r * 2,
          r * 2
        );
      }
      
      if (player.hasLantern) {
        const playerPx = player.position.x * TILE_SIZE + TILE_SIZE / 2;
        const playerPy = player.position.y * TILE_SIZE + TILE_SIZE / 2;
        let actualPx = playerPx;
        let actualPy = playerPy;
        if (player.targetPosition) {
          const t = easeOutCubic(player.movingProgress);
          const targetPx = player.targetPosition.x * TILE_SIZE + TILE_SIZE / 2;
          const targetPy = player.targetPosition.y * TILE_SIZE + TILE_SIZE / 2;
          actualPx = playerPx + (targetPx - playerPx) * t;
          actualPy = playerPy + (targetPy - playerPy) * t;
        }
        
        lightCtx.drawImage(
          lightTex,
          actualPx - LANTERN_RADIUS,
          actualPy - LANTERN_RADIUS,
          LANTERN_RADIUS * 2,
          LANTERN_RADIUS * 2
        );
      }
      
      lightCtx.globalCompositeOperation = 'source-over';
      
      const tempLightCanvas = document.createElement('canvas');
      tempLightCanvas.width = CANVAS_SIZE;
      tempLightCanvas.height = CANVAS_SIZE;
      const tempCtx = tempLightCanvas.getContext('2d')!;
      
      tempCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      tempCtx.globalCompositeOperation = 'lighter';
      
      for (const torch of torches) {
        const flicker = 0.92 + 0.08 * Math.sin(gameTime * 12 + torch.position.x);
        const r = TORCH_RADIUS * flicker;
        tempCtx.save();
        tempCtx.globalAlpha = 0.35;
        const torchGrad = tempCtx.createRadialGradient(
          torch.position.x, torch.position.y, 0,
          torch.position.x, torch.position.y, r
        );
        torchGrad.addColorStop(0, torch.color);
        torchGrad.addColorStop(1, 'rgba(255, 213, 79, 0)');
        tempCtx.fillStyle = torchGrad;
        tempCtx.fillRect(torch.position.x - r, torch.position.y - r, r * 2, r * 2);
        tempCtx.restore();
      }
      
      if (player.hasLantern) {
        const playerPx = player.position.x * TILE_SIZE + TILE_SIZE / 2;
        const playerPy = player.position.y * TILE_SIZE + TILE_SIZE / 2;
        let actualPx = playerPx;
        let actualPy = playerPy;
        if (player.targetPosition) {
          const t = easeOutCubic(player.movingProgress);
          const targetPx = player.targetPosition.x * TILE_SIZE + TILE_SIZE / 2;
          const targetPy = player.targetPosition.y * TILE_SIZE + TILE_SIZE / 2;
          actualPx = playerPx + (targetPx - playerPx) * t;
          actualPy = playerPy + (targetPy - playerPy) * t;
        }
        tempCtx.save();
        tempCtx.globalAlpha = 0.3;
        const lanternGrad = tempCtx.createRadialGradient(
          actualPx, actualPy, 0,
          actualPx, actualPy, LANTERN_RADIUS
        );
        lanternGrad.addColorStop(0, '#FFF9C4');
        lanternGrad.addColorStop(1, 'rgba(255, 249, 196, 0)');
        tempCtx.fillStyle = lanternGrad;
        tempCtx.fillRect(actualPx - LANTERN_RADIUS, actualPy - LANTERN_RADIUS, LANTERN_RADIUS * 2, LANTERN_RADIUS * 2);
        tempCtx.restore();
      }
      
      ctx.drawImage(tempLightCanvas, 0, 0);
      ctx.drawImage(lightCanvas, 0, 0);
      
      for (const monster of monsters) {
        if (!monster.alive) continue;
        
        let mx = monster.position.x * TILE_SIZE + TILE_SIZE / 2;
        let my = monster.position.y * TILE_SIZE + TILE_SIZE / 2;
        
        if (monster.targetPosition) {
          const t = easeOutCubic(monster.movingProgress);
          const targetMx = monster.targetPosition.x * TILE_SIZE + TILE_SIZE / 2;
          const targetMy = monster.targetPosition.y * TILE_SIZE + TILE_SIZE / 2;
          mx = mx + (targetMx - mx) * t;
          my = my + (targetMy - my) * t;
        }
        
        const shakeX = battleAnimation && battleAnimation.monsterId === monster.id ? battleAnimation.monsterShake : 0;
        const shakeY = battleAnimation && battleAnimation.monsterId === monster.id ? battleAnimation.monsterShake * 0.7 : 0;
        const drawX = mx + shakeX;
        const drawY = my + shakeY;
        
        const color = monster.type === 'lightChaser' ? '#E53935' : '#AB47BC';
        const glowColor = monster.type === 'lightChaser' ? 'rgba(229, 57, 53, 0.4)' : 'rgba(171, 71, 188, 0.4)';
        
        ctx.beginPath();
        ctx.arc(drawX, drawY, MONSTER_SIZE / 2 + 4, 0, Math.PI * 2);
        ctx.fillStyle = glowColor;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(drawX, drawY, MONSTER_SIZE / 2, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        const eyeOffsetX = 5;
        const eyeY = drawY - 3;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(drawX - eyeOffsetX, eyeY, 4, 0, Math.PI * 2);
        ctx.arc(drawX + eyeOffsetX, eyeY, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#1A1A1A';
        ctx.beginPath();
        ctx.arc(drawX - eyeOffsetX + 1, eyeY, 2, 0, Math.PI * 2);
        ctx.arc(drawX + eyeOffsetX + 1, eyeY, 2, 0, Math.PI * 2);
        ctx.fill();
        
        if (monster.health < monster.maxHealth) {
          const barW = MONSTER_SIZE;
          const barH = 4;
          const barX = drawX - barW / 2;
          const barY = drawY - MONSTER_SIZE / 2 - 10;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.fillRect(barX, barY, barW, barH);
          ctx.fillStyle = '#4CAF50';
          ctx.fillRect(barX, barY, barW * (monster.health / monster.maxHealth), barH);
        }
        
        if (monster.bubbleText && monster.bubbleTimer > 0) {
          const bubbleAlpha = monster.bubbleTimer < 0.5 ? monster.bubbleTimer / 0.5 : Math.min(1, monster.bubbleTimer);
          const text = monster.bubbleText;
          ctx.font = 'bold 12px sans-serif';
          const textMetrics = ctx.measureText(text);
          const bubbleW = textMetrics.width + 16;
          const bubbleH = 22;
          const bubbleX = drawX - bubbleW / 2;
          const bubbleY = drawY - MONSTER_SIZE / 2 - bubbleH - 14;
          
          ctx.save();
          ctx.globalAlpha = bubbleAlpha;
          
          ctx.fillStyle = 'rgba(30, 30, 30, 0.95)';
          ctx.strokeStyle = '#FFB300';
          ctx.lineWidth = 1.5;
          const r = 6;
          ctx.beginPath();
          ctx.moveTo(bubbleX + r, bubbleY);
          ctx.lineTo(bubbleX + bubbleW - r, bubbleY);
          ctx.quadraticCurveTo(bubbleX + bubbleW, bubbleY, bubbleX + bubbleW, bubbleY + r);
          ctx.lineTo(bubbleX + bubbleW, bubbleY + bubbleH - r);
          ctx.quadraticCurveTo(bubbleX + bubbleW, bubbleY + bubbleH, bubbleX + bubbleW - r, bubbleY + bubbleH);
          ctx.lineTo(bubbleX + r, bubbleY + bubbleH);
          ctx.quadraticCurveTo(bubbleX, bubbleY + bubbleH, bubbleX, bubbleY + bubbleH - r);
          ctx.lineTo(bubbleX, bubbleY + r);
          ctx.quadraticCurveTo(bubbleX, bubbleY, bubbleX + r, bubbleY);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(drawX - 5, bubbleY + bubbleH);
          ctx.lineTo(drawX + 5, bubbleY + bubbleH);
          ctx.lineTo(drawX, bubbleY + bubbleH + 6);
          ctx.closePath();
          ctx.fillStyle = 'rgba(30, 30, 30, 0.95)';
          ctx.fill();
          ctx.strokeStyle = '#FFB300';
          ctx.stroke();
          
          ctx.fillStyle = '#FFFFFF';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, drawX, bubbleY + bubbleH / 2);
          
          ctx.restore();
        }
      }
      
      let playerPx = player.position.x * TILE_SIZE + TILE_SIZE / 2;
      let playerPy = player.position.y * TILE_SIZE + TILE_SIZE / 2;
      
      if (player.targetPosition) {
        const t = easeOutCubic(player.movingProgress);
        const targetPx = player.targetPosition.x * TILE_SIZE + TILE_SIZE / 2;
        const targetPy = player.targetPosition.y * TILE_SIZE + TILE_SIZE / 2;
        playerPx = playerPx + (targetPx - playerPx) * t;
        playerPy = playerPy + (targetPy - playerPy) * t;
      }
      
      const playerShakeX = battleAnimation ? battleAnimation.playerShake : 0;
      const playerShakeY = battleAnimation ? battleAnimation.playerShake * 0.7 : 0;
      const pDrawX = playerPx + playerShakeX;
      const pDrawY = playerPy + playerShakeY;
      
      const lanternGlow = ctx.createRadialGradient(pDrawX, pDrawY - 10, 0, pDrawX, pDrawY - 10, 20);
      lanternGlow.addColorStop(0, 'rgba(255, 249, 196, 0.6)');
      lanternGlow.addColorStop(1, 'rgba(255, 249, 196, 0)');
      ctx.beginPath();
      ctx.arc(pDrawX, pDrawY - 10, 20, 0, Math.PI * 2);
      ctx.fillStyle = lanternGlow;
      ctx.fill();
      
      if (player.state === 'dark') {
        ctx.save();
        const flashAlpha = 0.3 + 0.4 * Math.abs(Math.sin(gameTime * 8));
        ctx.strokeStyle = `rgba(244, 67, 54, ${flashAlpha})`;
        ctx.lineWidth = 3;
        const halfW = PLAYER_SIZE / 2 + 4;
        const halfH = PLAYER_SIZE / 2 + 4;
        ctx.beginPath();
        const r = 8;
        ctx.moveTo(pDrawX - halfW + r, pDrawY - halfH);
        ctx.lineTo(pDrawX + halfW - r, pDrawY - halfH);
        ctx.quadraticCurveTo(pDrawX + halfW, pDrawY - halfH, pDrawX + halfW, pDrawY - halfH + r);
        ctx.lineTo(pDrawX + halfW, pDrawY + halfH - r);
        ctx.quadraticCurveTo(pDrawX + halfW, pDrawY + halfH, pDrawX + halfW - r, pDrawY + halfH);
        ctx.lineTo(pDrawX - halfW + r, pDrawY + halfH);
        ctx.quadraticCurveTo(pDrawX - halfW, pDrawY + halfH, pDrawX - halfW, pDrawY + halfH - r);
        ctx.lineTo(pDrawX - halfW, pDrawY - halfH + r);
        ctx.quadraticCurveTo(pDrawX - halfW, pDrawY - halfH, pDrawX - halfW + r, pDrawY - halfH);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }
      
      ctx.beginPath();
      const pR = 6;
      const pHalfW = PLAYER_SIZE / 2;
      const pHalfH = PLAYER_SIZE / 2;
      ctx.moveTo(pDrawX - pHalfW + pR, pDrawY - pHalfH);
      ctx.lineTo(pDrawX + pHalfW - pR, pDrawY - pHalfH);
      ctx.quadraticCurveTo(pDrawX + pHalfW, pDrawY - pHalfH, pDrawX + pHalfW, pDrawY - pHalfH + pR);
      ctx.lineTo(pDrawX + pHalfW, pDrawY + pHalfH - pR);
      ctx.quadraticCurveTo(pDrawX + pHalfW, pDrawY + pHalfH, pDrawX + pHalfW - pR, pDrawY + pHalfH);
      ctx.lineTo(pDrawX - pHalfW + pR, pDrawY + pHalfH);
      ctx.quadraticCurveTo(pDrawX - pHalfW, pDrawY + pHalfH, pDrawX - pHalfW, pDrawY + pHalfH - pR);
      ctx.lineTo(pDrawX - pHalfW, pDrawY - pHalfH + pR);
      ctx.quadraticCurveTo(pDrawX - pHalfW, pDrawY - pHalfH, pDrawX - pHalfW + pR, pDrawY - pHalfH);
      ctx.closePath();
      ctx.fillStyle = '#42A5F5';
      ctx.fill();
      ctx.strokeStyle = '#1976D2';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(pDrawX - 6, pDrawY - 4, 4, 0, Math.PI * 2);
      ctx.arc(pDrawX + 6, pDrawY - 4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1A1A1A';
      ctx.beginPath();
      ctx.arc(pDrawX - 5, pDrawY - 4, 2, 0, Math.PI * 2);
      ctx.arc(pDrawX + 7, pDrawY - 4, 2, 0, Math.PI * 2);
      ctx.fill();
      
      const iconAnim = stateIconAnimRef.current.progress;
      const iconScale = iconAnim < 1 ? (1 + 0.3 * Math.sin(iconAnim * Math.PI)) : 1;
      const iconRot = iconAnim < 1 ? (iconAnim - 0.5) * 0.5 : 0;
      const iconY = pDrawY - PLAYER_SIZE / 2 - 16;
      
      ctx.save();
      ctx.translate(pDrawX, iconY);
      ctx.rotate(iconRot);
      ctx.scale(iconScale, iconScale);
      
      if (player.state === 'bright') {
        ctx.fillStyle = '#FFD54F';
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FF8F00';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + gameTime * 0.5;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 11, Math.sin(a) * 11);
          ctx.lineTo(Math.cos(a) * 14, Math.sin(a) * 14);
          ctx.stroke();
        }
      } else if (player.state === 'dim') {
        ctx.fillStyle = '#BDBDBD';
        ctx.beginPath();
        ctx.arc(2, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3D3D3D';
        ctx.beginPath();
        ctx.arc(5, -1, 7, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#5C6BC0';
        ctx.beginPath();
        ctx.arc(2, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1A1A1A';
        ctx.beginPath();
        ctx.arc(5, -1, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#E0E0E0';
        ctx.beginPath();
        ctx.arc(-3, -3, 1, 0, Math.PI * 2);
        ctx.arc(-1, 2, 0.8, 0, Math.PI * 2);
        ctx.arc(2, -5, 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
      
      if (phase === 'defeat') {
        ctx.save();
        const grayAmount = defeatTransition;
        if (grayAmount > 0) {
          const imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            data[i] = data[i] + (gray - data[i]) * grayAmount;
            data[i + 1] = data[i + 1] + (gray - data[i + 1]) * grayAmount;
            data[i + 2] = data[i + 2] + (gray - data[i + 2]) * grayAmount;
          }
          ctx.putImageData(imageData, 0, 0);
        }
        ctx.restore();
      }
      
      rafRef.current = requestAnimationFrame(loop);
    };
    
    rafRef.current = requestAnimationFrame(loop);
    
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [tick]);
  
  return (
    <div style={{
      position: 'relative',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 0 40px rgba(0, 0, 0, 0.8), inset 0 0 0 1px rgba(255, 179, 0, 0.3)',
      flexShrink: 0
    }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{ display: 'block' }}
      />
    </div>
  );
}
