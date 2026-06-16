import { useNavigate } from 'react-router-dom';
import {
  useComponentList,
  useThemeColor,
  useBgColor,
} from '../store/editorStore';
import type {
  PortfolioComponent,
  TitleProps,
  ImageProps,
  TextCardProps,
} from '../store/editorStore';

function GalleryTitle({
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

function GalleryImage({
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

function GalleryTextCard({
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

function renderComponent(comp: PortfolioComponent, themeColor: string) {
  switch (comp.type) {
    case 'title':
      return (
        <GalleryTitle
          text={(comp.props as TitleProps).text}
          fontSize={(comp.props as TitleProps).fontSize}
          color={(comp.props as TitleProps).color}
          align={(comp.props as TitleProps).align}
          themeColor={themeColor}
        />
      );
    case 'image':
      return (
        <GalleryImage
          src={(comp.props as ImageProps).src}
          widthPercent={(comp.props as ImageProps).widthPercent}
          borderRadius={(comp.props as ImageProps).borderRadius}
          alt={(comp.props as ImageProps).alt}
        />
      );
    case 'textCard':
      return (
        <GalleryTextCard
          content={(comp.props as TextCardProps).content}
          bgColor={(comp.props as TextCardProps).bgColor}
          fontSize={(comp.props as TextCardProps).fontSize}
        />
      );
  }
}

function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max((num >> 16) - amt, 0);
  const G = Math.max(((num >> 8) & 0x00ff) - amt, 0);
  const B = Math.max((num & 0x0000ff) - amt, 0);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

export default function GalleryPage() {
  const navigate = useNavigate();
  const components = useComponentList();
  const themeColor = useThemeColor();
  const bgColor = useBgColor();

  const sorted = [...components].sort((a, b) => a.order - b.order);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: bgColor,
        position: 'relative',
      }}
    >
      <button
        onClick={() => navigate('/editor')}
        style={{
          position: 'fixed',
          top: 24,
          right: 24,
          backgroundColor: themeColor,
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          padding: '10px 24px',
          fontSize: 14,
          cursor: 'pointer',
          zIndex: 100,
          transition: 'all 0.2s ease',
          fontWeight: 500,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
        onMouseEnter={(e) => {
          const current = e.currentTarget.style.backgroundColor;
          e.currentTarget.style.backgroundColor = darkenColor(current, 10);
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = themeColor;
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        }}
      >
        返回编辑
      </button>

      <div
        style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: '48px 24px',
        }}
      >
        {sorted.length === 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 400,
              color: '#BDC3C7',
              fontSize: 18,
            }}
          >
            暂无内容，请返回编辑器添加组件
          </div>
        )}
        {sorted.map((comp) => (
          <div key={comp.id} style={{ marginBottom: 16, zIndex: comp.zIndex }}>
            {renderComponent(comp, themeColor)}
          </div>
        ))}
      </div>
    </div>
  );
}
