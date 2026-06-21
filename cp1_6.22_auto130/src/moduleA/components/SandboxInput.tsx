import React from 'react';
import type { ComponentProps } from '../../types';

interface SandboxInputProps extends ComponentProps {
  placeholder?: string;
  value?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
}

export const SandboxInput: React.FC<SandboxInputProps> = React.memo((props) => {
  const { placeholder, value = '', disabled = false, onChange } = props;

  return (
    <input
      type="text"
      className="sandbox-input"
      placeholder={placeholder}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value)}
    />
  );
});

SandboxInput.displayName = 'SandboxInput';
