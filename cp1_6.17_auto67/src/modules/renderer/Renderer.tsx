import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import type { ComponentConfig } from '@/types';

interface RendererProps {
  config: ComponentConfig | null;
}

export interface RendererHandle {
  getContainer: () => HTMLDivElement | null;
}

const StyledButton: React.FC<{
  text?: string;
  variant?: string;
  size?: string;
  disabled?: boolean;
}> = ({ text = 'Button', variant = 'primary', size = 'medium', disabled = false }) => {
  const bgMap: Record<string, string> = {
    primary: '#1890FF',
    secondary: '#F0F0F0',
    danger: '#FF4D4F',
  };
  const colorMap: Record<string, string> = {
    primary: '#FFFFFF',
    secondary: '#333333',
    danger: '#FFFFFF',
  };
  const sizeMap: Record<string, React.CSSProperties> = {
    small: { padding: '4px 12px', fontSize: '12px' },
    medium: { padding: '6px 16px', fontSize: '14px' },
    large: { padding: '8px 24px', fontSize: '16px' },
  };

  return React.createElement('button', {
    disabled,
    style: {
      backgroundColor: disabled ? '#F5F5F5' : bgMap[variant] || bgMap.primary,
      color: disabled ? '#BFBFBF' : colorMap[variant] || colorMap.primary,
      border: 'none',
      borderRadius: '6px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
      transition: 'all 0.2s ease',
      ...sizeMap[size],
    },
  }, text);
};

const StyledCard: React.FC<{
  title?: string;
  content?: string;
  borderWidth?: number;
}> = ({ title = 'Card Title', content = 'Card content goes here', borderWidth = 1 }) => {
  return React.createElement('div', {
    style: {
      border: `${borderWidth}px solid #D9D9D9`,
      borderRadius: '8px',
      padding: '16px',
      backgroundColor: '#FFFFFF',
      fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
      maxWidth: '320px',
    },
  },
    React.createElement('h3', {
      style: { margin: '0 0 8px 0', fontSize: '16px', color: '#1A1A2E', fontWeight: 600 },
    }, title),
    React.createElement('p', {
      style: { margin: 0, fontSize: '14px', color: '#666666', lineHeight: 1.6 },
    }, content),
  );
};

const StyledInput: React.FC<{
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}> = ({ placeholder = 'Enter text...', type = 'text', disabled = false }) => {
  return React.createElement('input', {
    type,
    placeholder,
    disabled,
    style: {
      border: '1px solid #D9D9D9',
      borderRadius: '6px',
      padding: '6px 12px',
      fontSize: '14px',
      fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
      backgroundColor: disabled ? '#F5F5F5' : '#FFFFFF',
      color: disabled ? '#BFBFBF' : '#333333',
      cursor: disabled ? 'not-allowed' : 'text',
      outline: 'none',
      width: '240px',
      transition: 'border-color 0.2s ease',
    },
  });
};

const componentMap: Record<string, React.FC<Record<string, unknown>>> = {
  Button: StyledButton as unknown as React.FC<Record<string, unknown>>,
  Card: StyledCard as unknown as React.FC<Record<string, unknown>>,
  Input: StyledInput as unknown as React.FC<Record<string, unknown>>,
};

const renderConfig = (config: ComponentConfig): React.ReactElement => {
  const Component = componentMap[config.type];
  if (!Component) {
    return React.createElement('div', {
      style: { color: '#FF4D4F', padding: '8px', fontSize: '14px' },
    }, `Unknown component: ${config.type}`);
  }
  const children = config.children
    ? config.children.map((child, i) =>
        React.cloneElement(renderConfig(child), { key: i })
      )
    : undefined;
  return React.createElement(Component, config.props as Record<string, unknown>, children);
};

export const Renderer = forwardRef<RendererHandle, RendererProps>(({ config }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    getContainer: () => containerRef.current,
  }));

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.minHeight = '100px';
    }
  }, []);

  return React.createElement('div', {
    ref: containerRef,
    style: {
      padding: '16px',
      backgroundColor: '#FFFFFF',
      borderRadius: '8px',
      display: 'inline-block',
    },
  }, config ? renderConfig(config) : null);
});
