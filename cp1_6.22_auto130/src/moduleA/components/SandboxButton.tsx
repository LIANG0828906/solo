import React from 'react';
import type { ComponentProps } from '../../types';

interface SandboxButtonProps extends ComponentProps {
  text?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  onClick?: () => void;
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: { backgroundColor: '#2563EB' },
  secondary: { backgroundColor: '#64748B' },
  danger: { backgroundColor: '#DC2626' },
};

export const SandboxButton: React.FC<SandboxButtonProps> = React.memo((props) => {
  const { text = '按钮', variant = 'primary', disabled = false, onClick } = props;

  return (
    <button
      className="sandbox-button"
      style={variantStyles[variant]}
      disabled={disabled}
      onClick={onClick}
    >
      {text}
    </button>
  );
});

SandboxButton.displayName = 'SandboxButton';
