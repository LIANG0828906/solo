import React, { useState, useEffect } from 'react';

export interface ComponentContent {
  title?: string;
  description?: string;
  imageUrl?: string;
  price?: string;
  features?: string[];
  author?: string;
  avatar?: string;
  ctaText?: string;
  ctaLink?: string;
}

export interface ComponentStyle {
  backgroundColor?: string;
  fontSize?: string;
  textColor?: string;
}

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: ComponentContent, style: ComponentStyle) => void;
  componentType: string;
  initialContent: ComponentContent;
  initialStyle: ComponentStyle;
}

const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  componentType,
  initialContent,
  initialStyle,
}) => {
  const [content, setContent] = useState<ComponentContent>(initialContent);
  const [style, setStyle] = useState<ComponentStyle>(initialStyle);

  useEffect(() => {
    setContent(initialContent);
    setStyle(initialStyle);
  }, [initialContent, initialStyle, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(content, style);
    onClose();
  };

  const handleContentChange = (field: keyof ComponentContent, value: any) => {
    setContent((prev) => ({ ...prev, [field]: value }));
  };

  const handleStyleChange = (field: keyof ComponentStyle, value: string) => {
    setStyle((prev) => ({ ...prev, [field]: value }));
  };

  const renderContentFields = () => {
    switch (componentType) {
      case 'hero':
        return (
          <>
            <div className="form-group">
              <label>标题</label>
              <input
                type="text"
                value={content.title || ''}
                onChange={(e) => handleContentChange('title', e.target.value)}
                placeholder="输入标题"
              />
            </div>
            <div className="form-group">
              <label>描述</label>
              <textarea
                value={content.description || ''}
                onChange={(e) => handleContentChange('description', e.target.value)}
                placeholder="输入描述文字"
              />
            </div>
            <div className="form-group">
              <label>图片URL</label>
              <input
                type="text"
                value={content.imageUrl || ''}
                onChange={(e) => handleContentChange('imageUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="form-group">
              <label>按钮文字</label>
              <input
                type="text"
                value={content.ctaText || ''}
                onChange={(e) => handleContentChange('ctaText', e.target.value)}
                placeholder="立即开始"
              />
            </div>
            <div className="form-group">
              <label>按钮链接</label>
              <input
                type="text"
                value={content.ctaLink || ''}
                onChange={(e) => handleContentChange('ctaLink', e.target.value)}
                placeholder="#"
              />
            </div>
          </>
        );
      case 'feature':
        return (
          <>
            <div className="form-group">
              <label>标题</label>
              <input
                type="text"
                value={content.title || ''}
                onChange={(e) => handleContentChange('title', e.target.value)}
                placeholder="功能标题"
              />
            </div>
            <div className="form-group">
              <label>描述</label>
              <textarea
                value={content.description || ''}
                onChange={(e) => handleContentChange('description', e.target.value)}
                placeholder="功能描述"
              />
            </div>
            <div className="form-group">
              <label>图标URL</label>
              <input
                type="text"
                value={content.imageUrl || ''}
                onChange={(e) => handleContentChange('imageUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </>
        );
      case 'pricing':
        return (
          <>
            <div className="form-group">
              <label>方案名称</label>
              <input
                type="text"
                value={content.title || ''}
                onChange={(e) => handleContentChange('title', e.target.value)}
                placeholder="专业版"
              />
            </div>
            <div className="form-group">
              <label>描述</label>
              <input
                type="text"
                value={content.description || ''}
                onChange={(e) => handleContentChange('description', e.target.value)}
                placeholder="适合成长中的团队"
              />
            </div>
            <div className="form-group">
              <label>价格</label>
              <input
                type="text"
                value={content.price || ''}
                onChange={(e) => handleContentChange('price', e.target.value)}
                placeholder="¥99/月"
              />
            </div>
            <div className="form-group">
              <label>特性列表（用逗号分隔）</label>
              <textarea
                value={content.features?.join(', ') || ''}
                onChange={(e) =>
                  handleContentChange(
                    'features',
                    e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                  )
                }
                placeholder="特性1, 特性2, 特性3"
              />
            </div>
          </>
        );
      case 'testimonial':
        return (
          <>
            <div className="form-group">
              <label>评价内容</label>
              <textarea
                value={content.description || ''}
                onChange={(e) => handleContentChange('description', e.target.value)}
                placeholder="用户评价内容"
              />
            </div>
            <div className="form-group">
              <label>用户姓名</label>
              <input
                type="text"
                value={content.author || ''}
                onChange={(e) => handleContentChange('author', e.target.value)}
                placeholder="张三"
              />
            </div>
            <div className="form-group">
              <label>头像URL</label>
              <input
                type="text"
                value={content.avatar || ''}
                onChange={(e) => handleContentChange('avatar', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </>
        );
      case 'footer':
        return (
          <>
            <div className="form-group">
              <label>标题</label>
              <input
                type="text"
                value={content.title || ''}
                onChange={(e) => handleContentChange('title', e.target.value)}
                placeholder="CTA标题"
              />
            </div>
            <div className="form-group">
              <label>描述</label>
              <textarea
                value={content.description || ''}
                onChange={(e) => handleContentChange('description', e.target.value)}
                placeholder="描述文字"
              />
            </div>
            <div className="form-group">
              <label>按钮文字</label>
              <input
                type="text"
                value={content.ctaText || ''}
                onChange={(e) => handleContentChange('ctaText', e.target.value)}
                placeholder="免费试用"
              />
            </div>
            <div className="form-group">
              <label>按钮链接</label>
              <input
                type="text"
                value={content.ctaLink || ''}
                onChange={(e) => handleContentChange('ctaLink', e.target.value)}
                placeholder="#"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>编辑组件</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {renderContentFields()}

        <div className="form-group">
          <label>背景色</label>
          <input
            type="color"
            value={style.backgroundColor || '#ffffff'}
            onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>字体大小</label>
          <input
            type="text"
            value={style.fontSize || '14px'}
            onChange={(e) => handleStyleChange('fontSize', e.target.value)}
            placeholder="14px"
          />
        </div>

        <div className="form-group">
          <label>文字颜色</label>
          <input
            type="color"
            value={style.textColor || '#ffffff'}
            onChange={(e) => handleStyleChange('textColor', e.target.value)}
          />
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            取消
          </button>
          <button className="btn-save" onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
