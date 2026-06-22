import { useMemo, useCallback } from 'react';
import type { WordFrequency } from '../types';

interface SkillWordCloudProps {
  words: WordFrequency[];
}

const COLOR_A = { r: 63, g: 81, b: 181 };
const COLOR_B = { r: 255, g: 152, b: 0 };

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

function mixColor(t: number) {
  const r = lerp(COLOR_A.r, COLOR_B.r, t);
  const g = lerp(COLOR_A.g, COLOR_B.g, t);
  const b = lerp(COLOR_A.b, COLOR_B.b, t);
  return `rgb(${r}, ${g}, ${b})`;
}

function layoutSpiral(
  items: Array<{ w: number; h: number; text: string; fontSize: number; color: string; value: number }>,
  width: number,
  height: number
) {
  const placed: Array<{
    x: number;
    y: number;
    w: number;
    h: number;
    text: string;
    fontSize: number;
    color: string;
    value: number;
  }> = [];

  const centerX = width / 2;
  const centerY = height / 2;

  for (const item of items) {
    let angle = 0;
    let radius = 0;
    const step = 2;
    let tries = 0;
    let placedOk = false;
    let x = centerX;
    let y = centerY;

    while (tries < 4000 && !placedOk) {
      x = centerX + Math.cos(angle) * radius - item.w / 2;
      y = centerY + Math.sin(angle) * radius - item.h / 2;

      if (x < 4 || y < 4 || x + item.w > width - 4 || y + item.h > height - 4) {
        // skip
      } else {
        let collision = false;
        for (const p of placed) {
          if (
            x < p.x + p.w + 2 &&
            x + item.w + 2 > p.x &&
            y < p.y + p.h + 2 &&
            y + item.h + 2 > p.y
          ) {
            collision = true;
            break;
          }
        }
        placedOk = !collision;
      }

      if (!placedOk) {
        angle += 0.25;
        radius += step * 0.25;
      }
      tries++;
    }

    if (placedOk) {
      placed.push({
        x,
        y,
        w: item.w,
        h: item.h,
        text: item.text,
        fontSize: item.fontSize,
        color: item.color,
        value: item.value
      });
    }
  }

  return placed;
}

export function SkillWordCloud({ words }: SkillWordCloudProps) {
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const width = Math.max(320, rect.width);
    const height = Math.max(360, node.clientHeight || 360);

    const values = words.map((w) => w.value);
    const maxV = Math.max(1, ...values);
    const minV = Math.min(...values);
    const range = Math.max(1, maxV - minV);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const sized = words
      .slice(0, 60)
      .map((w, idx) => {
        const t = (w.value - minV) / range;
        const sortedT = 1 - idx / Math.max(1, words.length - 1);
        const fontSize = Math.round(10 + (24 - 10) * Math.max(t, sortedT * 0.5));
        ctx.font = `bold ${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
        const metrics = ctx.measureText(w.text);
        const padW = 8;
        const padH = 6;
        const w2 = Math.ceil(metrics.width + padW * 2);
        const h2 = Math.ceil(fontSize * 1.35 + padH * 2);
        const colorT = idx / Math.max(1, words.length - 1);
        return {
          w: w2,
          h: h2,
          text: w.text,
          fontSize,
          color: mixColor(colorT),
          value: w.value
        };
      })
      .sort((a, b) => b.fontSize - a.fontSize);

    const placed = layoutSpiral(sized, width, height);

    node.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.style.cssText =
      'position:relative;width:100%;height:100%;';

    for (const p of placed) {
      const span = document.createElement('span');
      span.style.cssText = `
        position:absolute;
        left:${p.x}px;
        top:${p.y}px;
        padding: 6px 10px;
        display:inline-flex;
        align-items:center;
        justify-content:center;
        font-size:${p.fontSize}px;
        font-weight:700;
        color:${p.color};
        cursor:pointer;
        user-select:none;
        border-radius:8px;
        transition: transform .2s ease, background .2s ease, box-shadow .2s ease;
        transform-origin:center center;
        white-space:nowrap;
        line-height:1;
        background: rgba(255,255,255,0.55);
      `;
      span.textContent = p.text;
      span.title = `${p.text} · 频次 ${p.value}`;
      span.addEventListener('mouseenter', () => {
        span.style.transform = 'scale(1.15)';
        span.style.background = 'rgba(227, 242, 253, 0.95)';
        span.style.boxShadow = '0 4px 12px rgba(21,101,192,.18)';
        span.style.zIndex = '10';
      });
      span.addEventListener('mouseleave', () => {
        span.style.transform = 'scale(1)';
        span.style.background = 'rgba(255,255,255,0.55)';
        span.style.boxShadow = 'none';
        span.style.zIndex = '1';
      });
      wrapper.appendChild(span);
    }

    if (placed.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText =
        'width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#90a4ae;font-size:14px;';
      empty.textContent = '暂无技能词频数据';
      wrapper.appendChild(empty);
    }

    node.appendChild(wrapper);
  }, [words]);

  return (
    <div className="chart-card">
      <h3 className="chart-title">技能词频云图</h3>
      <div className="wordcloud-wrap" ref={containerRef} />
    </div>
  );
}

export default SkillWordCloud;
