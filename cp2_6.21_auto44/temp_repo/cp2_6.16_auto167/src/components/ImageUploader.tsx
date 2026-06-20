import { useState, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { validateFile, compressImage } from '@/utils/imageCompressor';
import type { AttachmentUpload } from '@/types';

interface ImageUploaderProps {
  value: Array<{ blob: Blob; dataUrl: string; filename: string; mimeType: string }>;
  onChange: (val: Array<{ blob: Blob; dataUrl: string; filename: string; mimeType: string }>) => void;
  maxCount?: number;
}

export function ImageUploader({ value, onChange, maxCount = 3 }: ImageUploaderProps) {
  const [uploads, setUploads] = useState<AttachmentUpload[]>([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setError(null);
    const fileArr = Array.from(files);
    const availableSlots = maxCount - value.length;

    if (fileArr.length > availableSlots) {
      setError(`最多只能上传${maxCount}张图片`);
      fileArr.splice(availableSlots);
    }

    const newUploads: AttachmentUpload[] = fileArr.map((file) => ({
      id: uuidv4(),
      file,
      progress: 0,
    }));

    setUploads((prev) => [...prev, ...newUploads]);

    for (const upload of newUploads) {
      const validation = validateFile(upload.file);
      if (!validation.valid) {
        setError(validation.error || '文件验证失败');
        setUploads((prev) => prev.filter((u) => u.id !== upload.id));
        continue;
      }

      try {
        const result = await compressImage(upload.file, (progress) => {
          setUploads((prev) =>
            prev.map((u) => (u.id === upload.id ? { ...u, progress } : u))
          );
        });

        onChange([
          ...value.filter(
            (_, i) => i < (maxCount - newUploads.indexOf(upload) - 1)
          ),
          {
            blob: result.blob,
            dataUrl: result.dataUrl,
            filename: upload.file.name,
            mimeType: result.blob.type || 'image/jpeg',
          },
        ]);

        setUploads((prev) => prev.filter((u) => u.id !== upload.id));
      } catch (err) {
        setError(err instanceof Error ? err.message : '上传失败');
        setUploads((prev) => prev.filter((u) => u.id !== upload.id));
      }
    }
  }, [value, onChange, maxCount]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div>
      {value.length < maxCount && (
        <div
          className={`upload-zone ${dragging ? 'dragging' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          <div className="upload-icon">📷</div>
          <div className="upload-title">点击或拖拽上传图片</div>
          <div className="upload-hint">
            支持1-{maxCount}张图片，单张不超过5MB
          </div>
        </div>
      )}

      {uploads.length > 0 && (
        <div className="upload-previews">
          {uploads.map((u) => (
            <div key={u.id} className="upload-preview">
              <div style={{ width: '100%', height: '100%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                处理中...
              </div>
              <div className="upload-progress">
                <div className="upload-progress-bar" style={{ width: `${u.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {value.length > 0 && (
        <div className="upload-previews">
          {value.map((img, idx) => (
            <div key={idx} className="upload-preview">
              <img src={img.dataUrl} alt={img.filename} />
              <div className="upload-preview-remove" onClick={() => removeImage(idx)}>
                ×
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{ marginTop: 12, color: 'var(--error)', fontSize: 13 }}>
          {error}
        </div>
      )}
    </div>
  );
}
