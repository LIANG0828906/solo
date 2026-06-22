/**
 * TokenEditor 组件：令牌编辑面板
 *
 * 模块职责：
 * - 提供色相环交互选择颜色
 * - 提供滑块调整间距、圆角、阴影参数
 * - 按类别分组展示令牌（颜色、间距、圆角、阴影）
 *
 * 调用关系：
 * - 写入 store：调用 useDesignTokenStore 的 updateColor / updateSpacing / updateBorderRadius / updateShadow
 * - 读取 store：通过 useDesignTokenStore 获取当前令牌值用于回显
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  useDesignTokenStore,
  hslToCss,
  type ColorToken,
} from '@/store/designTokenStore';
import { ChevronDown } from 'lucide-react';

interface SectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function Section({ title, defaultOpen = true, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="editor-section">
      <button
        className="section-header"
        onClick={() => setOpen(!open)}
        type="button"
      >
        <ChevronDown
          className="section-arrow"
          size={14}
          style={{
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
        <span>{title}</span>
      </button>
      <div
        className="section-content"
        style={{
          maxHeight: open ? '2000px' : '0px',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function HueRing({ token, tokenKey }: { token: ColorToken; tokenKey: string }) {
  const updateColor = useDesignTokenStore((s) => s.updateColor);
  const ringRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const getHueFromEvent = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      const ring = ringRef.current;
      if (!ring) return;
      const rect = ring.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const x = e.clientX - cx;
      const y = e.clientY - cy;
      let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
      if (angle < 0) angle += 360;
      updateColor(tokenKey, { hue: Math.round(angle) });
    },
    [updateColor, tokenKey]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      dragging.current = true;
      getHueFromEvent(e);
      const onMove = (ev: MouseEvent) => {
        if (dragging.current) getHueFromEvent(ev);
      };
      const onUp = () => {
        dragging.current = false;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [getHueFromEvent]
  );

  const indicatorAngle = token.hue - 90;
  const indicatorRad = (indicatorAngle * Math.PI) / 180;
  const radius = 72;
  const ix = Math.cos(indicatorRad) * radius;
  const iy = Math.sin(indicatorRad) * radius;

  return (
    <div className="hue-ring-container">
      <div
        className="hue-ring"
        ref={ringRef}
        onMouseDown={handleMouseDown}
        style={{
          background:
            'conic-gradient(from 0deg, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))',
        }}
      >
        <div className="hue-ring-inner" />
        <div
          className="hue-ring-indicator"
          style={{
            transform: `translate(calc(-50% + ${ix}px), calc(-50% + ${iy}px))`,
          }}
        />
      </div>
      <div className="color-preview-swatch" style={{ background: hslToCss(token) }} />
    </div>
  );
}

function ColorEditor() {
  const colors = useDesignTokenStore((s) => s.colors);
  const updateColor = useDesignTokenStore((s) => s.updateColor);

  const colorKeys = Object.keys(colors);

  return (
    <div className="color-editor">
      {colorKeys.map((key) => {
        const token = colors[key];
        return (
          <div key={key} className="color-token-group">
            <div className="token-label-row">
              <span className="token-label">{token.label}</span>
              <span className="token-value">{hslToCss(token)}</span>
            </div>
            <HueRing token={token} tokenKey={key} />
            <div className="slider-row">
              <label>饱和度</label>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={token.saturation}
                onChange={(e) =>
                  updateColor(key, { saturation: Number(e.target.value) })
                }
                className="custom-slider"
              />
              <span className="slider-val">{token.saturation}%</span>
            </div>
            <div className="slider-row">
              <label>明度</label>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={token.lightness}
                onChange={(e) =>
                  updateColor(key, { lightness: Number(e.target.value) })
                }
                className="custom-slider"
              />
              <span className="slider-val">{token.lightness}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SpacingEditor() {
  const spacing = useDesignTokenStore((s) => s.spacing);
  const updateSpacing = useDesignTokenStore((s) => s.updateSpacing);

  return (
    <div className="spacing-editor">
      {Object.entries(spacing).map(([key, token]) => (
        <div key={key} className="slider-group">
          <div className="token-label-row">
            <span className="token-label">{token.label}</span>
            <span className="token-value">{token.value}px</span>
          </div>
          <input
            type="range"
            min={0}
            max={48}
            step={1}
            value={token.value}
            onChange={(e) => updateSpacing(key, Number(e.target.value))}
            className="custom-slider"
          />
        </div>
      ))}
    </div>
  );
}

function BorderRadiusEditor() {
  const borderRadius = useDesignTokenStore((s) => s.borderRadius);
  const updateBorderRadius = useDesignTokenStore((s) => s.updateBorderRadius);

  return (
    <div className="radius-editor">
      {Object.entries(borderRadius).map(([key, token]) => (
        <div key={key} className="slider-group">
          <div className="token-label-row">
            <span className="token-label">{token.label}</span>
            <span className="token-value">
              {token.value >= 9999 ? '9999px' : `${token.value}px`}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={48}
            step={1}
            value={Math.min(token.value, 48)}
            onChange={(e) => updateBorderRadius(key, Number(e.target.value))}
            className="custom-slider"
            disabled={token.value >= 9999}
          />
        </div>
      ))}
    </div>
  );
}

function ShadowEditor() {
  const shadows = useDesignTokenStore((s) => s.shadows);
  const updateShadow = useDesignTokenStore((s) => s.updateShadow);

  return (
    <div className="shadow-editor">
      {Object.entries(shadows).map(([key, token]) => (
        <div key={key} className="slider-group shadow-group">
          <div className="token-label-row">
            <span className="token-label">{token.label}</span>
            <span className="token-value">
              {token.offsetX}px {token.offsetY}px {token.blur}px
            </span>
          </div>
          <div className="slider-row">
            <label>模糊</label>
            <input
              type="range"
              min={0}
              max={32}
              step={1}
              value={token.blur}
              onChange={(e) => updateShadow(key, { blur: Number(e.target.value) })}
              className="custom-slider"
            />
            <span className="slider-val">{token.blur}px</span>
          </div>
          <div className="slider-row">
            <label>X偏移</label>
            <input
              type="range"
              min={0}
              max={16}
              step={1}
              value={token.offsetX}
              onChange={(e) => updateShadow(key, { offsetX: Number(e.target.value) })}
              className="custom-slider"
            />
            <span className="slider-val">{token.offsetX}px</span>
          </div>
          <div className="slider-row">
            <label>Y偏移</label>
            <input
              type="range"
              min={0}
              max={16}
              step={1}
              value={token.offsetY}
              onChange={(e) => updateShadow(key, { offsetY: Number(e.target.value) })}
              className="custom-slider"
            />
            <span className="slider-val">{token.offsetY}px</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TokenEditor() {
  const colors = useDesignTokenStore((s) => s.colors);
  const primaryColor = hslToCss(colors.primary);

  return (
    <div
      className="token-editor"
      style={{
        ['--slider-primary-color' as string]: primaryColor,
      }}
    >
      <Section title="颜色令牌" defaultOpen>
        <ColorEditor />
      </Section>
      <Section title="间距令牌">
        <SpacingEditor />
      </Section>
      <Section title="圆角令牌">
        <BorderRadiusEditor />
      </Section>
      <Section title="阴影令牌">
        <ShadowEditor />
      </Section>
    </div>
  );
}
