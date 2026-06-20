import { useState, useEffect, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Plus } from 'lucide-react';
import { useExhibitStore } from '../store';
import './ExhibitForm.css';

function ExhibitForm() {
  const { isFormOpen, editingExhibit, closeForm, addExhibit, updateExhibit } = useExhibitStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; image?: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingExhibit) {
      setTitle(editingExhibit.title);
      setDescription(editingExhibit.description);
      setTags(editingExhibit.tags);
      setImageUrl(editingExhibit.imageUrl);
    } else {
      setTitle('');
      setDescription('');
      setTags([]);
      setImageUrl('');
      setTagInput('');
    }
    setErrors({});
  }, [editingExhibit, isFormOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFormOpen) {
        closeForm();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isFormOpen, closeForm]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeForm();
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.match(/image\/(jpeg|png|webp)/)) {
      setErrors((prev) => ({ ...prev, image: '仅支持 JPG、PNG、WebP 格式' }));
      return;
    }

    setErrors((prev) => ({ ...prev, image: undefined }));
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const validate = (): boolean => {
    const newErrors: { title?: string; image?: string } = {};
    if (!title.trim()) {
      newErrors.title = '请输入展品标题';
    }
    if (!imageUrl) {
      newErrors.image = '请上传展品图片';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (editingExhibit) {
      await updateExhibit(editingExhibit.id, {
        title: title.trim(),
        description: description.trim(),
        tags,
        imageUrl,
      });
    } else {
      await addExhibit({
        title: title.trim(),
        description: description.trim(),
        tags,
        imageUrl,
      });
    }
    closeForm();
  };

  if (!isFormOpen) return null;

  return (
    <div className="form-backdrop" onClick={handleBackdropClick}>
      <div className="form-container" ref={formRef}>
        <div className="form-header">
          <h2 className="form-title">{editingExhibit ? '编辑展品' : '添加展品'}</h2>
          <button className="form-close-btn" onClick={closeForm} aria-label="关闭">
            <X size={20} />
          </button>
        </div>

        <form className="form-content" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">展品图片</label>
            <div
              className={`drop-zone ${isDragging ? 'dragging' : ''} ${imageUrl ? 'has-image' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              {imageUrl ? (
                <div className="preview-image-wrapper">
                  <img src={imageUrl} alt="预览" className="preview-image" />
                  <div className="preview-overlay">
                    <ImageIcon size={20} />
                    <span>点击更换</span>
                  </div>
                </div>
              ) : (
                <div className="drop-zone-content">
                  <Upload size={32} className="drop-icon" />
                  <p className="drop-text">拖拽图片到此处，或点击选择</p>
                  <p className="drop-hint">支持 JPG、PNG、WebP 格式</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="file-input"
                onChange={handleFileInput}
              />
            </div>
            {errors.image && <p className="form-error">{errors.image}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="title">
              标题
            </label>
            <input
              id="title"
              type="text"
              className={`form-input ${errors.title ? 'error' : ''}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入展品标题"
            />
            {errors.title && <p className="form-error">{errors.title}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">
              描述
            </label>
            <textarea
              id="description"
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="输入展品描述"
              rows={4}
            />
          </div>

          <div className="form-group">
            <label className="form-label">标签</label>
            <div className="tags-input-container">
              <div className="tags-list">
                {tags.map((tag) => (
                  <span key={tag} className="tag-item">
                    {tag}
                    <button type="button" className="tag-remove" onClick={() => removeTag(tag)} aria-label="删除标签">
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  className="tag-input"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder={tags.length === 0 ? '输入标签后按回车添加' : ''}
                />
              </div>
              <button
                type="button"
                className="add-tag-btn"
                onClick={() => {
                  if (tagInput.trim()) {
                    const newTag = tagInput.trim();
                    if (!tags.includes(newTag)) {
                      setTags([...tags, newTag]);
                    }
                    setTagInput('');
                  }
                }}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={closeForm}>
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              {editingExhibit ? '保存修改' : '添加展品'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExhibitForm;
