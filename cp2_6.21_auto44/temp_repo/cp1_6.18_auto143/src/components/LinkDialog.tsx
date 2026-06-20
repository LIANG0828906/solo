import { useState } from 'react';
import type { SymbiosisType } from '../data/plantData';
import { symbiosisTypeLabel, symbiosisShortLabel } from '../data/plantData';
import { useAppStore } from '../stores/appStore';

const TYPES: SymbiosisType[] = ['mutualism', 'commensalism', 'antagonism'];

export default function LinkDialog() {
  const { linkDialog, closeLinkDialog, addLink, plants } = useAppStore();
  const [selectedType, setSelectedType] = useState<SymbiosisType | null>(null);
  const [description, setDescription] = useState('');

  if (!linkDialog.show || !linkDialog.sourceId || !linkDialog.targetId) return null;

  const source = plants.find((p) => p.id === linkDialog.sourceId);
  const target = plants.find((p) => p.id === linkDialog.targetId);

  const handleConfirm = () => {
    if (!selectedType) return;
    const desc =
      description.trim() ||
      `${source?.name || '植物'}与${target?.name || '植物'}建立${symbiosisTypeLabel[selectedType]}关系`;
    addLink(linkDialog.sourceId!, linkDialog.targetId!, selectedType, desc);
    setSelectedType(null);
    setDescription('');
  };

  const handleCancel = () => {
    closeLinkDialog();
    setSelectedType(null);
    setDescription('');
  };

  return (
    <div className="link-dialog-overlay" onClick={handleCancel}>
      <div className="link-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="link-dialog-title">创建共生关系</h3>
        <p className="link-dialog-subtitle">
          {source?.icon} {source?.name} ↔ {target?.icon} {target?.name}
        </p>

        <div className="link-type-options">
          {TYPES.map((t) => (
            <button
              key={t}
              className={`link-type-btn ${t}`}
              onClick={() => setSelectedType(t)}
              style={{
                borderColor: selectedType === t ? '#fff' : 'transparent',
              }}
            >
              <span>{symbiosisTypeLabel[t]}</span>
              <span className="link-type-short">{symbiosisShortLabel[t]}</span>
            </button>
          ))}
        </div>

        <textarea
          className="link-desc-input"
          placeholder="输入关系描述（可选）..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="link-dialog-actions">
          <button className="form-btn secondary" onClick={handleCancel}>
            取消
          </button>
          <button
            className="form-btn primary"
            onClick={handleConfirm}
            disabled={!selectedType}
            style={{ opacity: selectedType ? 1 : 0.5, cursor: selectedType ? 'pointer' : 'not-allowed' }}
          >
            确认创建
          </button>
        </div>
      </div>
    </div>
  );
}
