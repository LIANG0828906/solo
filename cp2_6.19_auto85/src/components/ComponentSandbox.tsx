import React, { useState, useEffect, useRef } from 'react';
import type { ComponentDefinition } from '../types';
import { PreviewButton } from './PreviewButton';
import { PreviewInput } from './PreviewInput';
import { PreviewCard } from './PreviewCard';
import { PreviewSwitch } from './PreviewSwitch';
import { PreviewTag } from './PreviewTag';

interface ComponentSandboxProps {
  component: ComponentDefinition;
  props: Record<string, any>;
  animKey: number;
  isPresetChange: boolean;
}

export const ComponentSandbox: React.FC<ComponentSandboxProps> = ({
  component,
  props,
  animKey,
  isPresetChange,
}) => {
  const [animClass, setAnimClass] = useState('');
  const prevKeyRef = useRef(animKey);

  useEffect(() => {
    if (prevKeyRef.current !== animKey) {
      prevKeyRef.current = animKey;
      setAnimClass(isPresetChange ? 'animate-flip' : 'animate-bounce');
      const timer = setTimeout(() => setAnimClass(''), 500);
      return () => clearTimeout(timer);
    }
  }, [animKey, isPresetChange]);

  const renderPreview = () => {
    switch (component.id) {
      case 'button':
        return <PreviewButton {...props} />;
      case 'input':
        return <PreviewInput {...props} />;
      case 'card':
        return <PreviewCard {...props} />;
      case 'switch':
        return <PreviewSwitch {...props} />;
      case 'tag':
        return <PreviewTag {...props} />;
      default:
        return null;
    }
  };

  return (
    <div
      key={component.id}
      className="animate-fade-in"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#181825',
        minWidth: 0,
      }}
    >
      <div
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid #313244',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#cdd6f4' }}>
          {component.name} 预览
        </h2>
        <span style={{ fontSize: '12px', color: '#6c7086' }}>
          实时预览 · 调整右侧属性
        </span>
      </div>
      <div
        className="checkerboard-bg"
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          overflow: 'auto',
          perspective: '1000px',
        }}
      >
        <div
          className={animClass}
          style={{
            display: 'inline-flex',
            transformStyle: 'preserve-3d',
          }}
        >
          {renderPreview()}
        </div>
      </div>
    </div>
  );
};
