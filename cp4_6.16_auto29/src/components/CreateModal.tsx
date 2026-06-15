import { useState, useMemo } from 'react';
import { validatePattern } from '@/utils/pattern';
import './CreateModal.css';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    yarnColor: string;
    stitchCount: number;
    rowCount: number;
    patternText: string;
    referenceImage?: string;
  }) => void;
}

export function CreateModal({ isOpen, onClose, onSubmit }: CreateModalProps) {
  const [name, setName] = useState('');
  const [yarnColor, setYarnColor] = useState('#D48B5C');
  const [stitchCount, setStitchCount] = useState(20);
  const [rowCount, setRowCount] = useState(20);
  const [patternText, setPatternText] = useState('');
  const [referenceImage, setReferenceImage] = useState<string | undefined>();

  const validation = useMemo(() => validatePattern(patternText.trim()), [patternText]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePatternChange = (text: string) => {
    setPatternText(text);
    if (validation.valid) {
      setRowCount(validation.rowCount);
      setStitchCount(validation.stitchCount);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('请输入项目名称');
      return;
    }
    if (!patternText.trim()) {
      alert('请输入图案内容');
      return;
    }
    if (!validation.valid) {
      alert(`图案格式错误：${validation.error}`);
      return;
    }
    onSubmit({
      name: name.trim(),
      yarnColor,
      stitchCount: validation.stitchCount,
      rowCount: validation.rowCount,
      patternText: patternText.trim(),
      referenceImage,
    });
    setName('');
    setYarnColor('#D48B5C');
    setStitchCount(20);
    setRowCount(20);
    setPatternText('');
    setReferenceImage(undefined);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">创建新项目</h2>
          <button className="modal-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="project-name">项目名称</label>
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：蓝色围巾"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="yarn-color">毛线颜色</label>
            <div className="color-picker-wrapper">
              <input
                id="yarn-color"
                type="color"
                value={yarnColor}
                onChange={(e) => setYarnColor(e.target.value)}
                className="color-picker"
              />
              <span className="color-value">{yarnColor}</span>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="stitch-count">针数</label>
              <input
                id="stitch-count"
                type="number"
                min="1"
                value={stitchCount}
                onChange={(e) => setStitchCount(Number(e.target.value))}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="row-count">行数</label>
              <input
                id="row-count"
                type="number"
                min="1"
                value={rowCount}
                onChange={(e) => setRowCount(Number(e.target.value))}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reference-image">参考图片（可选）</label>
            <input
              id="reference-image"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="form-input form-file"
            />
            {referenceImage && (
              <div className="image-preview">
                <img src={referenceImage} alt="预览" />
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="pattern-text">
              图案文本 <span className="form-hint">（每行用换行分隔，每个字符代表一个针脚）</span>
            </label>
            <textarea
              id="pattern-text"
              value={patternText}
              onChange={(e) => handlePatternChange(e.target.value)}
              placeholder={`例如：\n｜｜｜O｜｜｜/｜｜\n｜/｜｜O｜｜｜｜｜\n...`}
              className={`form-textarea ${
                patternText.trim() && !validation.valid ? 'form-textarea--error' : ''
              }`}
              rows={8}
            />
            {patternText.trim() && !validation.valid && (
              <div className="form-error">⚠️ {validation.error}</div>
            )}
            {validation.valid && patternText.trim() && (
              <div className="form-success">
                ✓ 图案格式正确：{validation.rowCount} 行 × {validation.stitchCount} 针
              </div>
            )}
            <div className="pattern-legend">
              <span className="legend-item"><code>｜</code> 下针</span>
              <span className="legend-item"><code>O</code> 空针</span>
              <span className="legend-item"><code>/</code> 左上二并一</span>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              创建项目
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
