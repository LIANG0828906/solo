import { useRef, useState, ChangeEvent } from 'react';
import dayjs from 'dayjs';
import { useDocumentStore } from '../store/useDocumentStore';
import { uploadDocument } from '../api/translate';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function DocumentPanel() {
  const { paragraphs, meta, setParagraphs, setLoading, isLoading } = useDocumentStore();
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
      setParagraphs(result, {
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
        fileSize: file.size,
      });
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
          {paragraphs.length > 0 && (
            <button
              className="btn btn-mini btn-outline"
              onClick={() => fileInputRef.current?.click()}
              title="重新上传"
            >
              🔄 重新上传
            </button>
          )}
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
            📁 {paragraphs.length > 0 ? '更换文档' : '上传文档'}
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
            <div className="document-meta-card">
              <div className="meta-icon">📎</div>
              <div className="meta-info">
                <div className="meta-filename">{meta?.fileName || '已导入文档'}</div>
                <div className="meta-sub">
                  {meta?.uploadedAt && (
                    <span>
                      🕐 上传于 {dayjs(meta.uploadedAt).format('YYYY-MM-DD HH:mm:ss')}
                    </span>
                  )}
                  {meta?.fileSize !== undefined && (
                    <span>📦 {formatFileSize(meta.fileSize)}</span>
                  )}
                  <span>📝 共 {paragraphs.length} 段</span>
                </div>
              </div>
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
