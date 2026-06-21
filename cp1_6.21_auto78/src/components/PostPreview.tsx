import React from 'react';

interface PosterStyle {
  containerStyle: React.CSSProperties;
  titleStyle: React.CSSProperties;
  subtitleStyle: React.CSSProperties;
  isFontTransitioning: boolean;
}

interface PostPreviewProps {
  title: string;
  subtitle: string;
  layout: 'center' | 'left' | 'wrap';
  posterStyle: PosterStyle;
  previewRef: React.RefObject<HTMLDivElement>;
}

const PostPreview: React.FC<PostPreviewProps> = ({
  title,
  subtitle,
  layout,
  posterStyle,
  previewRef,
}) => {
  const { containerStyle, titleStyle, subtitleStyle } = posterStyle;

  const renderWrapLayout = () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '520px',
            height: '520px',
            border: `2px dashed ${subtitleStyle.color}`,
            borderRadius: '50%',
            opacity: 0.15,
          }}
        />
        <h2 style={titleStyle}>{title || '标题文字'}</h2>
      </div>
      <p style={subtitleStyle}>
        {subtitle || '副标题内容，围绕主标题弯曲排列的环绕效果'}
      </p>
      <div
        style={{
          position: 'absolute',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '440px',
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${subtitleStyle.color}33, transparent)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '440px',
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${subtitleStyle.color}33, transparent)`,
        }}
      />
    </div>
  );

  const renderDefaultLayout = () => (
    <React.Fragment>
      <h2 style={titleStyle}>{title || '标题文字'}</h2>
      <p style={subtitleStyle}>
        {subtitle || '副标题内容，用于补充说明主标题的核心信息'}
      </p>
    </React.Fragment>
  );

  return (
    <div ref={previewRef} style={containerStyle}>
      {layout === 'wrap' ? renderWrapLayout() : renderDefaultLayout()}
    </div>
  );
};

export default PostPreview;
