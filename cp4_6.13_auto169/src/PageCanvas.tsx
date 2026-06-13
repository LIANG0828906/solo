import React, { useState, useRef, useCallback } from 'react';
import EditModal, { ComponentContent, ComponentStyle } from './EditModal';

export interface ComponentData {
  id: string;
  type: string;
  order_index: number;
  content: string;
  style: string;
  width: string;
}

interface PageCanvasProps {
  components: ComponentData[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onDrop: (type: string) => void;
  onUpdateComponent: (id: string, content: ComponentContent, style: ComponentStyle) => void;
  onUpdateWidth: (id: string, width: string) => void;
  onDeleteComponent: (id: string) => void;
  isPreview: boolean;
}

const widthOptions = ['25%', '50%', '75%', '100%'];

const PageCanvas: React.FC<PageCanvasProps> = ({
  components,
  selectedId,
  onSelect,
  onDrop,
  onUpdateComponent,
  onUpdateWidth,
  onDeleteComponent,
  isPreview,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<ComponentData | null>(null);
  const dragCounterRef = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (dragCounterRef.current === 1) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragOver(false);
      const type = e.dataTransfer.getData('componentType');
      if (type) {
        onDrop(type);
      }
    },
    [onDrop]
  );

  const handleDoubleClick = (comp: ComponentData) => {
    if (isPreview) return;
    setEditingComponent(comp);
    setEditModalOpen(true);
  };

  const handleSaveEdit = (content: ComponentContent, style: ComponentStyle) => {
    if (editingComponent) {
      onUpdateComponent(editingComponent.id, content, style);
    }
  };

  const parseContent = (contentStr: string): ComponentContent => {
    try {
      return JSON.parse(contentStr);
    } catch {
      return {};
    }
  };

  const parseStyle = (styleStr: string): ComponentStyle => {
    try {
      return JSON.parse(styleStr);
    } catch {
      return {};
    }
  };

  const renderComponent = (comp: ComponentData) => {
    const content = parseContent(comp.content);
    const style = parseStyle(comp.style);
    const widthClass = `width-${comp.width.replace('%', '')}`;

    const componentStyle: React.CSSProperties = {
      backgroundColor: style.backgroundColor || undefined,
      fontSize: style.fontSize || undefined,
      color: style.textColor || undefined,
    };

    let componentBody: React.ReactNode;

    switch (comp.type) {
      case 'hero':
        componentBody = (
          <div className="hero-component" style={componentStyle}>
            <h1>{content.title || '标题'}</h1>
            <p>{content.description || '描述文字'}</p>
            {content.ctaText && (
              <button className="cta-btn">{content.ctaText}</button>
            )}
            {content.imageUrl && <img src={content.imageUrl} alt="hero" />}
          </div>
        );
        break;
      case 'feature':
        componentBody = (
          <div className="feature-component" style={componentStyle}>
            {content.imageUrl && <img src={content.imageUrl} alt="feature" />}
            <h3>{content.title || '功能标题'}</h3>
            <p>{content.description || '功能描述'}</p>
          </div>
        );
        break;
      case 'pricing':
        componentBody = (
          <div className="pricing-component" style={componentStyle}>
            <h3>{content.title || '方案名称'}</h3>
            <p className="desc">{content.description || ''}</p>
            <div className="price">{content.price || '¥0'}</div>
            <ul>
              {(content.features || []).map((feat: string, idx: number) => (
                <li key={idx}>{feat}</li>
              ))}
            </ul>
            <button className="cta-btn">立即购买</button>
          </div>
        );
        break;
      case 'testimonial':
        componentBody = (
          <div className="testimonial-component" style={componentStyle}>
            <p>"{content.description || '评价内容'}"</p>
            <div className="author">
              {content.avatar && <img src={content.avatar} alt={content.author || ''} />}
              <span>{content.author || '匿名用户'}</span>
            </div>
          </div>
        );
        break;
      case 'footer':
        componentBody = (
          <div className="footer-cta-component" style={componentStyle}>
            <h2>{content.title || 'CTA标题'}</h2>
            <p>{content.description || '描述文字'}</p>
            {content.ctaText && (
              <button className="cta-btn">{content.ctaText}</button>
            )}
          </div>
        );
        break;
      default:
        componentBody = <div>未知组件</div>;
    }

    return (
      <div
        key={comp.id}
        className={`canvas-component-wrapper ${widthClass}`}
      >
        {!isPreview && (
          <>
            <button
              className="delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteComponent(comp.id);
              }}
              title="删除"
            >
              ×
            </button>
            <div className="width-controls">
              {widthOptions.map((w) => (
                <button
                  key={w}
                  className={`width-btn ${comp.width === w ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateWidth(comp.id, w);
                  }}
                >
                  {w}
                </button>
              ))}
            </div>
          </>
        )}
        <div
          className={`canvas-component ${selectedId === comp.id && !isPreview ? 'selected' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (!isPreview) onSelect(comp.id);
          }}
          onDoubleClick={() => handleDoubleClick(comp)}
        >
          {componentBody}
        </div>
      </div>
    );
  };

  const sortedComponents = [...components].sort((a, b) => a.order_index - b.order_index);

  const dragProps = {
    onDragEnter: handleDragEnter,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
  };

  return (
    <>
      <div
        className={`drop-zone ${isDragOver ? 'drag-over' : ''}`}
        {...dragProps}
        onClick={() => onSelect(null)}
      >
        {sortedComponents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-text">
              {isDragOver ? '释放以添加组件' : '从左侧拖拽组件到这里开始构建'}
            </div>
          </div>
        ) : (
          <div
            className="components-grid"
            {...dragProps}
            onClick={(e) => e.stopPropagation()}
          >
            {sortedComponents.map(renderComponent)}
            {isDragOver && (
              <div className="drop-indicator">
                <span>释放以放置组件</span>
              </div>
            )}
          </div>
        )}
        {isDragOver && sortedComponents.length > 0 && (
          <div className="drop-overlay-hint">释放以放置组件</div>
        )}
      </div>

      {editingComponent && (
        <EditModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSave={handleSaveEdit}
          componentType={editingComponent.type}
          initialContent={parseContent(editingComponent.content)}
          initialStyle={parseStyle(editingComponent.style)}
        />
      )}
    </>
  );
};

export default PageCanvas;
