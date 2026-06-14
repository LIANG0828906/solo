import React, { useRef, useCallback } from 'react';
import { useParamsStore } from '@/store/paramsStore';
import { exportConfig, importConfig } from '@/utils/serializer';
import TargetButton from './TargetButton';
import { Download, Upload, Plus, X } from 'lucide-react';

const PreviewArea: React.FC = () => {
  const params = useParamsStore((s) => s.params);
  const snapshots = useParamsStore((s) => s.snapshots);
  const activeSnapshotId = useParamsStore((s) => s.activeSnapshotId);
  const addSnapshot = useParamsStore((s) => s.addSnapshot);
  const removeSnapshot = useParamsStore((s) => s.removeSnapshot);
  const switchSnapshot = useParamsStore((s) => s.switchSnapshot);
  const importState = useParamsStore((s) => s.importState);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = useCallback(() => {
    const state = useParamsStore.getState();
    const json = exportConfig({
      params: state.params,
      snapshots: state.snapshots,
      activeSnapshotId: state.activeSnapshotId,
    });
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'component-params-config.json';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text !== 'string') return;
      const config = importConfig(text);
      if (config) {
        importState(config.params, config.snapshots, config.activeSnapshotId);
      } else {
        alert('导入失败：配置文件格式不正确');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [importState]);

  const handleAddSnapshot = useCallback(() => {
    const count = snapshots.length + 1;
    addSnapshot(`快照 ${count}`);
  }, [snapshots.length, addSnapshot]);

  return (
    <div className="preview-area">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 160px 12px 20px',
        borderBottom: '1px solid #e2e8f0',
        background: '#ffffff',
        flexShrink: 0,
        minHeight: '60px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          flex: 1,
          paddingBottom: '2px',
        }}>
          {snapshots.map((snapshot) => (
            <div
              key={snapshot.id}
              onClick={() => switchSnapshot(snapshot.id)}
              className={
                'snapshot-tab ' +
                (activeSnapshotId === snapshot.id ? 'snapshot-tab-active' : '')
              }
            >
              <span style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: '100%',
                textAlign: 'center',
              }}>
                {snapshot.name}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeSnapshot(snapshot.id);
                }}
                style={{
                  position: 'absolute',
                  right: '4px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#94a3b8',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {snapshots.length < 10 && (
            <button
              onClick={handleAddSnapshot}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#ffffff',
                border: '1px dashed #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#94a3b8',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.color = '#3b82f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              <Plus size={16} />
            </button>
          )}
        </div>

        <div className="io-buttons">
          <button onClick={handleExport} className="io-btn">
            <Download size={14} />
            导出
          </button>
          <button onClick={handleImport} className="io-btn">
            <Upload size={14} />
            导入
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        overflow: 'auto',
        padding: '24px',
        position: 'relative',
      }}>
        <div className="phone-shell">
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '120px',
            height: '28px',
            background: '#cbd5e1',
            borderRadius: '14px',
          }} />
          <TargetButton params={params} />
        </div>
      </div>
    </div>
  );
};

export default PreviewArea;
