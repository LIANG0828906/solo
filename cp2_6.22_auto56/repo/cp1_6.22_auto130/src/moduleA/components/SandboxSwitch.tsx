import React from 'react';
import type { ComponentProps } from '../../types';

interface SandboxSwitchProps extends ComponentProps {
  checked?: boolean;
  label?: string;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}

export const SandboxSwitch: React.FC<SandboxSwitchProps> = React.memo((props) => {
  const { checked = false, label, disabled = false, onChange } = props;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <label className="sandbox-switch">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
        />
        <span className="sandbox-switch-slider" />
      </label>
      {label && <span style={{ fontSize: '14px', color: '#1E293B' }}>{label}</span>}
    </div>
  );
});

SandboxSwitch.displayName = 'SandboxSwitch';
