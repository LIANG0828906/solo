import React from 'react';
import { useStore } from '../store/useStore';
import { Fragment } from '../fragments/FragmentEngine';

interface InfoPanelProps {
  fragments: Fragment[];
}

const InfoPanel: React.FC<InfoPanelProps> = ({ fragments }) => {
  const { hoveredFragment, completedSymbols } = useStore();

  const fragment = hoveredFragment
    ? fragments.find(f => f.id === hoveredFragment)
    : null;

  const getTypeName = (type: string): string => {
    const names: Record<string, string> = {
      bowl_rim: '碗口边缘',
      bottle_body: '瓶身碎片',
      painted: '彩绘陶片'
    };
    return names[type] || type;
  };

  const getSymbolName = (symbolId: number): string => {
    const names = ['螺旋纹', '三角纹', '同心圆纹', '波浪纹', '几何纹'];
    return names[symbolId] || `符号 ${symbolId + 1}`;
  };

  if (!fragment) {
    return (
      <div
        style={{
          position: 'absolute',
          top: '80px',
          left: '20px',
          padding: '16px 20px',
          background: 'rgba(205, 127, 50, 0.1)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(205, 127, 50, 0.3)',
          borderRadius: '8px',
          color: '#CD7F32',
          fontFamily: 'sans-serif',
          fontSize: '14px',
          minWidth: '200px',
          transition: 'all 0.2s ease',
          pointerEvents: 'none'
        }}
      >
        <div style={{ opacity: 0.7 }}>悬停陶片查看详情</div>
      </div>
    );
  }

  const isCompleted = completedSymbols.includes(fragment.symbolId);

  return (
    <div
      style={{
        position: 'absolute',
        top: '80px',
        left: '20px',
        padding: '16px 20px',
        background: 'rgba(205, 127, 50, 0.15)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(205, 127, 50, 0.5)',
        borderRadius: '8px',
        color: '#CD7F32',
        fontFamily: 'sans-serif',
        fontSize: '14px',
        minWidth: '220px',
        transition: 'all 0.2s ease',
        pointerEvents: 'none'
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '12px', fontSize: '16px' }}>
        {getTypeName(fragment.type)}
      </div>
      <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ opacity: 0.7 }}>所属符号：</span>
        <span>{getSymbolName(fragment.symbolId)}</span>
      </div>
      <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ opacity: 0.7 }}>碎片编号：</span>
        <span>#{fragment.id.split('_')[1]}</span>
      </div>
      <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ opacity: 0.7 }}>拼接状态：</span>
        <span style={{ color: fragment.isSnapped ? '#4CAF50' : '#FF9800' }}>
          {fragment.isSnapped ? '已拼接' : '待拼接'}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ opacity: 0.7 }}>符号状态：</span>
        <span style={{ color: isCompleted ? '#4CAF50' : '#FF9800' }}>
          {isCompleted ? '已完成' : '进行中'}
        </span>
      </div>
    </div>
  );
};

export default InfoPanel;
