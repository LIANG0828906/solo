import { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import {
  getAdjacentNodes,
  symbiosisTypeLabel,
  type SymbiosisType,
} from '../data/plantData';

const ICON_OPTIONS = ['🌻', '🌿', '🌵', '🍅', '🌹', '🥕', '🫘', '🌽', '🍃', '🌼', '🌱', '🌳', '🌲', '🍀', '🌺', '🌷', '🪴', '🍎', '🍇', '🍊'];

export default function SidePanel() {
  const { selectedNodeId, plants, setSelectedNode, showAddForm, toggleAddForm, addPlant, isSidePanelOpen, toggleSidePanel, isDrawerOpen, toggleDrawer } = useAppStore();

  const [name, setName] = useState('');
  const [scientificName, setScientificName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🌱');

  const selectedPlant = plants.find((p) => p.id === selectedNodeId);
  const adjacents = selectedPlant ? getAdjacentNodes(selectedPlant.id) : [];

  const resetForm = () => {
    setName('');
    setScientificName('');
    setDescription('');
    setSelectedIcon('🌱');
  };

  const handleSave = () => {
    if (!name.trim()) return;
    addPlant({
      name: name.trim(),
      scientificName: scientificName.trim() || 'Unknown sp.',
      description: description.trim() || '暂无描述。',
      icon: selectedIcon,
    });
    resetForm();
  };

  const handleCancel = () => {
    toggleAddForm();
    resetForm();
  };

  const panelContent = (
    <>
      {showAddForm && (
        <div className="panel-section">
          <div className="panel-section-title">新增植物</div>
          <div className="add-form">
            <div className="form-group">
              <label className="form-label">名称 *</label>
              <input
                className="form-input"
                placeholder="如：薰衣草"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">学名</label>
              <input
                className="form-input"
                placeholder="如：Lavandula"
                value={scientificName}
                onChange={(e) => setScientificName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">描述</label>
              <textarea
                className="form-input form-textarea"
                placeholder="描述植物的习性和特点..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">选择图标</label>
              <div className="icon-picker">
                {ICON_OPTIONS.map((icon) => (
                  <button
                    key={icon}
                    className={`icon-option ${icon === selectedIcon ? 'active' : ''}`}
                    onClick={() => setSelectedIcon(icon)}
                    type="button"
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-actions">
              <button className="form-btn secondary" onClick={handleCancel} type="button">
                取消
              </button>
              <button
                className="form-btn primary"
                onClick={handleSave}
                type="button"
                disabled={!name.trim()}
                style={{ opacity: name.trim() ? 1 : 0.5, cursor: name.trim() ? 'pointer' : 'not-allowed' }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPlant ? (
        <>
          <div className="panel-section">
            <div className="panel-section-title">植物详情</div>
            <div className="plant-detail-header">
              <div className="plant-icon-lg">{selectedPlant.icon}</div>
              <div className="plant-names">
                <div className="plant-name">{selectedPlant.name}</div>
                <div className="plant-scientific-name">{selectedPlant.scientificName}</div>
              </div>
            </div>
            <div className="plant-image-placeholder">
              <div className="big-icon">{selectedPlant.icon}</div>
              <div>图片占位符</div>
            </div>
            <p className="plant-description">{selectedPlant.description}</p>
          </div>

          <div className="panel-section">
            <div className="panel-section-title">
              共生关系 ({adjacents.length})
            </div>
            {adjacents.length === 0 ? (
              <div className="empty-state" style={{ padding: '16px 8px' }}>
                <div>暂无共生关系</div>
              </div>
            ) : (
              <div className="neighbors-list">
                {adjacents.map(({ plant, link }) => (
                  <div
                    key={`${plant.id}-${link.id}`}
                    className="neighbor-item"
                    onClick={() => setSelectedNode(plant.id)}
                  >
                    <span className="neighbor-icon">{plant.icon}</span>
                    <div className="neighbor-info">
                      <div className="neighbor-name">{plant.name}</div>
                      <div className="neighbor-relation">{link.description}</div>
                    </div>
                    <span className={`relation-tag ${link.type as SymbiosisType}`}>
                      {symbiosisTypeLabel[link.type]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="panel-section">
          <div className="panel-section-title">欢迎</div>
          <div className="empty-state">
            <div className="empty-state-icon">🌱</div>
            <div style={{ marginBottom: 8, fontWeight: 500, color: 'var(--color-text)' }}>
              植物共生网络
            </div>
            <div>
              点击图谱中的植物节点查看详情
              <br />
              按住 <kbd style={{
                background: 'var(--color-bg-input)',
                border: '1px solid var(--color-border)',
                padding: '1px 6px',
                borderRadius: 3,
                fontFamily: 'monospace',
                fontSize: 11,
              }}>Ctrl</kbd> 拖拽节点可创建新连线
            </div>
          </div>
        </div>
      )}

      <button className="add-plant-btn" onClick={toggleAddForm} type="button">
        <span>＋</span>
        <span>{showAddForm ? '收起表单' : '新增植物'}</span>
      </button>
    </>
  );

  return (
    <>
      <aside className={`side-panel ${!isSidePanelOpen ? 'collapsed' : ''}`}>
        {isSidePanelOpen && panelContent}
        {!isSidePanelOpen && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            paddingTop: 8,
          }}>
            <span style={{ fontSize: 22 }}>🌿</span>
          </div>
        )}
      </aside>

      <button className="panel-toggle-btn" onClick={toggleSidePanel} type="button">
        {isSidePanelOpen ? '›' : '‹'}
      </button>

      {isDrawerOpen && (
        <>
          <div className="drawer-overlay" onClick={toggleDrawer} />
          <div className="bottom-drawer">
            <div className="drawer-handle" />
            {panelContent}
          </div>
        </>
      )}

      <button className="drawer-btn" onClick={toggleDrawer} type="button">
        🌿
      </button>
    </>
  );
}
