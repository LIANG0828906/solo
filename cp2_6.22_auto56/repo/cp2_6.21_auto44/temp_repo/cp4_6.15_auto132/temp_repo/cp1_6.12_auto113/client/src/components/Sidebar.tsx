import { Card, GroupType } from '../../../shared/types';
import './Sidebar.css';

interface GroupInfo {
  key: GroupType | string;
  label: string;
}

interface SidebarProps {
  groups: GroupInfo[];
  activeGroup: string;
  onGroupChange: (group: string) => void;
  cards: Card[];
}

const Sidebar = ({ groups, activeGroup, onGroupChange, cards }: SidebarProps) => {
  const getCountForGroup = (groupKey: string): number => {
    if (groupKey === 'all') return cards.length;
    return cards.filter(c => c.group === groupKey).length;
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3 className="sidebar-title">分组</h3>
      </div>
      <nav className="sidebar-nav">
        <button
          className={`group-item ${activeGroup === 'all' ? 'active' : ''}`}
          onClick={() => onGroupChange('all')}
        >
          <span className="group-label">全部</span>
          <span className="group-count">{getCountForGroup('all')}</span>
        </button>
        {groups.map(group => (
          <button
            key={group.key}
            className={`group-item ${activeGroup === group.key ? 'active' : ''}`}
            onClick={() => onGroupChange(group.key)}
          >
            <span className="group-label">{group.label}</span>
            <span className="group-count">{getCountForGroup(group.key)}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
