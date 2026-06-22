import React, { useState, useRef, useCallback, useMemo, DragEvent, ChangeEvent } from 'react';
import { useStore } from './store';
import type { IconData } from './types';
import { PRESET_COLORS } from './types';

const Spinner: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ animation: 'spin 1s linear infinite' }}
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const SvgRenderer: React.FC<{ content: string; color: string; size?: number }> = ({ content, color, size = 48 }) => {
  const colored = useMemo(() => {
    let c = content.replace(/fill="[^"]*"/g, `fill="${color}"`);
    if (!c.includes('fill=')) {
      c = c.replace(/<svg/, `<svg fill="${color}"`);
    }
    return c;
  }, [content, color]);

  return (
    <div
      style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      dangerouslySetInnerHTML={{ __html: colored }}
    />
  );
};

const IconCard: React.FC<{
  icon: IconData;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDragStart: (e: DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
}> = ({ icon, isSelected, onSelect, onRemove, onDragStart, onDragOver, onDrop }) => {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onSelect}
      style={{
        width: 80,
        height: 80,
        borderRadius: 8,
        background: '#282840',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        position: 'relative',
        border: isSelected ? '2px solid #00D4AA' : '2px solid transparent',
        boxSizing: 'border-box',
        transition: 'all 0.2s ease',
        animation: 'fadeIn 0.3s ease-out',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 212, 170, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <SvgRenderer content={icon.svgContent} color={icon.color} size={40} />
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        style={{
          position: 'absolute',
          top: -6,
          right: -6,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#FF6B6B',
          border: 'none',
          color: '#fff',
          fontSize: 12,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          opacity: 0,
          transition: 'opacity 0.2s ease',
        }}
        onMouseEnter={(e) => ((e.currentTarget.parentElement as HTMLDivElement).style.opacity = '1')}
      >
        ×
      </button>
      <div
        style={{
          position: 'absolute',
          bottom: 2,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 10,
          color: '#888',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          padding: '0 4px',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {icon.name}
      </div>
    </div>
  );
};

const NavBar: React.FC = () => {
  const { icons, isGenerating, fontResult, exportProgress, generateFont, exportZip } = useStore();
  const canGenerate = icons.length >= 3 && !isGenerating;
  const canExport = fontResult !== null;

  return (
    <nav
      style={{
        height: 60,
        background: '#1A1A2E',
        borderBottom: '2px solid #00D4AA',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 32,
            height: 32,
            background: 'linear-gradient(135deg, #00D4AA 0%, #4ECDC4 100%)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            color: '#0F0F1A',
            fontSize: 14,
          }}
        >
          F
        </div>
        <span
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: '#E0E0E0',
            letterSpacing: 1,
          }}
        >
          字体工坊
        </span>
        <span
          style={{
            fontSize: 12,
            color: '#888',
            marginLeft: 8,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {icons.length}/20
        </span>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={generateFont}
          disabled={!canGenerate}
          style={{
            padding: '