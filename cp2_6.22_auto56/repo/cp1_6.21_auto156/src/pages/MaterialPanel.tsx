import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Material, MaterialType } from '../types';

const TYPE_COLORS: Record<MaterialType, string> = {
  text: '#3B82F6',
  link: '#22C55E',
  image: '#8B5CF6',
};

const TYPE_LABELS: Record<MaterialType, string> = {
  text: '文字',
  link: '链接',
  image: '图片',
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function highlightText(text: string, keyword: string): React.ReactNode {
  if (!keyword.trim()) return text;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <span key={i} style={{ background: '#FEF08A', fontWeight: 700 }}>{part}</span>
    ) : (
      part
    )
  );
}

const ITEM_HEIGHT = 140;
const BUFFER = 5;

function MaterialCard({
  material,
  keyword,
  onInsert,
  onEdit,
  onDelete,
}: {
  material: Material;
  keyword: string;
  onInsert: (m: Material) => void;
  onEdit: (m: Material) => void;
  onDelete: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const summary = material.content.slice(0, 200);

  return (
    <div
      onClick={() => onInsert(material)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: '#FFFFFF',
        borderRadius: '8px',
        border: '2px solid #E2E8F0',
        padding: '12px',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s ease, background 0.15s ease',
        boxShadow: hovered ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
        background: hovered ? '#E2E8F0' : '#FFFFFF',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '4px',
          height: '100%',
          background: TYPE_COLORS[material.type],
          borderRadius: '8px 0 0 8px',
        }}
      />
      <div style={{ paddingLeft: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B', lineHeight: 1.4, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {highlightText(material.title.slice(0, 30), keyword)}
          </div>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: TYPE_COLORS[material.type] + '18',
              color: TYPE_COLORS[material.type],
              fontWeight: 500,
              whiteSpace: 'nowrap',
              marginLeft: '8px',
            }}
          >
            {TYPE_LABELS[material.type]}
          </span>
        </div>
        {material.type === 'image' && material.imageUrl && (
          <img
            src={material.imageUrl}
            alt={material.title}
            style={{ width: '100%', maxHeight: '80px', objectFit: 'cover', borderRadius: '4px', marginTop: '8px' }}
          />
        )}
        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '6px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {highlightText(summary, keyword)}
        </div>
        <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px' }}>
          {formatTime(material.createdAt)}
        </div>
      </div>
      {hovered && (
        <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(material); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#64748B', padding: '2px', transition: 'color 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#3B82F6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#64748B'; }}
            title="编辑"
          >
            🖊
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(material.id); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#64748B', padding: '2px', transition: 'color 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#64748B'; }}
            title="删除"
          >
            🗑
          </button>
        </div>
      )}
    </div>
  );
}

export default function MaterialPanel({
  onEditMaterial,
}: {
  onEditMaterial: (material: Material) => void;
}) {
  const { materials, pasteMaterial, deleteMaterial } = useAppContext();
  const [filter, setFilter] = useState<MaterialType | 'all'>('all');
  const [keyword, setKeyword] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => setScrollTop(el.scrollTop);
    const handleResize = () => setViewportHeight(el.clientHeight);
    el.addEventListener('scroll', handleScroll, { passive: true });
    const ro = new ResizeObserver(handleResize);
    ro.observe(el);
    handleResize();
    return () => { el.removeEventListener('scroll', handleScroll); ro.disconnect(); };
  }, []);

  const filtered = useMemo(() => {
    let list = materials;
    if (filter !== 'all') list = list.filter((m) => m.type === filter);
    if (keyword.trim()) {
      const kw = keyword.toLowerCase();
      list = list.filter((m) => m.title.toLowerCase().includes(kw) || m.content.toLowerCase().includes(kw));
    }
    return list;
  }, [materials, filter, keyword]);

  const totalHeight = filtered.length * ITEM_HEIGHT + (filtered.length > 0 ? (filtered.length - 1) * 8 : 0);
  const startIndex = Math.max(0, Math.floor(scrollTop / (ITEM_HEIGHT + 8)) - BUFFER);
  const endIndex = Math.min(filtered.length, Math.ceil((scrollTop + viewportHeight) / (ITEM_HEIGHT + 8)) + BUFFER);
  const visibleItems = filtered.slice(startIndex, endIndex);

  const handleInsert = useCallback((material: Material) => {
    pasteMaterial(material);
  }, [pasteMaterial]);

  return (
    <div
      style={{
        width: '300px',
        background: '#F8FAFC',
        borderRadius: '8px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as MaterialType | 'all')}
          style={{
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid #CBD5E1',
            background: '#FFFFFF',
            fontSize: '13px',
            color: '#334155',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="all">全部</option>
          <option value="text">文字</option>
          <option value="link">链接</option>
          <option value="image">图片</option>
        </select>
        <input
          type="text"
          placeholder="搜索素材..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{
            flex: 1,
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid #CBD5E1',
            fontSize: '13px',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => { e.target.style.borderColor = '#3B82F6'; }}
          onBlur={(e) => { e.target.style.borderColor = '#CBD5E1'; }}
        />
      </div>
      <div
        ref={scrollRef}
        style={{ flex: 1, overflowY: 'auto', position: 'relative' }}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          {visibleItems.map((material, i) => {
            const idx = startIndex + i;
            return (
              <div
                key={material.id}
                style={{
                  position: 'absolute',
                  top: idx * (ITEM_HEIGHT + 8),
                  left: 0,
                  right: 0,
                  height: ITEM_HEIGHT,
                }}
              >
                <MaterialCard
                  material={material}
                  keyword={keyword}
                  onInsert={handleInsert}
                  onEdit={onEditMaterial}
                  onDelete={deleteMaterial}
                />
              </div>
            );
          })}
        </div>
      </div>
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: '#94A3B8', padding: '40px 0', fontSize: '14px' }}>
          暂无素材
        </div>
      )}
    </div>
  );
}
