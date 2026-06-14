import React from 'react';
import type { ParamItem } from '@/store/types';

interface TargetButtonProps {
  params: ParamItem[];
}

function getParamValue(params: ParamItem[], name: string): string {
  return params.find((p) => p.name === name)?.currentValue ?? '';
}

const sizeMap: Record<string, { padding: string; fontSize: string }> = {
  small: { padding: '6px 16px', fontSize: '12px' },
  medium: { padding: '10px 24px', fontSize: '14px' },
  large: { padding: '14px 32px', fontSize: '16px' },
};

const variantMap: Record<string, { background: string; color: string; border: string }> = {
  primary: { background: '#3b82f6', color: '#ffffff', border: 'none' },
  secondary: { background: '#e2e8f0', color: '#334155', border: 'none' },
  outline: { background: 'transparent', color: '#3b82f6', border: '2px solid #3b82f6' },
};

const TargetButton: React.FC<TargetButtonProps> = ({ params }) => {
  const text = getParamValue(params, 'text') || 'Button';
  const variant = getParamValue(params, 'variant') || 'primary';
  const size = getParamValue(params, 'size') || 'medium';
  const disabled = getParamValue(params, 'disabled') === 'true';
  const borderRadius = getParamValue(params, 'borderRadius') || '8';

  const sizeStyle = sizeMap[size] ?? sizeMap.medium;
  const variantStyle = variantMap[variant] ?? variantMap.primary;

  const buttonStyle: React.CSSProperties = {
    padding: sizeStyle.padding,
    fontSize: sizeStyle.fontSize,
    fontWeight: 600,
    background: disabled ? '#cbd5e1' : variantStyle.background,
    color: disabled ? '#94a3b8' : variantStyle.color,
    border: disabled ? 'none' : variantStyle.border,
    borderRadius: `${borderRadius}px`,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    outline: 'none',
    letterSpacing: '0.02em',
    opacity: disabled ? 0.6 : 1,
  };

  return <button style={buttonStyle} disabled={disabled}>{text}</button>;
};

export default TargetButton;
