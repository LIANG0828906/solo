import React from 'react';
import { Icon } from '@iconify/react';

interface PreviewCardProps {
  title: string;
  description: string;
  bgColor: string;
  textColor: string;
  descColor: string;
  width: number;
  padding: number;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  titleSize: number;
  titleWeight: string;
  descSize: number;
  shadow: number;
  icon: string;
}

export const PreviewCard: React.FC<PreviewCardProps> = (props) => {
  const {
    title,
    description,
    bgColor,
    textColor,
    descColor,
    width,
    padding,
    borderRadius,
    borderWidth,
    borderColor,
    titleSize,
    titleWeight,
    descSize,
    shadow,
    icon,
  } = props;

  const cardStyle: React.CSSProperties = {
    width: `${width}px`,
    backgroundColor: bgColor,
    borderRadius: `${borderRadius}px`,
    border: `${borderWidth}px solid ${borderColor}`,
    boxShadow: shadow > 0 ? `0 ${Math.floor(shadow / 3)}px ${shadow}px rgba(0, 0, 0, 0.3)` : 'none',
    padding: `${padding}px`,
    transition: 'all 0.2s ease',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: description ? '10px' : '0',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: `${titleSize}px`,
    fontWeight: Number(titleWeight),
    color: textColor,
    lineHeight: 1.3,
  };

  const descStyle: React.CSSProperties = {
    fontSize: `${descSize}px`,
    color: descColor,
    lineHeight: 1.6,
  };

  return (
    <div style={cardStyle}>
      {(icon || title) && (
        <div style={headerStyle}>
          {icon && <Icon icon={icon} width={titleSize} height={titleSize} color={textColor} />}
          <span style={titleStyle}>{title}</span>
        </div>
      )}
      {description && <p style={descStyle}>{description}</p>}
    </div>
  );
};
