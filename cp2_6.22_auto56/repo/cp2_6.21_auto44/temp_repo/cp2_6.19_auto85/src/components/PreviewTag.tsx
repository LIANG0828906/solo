import React from 'react';
import { Icon } from '@iconify/react';

interface PreviewTagProps {
  text: string;
  bgColor: string;
  textColor: string;
  paddingX: number;
  paddingY: number;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  fontSize: number;
  fontWeight: string;
  icon: string;
  closable: boolean;
}

export const PreviewTag: React.FC<PreviewTagProps> = (props) => {
  const {
    text,
    bgColor,
    textColor,
    paddingX,
    paddingY,
    borderRadius,
    borderWidth,
    borderColor,
    fontSize,
    fontWeight,
    icon,
    closable,
  } = props;

  const tagStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: `${paddingY}px ${paddingX}px`,
    backgroundColor: bgColor,
    color: textColor,
    fontSize: `${fontSize}px`,
    fontWeight: Number(fontWeight),
    borderRadius: `${borderRadius}px`,
    border: `${borderWidth}px solid ${borderColor}`,
    lineHeight: 1.4,
    transition: 'all 0.2s ease',
    userSelect: 'none',
  };

  return (
    <span style={tagStyle}>
      {icon && <Icon icon={icon} width={fontSize} height={fontSize} />}
      <span>{text}</span>
      {closable && (
        <Icon icon="mdi:close" width={fontSize} height={fontSize} style={{ opacity: 0.7, cursor: 'pointer' }} />
      )}
    </span>
  );
};
