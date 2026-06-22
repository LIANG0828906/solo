import { useDiaryStore } from '../store';
import MainCanvas, { generateThumbnail } from '../components/MainCanvas';
import { Save, Sparkles } from 'lucide-react';

function formatDate(d: Date): string {
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function DiaryEditor() {
  const currentContent = useDiaryStore((s) => s.currentContent);
  const currentInkPoints = useDiaryStore((s) => s.currentInkPoints);
  const selectedEmotion = useDiaryStore((s) => s.selectedEmotion);
  const setCurrentContent = useDiaryStore((s) => s.setCurrentContent);
  const saveDiary = useDiaryStore((s) => s.saveDiary);
  const resetEditor = useDiaryStore((s) => s.resetEditor);

  const handleSave = () => {
    const thumb = generateThumbnail(currentInkPoints, selectedEmotion);
    saveDiary(thumb);
  };

  const today = formatDate(new Date());
  const canSave = currentContent.trim().length > 0 || currentInkPoints.length >= 5;

  return (
    <div className="editor-layout">
      <MainCanvas />

      <div className="editor-panel">
        <div className="editor-panel-header">
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} />
            今日心境
          </span>
          <span className="editor-date">{today}</span>
        </div>

        <div className="text-editor">
          <textarea
            className="vertical-textarea"
            placeholder="右起竖排，落笔成章…"
            value={currentContent}
            onChange={(e) => setCurrentContent(e.target.value)}
            spellCheck={false}
          />
        </div>

        <div className="editor-actions">
          <button className="btn" onClick={resetEditor}>
            清空
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!canSave}
            style={!canSave ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
          >
            <Save size={16} />
            保存日记
          </button>
        </div>
      </div>
    </div>
  );
}
