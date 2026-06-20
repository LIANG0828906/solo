import { useRef, useState } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { validateFile } from '@/utils/helpers';
import styles from './UploadZone.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function UploadZone({ open, onClose }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const addPhoto = useAppStore((s) => s.addPhoto);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  if (!open) return null;

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    setError('');
    setUploading(true);
    try {
      for (const file of files) {
        const check = validateFile(file);
        if (!check.ok) {
          setError(`${file.name}: ${check.error}`);
          continue;
        }
        await addPhoto(file);
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
      setTimeout(onClose, 300);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={`${styles.modal} ${dragOver ? styles.dragOver : ''} anim-scale-in`}
        onClick={(e) => e.stopPropagation()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <button className={styles.close} onClick={onClose} title="关闭">
          <X size={18} />
        </button>

        <div className={styles.iconWrap}>
          <div className={styles.iconBubble}>
            <Upload size={28} />
          </div>
        </div>

        <h3 className={styles.title}>上传摄影作品</h3>
        <p className={styles.hint}>
          拖拽图片到此处，或 <span className={styles.linkLike} onClick={() => inputRef.current?.click()}>点击选择文件</span>
        </p>
        <div className={styles.formats}>
          支持 JPG · PNG · WebP，单张不超过 10MB
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
        />

        <button
          className={`btn btn-primary ${styles.cta}`}
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? '上传中...' : '选择图片'}
        </button>

        {error && (
          <div className={styles.error}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
