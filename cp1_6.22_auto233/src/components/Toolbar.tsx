import { useState } from 'react';
import { useBoard } from '@/data/cardStore';

interface ToolbarProps {
  onExport: () => void;
}

export default function Toolbar({ onExport }: ToolbarProps) {
  const [expanded, setExpanded] = useState(true);
  const { state, addCard, toggleSwimlane, undo, redo } = useBoard();

  const handleAddCharacter = () => addCard('character');
  const handleAddScene = () => addCard('scene');
  const handleAddSwatch = () => addCard('swatch');

  const tools = [
    { icon: '👤', label: '添加角色', onClick: handleAddCharacter, section: 'add' },
    { icon: '🏞️', label: '添加场景', onClick: handleAddScene, section: 'add' },
    { icon: '🎨', label: '添加色票', onClick: handleAddSwatch, section: 'add' },
    {
      icon: state.swimlaneView ? '📐' : '📊',
      label: state.swimlaneView ? '自由视图' : '泳道视图',
      onClick: toggleSwimlane,
      section: 'view',
      active: state.swimlaneView,
    },
    { icon: '⬇️', label: '导出PNG', onClick: onExport, section: 'export' },
    { icon: '↩️', label: '撤销', onClick: undo, section: 'history' },
    { icon: '↪️', label: '重做', onClick: redo, section: 'history' },
  ];

  const sections = ['add', 'view', 'export', 'history'];

  return (
    <div className={`toolbar ${expanded ? 'expanded' : 'collapsed'}`}>
      <button
        className="toolbar-btn"
        onClick={() => setExpanded(!expanded)}
        style={{ marginBottom: '8px' }}
      >
        <span className="toolbar-btn-icon">{expanded ? '◀' : '▶'}</span>
        {expanded && <span className="toolbar-btn-label">收起</span>}
      </button>

      {sections.map((section, sectionIndex) => (
        <div key={section}>
          {sectionIndex > 0 && <div className="toolbar-divider" />}
          <div className="toolbar-section">
            {tools
              .filter((t) => t.section === section)
              .map((tool) => (
                <button
                  key={tool.label}
                  className={`toolbar-btn ${tool.active ? 'active' : ''}`}
                  onClick={tool.onClick}
                  title={tool.label}
                >
                  <span className="toolbar-btn-icon">{tool.icon}</span>
                  <span className="toolbar-btn-label">{tool.label}</span>
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
