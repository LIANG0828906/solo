import React, { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../game/GameStore';
import type { HexCoord } from './hexUtils';
import {
  HEX_SIZE,
  BOARD_SIZE,
  TERRAIN_CONFIG,
  hexToPixel,
  pixelToHex,
  getHexCorners,
  isInBoard,
  hexEquals
} from './hexUtils';
import { ELEMENT_COLORS, ELEMENT_ICONS } from '../entities/spiritData';

interface HexBoardProps {
  onHexClick: (coord: HexCoord) => void;
}

const CANVAS_SIZE = 600;

export const HexBoard: React.FC<HexBoardProps> = ({ onHexClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    board,
    spirits,
    selectedSpirit,
    getTerrainAt
  } = useGameStore();

  const drawHex = useCallback((
    ctx: CanvasRenderingContext2D,
    center: { x: number; y: number },
    size: number,
    fillColor: string | [string, string],
    strokeColor: string,
    lineWidth: number = 1
  ) => {
    const corners = getHexCorners(center, size - 2);
    
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < 6; i++) {
      ctx.lineTo(corners[i].x, corners[i].y);
    }
    ctx.closePath();

    if (Array.isArray(fillColor) && fillColor[0] !== fillColor[1]) {
      const gradient = ctx.createRadialGradient(
        center.x, center.y, 0,
        center.x, center.y, size
      );
      gradient.addColorStop(0, fillColor[0]);
      gradient.addColorStop(1, fillColor[1]);
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = Array.isArray(fillColor) ? fillColor[0] : fillColor;
    }
    
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }, []);

  const drawSpirit = useCallback((
    ctx: CanvasRenderingContext2D,
    center: { x: number; y: number },
    spirit: typeof spirits[0],
    isSelected: boolean
  ) => {
    const size = HEX_SIZE * 0.6;
    const color = ELEMENT_COLORS[spirit.element];
    const icon = ELEMENT_ICONS[spirit.element];

    ctx.beginPath();
    ctx.arc(center.x, center.y, size, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = spirit.owner === 'player' ? '#4ADE80' : '#F87171';
    ctx.lineWidth = isSelected ? 4 : 2;
    ctx.stroke();

    ctx.font = `${size * 0.9}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, center.x, center.y);

    const hpPercent = spirit.stats.hp / spirit.stats.maxHp;
    const barWidth = size * 2;
    const barHeight = 6;
    const barX = center.x - barWidth / 2;
    const barY = center.y + size + 8;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    ctx.fillStyle = hpPercent > 0.5 ? '#4ADE80' : hpPercent > 0.25 ? '#FBBF24' : '#EF4444';
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    ctx.font = 'bold 10px Arial';
    ctx.fillStyle = '#FFF';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeText(`${spirit.stats.hp}/${spirit.stats.maxHp}`, center.x, barY + barHeight / 2);
    ctx.fillText(`${spirit.stats.hp}/${spirit.stats.maxHp}`, center.x, barY + barHeight / 2);

    if (spirit.canAct && spirit.owner === 'player' && !spirit.hasAttacked) {
      ctx.beginPath();
      ctx.arc(center.x + size * 0.7, center.y - size * 0.7, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#4ADE80';
      ctx.fill();
      ctx.strokeStyle = '#FFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, []);

  const drawBoard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || board.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const startTime = performance.now();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const offsetX = canvas.width / 2 - (BOARD_SIZE * HEX_SIZE * 1.5) / 2;
    const offsetY = canvas.height / 2 - (BOARD_SIZE * HEX_SIZE * Math.sqrt(3)) / 2;

    for (let q = 0; q < BOARD_SIZE; q++) {
      for (let r = 0; r < BOARD_SIZE; r++) {
        const terrain = board[q][r];
        const pixel = hexToPixel({ q, r }, HEX_SIZE);
        const center = {
          x: pixel.x + offsetX,
          y: pixel.y + offsetY
        };

        const terrainConfig = TERRAIN_CONFIG[terrain.type];
        drawHex(
          ctx,
          center,
          HEX_SIZE,
          terrainConfig.colors,
          '#8B5A2B',
          1
        );

        const selectedSpiritData = spirits.find(s => s.id === selectedSpirit);
        if (selectedSpiritData && selectedSpiritData.position) {
          const dist = Math.abs(q - selectedSpiritData.position.q) + 
                       Math.abs(q + r - selectedSpiritData.position.q - selectedSpiritData.position.r) + 
                       Math.abs(r - selectedSpiritData.position.r);
          const actualDist = dist / 2;
          
          if (!selectedSpiritData.hasMoved) {
            const moveRange = Math.floor(selectedSpiritData.stats.speed / 2) + 1;
            if (actualDist <= moveRange && actualDist > 0) {
              const occupied = spirits.some(
                s => s.position && s.position.q === q && s.position.r === r
              );
              if (!occupied) {
                ctx.globalAlpha = 0.3;
                drawHex(ctx, center, HEX_SIZE - 4, '#3B82F6', '#3B82F6', 2);
                ctx.globalAlpha = 1;
              }
            }
          }
          
          if (!selectedSpiritData.hasAttacked) {
            if (actualDist <= selectedSpiritData.stats.range && actualDist > 0) {
              const target = spirits.find(
                s => s.position && s.position.q === q && s.position.r === r && s.owner !== selectedSpiritData.owner
              );
              if (target) {
                ctx.globalAlpha = 0.4;
                drawHex(ctx, center, HEX_SIZE - 4, '#EF4444', '#EF4444', 2);
                ctx.globalAlpha = 1;
              }
            }
          }
        }
      }
    }

    spirits.forEach(spirit => {
      if (!spirit.position) return;
      const pixel = hexToPixel(spirit.position, HEX_SIZE);
      const center = {
        x: pixel.x + offsetX,
        y: pixel.y + offsetY
      };
      drawSpirit(ctx, center, spirit, spirit.id === selectedSpirit);
    });

    const renderTime = performance.now() - startTime;
    if (renderTime > 20) {
      console.warn(`Board render took ${renderTime.toFixed(2)}ms, target is <20ms`);
    }
  }, [board, spirits, selectedSpirit, drawHex, drawSpirit]);

  useEffect(() => {
    drawBoard();
  }, [drawBoard]);

  useEffect(() => {
    let animationId: number;
    let lastTime = 0;
    const fpsInterval = 1000 / 30;

    const animate = (currentTime: number) => {
      animationId = requestAnimationFrame(animate);
      
      if (currentTime - lastTime >= fpsInterval) {
        lastTime = currentTime;
        drawBoard();
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [drawBoard]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const offsetX = canvas.width / 2 - (BOARD_SIZE * HEX_SIZE * 1.5) / 2;
    const offsetY = canvas.height / 2 - (BOARD_SIZE * HEX_SIZE * Math.sqrt(3)) / 2;

    const hex = pixelToHex(x - offsetX, y - offsetY, HEX_SIZE);

    if (isInBoard(hex, BOARD_SIZE)) {
      onHexClick(hex);
    }
  }, [onHexClick]);

  const getSpiritAtPosition = useCallback((coord: HexCoord) => {
    return spirits.find(s => s.position && hexEquals(s.position, coord));
  }, [spirits]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const offsetX = canvas.width / 2 - (BOARD_SIZE * HEX_SIZE * 1.5) / 2;
    const offsetY = canvas.height / 2 - (BOARD_SIZE * HEX_SIZE * Math.sqrt(3)) / 2;

    const hex = pixelToHex(x - offsetX, y - offsetY, HEX_SIZE);

    if (isInBoard(hex, BOARD_SIZE)) {
      const spirit = getSpiritAtPosition(hex);
      const terrain = getTerrainAt(hex);
      
      if (spirit || terrain) {
        canvas.style.cursor = 'pointer';
      } else {
        canvas.style.cursor = 'default';
      }
    } else {
      canvas.style.cursor = 'default';
    }
  }, [getSpiritAtPosition, getTerrainAt]);

  return (
    <div className="relative">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            className="rounded-2xl shadow-2xl"
            style={{
              willChange: 'transform',
              maxWidth: '100%',
              height: 'auto'
            }}
          />
        </motion.div>
      </AnimatePresence>
      
      <div className="absolute bottom-2 right-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
        {BOARD_SIZE}x{BOARD_SIZE} 六边形网格
      </div>
    </div>
  );
};
