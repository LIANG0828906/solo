import { useState, useRef } from 'react';
import { useStore } from '@/store';
import { Save, FolderOpen, Download, Upload, Trash2, Camera, X } from 'lucide-react';
import type { Snapshot } from '@/store';

export default function SnapshotManager() {
  const snapshots = useStore((s) => s.snapshots);
  const saveSnapshot = useStore((s) => s.saveSnapshot);
  const loadSnapshot = useStore((s) => s.loadSnapshot);
  const deleteSnapshot = useStore((s) => s.deleteSnapshot);
  const exportSnapshot = useStore((s) => s.exportSnapshot);
  const importSnapshot = useStore((s) => s.importSnapshot);

  const [name, setName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    const snapshotName = name.trim() || `快照 ${Date.now()}`;
    let thumbnail = '';
    try {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        thumbnail = canvas.toDataURL('image/png');
      }
    } catch {
      thumbnail = '';
    }
    saveSnapshot(snapshotName, thumbnail);
    setName('');
  };

  const handleExport = () => {
    const allData: Snapshot[] = snapshots.map((snap) => {
      const json = exportSnapshot(snap.id);
      return JSON.parse(json) as Snapshot;
    });
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'archlight-snapshots.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as Snapshot[];
        if (Array.isArray(parsed)) {
          parsed.forEach((snap) => {
            importSnapshot(JSON.stringify(snap));
          });
        }
      } catch {}
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#cdd6f4' }}>
        <Camera size={16} />
        <span>快照管理</span>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="快照名称"
          style={{
            flex: 1,
            background: '#313244',
            border: '1px solid #45475a',
            borderRadius: 6,
            padding: '6px 10px',
            color: '#cdd6f4',
            fontSize: 12,
            outline: 'none',
          }}
        />
        <button
          onClick={handleSave}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: '#313244',
            border: '1px solid #45475a',
            borderRadius: 6,
            padding: '6px 12px',
            color: '#cdd6f4',
            fontSize: 12,
            cursor: 'pointer',
            transition: 'background 0.2s ease-out',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#45475a')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#313244')}
        >
          <Save size={14} />
          保存快照
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: 8,
        }}
      >
        {snapshots.map((snap) => (
          <div
            key={snap.id}
            onClick={() => loadSnapshot(snap.id)}
            style={{
              position: 'relative',
              border: '1px solid #45475a',
              borderRadius: 6,
              overflow: 'hidden',
              cursor: 'pointer',
              background: '#1e1e2e',
              transition: 'transform 0.2s ease-out, border-color 0.2s ease-out, box-shadow 0.2s ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.03)';
              e.currentTarget.style.borderColor = '#89b4fa';
              e.currentTarget.style.boxShadow = '0 0 8px rgba(137,180,250,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.borderColor = '#45475a';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteSnapshot(snap.id);
              }}
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                background: 'rgba(30,30,46,0.8)',
                border: 'none',
                borderRadius: 4,
                padding: 2,
                color: '#cdd6f4',
                cursor: 'pointer',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s ease-out',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#f38ba8')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#cdd6f4')}
            >
              <Trash2 size={12} />
            </button>

            {snap.thumbnail ? (
              <img
                src={snap.thumbnail}
                alt={snap.name}
                style={{
                  width: '100%',
                  height: 80,
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: 80,
                  background: '#181825',
                }}
              />
            )}

            <div style={{ padding: '4px 6px 6px' }}>
              <div
                style={{
                  fontSize: 11,
                  color: '#cdd6f4',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {snap.name}
              </div>
              <div style={{ fontSize: 10, color: '#6c7086' }}>
                {formatDate(snap.date)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={handleExport}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            flex: 1,
            justifyContent: 'center',
            background: '#313244',
            border: '1px solid #45475a',
            borderRadius: 6,
            padding: '6px 12px',
            color: '#cdd6f4',
            fontSize: 12,
            cursor: 'pointer',
            transition: 'background 0.2s ease-out',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#45475a')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#313244')}
        >
          <Download size={14} />
          导出
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            flex: 1,
            justifyContent: 'center',
            background: '#313244',
            border: '1px solid #45475a',
            borderRadius: 6,
            padding: '6px 12px',
            color: '#cdd6f4',
            fontSize: 12,
            cursor: 'pointer',
            transition: 'background 0.2s ease-out',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#45475a')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#313244')}
        >
          <Upload size={14} />
          导入
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
}
