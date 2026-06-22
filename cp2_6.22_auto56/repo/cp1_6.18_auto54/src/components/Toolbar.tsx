import React, { useState } from 'react';
import { Link, Save, Trash2, X } from 'lucide-react';
import { useStarStore, useConstellationStore } from '@/modules/DataManager';

interface ToolbarProps {
  onConnect: () => void;
  onSave: (name: string) => void;
  onClear: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ onConnect, onSave, onClear }) => {
  const { selectedStarIds, clearSelection } = useStarStore();
  const { connections } = useConstellationStore();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [constellationName, setConstellationName] = useState('');

  const handleConnect = () => {
    if (selectedStarIds.length >= 2) {
      onConnect();
    }
  };

  const handleSave = () => {
    if (constellationName.trim()) {
      onSave(constellationName.trim());
      setConstellationName('');
      setShowSaveDialog(false);
    }
  };

  const handleClear = () => {
    clearSelection();
    onClear();
  };

  const canConnect = selectedStarIds.length >= 2;
  const canSave = connections.length > 0;

  return (
    <div className="toolbar">
      <button
        className={`toolbar__btn ${canConnect ? '' : 'toolbar__btn--disabled'}`}
        onClick={handleConnect}
        disabled={!canConnect}
        title={canConnect ? `连接 ${selectedStarIds.length} 颗恒星` : '按住 Shift 点击选择两颗或更多恒星'}
      >
        <Link size={16} />
        <span>连接</span>
        {selectedStarIds.length > 0 && (
          <span className="toolbar__badge">{selectedStarIds.length}</span>
        )}
      </button>

      <button
        className={`toolbar__btn ${canSave ? '' : 'toolbar__btn--disabled'}`}
        onClick={() => setShowSaveDialog(true)}
        disabled={!canSave}
        title="保存星座"
      >
        <Save size={16} />
        <span>保存</span>
      </button>

      <button className="toolbar__btn toolbar__btn--danger" onClick={handleClear} title="清除画布">
        <Trash2 size={16} />
        <span>清除</span>
      </button>

      {selectedStarIds.length > 0 && (
        <button className="toolbar__btn toolbar__btn--secondary" onClick={clearSelection}>
          <X size={16} />
          <span>取消选择</span>
        </button>
      )}

      {showSaveDialog && (
        <div className="save-dialog-overlay" onClick={() => setShowSaveDialog(false)}>
          <div className="save-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 className="save-dialog__title">保存星座</h3>
            <input
              type="text"
              className="save-dialog__input"
              placeholder="输入星座名称..."
              value={constellationName}
              onChange={(e) => setConstellationName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <div className="save-dialog__actions">
              <button className="save-dialog__btn save-dialog__btn--cancel" onClick={() => setShowSaveDialog(false)}>
                取消
              </button>
              <button
                className="save-dialog__btn save-dialog__btn--confirm"
                onClick={handleSave}
                disabled={!constellationName.trim()}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Toolbar;
