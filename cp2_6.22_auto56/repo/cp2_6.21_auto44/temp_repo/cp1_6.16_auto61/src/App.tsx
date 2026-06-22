import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import CanvasDraw from './CanvasDraw';
import Gallery from './Gallery';
import type { DrawingRecord, Stroke, Mood } from './types';

export default function App() {
  const [records, setRecords] = useState<DrawingRecord[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveDrawing = useCallback((strokes: Stroke[], mood: Mood) => {
    const newRecord: DrawingRecord = {
      id: uuidv4(),
      timestamp: Date.now(),
      mood,
      strokes,
      isFavorite: false
    };
    setRecords((prev) => [newRecord, ...prev]);
  }, []);

  const handleToggleFavorite = useCallback((id: string) => {
    setRecords((prev) =>
      prev.map((record) => {
        if (record.id === id) {
          return {
            ...record,
            isFavorite: !record.isFavorite,
            favoritedAt: !record.isFavorite ? Date.now() : undefined
          };
        }
        return record;
      })
    );
  }, []);

  const handleExport = useCallback(() => {
    const exportData = records.map((record) => ({
      id: record.id,
      timestamp: record.timestamp,
      mood: record.mood,
      strokes: record.strokes,
      isFavorite: record.isFavorite,
      favoritedAt: record.favoritedAt
    }));

    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `visual_diary_${dateStr}.json`;

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [records]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data)) {
          const validRecords = data.filter(
            (item: unknown) =>
              item &&
              typeof item === 'object' &&
              'id' in item &&
              'timestamp' in item &&
              'mood' in item &&
              'strokes' in item
          ) as DrawingRecord[];
          setRecords(validRecords);
        }
      } catch (err) {
        console.error('导入失败:', err);
        alert('文件格式错误，导入失败');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  return (
    <div style={styles.app}>
      <h1 style={styles.header}>动态视觉日记</h1>

      <div style={styles.mainContent}>
        <CanvasDraw onSave={handleSaveDrawing} />

        <div style={styles.ioButtons}>
          <button onClick={handleExport} style={styles.ioButton}>
            📤 导出 JSON
          </button>
          <button onClick={handleImportClick} style={styles.ioButton}>
            📥 导入 JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
        </div>

        <Gallery records={records} onToggleFavorite={handleToggleFavorite} />
      </div>

      <div style={styles.footer}>
        <p>提示：按住鼠标左键拖动画画，Ctrl+Z 撤销，Ctrl+Shift+Z 清空</p>
      </div>
    </div>
  );
}

const styles = {
  app: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '40px 20px',
    background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)'
  },
  header: {
    color: '#ffffff',
    fontSize: '36px',
    fontWeight: 700,
    marginBottom: '10px',
    textAlign: 'center' as const,
    textShadow: '0 2px 10px rgba(0,0,0,0.3)'
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    flex: 1
  },
  ioButtons: {
    display: 'flex',
    gap: '12px',
    marginTop: '10px'
  },
  ioButton: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#ffffff',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
  },
  footer: {
    marginTop: '40px',
    color: 'rgba(255,255,255,0.4)',
    fontSize: '12px',
    textAlign: 'center' as const
  }
};
