import { useState } from 'react';
import { useDocumentStore } from '../store/useDocumentStore';
import { exportDocument } from '../api/translate';

interface Props {
  onClose: () => void;
}

type Format = 'markdown' | 'pdf';

export default function ExportDialog({ onClose }: Props) {
  const { paragraphs, translations, fileName } = useDocumentStore();
  const [format, setFormat] = useState<Format>('markdown');
  const [bilingual, setBilingual] = useState(true);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const data = paragraphs.map((p) => ({
        id: p.id,
        text: p.text,
        translation: translations[p.id] || '',
      }));
      const blob = await exportDocument(data, format, bilingual);
      const baseName = fileName.replace(/\.[^.]+$/, '') || 'translation';
      const ext = format === 'markdown' ? '.md' : '.txt';
      const downloadName = `${baseName}_${bilingual ? 'bilingual' : 'target'}${ext}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDone(true);
      setTimeout(onClose, 900);
    } catch (e) {
      console.error(e);
      alert('导出失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📤 导出文档</h3>
          <button className="icon-btn" onClick={onClose} disabled={loading}>✕</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">导出格式</label>
            <div className="option-row">
              <label className={`option-card ${format === 'markdown' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="format"
                  checked={format === 'markdown'}
                  onChange={() => setFormat('markdown')}
                />
                <div className="option-content">
                  <div className="option-title">Markdown</div>
                  <div className="option-desc">结构化排版，支持双语对照</div>
                </div>
              </label>
              <label className={`option-card ${format === 'pdf' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="format"
                  checked={format === 'pdf'}
                  onChange={() => setFormat('pdf')}
                />
                <div className="option-content">
                  <div className="option-title">PDF / TXT</div>
                  <div className="option-desc">纯文本格式，便于打印与分享</div>
                </div>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">导出内容</label>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={bilingual}
                onChange={(e) => setBilingual(e.target.checked)}
              />
              <span className="toggle-text">
                <strong>双语对照</strong>
                <span className="toggle-hint">原文在上，译文在下，交替排列</span>
              </span>
              <span className="toggle-switch">
                <span className="toggle-knob" />
              </span>
            </label>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={!bilingual}
                onChange={(e) => setBilingual(!e.target.checked)}
              />
              <span className="toggle-text">
                <strong>仅译文</strong>
                <span className="toggle-hint">只输出已翻译内容，未翻译段落保留原文</span>
              </span>
              <span className="toggle-switch passive">
                <span className="toggle-knob" />
              </span>
            </label>
          </div>

          <div className="preview-info">
            共 <b>{paragraphs.length}</b> 段，已翻译{' '}
            <b>
              {paragraphs.filter((p) => translations[p.id]?.trim()).length}
            </b>{' '}
            段
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose} disabled={loading}>
            取消
          </button>
          <button
            className="btn btn-primary btn-export-action"
            onClick={handleExport}
            disabled={loading || done}
          >
            {loading ? (
              <>
                <span className="btn-spinner" /> 正在生成…
              </>
            ) : done ? (
              <>✓ 已下载</>
            ) : (
              <>⬇️ 开始导出</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
