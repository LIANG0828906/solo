import React, { memo } from 'react';
import { useDrag } from 'react-dnd';
import { ElementType, DRAG_TYPES, MaterialDragItem } from '../types';

export const MaterialPanel: React.FC = memo(() => {
  return (
    <div
      style={{
        width: 280,
        flexShrink: 0,
        background: '#2B3A4D',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <div
        style={{
          padding: '16px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.8, opacity: 0.9 }}>
          素材库
        </div>
        <div style={{ fontSize: 11, marginTop: 4, opacity: 0.5 }}>
          拖拽素材到画布上
        </div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <MaterialCard
          icon="T"
          title="文本框"
          desc="添加可编辑文字"
          elementType={ElementType.TEXT}
        />
        <MaterialCard
          icon="🖼"
          title="图片框"
          desc="上传本地图片填充"
          elementType={ElementType.IMAGE}
        />
      </div>

      <div style={{ flex: 1 }} />

      <div
        style={{
          padding: 16,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          fontSize: 11,
          opacity: 0.5,
          lineHeight: 1.6,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 6, opacity: 0.8 }}>操作提示</div>
        <div>• 拖拽素材到画布添加</div>
        <div>• 单击选中元素进行编辑</div>
        <div>• 双击文字框直接编辑</div>
        <div>• 拖动右下角按比例缩放</div>
      </div>
    </div>
  );
});

MaterialPanel.displayName = 'MaterialPanel';

const MaterialCard: React.FC<{
  icon: string;
  title: string;
  desc: string;
  elementType: ElementType;
}> = ({ icon, title, desc, elementType }) => {
  const [{ isDragging }, drag] = useDrag<MaterialDragItem, void, { isDragging: boolean }>(
    () => ({
      type: DRAG_TYPES.MATERIAL,
      item: () => ({
        type: DRAG_TYPES.MATERIAL,
        elementType,
      }),
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [elementType]
  );

  return (
    <div
      ref={drag}
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 6,
        padding: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.5 : 1,
        transition: 'all 0.15s',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.background = 'rgba(74,107,140,0.4)';
          e.currentTarget.style.borderColor = 'rgba(74,107,140,0.8)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 6,
          background: 'linear-gradient(135deg, #4A6B8C, #3A5A7C)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: elementType === ElementType.TEXT ? 18 : 20,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.95 }}>{title}</div>
        <div style={{ fontSize: 11, marginTop: 2, opacity: 0.55 }}>{desc}</div>
      </div>
    </div>
  );
};
