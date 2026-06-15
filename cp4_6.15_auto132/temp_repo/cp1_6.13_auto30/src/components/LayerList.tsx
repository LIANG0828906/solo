import React, { memo, useState, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import {
  LayoutState,
  DRAG_TYPES,
  LayerDragItem,
  ElementType,
  PosterElement,
  TextElement,
  ImageElement,
} from '../types';
import { LayoutManager } from '../layout/LayoutManager';

interface LayerListProps {
  layoutManager: LayoutManager;
}

export const LayerList: React.FC<LayerListProps> = memo(({ layoutManager }) => {
  const [state, setState] = useState<LayoutState>(layoutManager.getState());

  useEffect(() => {
    return layoutManager.subscribe((s) => setState(s));
  }, [layoutManager]);

  const elements = [...state.elements].sort((a, b) => b.zIndex - a.zIndex);

  const getDescription = (el: PosterElement) => {
    if (el.type === ElementType.TEXT) {
      const content = (el as TextElement).content.replace(/\s/g, '');
      return content || '空文本';
    } else {
      return (el as ImageElement).src ? '已填充图片' : '空图片占位';
    }
  };

  const truncate = (s: string, n: number) => {
    if (s.length <= n) return s;
    return s.slice(0, n) + '…';
  };

  if (elements.length === 0) {
    return (
      <div
        style={{
          padding: 16,
          textAlign: 'center',
          fontSize: 11,
          opacity: 0.5,
          border: '1px dashed rgba(255,255,255,0.12)',
          borderRadius: 6,
        }}
      >
        暂无图层
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {elements.map((el, displayIndex) => {
        const realIndex = state.elements.length - 1 - displayIndex;
        return (
          <LayerItem
            key={el.id}
            element={el}
            isSelected={el.id === state.selectedId}
            realIndex={realIndex}
            description={truncate(getDescription(el), 20)}
            onSelect={() => layoutManager.selectElement(el.id)}
            onReorder={(from, to) => layoutManager.reorderElements(from, to)}
          />
        );
      })}
      <div style={{ fontSize: 10, opacity: 0.4, textAlign: 'center', marginTop: 8 }}>
        拖拽列表项调整顺序
      </div>
    </div>
  );
});

LayerList.displayName = 'LayerList';

interface LayerItemProps {
  element: PosterElement;
  isSelected: boolean;
  realIndex: number;
  description: string;
  onSelect: () => void;
  onReorder: (from: number, to: number) => void;
}

const LayerItem: React.FC<LayerItemProps> = ({
  element,
  isSelected,
  realIndex,
  description,
  onSelect,
  onReorder,
}) => {
  const ref = React.useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag<LayerDragItem, void, { isDragging: boolean }>(
    () => ({
      type: DRAG_TYPES.LAYER,
      item: {
        type: DRAG_TYPES.LAYER,
        index: realIndex,
        elementId: element.id,
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [element.id, realIndex]
  );

  const [{ isOver }, drop] = useDrop<LayerDragItem, void, { isOver: boolean }>(
    () => ({
      accept: DRAG_TYPES.LAYER,
      hover: (item) => {
        if (item.index !== realIndex) {
          onReorder(item.index, realIndex);
          item.index = realIndex;
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true }),
      }),
    }),
    [realIndex, onReorder]
  );

  drag(drop(ref));

  const isText = element.type === ElementType.TEXT;

  return (
    <div
      ref={ref}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        background: isSelected ? 'rgba(74,107,140,0.4)' : 'rgba(255,255,255,0.04)',
        border: isSelected
          ? '2px dashed #4A90E2'
          : `1px solid ${isOver ? 'rgba(74,107,140,0.8)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 5,
        cursor: isDragging ? 'grabbing' : 'pointer',
        opacity: isDragging ? 0.4 : 1,
        transition: 'all 0.15s ease',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: 4,
          background: isText ? 'rgba(52,152,219,0.2)' : 'rgba(39,174,96,0.2)',
          border: `1px solid ${isText ? 'rgba(52,152,219,0.5)' : 'rgba(39,174,96,0.5)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 700,
          color: isText ? '#5DADE2' : '#58D68D',
          flexShrink: 0,
        }}
      >
        {isText ? 'T' : '🖼'}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            opacity: 0.95,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontWeight: isSelected ? 600 : 400,
          }}
        >
          {isText ? '文本' : '图片'}
        </div>
        <div
          style={{
            fontSize: 10,
            opacity: 0.5,
            marginTop: 2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {description}
        </div>
      </div>

      <div
        style={{
          fontSize: 10,
          opacity: 0.4,
          cursor: 'grab',
          padding: 2,
        }}
      >
        ⠿
      </div>
    </div>
  );
};
