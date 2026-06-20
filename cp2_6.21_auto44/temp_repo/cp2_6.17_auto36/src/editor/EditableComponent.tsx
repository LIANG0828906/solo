import { useDrag } from 'react-dnd';
import { useEditorStore, useThemeColor } from '../store/editorStore';
import type {
  PortfolioComponent,
  TitleProps,
  ImageProps,
  TextCardProps,
} from '../store/editorStore';
import { useState, useEffect } from 'react';

interface EditableComponentProps {
  component: PortfolioComponent;
  isSelected: boolean;
  isMultiSelected: boolean;
  onSelect: (id: string, isMulti?: boolean) => void;
}

function TitleRenderer({
  text,
  fontSize,
  color,
  align,
  themeColor,
}: {
  text: string;
  fontSize: number;
  color: string;
  align: 'left' | 'center' | 'right';
  themeColor: string;
}) {
  const displayColor = color === 'inherit' ? themeColor : color;
  return (
    <div
      style={{
        fontSize,
        fontWeight: 'bold',
        color: displayColor,
        lineHeight: 1.3,
        textAlign: align,
      }}
    >
      {text}
    </div>
  );
}

function ImageRenderer({
  src,
  widthPercent,
  borderRadius,
  alt,
}: {
  src: string;
  widthPercent: number;
  borderRadius: number;
  alt: string;
}) {
  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <img
        src={src}
        alt={alt}
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

function TextCardRenderer({
  content,
  bgColor,
  fontSize,
}: {
  content: string;
  bgColor: string;
  fontSize: number;
}) {
  return (
    <div
      style={{
        backgroundColor: bgColor,
        padding: '20px 24px',
        borderRadius: 6,
        fontSize,
        lineHeight: 1.7,
        color: '#2C3E50',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

export default function EditableComponent({
  component,
  isSelected,
  isMultiSelected,
  onSelect,
}: EditableComponentProps) {
  const removeComponent = useEditorStore((s) => s.removeComponent);
  const themeColor = useThemeColor();
  const [animating, setAnimating] = useState(false);
  const [removing, setRemoving] = useState(false);

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
    onSelect(component.id, e.ctrlKey || e.metaKey);
  };

  const renderContent = () => {
    switch (component.type) {
      case 'title':
        return (
          <TitleRenderer
            text={(component.props as TitleProps).text}
            fontSize={(component.props as TitleProps).fontSize}
            color={(component.props as TitleProps).color}
            align={(component.props as TitleProps).align}
            themeColor={themeColor}
          />
        );
      case 'image':
        return (
          <ImageRenderer
            src={(component.props as ImageProps).src}
            widthPercent={(component.props as ImageProps).widthPercent}
            borderRadius={(component.props as ImageProps).borderRadius}
            alt={(component.props as ImageProps).alt}
          />
        );
      case 'textCard':
        return (
          <TextCardRenderer
            content={(component.props as TextCardProps).content}
            bgColor={(component.props as TextCardProps).bgColor}
            fontSize={(component.props as TextCardProps).fontSize}
          />
        );
    }
  };

  const showSelectedBorder = isSelected || isMultiSelected;

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
        outline: showSelectedBorder ? '2px dashed #3498DB' : 'none',
        outlineOffset: 2,
        borderRadius: 6,
        zIndex: component.zIndex,
      }}
    >
      {isMultiSelected && (
        <div
          style={{
            position: 'absolute',
            top: -10,
            left: -10,
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: '#3498DB',
            color: '#fff',
            fontSize: 10,
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
          }}
        >
          ✓
        </div>
      )}

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
