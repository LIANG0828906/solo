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
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minWidth: 0,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        borderBottom: '1px solid #e2e8f0',
        background: '#ffffff',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          flex: 1,
        }}>
          {snapshots.map((snapshot) => (
            <div
              key={snapshot.id}
              onClick={() => switchSnapshot(snapshot.id)}
              style={{
                width: '120px',
                height: '36px',
                borderRadius: '8px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 400,
                color: '#475569',
                position: 'relative',
                flexShrink: 0,
                borderBottom: activeSnapshotId === snapshot.id
                  ? '2px solid #3b82f6'
                  : '2px solid transparent',
                transition: 'border-color 0.15s ease',
                padding: '0 28px 0 12px',
              }}
            >
              <span style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
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
        <div style={{ display: 'flex', gap: '8px', marginLeft: '12px', flexShrink: 0 }}>
          <button
            onClick={handleExport}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#475569',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2563eb';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.color = '#475569';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <Download size={14} />
            导出
          </button>
          <button
            onClick={handleImport}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#475569',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2563eb';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.color = '#475569';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
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
      }}>
        <div style={{
          width: '375px',
          height: '812px',
          background: '#f1f5f9',
          borderRadius: '40px',
          border: '4px solid #cbd5e1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
        }}>
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
