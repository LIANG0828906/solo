import React, { useRef, useEffect, useCallback } from 'react';
import { useCharacterStore } from '../characterModule/CharacterStore';
import { getSkillsForClass, getNodeState } from '../skillModule/SkillEngine';
import { SkillNode, NodeState } from '../shared/types';

const NODE_RADIUS = 24;
const NODE_BORDER = 2;

const NODE_COLORS: Record<NodeState, { bg: string; border: string }> = {
  inactive: { bg: '#1e293b', border: '#475569' },
  learnable: { bg: '#1e293b', border: '#3b82f6' },
  activated: { bg: '#3b82f6', border: '#2563eb' },
  unavailable: { bg: '#334155', border: '#475569' },
};

const LINE_COLORS = {
  bothInactive: '#475569',
  oneActive: '#3b82f680',
  bothActive: '#3b82f6',
};

function getLineColor(
  fromState: NodeState,
  toState: NodeState
): string {
  const fromActive = fromState === 'activated';
  const toActive = toState === 'activated';
  if (fromActive && toActive) return LINE_COLORS.bothActive;
  if (fromActive || toActive) return LINE_COLORS.oneActive;
  return LINE_COLORS.bothInactive;
}

const SkillTree: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  const race = useCharacterStore((s) => s.race);
  const characterClass = useCharacterStore((s) => s.characterClass);
  const activatedSkills = useCharacterStore((s) => s.activatedSkills);
  const skillPoints = useCharacterStore((s) => s.skillPoints);
  const activateSkill = useCharacterStore((s) => s.activateSkill);

  const skills = getSkillsForClass(characterClass);

  const getNodeStates = useCallback((): Map<string, NodeState> => {
    const states = new Map<string, NodeState>();
    skills.forEach((node) => {
      states.set(node.id, getNodeState(node, activatedSkills, skillPoints));
    });
    return states;
  }, [skills, activatedSkills, skillPoints]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
      ctx.clearRect(0, 0, width, height);
      const nodeStates = getNodeStates();

      const connections: Array<{ from: SkillNode; to: SkillNode }> = [];
      skills.forEach((node) => {
        node.prerequisites.forEach((preId) => {
          const pre = skills.find((s) => s.id === preId);
          if (pre) connections.push({ from: pre, to: node });
        });
      });

      connections.forEach(({ from, to }) => {
        const fromState = nodeStates.get(from.id) || 'inactive';
        const toState = nodeStates.get(to.id) || 'inactive';
        ctx.beginPath();
        ctx.moveTo(from.x * width, from.y * height);
        ctx.lineTo(to.x * width, to.y * height);
        ctx.strokeStyle = getLineColor(fromState, toState);
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      skills.forEach((node) => {
        const state = nodeStates.get(node.id) || 'inactive';
        const cx = node.x * width;
        const cy = node.y * height;
        const colors = NODE_COLORS[state];

        let alpha = 1;
        if (state === 'learnable') {
          alpha = 0.5 + 0.5 * Math.sin(time * Math.PI * 2 / 500);
        }

        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(cx, cy, NODE_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = colors.bg;
        ctx.fill();
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = NODE_BORDER;
        ctx.stroke();

        ctx.fillStyle = state === 'activated' ? '#ffffff' : state === 'unavailable' ? '#64748b' : '#e2e8f0';
        ctx.font = '14px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.effect.icon, cx, cy - 4);

        ctx.font = '10px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
        ctx.fillStyle = state === 'activated' ? '#ffffff' : '#94a3b8';
        ctx.fillText(node.name, cx, cy + 12);

        ctx.globalAlpha = 1;
      });
    },
    [skills, getNodeStates]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = (timestamp: number) => {
      timeRef.current = timestamp;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const dpr = window.devicePixelRatio || 1;
        draw(ctx, canvas.width / dpr, canvas.height / dpr, timestamp);
      }
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [draw]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      const nodeStates = getNodeStates();

      for (const node of skills) {
        const nx = node.x * w;
        const ny = node.y * h;
        const dist = Math.sqrt((x - nx) ** 2 + (y - ny) ** 2);
        if (dist <= NODE_RADIUS) {
          const state = nodeStates.get(node.id);
          if (state === 'learnable') {
            activateSkill(node.id);
          }
          break;
        }
      }
    },
    [skills, getNodeStates, activateSkill]
  );

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        cursor: 'pointer',
      }}
    />
  );
};

export default SkillTree;
