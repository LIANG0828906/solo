import React from 'react';

interface IconButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
  active?: boolean;
  disabled?: boolean;
  className?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  children,
  onClick,
  title,
  active = false,
  disabled = false,
  className = '',
}) => {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: active ? 'var(--color-accent)' : 'transparent',
    color: active ? 'var(--color-white)' : 'var(--color-text)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    opacity: disabled ? 0.5 : 1,
  };

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      title={title}
      disabled={disabled}
      className={className}
      style={baseStyle}
    >
      {children}
    </button>
  );
};
