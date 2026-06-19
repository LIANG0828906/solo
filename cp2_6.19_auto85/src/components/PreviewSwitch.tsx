import React from 'react';

interface PreviewSwitchProps {
  checked: boolean;
  activeColor: string;
  inactiveColor: string;
  thumbColor: string;
  width: number;
  height: number;
  thumbSize: number;
  borderRadius: number;
  shadow: number;
  label: boolean;
  labelText: string;
  disabled: boolean;
}

export const PreviewSwitch: React.FC<PreviewSwitchProps> = (props) => {
  const {
    checked,
    activeColor,
    inactiveColor,
    thumbColor,
    width,
    height,
    thumbSize,
    borderRadius,
    shadow,
    label,
    labelText,
    disabled,
  } = props;

  const thumbOffset = Math.max(2, (height - thumbSize) / 2);
  const thumbTranslate = checked ? width - thumbSize - thumbOffset : thumbOffset;

  const wrapperStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    userSelect: 'none',
  };

  const trackStyle: React.CSSProperties = {
    position: 'relative',
    width: `${width}px`,
    height: `${height}px`,
    backgroundColor: checked ? activeColor : inactiveColor,
    borderRadius: `${borderRadius}px`,
    transition: 'background-color 0.2s ease',
  };

  const thumbStyle: React.CSSProperties = {
    position: 'absolute',
    top: `${thumbOffset}px`,
    left: '0',
    width: `${thumbSize}px`,
    height: `${thumbSize}px`,
    backgroundColor: thumbColor,
    borderRadius: '50%',
    transform: `translateX(${thumbTranslate}px)`,
    boxShadow: shadow > 0 ? `0 ${Math.floor(shadow / 2)}px ${shadow}px rgba(0, 0, 0, 0.3)` : 'none',
    transition: 'transform 0.2s ease',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#cdd6f4',
  };

  return (
    <div style={wrapperStyle}>
      <div style={trackStyle}>
        <div style={thumbStyle} />
      </div>
      {label && <span style={labelStyle}>{labelText}</span>}
    </div>
  );
};
