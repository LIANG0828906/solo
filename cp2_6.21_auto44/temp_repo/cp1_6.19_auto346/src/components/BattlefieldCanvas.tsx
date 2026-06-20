import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useBattlefieldStore, BATTLEFIELD_WIDTH, BATTLEFIELD_HEIGHT, Unit } from '../store';
import { drawBattlefield, getUnitAt } from '../modules/battlefield';
import { Menu } from 'lucide-react';

interface Props {
  onOpenMobileCommand: () => void;
}

export const BattlefieldCanvas: React.FC<Props> = ({ onOpenMobileCommand }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectionRect, setSelectionRect] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [tooltipUnit, setTooltipUnit] = useState<Unit | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const replayCommandIndexRef = useRef<number>(-1);

  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement> | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = (time: number) => {
      const delta = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;

      const state = useBattlefieldStore.getState();
      const scaledDelta = delta * state.replaySpeed;

      if (state.isReplaying && state.replayFromIndex >= 0) {
        if (replayCommandIndexRef.current === -1) {
          replayCommandIndexRef.current = state.replayFromIndex;
        }
        if (replayCommandIndexRef.current < state.commands.length - 1) {
          const currentCmd = state.commands[replayCommandIndexRef.current];
          const nextCmd = state.commands[replayCommandIndexRef.current + 1];
          if (time - (currentCmd.timestamp + (nextCmd.timestamp - currentCmd.timestamp) * 0.5) > 0) {
            replayCommandIndexRef.current++;
            state.applyCommand(state.commands[replayCommandIndexRef.current]);
          }
        }
      } else {
        replayCommandIndexRef.current = -1;
      }

      state.updateUnits(scaledDelta, time);
      state.cleanupEffects(time);
      drawBattlefield(ctx, time, selectionRect, mousePos);
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [selectionRect, mousePos]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    const state = useBattlefieldStore.getState();

    if (state.placingTeam) {
      state.placeUnit(state.placingTeam, x, y);
      return;
    }

    if (state.pendingTarget && state.selectedUnitIds.length > 0) {
      const params: { radius?: number; width?: number; arc?: boolean } = {};
      if (state.commandType === 'surround') params.radius = state.surroundRadius;
      if (state.commandType === 'disperse') params.radius = state.disperseRadius;
      if (state.commandType === 'formation') {
        params.width = state.formationWidth;
        params.arc = state.formationArc;
      }
      state.issueCommand(state.commandType, state.selectedUnitIds, { x, y }, params);
      state.setPendingTarget(null);
      return;
    }

    const unit = getUnitAt(x, y, state.units);
    if (unit) {
      state.selectUnit(unit.id, e.shiftKey);
    } else {
      setIsDragging(true);
      setDragStart({ x, y });
      setSelectionRect({ x1: x, y1: y, x2: x, y2: y });
      state.clearSelection();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    setMousePos({ x, y });

    const state = useBattlefieldStore.getState();
    const unit = getUnitAt(x, y, state.units);
    if (unit) {
      setTooltipUnit(unit);
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        setTooltipPos({
          x: e.clientX - rect.left + 15,
          y: e.clientY - rect.top + 15,
        });
      }
    } else {
      setTooltipUnit(null);
    }

    if (isDragging && dragStart) {
      setSelectionRect({ x1: dragStart.x, y1: dragStart.y, x2: x, y2: y });
    }
  };

  const handleMouseUp = (_e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging && selectionRect) {
      const state = useBattlefieldStore.getState();
      state.selectUnitsInRect(selectionRect.x1, selectionRect.y1, selectionRect.x2, selectionRect.y2);
    }
    setIsDragging(false);
    setDragStart(null);
    setSelectionRect(null);
  };

  const handleMouseLeave = () => {
    setMousePos(null);
    setTooltipUnit(null);
    if (isDragging && selectionRect) {
      const state = useBattlefieldStore.getState();
      state.selectUnitsInRect(selectionRect.x1, selectionRect.y1, selectionRect.x2, selectionRect.y2);
    }
    setIsDragging(false);
    setDragStart(null);
    setSelectionRect(null);
  };

  return (
    <div className="battlefield-wrapper">
      <div className="battlefield-header">
        <h1>银河帝国舰队战术模拟器</h1>
        <button className="mobile-menu-btn" onClick={onOpenMobileCommand}>
          <Menu size={20} />
        </button>
      </div>
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          width={BATTLEFIELD_WIDTH}
          height={BATTLEFIELD_HEIGHT}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
        {tooltipUnit && (
          <div
            className="unit-tooltip"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}
          >
            <div className="tooltip-header">
              <span className={`tooltip-dot ${tooltipUnit.team}`}></span>
              <span>
                {tooltipUnit.team === 'red' ? '红方' : '蓝方'} 单位
              </span>
            </div>
            <div className="tooltip-row">
              <span>ID:</span>
              <span>{tooltipUnit.id.slice(0, 8)}</span>
            </div>
            <div className="tooltip-row">
              <span>生命值:</span>
              <span style={{
                color:
                  tooltipUnit.hp / tooltipUnit.maxHp > 0.75
                    ? '#4caf50'
                    : tooltipUnit.hp / tooltipUnit.maxHp > 0.25
                    ? '#ffeb3b'
                    : '#f44336',
              }}>
                {tooltipUnit.hp} / {tooltipUnit.maxHp}
              </span>
            </div>
            <div className="tooltip-row">
              <span>移动速度:</span>
              <span>{tooltipUnit.speed.toFixed(2)} px/f</span>
            </div>
            <div className="tooltip-row">
              <span>攻击力:</span>
              <span>{tooltipUnit.attack}</span>
            </div>
            <div className="tooltip-row">
              <span>状态:</span>
              <span className={`state-tag ${tooltipUnit.state}`}>{tooltipUnit.state}</span>
            </div>
          </div>
        )}
      </div>
      <div className="battlefield-footer">
        <span className="hint-text">
          {useBattlefieldStore.getState().placingTeam
            ? `点击战场部署${useBattlefieldStore.getState().placingTeam === 'red' ? '红方' : '蓝方'}单位`
            : useBattlefieldStore.getState().pendingTarget
            ? '点击战场指定目标位置'
            : '拖拽框选单位 · 点击选中 · Shift多选'}
        </span>
      </div>
    </div>
  );
};

export default BattlefieldCanvas;
