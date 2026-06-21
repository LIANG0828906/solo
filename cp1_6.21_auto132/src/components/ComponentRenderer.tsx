import React, { useState, useRef } from 'react';
import { useApp, type WorkspaceComponent, type ComponentAttributes, type ButtonSize, type ColorTheme, type ShapeVariant } from '../context/AppContext';
import { createSnapshot, setSnapshotToURL } from '../context/AppContext';

const PRIMARY = '#6366F1';
const SECONDARY = '#10B981';
const ERROR = '#F43F5E';

function colorValue(c?: ColorTheme): string {
  switch (c) {
    case 'secondary': return SECONDARY;
    case 'error': return ERROR;
    default: return PRIMARY;
  }
}

function sizeClasses(s?: ButtonSize): { h: string; px: string; text: string; icon: number } {
  switch (s) {
    case 'sm': return { h: 'h-8', px: 'px-3', text: 'text-xs', icon: 14 };
    case 'lg': return { h: 'h-12', px: 'px-6', text: 'text-base', icon: 20 };
    default: return { h: 'h-10', px: 'px-4', text: 'text-sm', icon: 16 };
  }
}

function shapeRadius(s?: ShapeVariant): string {
  switch (s) {
    case 'square': return 'rounded';
    case 'pill': return 'rounded-full';
    default: return 'rounded-lg';
  }
}

interface RenderCompProps {
  comp: WorkspaceComponent;
  isDark: boolean;
  onAttrChange: (attrs: ComponentAttributes) => void;
}

function MD3Button({ comp, isDark, onAttrChange }: RenderCompProps) {
  const a = comp.attributes;
  const sz = sizeClasses(a.size);
  const rad = shapeRadius(a.shape);
  const col = colorValue(a.color);
  return (
    <button
      disabled={a.disabled}
      onClick={() => {}}
      className={`${sz.h} ${sz.px} ${sz.text} ${rad} font-semibold text-white transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
      style={{ backgroundColor: col }}
    >
      {a.label || '按钮'}
    </button>
  );
}

function MD3ButtonOutlined({ comp, isDark, onAttrChange }: RenderCompProps) {
  const a = comp.attributes;
  const sz = sizeClasses(a.size);
  const rad = shapeRadius(a.shape);
  const col = colorValue(a.color);
  return (
    <button
      disabled={a.disabled}
      className={`${sz.h} ${sz.px} ${sz.text} ${rad} font-semibold border-2 bg-transparent transition-all duration-200 hover:shadow-sm active:scale-[0.98] disabled:opacity-50`}
      style={{ borderColor: col, color: col }}
    >
      {a.label || '描边按钮'}
    </button>
  );
}

function MD3ButtonText({ comp, isDark, onAttrChange }: RenderCompProps) {
  const a = comp.attributes;
  const sz = sizeClasses(a.size);
  const rad = shapeRadius(a.shape);
  const col = colorValue(a.color);
  return (
    <button
      disabled={a.disabled}
      className={`${sz.h} ${sz.px} ${sz.text} ${rad} font-semibold bg-transparent transition-all duration-200 active:scale-[0.98] disabled:opacity-50`}
      style={{ color: col }}
    >
      {a.label || '文字按钮'}
    </button>
  );
}

function MD3Input({ comp, isDark, onAttrChange }: RenderCompProps) {
  const a = comp.attributes;
  const sz = sizeClasses(a.size);
  const rad = shapeRadius(a.shape);
  return (
    <input
      disabled={a.disabled}
      placeholder={a.placeholder}
      value={String(a.value ?? '')}
      onChange={(e) => onAttrChange({ value: e.target.value })}
      className={`${sz.h} ${sz.px} ${sz.text} ${rad} w-64 border outline-none transition-all duration-200 focus:ring-2 focus:ring-indigo-300 ${
        isDark
          ? 'bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-indigo-400'
          : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-indigo-500'
      } disabled:opacity-50`}
    />
  );
}

function MD3Textarea({ comp, isDark, onAttrChange }: RenderCompProps) {
  const a = comp.attributes;
  return (
    <textarea
      disabled={a.disabled}
      placeholder={a.placeholder}
      value={String(a.value ?? '')}
      onChange={(e) => onAttrChange({ value: e.target.value })}
      rows={4}
      className={`w-80 p-3 text-sm rounded-xl border outline-none transition-all duration-200 resize-none focus:ring-2 focus:ring-indigo-300 ${
        isDark
          ? 'bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-indigo-400'
          : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-indigo-500'
      } disabled:opacity-50`}
    />
  );
}

function MD3Select({ comp, isDark, onAttrChange }: RenderCompProps) {
  const a = comp.attributes;
  const sz = sizeClasses(a.size);
  const rad = shapeRadius(a.shape);
  return (
    <div className="relative">
      <select
        disabled={a.disabled}
        value={String(a.value ?? '')}
        onChange={(e) => onAttrChange({ value: e.target.value })}
        className={`${sz.h} ${sz.px} ${sz.text} ${rad} w-56 border outline-none transition-all duration-200 appearance-none pr-10 focus:ring-2 focus:ring-indigo-300 ${
          isDark
            ? 'bg-slate-800 border-slate-600 text-slate-100 focus:border-indigo-400'
            : 'bg-white border-slate-300 text-slate-800 focus:border-indigo-500'
        } disabled:opacity-50`}
      >
        <option>选项1</option>
        <option>选项2</option>
        <option>选项3</option>
      </select>
      <svg className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}

function MD3Checkbox({ comp, isDark, onAttrChange }: RenderCompProps) {
  const a = comp.attributes;
  const sz = sizeClasses(a.size);
  const boxSize = a.size === 'sm' ? 'w-4 h-4' : a.size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  return (
    <label className={`inline-flex items-center gap-2 cursor-pointer ${sz.text} ${isDark ? 'text-slate-200' : 'text-slate-700'} ${a.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <button
        type="button"
        disabled={a.disabled}
        onClick={() => onAttrChange({ checked: !a.checked })}
        className={`${boxSize} rounded transition-all duration-200 flex items-center justify-center border-2 ${
          a.checked ? '' : isDark ? 'bg-transparent border-slate-500' : 'bg-transparent border-slate-300'
        }`}
        style={a.checked ? { backgroundColor: PRIMARY, borderColor: PRIMARY } : {}}
      >
        {a.checked && (
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-3/4 h-3/4">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
      <span>{a.label}</span>
    </label>
  );
}

function MD3Radio({ comp, isDark, onAttrChange }: RenderCompProps) {
  const a = comp.attributes;
  const sz = sizeClasses(a.size);
  const dotOuter = a.size === 'sm' ? 'w-4 h-4' : a.size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  return (
    <label className={`inline-flex items-center gap-2 cursor-pointer ${sz.text} ${isDark ? 'text-slate-200' : 'text-slate-700'} ${a.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <button
        type="button"
        disabled={a.disabled}
        onClick={() => onAttrChange({ checked: !a.checked })}
        className={`${dotOuter} rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
          isDark ? 'border-slate-500' : 'border-slate-300'
        }`}
        style={a.checked ? { borderColor: PRIMARY } : {}}
      >
        <div
          className={`rounded-full transition-all duration-200 ${
            a.checked ? (a.size === 'sm' ? 'w-2 h-2' : a.size === 'lg' ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5') : 'w-0 h-0'
          }`}
          style={{ backgroundColor: PRIMARY }}
        />
      </button>
      <span>{a.label}</span>
    </label>
  );
}

function MD3Switch({ comp, isDark, onAttrChange }: RenderCompProps) {
  const a = comp.attributes;
  const sz = a.size === 'sm' ? { w: 'w-10', h: 'h-6', dot: 'w-4 h-4' } : a.size === 'lg' ? { w: 'w-14', h: 'h-8', dot: 'w-6 h-6' } : { w: 'w-12', h: 'h-7', dot: 'w-5 h-5' };
  return (
    <button
      type="button"
      disabled={a.disabled}
      onClick={() => onAttrChange({ checked: !a.checked })}
      className={`relative ${sz.w} ${sz.h} rounded-full transition-all duration-300 ${a.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={{ backgroundColor: a.checked ? PRIMARY : isDark ? '#334155' : '#CBD5E1' }}
    >
      <span
        className={`absolute top-1/2 -translate-y-1/2 ${sz.dot} bg-white rounded-full shadow-md transition-all duration-300`}
        style={{ left: a.checked ? 'calc(100% - 6px)' : '3px', transform: a.checked ? 'translate(-100%, -50%)' : 'translateY(-50%)' }}
      />
    </button>
  );
}

function MD3Card({ comp, isDark, onAttrChange }: RenderCompProps) {
  const a = comp.attributes;
  const rad = shapeRadius(a.shape);
  return (
    <div
      className={`w-72 ${rad} p-5 transition-all duration-200 ${
        isDark ? 'bg-slate-800' : 'bg-white'
      }`}
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.1)' }}
    >
      <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{a.label || '卡片标题'}</h3>
      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>这是卡片的描述内容区域，可以展示一些信息。</p>
      <div className="mt-4 flex gap-2">
        <button className="h-9 px-4 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: PRIMARY }}>操作</button>
        <button className="h-9 px-4 rounded-lg text-sm font-medium" style={{ color: PRIMARY }}>更多</button>
      </div>
    </div>
  );
}

function MD3CardElevated({ comp, isDark, onAttrChange }: RenderCompProps) {
  const a = comp.attributes;
  const rad = shapeRadius(a.shape);
  return (
    <div
      className={`w-72 ${rad} p-5 transition-all duration-200 ${isDark ? 'bg-slate-700' : 'bg-white'}`}
      style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.07), 0 10px 15px rgba(0,0,0,0.1), 0 20px 40px rgba(0,0,0,0.08)' }}
    >
      <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{a.label || '高-卡片'}</h3>
      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>具有更深阴影效果的卡片。</p>
    </div>
  );
}

function MD3CardOutlined({ comp, isDark, onAttrChange }: RenderCompProps) {
  const a = comp.attributes;
  const rad = shapeRadius(a.shape);
  return (
    <div
      className={`w-72 ${rad} p-5 border-2 transition-all duration-200 ${
        isDark ? 'bg-transparent border-slate-600' : 'bg-transparent border-slate-200'
      }`}
    >
      <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{a.label || '描边卡片'}</h3>
      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>使用边框代替背景的描边卡片。</p>
    </div>
  );
}

function MD3Navbar({ comp, isDark, onAttrChange }: RenderCompProps) {
  const a = comp.attributes;
  const h = a.size === 'sm' ? 'h-12' : a.size === 'lg' ? 'h-16' : 'h-14';
  const links = ['首页', '产品', '文档', '关于'];
  return (
    <div className={`w-full max-w-2xl ${h} rounded-xl px-4 flex items-center justify-between ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: PRIMARY }}>
          {(a.label || 'N').charAt(0)}
        </div>
        <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{a.label || '导航栏'}</span>
      </div>
      <nav className={`hidden md:flex items-center gap-1 text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
        {links.map((l, i) => (
          <button key={l} className={`px-3 h-9 rounded-lg transition-colors ${i === 0 ? (isDark ? 'bg-slate-700 text-white' : 'bg-indigo-50') : 'hover:bg-slate-100/50'}`} style={i === 0 && !isDark ? { color: PRIMARY } : {}}>{l}</button>
        ))}
      </nav>
    </div>
  );
}

function MD3Sidebar({ comp, isDark, onAttrChange }: RenderCompProps) {
  const a = comp.attributes;
  const w = a.size === 'sm' ? 'w-40' : a.size === 'lg' ? 'w-56' : 'w-48';
  const items = [
    { name: '仪表盘', icon: 'M3 12l9-9 9 9M5 10v10h14V10' },
    { name: '项目', icon: 'M3 7h18v14H3zM3 7l4-4h10l4 4' },
    { name: '设置', icon: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z' },
  ];
  return (
    <div className={`${w} h-56 rounded-xl p-3 flex flex-col gap-1 ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
      <div className={`px-3 h-10 flex items-center font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{a.label || '侧边栏'}</div>
      {items.map((it, i) => (
        <button key={it.name} className={`flex items-center gap-3 px-3 h-10 rounded-lg text-sm font-medium transition-colors ${i === 0 ? '' : isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`} style={i === 0 ? { backgroundColor: isDark ? '#334155' : '#EEF2FF', color: PRIMARY } : {}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={it.icon} />
          </svg>
          {it.name}
        </button>
      ))}
    </div>
  );
}

function MD3Container({ comp, isDark, onAttrChange }: RenderCompProps) {
  const a = comp.attributes;
  const rad = shapeRadius(a.shape);
  return (
    <div className={`w-80 h-40 ${rad} p-4 border-2 border-dashed flex items-center justify-center ${isDark ? 'border-slate-600 bg-slate-800/50 text-slate-300' : 'border-slate-300 bg-slate-50 text-slate-500'}`}>
      <div className="text-center">
        <svg className="w-10 h-10 mx-auto mb-2 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
        <div className="text-sm font-medium">{a.label || '容器'}</div>
      </div>
    </div>
  );
}

function MD3Slider({ comp, isDark, onAttrChange }: RenderCompProps) {
  const a = comp.attributes;
  const min = a.min ?? 0;
  const max = a.max ?? 100;
  const step = a.step ?? 1;
  const val = Number(a.value ?? 0);
  const percent = ((val - min) / (max - min)) * 100;
  return (
    <div className="w-64 flex items-center gap-3">
      <div className="flex-1 relative h-6 flex items-center">
        <div className={`w-full h-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
          <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: PRIMARY }} />
        </div>
        <input
          type="range"
          disabled={a.disabled}
          min={min}
          max={max}
          step={step}
          value={val}
          onChange={(e) => onAttrChange({ value: Number(e.target.value) })}
          className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div
          className="absolute w-5 h-5 rounded-full shadow-md border-2 bg-white pointer-events-none"
          style={{ left: `calc(${percent}% - 10px)`, borderColor: PRIMARY }}
        />
      </div>
      <span className={`text-xs font-mono w-10 text-right ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{val}</span>
    </div>
  );
}

function MD3Progress({ comp, isDark, onAttrChange }: RenderCompProps) {
  const a = comp.attributes;
  const col = colorValue(a.color);
  const h = a.size === 'sm' ? 'h-1.5' : a.size === 'lg' ? 'h-4' : 'h-2.5';
  const val = Math.max(0, Math.min(100, Number(a.value ?? 0)));
  return (
    <div className="w-64">
      <div className={`w-full rounded-full ${h} ${isDark ? 'bg-slate-700' : 'bg-slate-200'} overflow-hidden`}>
        <div className={`${h} rounded-full transition-all duration-300`} style={{ width: `${val}%`, backgroundColor: col }} />
      </div>
      <div className={`text-xs mt-1 font-mono text-right ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{val}%</div>
    </div>
  );
}

function MD3LoadingSpinner({ comp, isDark }: RenderCompProps) {
  const a = comp.attributes;
  const col = colorValue(a.color);
  const size = a.size === 'sm' ? 28 : a.size === 'lg' ? 56 : 40;
  if (!a.loading) return null;
  return (
    <div style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 50 50" className="animate-spin">
        <circle cx="25" cy="25" r="20" fill="none" stroke={col} strokeWidth="5" strokeLinecap="round" strokeDasharray="80 200" strokeDashoffset="0" />
      </svg>
    </div>
  );
}

function MD3LoadingDots({ comp, isDark }: RenderCompProps) {
  const a = comp.attributes;
  const col = colorValue(a.color);
  const sz = a.size === 'sm' ? 'w-2 h-2' : a.size === 'lg' ? 'w-4 h-4' : 'w-3 h-3';
  if (!a.loading) return null;
  return (
    <div className="flex items-center gap-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`${sz} rounded-full`}
          style={{ backgroundColor: col, animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite` }}
        />
      ))}
    </div>
  );
}

function MD3LoadingBar({ comp, isDark }: RenderCompProps) {
  const a = comp.attributes;
  const col = colorValue(a.color);
  const w = a.size === 'sm' ? 'w-40' : a.size === 'lg' ? 'w-80' : 'w-56';
  const h = a.size === 'sm' ? 'h-1' : a.size === 'lg' ? 'h-2' : 'h-1.5';
  if (!a.loading) return null;
  return (
    <div className={`${w} ${h} rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
      <div className={`${h} rounded-full relative`} style={{ backgroundColor: col }}>
        <div className="absolute inset-0 animate-pulse bg-white/30" />
      </div>
    </div>
  );
}

function MD3Tooltip({ comp, isDark }: RenderCompProps) {
  const a = comp.attributes;
  const sz = sizeClasses(a.size);
  return (
    <div className="relative inline-block">
      <div className={`inline-flex items-center px-3 h-10 rounded-lg text-sm font-medium border ${isDark ? 'border-slate-600 text-slate-200' : 'border-slate-300 text-slate-700'}`}>
        悬停查看提示
      </div>
      <div className={`absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full ${sz.px} py-2 rounded-xl text-xs text-white whitespace-nowrap shadow-lg`} style={{ backgroundColor: isDark ? '#475569' : '#1E293B' }}>
        {a.label || '这是提示内容'}
        <div className={`absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-t-4 border-transparent`} style={{ borderTopColor: isDark ? '#475569' : '#1E293B' }} />
      </div>
    </div>
  );
}

function MD3Badge({ comp, isDark }: RenderCompProps) {
  const a = comp.attributes;
  const col = colorValue(a.color);
  const sz = a.size === 'sm' ? 'px-2 py-0.5 text-[10px]' : a.size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs';
  return (
    <span className={`${sz} inline-flex items-center rounded-full font-bold text-white`} style={{ backgroundColor: col }}>
      {a.label || '新'}
    </span>
  );
}

function MD3Alert({ comp, isDark }: RenderCompProps) {
  const a = comp.attributes;
  const col = colorValue(a.color);
  const sz = sizeClasses(a.size);
  const bgMap: Record<string, string> = {
    primary: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)',
    secondary: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.08)',
    error: isDark ? 'rgba(244,63,94,0.15)' : 'rgba(244,63,94,0.08)',
  };
  return (
    <div className={`flex items-start gap-3 max-w-md p-4 rounded-xl border-l-4 ${sz.text}`} style={{ backgroundColor: bgMap[a.color || 'primary'], borderLeftColor: col }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" className="shrink-0 mt-0.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p className={isDark ? 'text-slate-200' : 'text-slate-700'}>{a.label || '这是一条提示信息'}</p>
    </div>
  );
}

function MD3Snackbar({ comp, isDark }: RenderCompProps) {
  const a = comp.attributes;
  const col = colorValue(a.color);
  const sz = sizeClasses(a.size);
  return (
    <div className={`inline-flex items-center gap-3 px-5 h-12 rounded-xl shadow-lg text-white ${sz.text}`} style={{ backgroundColor: col }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <span>{a.label || '操作成功'}</span>
    </div>
  );
}

function MD3Avatar({ comp, isDark }: RenderCompProps) {
  const a = comp.attributes;
  const rad = shapeRadius(a.shape);
  const sz = a.size === 'sm' ? 'w-8 h-8 text-sm' : a.size === 'lg' ? 'w-14 h-14 text-xl' : 'w-10 h-10 text-base';
  return (
    <div className={`${sz} ${rad} flex items-center justify-center font-bold text-white shadow-md`} style={{ backgroundColor: PRIMARY }}>
      {(a.label || 'U').charAt(0)}
    </div>
  );
}

function MD3Chip({ comp, isDark, onAttrChange }: RenderCompProps) {
  const a = comp.attributes;
  const col = colorValue(a.color);
  const rad = shapeRadius(a.shape);
  const sz = a.size === 'sm' ? 'px-2 py-0.5 h-6 text-xs' : a.size === 'lg' ? 'px-4 py-1.5 h-10 text-sm' : 'px-3 py-1 h-8 text-xs';
  return (
    <span className={`inline-flex items-center gap-1 ${sz} ${rad} font-semibold`} style={{ backgroundColor: `${col}15`, color: col, border: `1.5px solid ${col}50` }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      {a.label || '标签'}
    </span>
  );
}

function MD3Divider({ comp, isDark }: RenderCompProps) {
  const a = comp.attributes;
  const w = a.size === 'sm' ? 'w-40' : a.size === 'lg' ? 'w-96' : 'w-64';
  return (
    <div className={`${w} flex items-center gap-3`}>
      <div className={`flex-1 h-px ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#64748B' : '#94A3B8'} strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
      <div className={`flex-1 h-px ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
    </div>
  );
}

function MD3List({ comp, isDark }: RenderCompProps) {
  const a = comp.attributes;
  const sz = a.size === 'sm' ? 'h-10 px-3 text-xs' : a.size === 'lg' ? 'h-14 px-5 text-base' : 'h-12 px-4 text-sm';
  return (
    <div className={`w-72 rounded-xl overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
      {[1, 2, 3].map((i) => (
        <div key={i} className={`flex items-center gap-3 ${sz} ${i < 3 ? (isDark ? 'border-b border-slate-700' : 'border-b border-slate-100') : ''}`}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: i === 1 ? PRIMARY : i === 2 ? SECONDARY : ERROR }}>
            {i}
          </div>
          <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>{a.label || '列表项文本'} {i}</span>
        </div>
      ))}
    </div>
  );
}

function MD3Tabs({ comp, isDark, onAttrChange }: RenderCompProps) {
  const a = comp.attributes;
  const sz = a.size === 'sm' ? 'h-9 text-xs' : a.size === 'lg' ? 'h-12 text-base' : 'h-11 text-sm';
  const tabs = [a.label || '标签1', '标签2', '标签3'];
  const [active, setActive] = useState(0);
  return (
    <div className={`w-80 rounded-xl p-1 flex gap-1 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
      {tabs.map((t, i) => (
        <button
          key={t}
          onClick={() => setActive(i)}
          className={`flex-1 ${sz} rounded-lg font-semibold transition-all duration-200 ${
            active === i
              ? `shadow-sm ${isDark ? 'text-white' : ''}`
              : isDark
              ? 'text-slate-400 hover:text-slate-200'
              : 'text-slate-500 hover:text-slate-700'
          }`}
          style={active === i ? { backgroundColor: PRIMARY, color: 'white' } : {}}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function MD3Table({ comp, isDark }: RenderCompProps) {
  const a = comp.attributes;
  const sz = a.size === 'sm' ? 'text-xs' : a.size === 'lg' ? 'text-base' : 'text-sm';
  const rows = [
    ['ID', '名称', '状态'],
    ['1', a.label || '单元格内容', '进行中'],
    ['2', '内容 B', '已完成'],
  ];
  return (
    <div className={`rounded-xl overflow-hidden shadow-sm ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
      <table className={`${sz}`}>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i === 0 ? '' : i < rows.length - 1 ? (isDark ? 'border-b border-slate-700' : 'border-b border-slate-100') : ''}>
              {row.map((cell, j) => (
                <td key={j} className={`px-4 py-3 ${i === 0 ? `font-bold ${isDark ? 'text-white bg-slate-700/50' : 'text-slate-800 bg-slate-50'}` : isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const COMPONENT_RENDERERS: Record<string, React.FC<RenderCompProps>> = {
  'button': MD3Button,
  'button-outlined': MD3ButtonOutlined,
  'button-text': MD3ButtonText,
  'input': MD3Input,
  'textarea': MD3Textarea,
  'select': MD3Select,
  'checkbox': MD3Checkbox,
  'radio': MD3Radio,
  'switch': MD3Switch,
  'card': MD3Card,
  'card-elevated': MD3CardElevated,
  'card-outlined': MD3CardOutlined,
  'navbar': MD3Navbar,
  'sidebar': MD3Sidebar,
  'container': MD3Container,
  'slider': MD3Slider,
  'progress': MD3Progress,
  'loading-spinner': MD3LoadingSpinner,
  'loading-dots': MD3LoadingDots,
  'loading-bar': MD3LoadingBar,
  'tooltip': MD3Tooltip,
  'badge': MD3Badge,
  'alert': MD3Alert,
  'snackbar': MD3Snackbar,
  'avatar': MD3Avatar,
  'chip': MD3Chip,
  'divider': MD3Divider,
  'list': MD3List,
  'tabs': MD3Tabs,
  'table': MD3Table,
};

function AttributeEditor({ comp, isDark, getDefinition, onUpdate, onRemove }: {
  comp: WorkspaceComponent;
  isDark: boolean;
  getDefinition: (t: string) => ReturnType<typeof import('../context/AppContext').useApp>['getDefinition'];
  onUpdate: (attrs: ComponentAttributes) => void;
  onRemove: () => void;
}) {
  const def = getDefinition(comp.type);
  if (!def) return null;

  const labelClass = `text-xs font-semibold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`;
  const inputClass = `w-full h-9 px-3 rounded-lg text-sm border outline-none transition-colors ${
    isDark
      ? 'bg-slate-800 border-slate-600 text-slate-100 focus:border-indigo-400'
      : 'bg-white border-slate-300 text-slate-800 focus:border-indigo-500'
  }`;
  const selectClass = inputClass + ' appearance-none cursor-pointer';

  const editable = def.editableAttributes;

  const renderField = (key: string) => {
    const val = comp.attributes;
    switch (key) {
      case 'size':
        return (
          <div>
            <div className={labelClass}>大小</div>
            <select className={selectClass} value={val.size || 'md'} onChange={(e) => onUpdate({ size: e.target.value as ButtonSize })}>
              <option value="sm">小 (sm)</option>
              <option value="md">中 (md)</option>
              <option value="lg">大 (lg)</option>
            </select>
          </div>
        );
      case 'color':
        return (
          <div>
            <div className={labelClass}>主题色</div>
            <select className={selectClass} value={val.color || 'primary'} onChange={(e) => onUpdate({ color: e.target.value as ColorTheme })}>
              <option value="primary">靛蓝 (Primary)</option>
              <option value="secondary">翠绿 (Secondary)</option>
              <option value="error">玫瑰红 (Error)</option>
            </select>
          </div>
        );
      case 'shape':
        return (
          <div>
            <div className={labelClass}>形状</div>
            <select className={selectClass} value={val.shape || 'rounded'} onChange={(e) => onUpdate({ shape: e.target.value as ShapeVariant })}>
              <option value="rounded">圆角 (rounded)</option>
              <option value="square">直角 (square)</option>
              <option value="pill">胶囊 (pill)</option>
            </select>
          </div>
        );
      case 'label':
        return (
          <div>
            <div className={labelClass}>标签/标题</div>
            <input className={inputClass} value={val.label ?? ''} onChange={(e) => onUpdate({ label: e.target.value })} />
          </div>
        );
      case 'placeholder':
        return (
          <div>
            <div className={labelClass}>占位符</div>
            <input className={inputClass} value={val.placeholder ?? ''} onChange={(e) => onUpdate({ placeholder: e.target.value })} />
          </div>
        );
      case 'value':
        if (typeof val.value === 'number') {
          return (
            <div>
              <div className={labelClass}>数值</div>
              <input type="number" className={inputClass} value={val.value as number} onChange={(e) => onUpdate({ value: Number(e.target.value) })} />
            </div>
          );
        }
        return (
          <div>
            <div className={labelClass}>值</div>
            <input className={inputClass} value={String(val.value ?? '')} onChange={(e) => onUpdate({ value: e.target.value })} />
          </div>
        );
      case 'disabled':
        return (
          <div className="flex items-center justify-between">
            <div className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>禁用状态</div>
            <button
              onClick={() => onUpdate({ disabled: !val.disabled })}
              className={`relative w-11 h-6 rounded-full transition-colors`}
              style={{ backgroundColor: val.disabled ? PRIMARY : isDark ? '#334155' : '#CBD5E1' }}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${val.disabled ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>
        );
      case 'checked':
        return (
          <div className="flex items-center justify-between">
            <div className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>选中状态</div>
            <button
              onClick={() => onUpdate({ checked: !val.checked })}
              className={`relative w-11 h-6 rounded-full transition-colors`}
              style={{ backgroundColor: val.checked ? PRIMARY : isDark ? '#334155' : '#CBD5E1' }}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${val.checked ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>
        );
      case 'loading':
        return (
          <div className="flex items-center justify-between">
            <div className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>加载状态</div>
            <button
              onClick={() => onUpdate({ loading: !val.loading })}
              className={`relative w-11 h-6 rounded-full transition-colors`}
              style={{ backgroundColor: val.loading ? PRIMARY : isDark ? '#334155' : '#CBD5E1' }}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${val.loading ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>
        );
      case 'min':
      case 'max':
      case 'step':
        return (
          <div>
            <div className={labelClass}>{key === 'min' ? '最小值' : key === 'max' ? '最大值' : '步进'}</div>
            <input type="number" className={inputClass} value={(val as any)[key] ?? 0} onChange={(e) => onUpdate({ [key]: Number(e.target.value) } as ComponentAttributes)} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`mt-4 p-4 rounded-xl border transition-all duration-300 ${
      isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white/60 border-slate-200'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
          <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: def.iconColor }} />
          {def.name} 属性
        </div>
        <button
          onClick={onRemove}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            isDark ? 'text-slate-400 hover:bg-rose-500/20 hover:text-rose-400' : 'text-slate-400 hover:bg-rose-50 hover:text-rose-500'
          }`}
          title="删除组件"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6M10 11v6M14 11v6" />
            <path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2" />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {editable.map((k) => (
          <div key={k}>{renderField(k)}</div>
        ))}
      </div>
    </div>
  );
}

export default function ComponentRenderer() {
  const { state, dispatch, getDefinition } = useApp();
  const isDark = state.theme === 'dark';
  const sorted = [...state.components].sort((a, b) => a.order - b.order);

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragStartPos = useRef<number>(0);

  const handleAttrChange = (instanceId: string, attrs: ComponentAttributes) => {
    dispatch({ type: 'UPDATE_ATTRIBUTES', payload: { instanceId, attributes: attrs } });
  };

  const handleRemove = (instanceId: string) => {
    dispatch({ type: 'REMOVE_COMPONENT', payload: { instanceId } });
  };

  const handleAutoSave = () => {
    const snapshot = createSnapshot(state.components, state.theme);
    setSnapshotToURL(snapshot);
  };

  const onDragStart = (e: React.DragEvent, id: string, index: number) => {
    setDraggedId(id);
    dragStartPos.current = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) setDragOverIndex(index);
  };

  const onDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (!draggedId) return;
    const newSorted = [...sorted];
    const fromIdx = newSorted.findIndex((c) => c.instanceId === draggedId);
    if (fromIdx === -1) {
      setDraggedId(null);
      setDragOverIndex(null);
      return;
    }
    const [removed] = newSorted.splice(fromIdx, 1);
    const targetIdx = dropIndex > fromIdx ? dropIndex - 1 : dropIndex;
    newSorted.splice(targetIdx, 0, removed);
    dispatch({ type: 'REORDER_COMPONENTS', payload: { components: newSorted } });
    setDraggedId(null);
    setDragOverIndex(null);
    setTimeout(handleAutoSave, 0);
  };

  const onDragEnd = () => {
    setDraggedId(null);
    setDragOverIndex(null);
  };

  const workspaceBg = isDark
    ? 'bg-gradient-to-br from-[#0F172A] via-[#0F172A] to-[#1E293B]'
    : 'bg-gradient-to-br from-[#FAFAFA] via-[#FAFAFA] to-[#F3F4F6]';
  const borderColor = isDark ? '#334155' : '#CBD5E1';

  return (
    <main className={`flex-1 overflow-y-auto ${workspaceBg} transition-colors duration-500`}>
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        {sorted.length === 0 ? (
          <div className="h-[70vh] flex flex-col items-center justify-center text-center">
            <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-6 ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-xl`}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </div>
            <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>开始创建你的组件示例</h2>
            <p className={`max-w-md ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              点击左侧组件库中的任意组件，即可在工作区中添加并实时调整属性，或通过分享链接与团队成员协作。
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {['按钮', '卡片', '滑块', '开关'].map((t) => (
                <div key={t} className={`px-4 py-2 rounded-full text-sm font-medium ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600 shadow-sm'}`}>
                  {t}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {sorted.map((comp, idx) => {
              const Renderer = COMPONENT_RENDERERS[comp.type];
              const isSelected = state.selectedInstanceId === comp.instanceId;
              const isDragging = draggedId === comp.instanceId;
              const showPlaceholder = dragOverIndex === idx && draggedId && draggedId !== comp.instanceId;
              return (
                <div key={comp.instanceId} className="relative">
                  {showPlaceholder && (
                    <div
                      className="mb-5 rounded-xl"
                      style={{ height: 180, backgroundColor: 'rgba(59, 130, 246, 0.2)', border: '2px dashed #3B82F6', opacity: 0.5 }}
                    />
                  )}
                  <div
                    draggable
                    onDragStart={(e) => onDragStart(e, comp.instanceId, idx)}
                    onDragOver={(e) => onDragOver(e, idx)}
                    onDrop={(e) => onDrop(e, idx)}
                    onDragEnd={onDragEnd}
                    onClick={() => dispatch({ type: 'SELECT_COMPONENT', payload: { instanceId: comp.instanceId } })}
                    className={`group relative rounded-xl transition-all duration-300 cursor-pointer ${
                      isDragging ? 'opacity-40' : ''
                    }`}
                    style={{
                      border: `2px dashed ${borderColor}`,
                      boxShadow: isSelected
                        ? `0 4px 8px rgba(0,0,0,0.1), inset 0 0 0 2px rgba(99,102,241,0.3), inset 0 2px 4px rgba(0,0,0,0.05)`
                        : 'inset 0 2px 4px rgba(0,0,0,0.05)',
                      transition: 'box-shadow 0.2s ease-out, transform 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 8px rgba(0,0,0,0.1), inset 0 2px 4px rgba(0,0,0,0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLDivElement).style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.05)';
                      }
                    }}
                  >
                    <div className="absolute -top-3 left-4 flex items-center gap-2 z-10">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-sm ${
                          isDark ? 'bg-slate-700 text-slate-200' : 'bg-white text-slate-600'
                        }`}
                      >
                        {getDefinition(comp.type)?.name || comp.type}
                      </span>
                    </div>
                    <div className="absolute -top-3 right-4 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          onDragStart(e, comp.instanceId, idx);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing ${
                          isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-white text-slate-500 hover:bg-slate-100'
                        } shadow-sm`}
                        title="拖动排序"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="9" cy="5" r="1.2" />
                          <circle cx="15" cy="5" r="1.2" />
                          <circle cx="9" cy="12" r="1.2" />
                          <circle cx="15" cy="12" r="1.2" />
                          <circle cx="9" cy="19" r="1.2" />
                          <circle cx="15" cy="19" r="1.2" />
                        </svg>
                      </button>
                    </div>

                    <div className="p-8 pt-7 flex items-center justify-center min-h-[140px]">
                      {Renderer ? (
                        <Renderer
                          comp={comp}
                          isDark={isDark}
                          onAttrChange={(attrs) => handleAttrChange(comp.instanceId, attrs)}
                        />
                      ) : (
                        <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          未知组件: {comp.type}
                        </div>
                      )}
                    </div>

                    {isSelected && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <AttributeEditor
                          comp={comp}
                          isDark={isDark}
                          getDefinition={getDefinition}
                          onUpdate={(attrs) => handleAttrChange(comp.instanceId, attrs)}
                          onRemove={() => handleRemove(comp.instanceId)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </main>
  );
}
