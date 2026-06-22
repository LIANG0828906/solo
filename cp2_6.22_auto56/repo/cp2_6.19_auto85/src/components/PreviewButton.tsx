import React from 'react';
import { Icon } from '@iconify/react';

interface PreviewButtonProps {
  text: string;
  bgColor: string;
  textColor: string;
  width: number;
  height: number;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  fontSize: number;
  fontWeight: string;
  shadow: number;
  icon: string;
  disabled: boolean;
}

export const PreviewButton: React.FC<PreviewButtonProps> = (props) => {
  const {
    text,
    bgColor,
    textColor,
    width,
    height,
    borderRadius,
    borderWidth,
    borderColor,
    fontSize,
    fontWeight,
    shadow,
    icon,
    disabled,
  } = props;

  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: `${width}px`,
    height: `${height}px`,
    backgroundColor: bgColor,
    color: textColor,
    fontSize: `${fontSize}px`,
    fontWeight: Number(fontWeight),
    borderRadius: `${borderRadius}px`,
    border: `${borderWidth}px solid ${borderColor}`,
    boxShadow: shadow > 0 ? `0 ${Math.floor(shadow / 2)}px ${shadow}px rgba(0, 0, 0, 0.3)` : 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    userSelect: 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  };

  return (
    <button style={style} disabled={disabled}>
      {icon && (
        <Icon
          icon={icon}
          width={fontSize}
          height={fontSize}
          className={icon === 'mdi:loading' ? 'animate-spin' : ''}
        />
      )}
      <span>{text}</span>
    </button>
  );
};
