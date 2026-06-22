import React from 'react';
import { useSandboxStore } from '../store/sandboxStore';
import { useDragDrop } from '../hooks/useDragDrop';
import { SandboxInput } from './SandboxInput';
import { SandboxButton } from './SandboxButton';
import { SandboxSwitch } from './SandboxSwitch';
import { SandboxTable } from './SandboxTable';
import type { ComponentInstance } from '../../types';

const componentMap = {
  input: SandboxInput,
  button: SandboxButton,
  switch: SandboxSwitch,
  table: SandboxTable,
};

interface ComponentWrapperProps {
  component: ComponentInstance;
  index: number;
}

export const ComponentWrapper: React.FC<ComponentWrapperProps> = React.memo(({ component, index }) => {
  const { id, type, props } = component;
  const { selectedComponentId, selectComponent, updateComponentProps } =
    useSandboxStore();
  const { handleMouseDown, setRef, isDragging } = useDragDrop(id, index);

  const isSelected = selectedComponentId === id;
  const Component = componentMap[type];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDragging) {
      selectComponent(id);
    }
  };

  const handleComponentChange = (key: string, value: any) => {
    updateComponentProps(id, { [key]: value });
  };

  const enhancedProps = {
    ...props,
    onChange: (value: any) => {
      if (type === 'input') {
        handleComponentChange('value', value);
      } else if (type === 'switch') {
        handleComponentChange('checked', value);
      }
      props.onChange?.(value);
    },
    onClick: () => {
      props.onClick?.();
    },
  };

  return (
    <div
      ref={setRef}
      className={`drag-handle drag-transition ${isSelected ? 'component-selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        padding: '12px',
        borderRadius: '8px',
        backgroundColor: '#FFFFFF',
        position: isDragging ? 'fixed' : 'relative',
        zIndex: isDragging ? 1000 : 'auto',
        pointerEvents: isDragging ? 'none' : 'auto',
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      <Component {...enhancedProps} />
    </div>
  );
});

ComponentWrapper.displayName = 'ComponentWrapper';
