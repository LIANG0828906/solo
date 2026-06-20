import type { ActiveTab } from '../types';

interface TabNavProps {
  active: ActiveTab;
  onChange: (tab: ActiveTab) => void;
}

const TABS: Array<{ key: ActiveTab; label: string; icon: string }> = [
  { key: 'skills', label: '技能分析', icon: '🎯' },
  { key: 'timeline', label: '经历时间线', icon: '📅' },
  { key: 'matching', label: '岗位匹配', icon: '💼' }
];

export function TabNav({ active, onChange }: TabNavProps) {
  return (
    <nav className="tab-nav" role="tablist">
      {TABS.map((t) => {
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={isActive}
            className={`tab-item ${isActive ? 'active' : ''}`}
            onClick={() => onChange(t.key)}
          >
            <span style={{ marginRight: 6 }}>{t.icon}</span>
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}

export default TabNav;
