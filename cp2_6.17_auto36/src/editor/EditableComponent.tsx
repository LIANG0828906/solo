import { useDrag } from 'react-dnd';
import { useEditorStore } from '../store/editorStore';
import type { PortfolioComponent } from '../store/editorStore';
import { useState, useRef, useEffect } from 'react';

interface EditableComponentProps {
  component: PortfolioComponent;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function TitleRenderer({ text, fontSize }: { text: string; fontSize: number }) {
  return (
    <div style={{ fontSize, fontWeight: 'bold', color: '#2C3E50', lineHeight: 1.3 }}>
      {text}
    </div>
  );
}

function ImageRenderer({ src, widthPercent, borderRadius }: { src: string; widthPercent: number; borderRadius: number }) {
  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <img
        src={src}
        alt="portfolio"
        style={{
          width: `${widthPercent}%`,
          borderRadius,
          display: 'block',
          maxHeight: 400,
          objectFit: 'cover',
        }}
      />
    </div>
  );
}

function TextCardRenderer({ content, bgColor }: { content: string; bgColor: string }) {
  return (
    <div
      style={{
        backgroundColor: bgColor,
        padding: '20px 24px',
        borderRadius: 6,
        fontSize: 15,
        lineHeight: 1.7,
        color: '#2C3E50',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

export default function EditableComponent({ component, isSelected, onSelect }: EditableComponentProps) {
  const removeComponent = useEditorStore((s) => s.removeComponent);
  const [animating, setAnimating] = useState(false);
  const [removing, setRemoving] = useState(false);
  const prevIdRef = useRef(component.id);

  useEffect(() => {
    if (prevIdRef.current !== component.id) {
      prevIdRef.current = component.id;
    }
  }, [component.id]);

  useEffect(() => {
    setAnimating(true);
    const timer = setTimeout(() => setAnimating(false), 200);
    return () => clearTimeout(timer);
  }, [component.id]);

  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: 'CANVAS_COMPONENT',
      item: { id: component.id, type: component.type, order: component.order },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [component.id, component.type, component.order]
  );

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRemoving(true);
    setTimeout(() => {
      removeComponent(component.id);
    }, 300);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(component.id);
  };

  const renderContent = () => {
    switch (component.type) {
      case 'title':
        return <TitleRenderer text={(component.props as { text: string; fontSize: number }).text} fontSize={(component.props as { text: string; fontSize: number }).fontSize} />;
      case 'image':
        return <ImageRenderer src={(component.props as { src: string; widthPercent: number; borderRadius: number }).src} widthPercent={(component.props as { src: string; widthPercent: number; borderRadius: number }).widthPercent} borderRadius={(component.props as { src: string; widthPercent: number; borderRadius: number }).borderRadius} />;
      case 'textCard':
        return <TextCardRenderer content={(component.props as { content: string; bgColor: string }).content} bgColor={(component.props as { content: string; bgColor: string }).bgColor} />;
    }
  };

  return (
    <div
      ref={preview}
      onClick={handleClick}
      style={{
        position: 'relative',
        marginBottom: 12,
        cursor: 'pointer',
        opacity: isDragging ? 0.4 : removing ? 0 : 1,
        transform: animating ? 'scale(1.05)' : 'scale(1)',
        transition: 'all 0.3s ease',
        outline: isSelected
          ? '2px dashed #3498DB'
          : 'none',
        outlineOffset: 2,
        borderRadius: 6,
      }}
    >
      <div
        ref={drag}
        style={{
          padding: '8px 4px',
          cursor: 'grab',
        }}
      >
        {renderContent()}
      </div>

      {isSelected && (
        <button
          onClick={handleDelete}
          style={{
            position: 'absolute',
            top: -12,
            right: -12,
            width: 24,
            height: 24,
            borderRadius: 4,
            backgroundColor: '#E74C3C',
            color: '#fff',
            border: 'none',
            fontSize: 12,
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s ease',
            zIndex: 10,
            lineHeight: 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
