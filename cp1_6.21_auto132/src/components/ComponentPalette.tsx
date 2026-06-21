import React, { useMemo, useState } from 'react';
import { useApp, COMPONENT_DEFINITIONS, type ComponentDefinition } from '../context/AppContext';

function CategoryIcon({ color, type }: { color: string; type: string }) {
  const shapes = [
    type.includes('button') ? 'M8 5h8a3 3 0 013 3v8a3 3 0 01-3 3H8a3 3 0 01-3-3V8a3 3 0 013-3z' :
    type.includes('input') || type.includes('textarea') || type.includes('select') ? 'M4 7h16v10H4z' :
    type.includes('card') || type.includes('container') ? 'M4 4h16v16H4z' :
    type.includes('navbar') || type.includes('sidebar') ? 'M3 5h18v4H3zM3 11h18v8H3z' :
    type.includes('slider') || type.includes('progress') ? 'M3 10h18M7 10a3 3 0 110-6 3 3 0 010 6z' :
    type.includes('loading') ? 'M12 3a9 9 0 11-6.36 2.64' :
    type.includes('checkbox') || type.includes('radio') || type.includes('switch') ? 'M4 12l4 4L20 6' :
    type.includes('avatar') ? 'M12 12a4 4 0 100-8 4 4 0 000 8zm-8 8a8 8 0 0116 0' :
    type.includes('badge') || type.includes('chip') ? 'M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z' :
    type.includes('alert') || type.includes('snackbar') || type.includes('tooltip') ? 'M12 2l10 18H2z' :
    type.includes('divider') ? 'M3 12h18' :
    type.includes('list') ? 'M4 6h16M4 12h16M4 18h16' :
    type.includes('tabs') ? 'M3 5h18v14H3zM3 9h5v-4zM10 9h5v-4zM17 9h4v-4z' :
    type.includes('table') ? 'M3 5h18v14H3zM3 10h18M8 5v14M13 5v14' :
    'M4 4h16v16H4z',
  ];
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={shapes[0]} />
    </svg>
  );
}

export default function ComponentPalette() {
  const { dispatch, state } = useApp();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    基础组件: true,
    容器组件: true,
    交互组件: true,
    反馈组件: true,
    数据展示: true,
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const grouped = useMemo(() => {
    const result: Record<string, ComponentDefinition[]> = {};
    COMPONENT_DEFINITIONS.forEach((def) => {
      if (!result[def.category]) result[def.category] = [];
      result[def.category].push(def);
    });
    return result;
  }, []);

  const handleClick = (def: ComponentDefinition) => {
    dispatch({ type: 'ADD_COMPONENT', payload: { definition: def } });
  };

  const toggleCategory = (cat: string) => {
    setExpanded((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const paletteClasses = `
    palette-sidebar fixed md:relative z-40 h-full flex flex-col transition-all duration-300
    ${state.theme === 'light' ? 'bg-[#F1F5F9]' : 'bg-[#1E293B]'}
  `;

  const textClass = state.theme === 'light' ? 'text-slate-700' : 'text-slate-200';
  const subTextClass = state.theme === 'light' ? 'text-slate-500' : 'text-slate-400';
  const borderClass = state.theme === 'light' ? 'border-slate-200' : 'border-slate-700';
  const hoverBg = state.theme === 'light' ? 'hover:bg-slate-200/70' : 'hover:bg-slate-700/50';

  return (
    <>
      <button
        className={`md:hidden fixed top-3 left-3 z-50 w-10 h-10 rounded-lg flex items-center justify-center ${
          state.theme === 'light' ? 'bg-white shadow' : 'bg-slate-700'
        }`}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <svg className={textClass} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d={mobileOpen ? 'M6 6l12 12M6 18L18 6' : 'M3 6h18M3 12h18M3 18h18'} />
        </svg>
      </button>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`${paletteClasses} md:w-[260px] w-60 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className={`p-4 border-b ${borderClass}`}>
          <h2 className={`text-base font-semibold ${textClass}`}>组件库</h2>
          <p className={`text-xs mt-1 ${subTextClass}`}>点击添加到工作区</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {Object.entries(grouped).map(([category, defs]) => (
            <div key={category}>
              <button
                onClick={() => toggleCategory(category)}
                className={`w-full flex items-center justify-between px-2 py-2 rounded-lg ${hoverBg} ${textClass} transition-colors`}
              >
                <span className="text-sm font-medium">{category}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${expanded[category] ? 'rotate-90' : ''} ${subTextClass}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
              {expanded[category] && (
                <ul className="mt-1 space-y-0.5">
                  {defs.map((def) => (
                    <li key={def.type}>
                      <button
                        onClick={() => handleClick(def)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 ${hoverBg} ${textClass} group`}
                      >
                        <CategoryIcon color={def.iconColor} type={def.type} />
                        <span className="text-sm">{def.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div className={`p-4 border-t ${borderClass}`}>
          <p className={`text-xs ${subTextClass}`}>共 {COMPONENT_DEFINITIONS.length} 个组件</p>
        </div>
      </aside>
    </>
  );
}
