import React, { useState, useMemo } from 'react';
import type { ColorItem } from './ColorInputPanel';

interface PreviewModeProps {
  foregroundColors: ColorItem[];
  backgroundColors: ColorItem[];
  onClose: () => void;
}

const loremText = `色彩无障碍设计是现代前端开发中不可或缺的一环。根据 WCAG 2.1 标准，文本与背景之间必须具备足够的对比度，才能确保视觉障碍用户能够正常阅读内容。本预览模式模拟了真实阅读场景下的文本可读性，帮助设计师在美观与无障碍之间找到平衡点。

在设计界面时，我们经常面临视觉美感与可访问性之间的抉择。一个精心挑选的配色方案可能看起来令人赏心悦目，但如果对比度不足，那些视力受损的用户将无法有效使用产品。这不仅影响用户体验，也可能带来法律合规风险。

研究表明，全球约有 2.85 亿人患有视觉障碍，其中 3900 万人完全失明。通过确保足够的色彩对比度，我们可以让更多用户无障碍地访问数字内容。这不仅是一种最佳实践，更是基本的人性化设计原则。

正文内容通常会使用较小的字号，因此对对比度的要求更为严格。标题由于字号较大，可以适当降低对比度要求，但仍需保证基本的可读性。链接文本不仅要与背景有足够对比度，还需要与周围正文有所区分。

小字标注常用于免责声明、版权信息等次要内容，虽然在设计层级中地位较低，但依然需要满足基本的可读性标准。特别是在法律声明等场景中，确保所有用户都能阅读到这些信息是非常重要的。`;

const longContent = loremText.split('\n').filter(Boolean);

const PreviewMode: React.FC<PreviewModeProps> = ({
  foregroundColors,
  backgroundColors,
  onClose,
}) => {
  const [bgIndex, setBgIndex] = useState(0);
  const [hoveredLink, setHoveredLink] = useState(false);

  const bgColor = backgroundColors[bgIndex]?.hex || '#1E1E2E';
  const headingColor = foregroundColors[0]?.hex || '#E0E0F0';
  const bodyColor = foregroundColors.length > 1 ? foregroundColors[1].hex : foregroundColors[0]?.hex || '#E0E0F0';
  const linkColor = foregroundColors.length > 2 ? foregroundColors[2].hex : foregroundColors[0]?.hex || '#6366F1';
  const smallColor = foregroundColors.length > 3 ? foregroundColors[3].hex : foregroundColors.length > 1 ? foregroundColors[1].hex : '#E0E0F0';

  const linkHoverColor = useMemo(() => {
    const hex = linkColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const lighter = `rgb(${Math.min(255, r + 40)},${Math.min(255, g + 40)},${Math.min(255, b + 40)})`;
    return lighter;
  }, [linkColor]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        background: bgColor,
        overflow: 'auto',
        transition: 'background 0.3s',
      }}
    >
      <div
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 1001,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}
      >
        {backgroundColors.map((c, i) => (
          <button
            key={c.id}
            onClick={() => setBgIndex(i)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: i === bgIndex ? '2px solid #6366F1' : '2px solid #3B3B55',
              background: c.hex,
              cursor: 'pointer',
              transition: 'border-color 0.2s, transform 0.2s',
              padding: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          />
        ))}
        <button
          onClick={onClose}
          style={{
            marginLeft: 8,
            padding: '8px 16px',
            background: 'rgba(0,0,0,0.4)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
            transition: 'background 0.2s, transform 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.4)';
          }}
        >
          退出预览
        </button>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '80px 24px 60px' }}>
        {longContent.map((para, i) => {
          if (i === 0) {
            return (
              <h1
                key={i}
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: headingColor,
                  lineHeight: 1.4,
                  marginBottom: 24,
                }}
              >
                {para}
              </h1>
            );
          }

          const parts: React.ReactNode[] = [];
          let text = para;
          let keyIdx = 0;
          const linkPattern = /对比度|可访问性|可读性|色彩对比度/g;
          let lastIndex = 0;
          let match;
          while ((match = linkPattern.exec(text)) !== null) {
            if (match.index > lastIndex) {
              parts.push(
                <span key={keyIdx++}>{text.substring(lastIndex, match.index)}</span>
              );
            }
            parts.push(
              <span
                key={keyIdx++}
                style={{
                  color: hoveredLink && match.index === 0 ? linkHoverColor : linkColor,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                  fontSize: 14,
                }}
                onMouseEnter={() => setHoveredLink(true)}
                onMouseLeave={() => setHoveredLink(false)}
              >
                {match[0]}
              </span>
            );
            lastIndex = match.index + match[0].length;
          }
          if (lastIndex < text.length) {
            parts.push(<span key={keyIdx++}>{text.substring(lastIndex)}</span>);
          }

          const isSmall = i === longContent.length - 1;

          return (
            <p
              key={i}
              style={{
                fontSize: isSmall ? 12 : 16,
                fontWeight: isSmall ? 400 : 400,
                color: isSmall ? smallColor : bodyColor,
                lineHeight: isSmall ? 1.6 : 1.8,
                marginBottom: 16,
              }}
            >
              {parts}
            </p>
          );
        })}
      </div>
    </div>
  );
};

export default PreviewMode;
