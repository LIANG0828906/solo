import { useRef } from 'react';
import type { MemeTemplate } from '@/types';
import { memeTemplates } from '@/data/templates';

interface TemplatePanelProps {
  onSelectTemplate: (template: MemeTemplate) => void;
  onUploadImage: (file: File) => void;
  uploadProgress: number;
  isUploading: boolean;
}

export default function TemplatePanel({
  onSelectTemplate,
  onUploadImage,
  uploadProgress,
  isUploading,
}: TemplatePanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        alert('请上传 JPG、PNG 或 GIF 格式的图片');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过 5MB');
        return;
      }
      onUploadImage(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const circumference = 2 * Math.PI * 13;
  const progressOffset = circumference - (uploadProgress / 100) * circumference;

  return (
    <div>
      <div className="upload-section">
        <button className="upload-btn" onClick={handleUploadClick} disabled={isUploading}>
          {isUploading ? '上传中...' : '📤 上传图片'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        {isUploading && (
          <div className="upload-progress">
            <div className="progress-ring">
              <svg width="32" height="32">
                <circle className="bg" cx="16" cy="16" r="13" />
                <circle
                  className="progress"
                  cx="16"
                  cy="16"
                  r="13"
                  strokeDasharray={circumference}
                  strokeDashoffset={progressOffset}
                />
              </svg>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              {Math.round(uploadProgress)}%
            </span>
          </div>
        )}
      </div>

      <div className="section-title">热门模板</div>
      <div className="template-grid">
        {memeTemplates.map((template) => (
          <div
            key={template.id}
            className="template-card"
            onClick={() => onSelectTemplate(template)}
          >
            <img src={template.thumbnail} alt={template.name} />
            <div className="template-name">{template.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
