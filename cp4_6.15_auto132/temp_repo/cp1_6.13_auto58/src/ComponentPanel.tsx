import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import type { ComponentType } from './types';

/**
 * DEFAULT_STYLES 配置表
 * ──────────────────────────────────────────────────────────────
 * 每种组件类型的默认属性值:
 *
 * type      | width | height | fontSize | color    | backgroundColor | borderRadius | content
 * ──────────┼───────┼────────┼──────────┼──────────┼─────────────────┼──────────────┼───────────────
 * title     | 300   | 60     | 24       | #1e3a5f  | transparent     | 0            | 标题文本
 * paragraph | 300   | 120    | 14       | #333333  | transparent     | 0            | 段落文本内容
 * image     | 400   | 300    | -        | -        | transparent     | 4            | -
 * button    | 120   | 40     | 14       | #ffffff  | #2196F3         | 4            | 按钮
 * form      | 300   | 200    | 14       | #333333  | #ffffff         | 4            | -
 * carousel  | 400   | 300    | -        | -        | #f0f0f0         | 4            | -
 * ──────────────────────────────────────────────────────────────
 */
export const DEFAULT_STYLES: Record<ComponentType, {
  width: number;
  height: number;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
  content?: string;
}> = {
  title: {
    width: 300,
    height: 60,
    fontSize: 24,
    color: '#1e3a5f',
    backgroundColor: 'transparent',
    borderRadius: 0,
    content: '标题文本',
  },
  paragraph: {
    width: 300,
    height: 120,
    fontSize: 14,
    color: '#333333',
    backgroundColor: 'transparent',
    borderRadius: 0,
    content: '段落文本内容，在这里输入您的文字描述。',
  },
  image: {
    width: 400,
    height: 300,
    backgroundColor: 'transparent',
    borderRadius: 4,
  },
  button: {
    width: 120,
    height: 40,
    fontSize: 14,
    color: '#ffffff',
    backgroundColor: '#2196F3',
    borderRadius: 4,
    content: '按钮',
  },
  form: {
    width: 300,
    height: 200,
    fontSize: 14,
    color: '#333333',
    backgroundColor: '#ffffff',
    borderRadius: 4,
  },
  carousel: {
    width: 400,
    height: 300,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
};

interface ComponentItemProps {
  componentType: ComponentType;
  icon: string;
  name: string;
}

const ComponentItem: React.FC<ComponentItemProps> = ({ componentType, icon, name }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'COMPONENT',
    item: { type: 'COMPONENT', componentType },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [componentType]);

  return (
    <div
      ref={drag}
      style={{
        padding: '12px 16px',
        margin: '4px 8px',
        backgroundColor: isDragging ? '#e3f2fd' : '#ffffff',
        border: isDragging ? '2px dashed #2196F3' : '1px solid #e0e0e0',
        borderRadius: 8,
        cursor: 'grab',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        transition: 'all 0.2s ease',
        opacity: isDragging ? 0.6 : 1,
        boxShadow: isDragging ? '3px 3px 6px rgba(0,0,0,0.15)' : 'none',
        userSelect: 'none',
      }}
    >
      <span style={{ fontSize: 24 }}>{icon}</span>
      <span style={{ fontSize: 14, color: '#1e3a5f', fontWeight: 500 }}>{name}</span>
    </div>
  );
};

const ComponentPanel: React.FC = () => {
  const components: { type: ComponentType; icon: string; name: string }[] = [
    { type: 'title', icon: '📝', name: '标题' },
    { type: 'paragraph', icon: '📄', name: '段落' },
    { type: 'image', icon: '🖼️', name: '图片' },
    { type: 'button', icon: '🔘', name: '按钮' },
    { type: 'form', icon: '📋', name: '表单' },
    { type: 'carousel', icon: '🎠', name: '轮播图' },
  ];

  return (
    <div style={{
      width: 250,
      height: '100%',
      backgroundColor: '#f0f2f5',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '16px',
        fontSize: 16,
        fontWeight: 700,
        color: '#1e3a5f',
        borderBottom: '2px solid #e0e0e0',
      }}>
        组件面板
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {components.map(comp => (
          <ComponentItem
            key={comp.type}
            componentType={comp.type}
            icon={comp.icon}
            name={comp.name}
          />
        ))}
      </div>
      <div style={{
        height: 6,
        background: 'linear-gradient(90deg, #2196F3, #9C27B0)',
        flexShrink: 0,
      }} />
    </div>
  );
};

export default ComponentPanel;
