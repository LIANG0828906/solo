import React from 'react';
import { Icon } from '@iconify/react';

interface PreviewInputProps {
  placeholder: string;
  value: string;
  bgColor: string;
  textColor: string;
  placeholderColor: string;
  width: number;
  height: number;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  fontSize: number;
  shadow: number;
  icon: string;
  disabled: boolean;
}

export const PreviewInput: React.FC<PreviewInputProps> = (props) => {
  const {
    placeholder,
    value,
    bgColor,
    textColor,
    placeholderColor,
    width,
    height,
    borderRadius,
    borderWidth,
    borderColor,
    fontSize,
    shadow,
    icon,
    disabled,
  } = props;

  const wrapperStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    width: `${width}px`,
    height: `${height}px`,
    backgroundColor: bgColor,
    borderRadius: `${borderRadius}px`,
    border: `${borderWidth}px solid ${borderColor}`,
    boxShadow: shadow > 0 ? `0 ${Math.floor(shadow / 2)}px ${shadow}px rgba(0, 0, 0, 0.2)` : 'none',
    padding: `0 ${icon ? '12px' : '14px'}`,
    gap: '8px',
    transition: 'all 0.2s ease',
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : 'text',
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: textColor,
    fontSize: `${fontSize}px`,
    fontFamily: 'inherit',
    width: '100%',
  };

  return (
    <div style={wrapperStyle}>
      {icon && <Icon icon={icon} width={fontSize} height={fontSize} color={placeholderColor} />}
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        style={inputStyle}
        disabled={disabled}
        readOnly
      />
    </div>
  );
};
