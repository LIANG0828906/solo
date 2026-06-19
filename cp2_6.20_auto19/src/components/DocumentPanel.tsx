import { useRef, useState, ChangeEvent } from 'react';
import { useDocumentStore } from '../store/useDocumentStore';
import { uploadDocument } from '../api/translate';

export default function DocumentPanel() {
  const { paragraphs, fileName, setParagraphs, setLoading, isLoading } = useDocumentStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    if (!file.name.match(/\.(txt|pdf)$/i)) {
      setError('仅支持 .txt 和 .pdf 格式文件');
      return;
    }
    setLoading(true);
    try {
      const start = performance.now();
      const result = await uploadDocument(file);
      const elapsed = performance.now() - start;
      const minDelay = 400;
      if (elapsed < minDelay) {
        await new Promise((r) => setTimeout(r, minDelay - elapsed));
      }
      setParagraphs(result, file.name);
    } catch (e) {
      setError('文件解析失败，请重试');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  return (
    <section className="panel panel-document">
      <div className="panel-header">
        <h2 className="panel-title">📄 原文</h2>
        <div className="panel-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf"
            hidden
            onChange={onFileChange}
          />
          <button
            className="btn btn-primary"
            onClick={() => fileInputRef.current?.click()}
          >
            📁 上传文档
          </button>
        </div>
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}

      <div className="panel-body">
        {paragraphs.length === 0 ? (
          <div
            className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {isLoading ? (
              <div className="loading-spinner-large">
                <div className="spinner-ring" />
                <p>正在解析文档…</p>
              </div>
            ) : (
              <>
                <div className="upload-icon">☁️</div>
                <h3>拖放文件到此处或点击上传</h3>
                <p>支持 TXT / PDF 格式，系统将自动分段展示</p>
                <div className="upload-hint">最大 20MB · 推荐单篇文档</div>
              </>
            )}
          </div>
        ) : (
          <div className="paragraphs-list">
            <div className="document-meta">
              <span className="meta-chip">📎 {fileName || '已导入文档'}</span>
              <span className="meta-chip">📝 共 {paragraphs.length} 段</span>
            </div>
            {paragraphs.map((p, idx) => (
              <div key={p.id} className="paragraph-item">
                <div className="paragraph-index">{idx + 1}</div>
                <div className="paragraph-text">{p.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
