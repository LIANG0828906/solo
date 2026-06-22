import React from 'react';

interface AnnotationPanelProps {
  taskId: string | null;
}

const AnnotationPanel: React.FC<AnnotationPanelProps> = ({ taskId }) => {
  if (!taskId) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#90A4AE',
          fontSize: 16,
        }}
      >
        请从左侧选择一个任务进行标注
      </div>
    );
  }

  return (
    <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
      <h3 style={{ color: '#fff', marginBottom: 16, fontSize: 18 }}>
        标注面板 - 任务 {taskId}
      </h3>
      <div
        style={{
          backgroundColor: '#37474F',
          borderRadius: 8,
          padding: 24,
          color: '#fff',
          minHeight: 300,
        }}
      >
        <p style={{ lineHeight: 1.8, color: '#ECEFF1' }}>
          这里是任务内容区域。根据任务类型（文本或图片），将显示对应的标注界面。
        </p>
        <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
          <button
            style={{
              padding: '10px 24px',
              backgroundColor: '#42A5F5',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            提交标注
          </button>
          <button
            style={{
              padding: '10px 24px',
              backgroundColor: '#546E7A',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            重置
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnotationPanel;
