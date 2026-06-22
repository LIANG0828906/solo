import React, { useEffect, useState } from 'react';

export interface InfoPanelProps {
  visible: boolean;
  properties: Record<string, string | number | boolean>;
  isAbnormal?: boolean;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ visible, properties, isAbnormal }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      requestAnimationFrame(() => setShow(true));
    } else {
      setShow(false);
    }
  }, [visible]);

  if (!visible && !show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        right: 20,
        bottom: 20,
        width: 280,
        backgroundColor: '#1A1A2ECC',
        borderRadius: 12,
        padding: 16,
        color: 'white',
        fontFamily: 'sans-serif',
        fontSize: 14,
        opacity: show ? 1 : 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: 'auto',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
      }}
    >
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          marginBottom: 12,
          paddingBottom: 8,
          borderBottom: '1px solid #333355',
          color: '#ffffff',
        }}
      >
        {properties['名称'] || '属性信息'}
      </div>
      {Object.entries(properties).map(([key, value]) => {
        if (key === '名称') return null;
        const isAbnormalStatus = key === '状态' && isAbnormal;
        return (
          <div
            key={key}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '6px 0',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ color: '#8888AA' }}>{key}</span>
            <span
              style={{
                color: isAbnormalStatus ? '#FF4444' : '#CCCCCC',
                fontWeight: isAbnormalStatus ? 600 : 400,
              }}
            >
              {typeof value === 'boolean' ? (value ? '是' : '否') : String(value)}
            </span>
          </div>
        );
      })}
      {isAbnormal && (
        <div
          style={{
            marginTop: 12,
            padding: 10,
            backgroundColor: 'rgba(255, 68, 68, 0.15)',
            borderRadius: 8,
            border: '1px solid #FF444466',
            color: '#FF6666',
            fontSize: 12,
            textAlign: 'center',
            transition: 'all 0.15s ease',
          }}
        >
          ⚠ 该管段存在异常，建议尽快检修
        </div>
      )}
    </div>
  );
};

export default InfoPanel;
