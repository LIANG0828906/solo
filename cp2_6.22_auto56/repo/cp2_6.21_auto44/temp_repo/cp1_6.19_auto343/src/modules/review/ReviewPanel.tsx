import React from 'react';

interface ReviewPanelProps {
  taskId: string | null;
}

const ReviewPanel: React.FC<ReviewPanelProps> = ({ taskId }) => {
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
        请从左侧选择一个任务进行审核
      </div>
    );
  }

  return (
    <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
      <h3 style={{ color: '#fff', marginBottom: 16, fontSize: 18 }}>
        审核面板 - 任务 {taskId}
      </h3>
      <div style={{ display: 'flex', gap: 20 }}>
        <div
          style={{
            flex: 1,
            backgroundColor: '#37474F',
            borderRadius: 8,
            padding: 24,
            color: '#fff',
          }}
        >
          <h4 style={{ marginBottom: 12, color: '#B0BEC5', fontSize: 14 }}>原始内容</h4>
          <p style={{ lineHeight: 1.8, color: '#ECEFF1' }}>这是任务的原始内容，显示在审核面板的左侧。</p>
        </div>
        <div
          style={{
            flex: 1,
            backgroundColor: '#37474F',
            borderRadius: 8,
            padding: 24,
            color: '#fff',
          }}
        >
          <h4 style={{ marginBottom: 12, color: '#B0BEC5', fontSize: 14 }}>标注结果</h4>
          <p style={{ lineHeight: 1.8, color: '#ECEFF1' }}>这是标注员的标注结果，显示在审核面板的右侧。</p>
        </div>
      </div>
      <div style={{ marginTop: 20 }}>
        <textarea
          placeholder="请填写审核评语（可选，最多200字）..."
          style={{
            width: '100%',
            height: 80,
            backgroundColor: '#37474F',
            border: '1px solid #546E7A',
            borderRadius: 6,
            padding: 12,
            color: '#fff',
            fontSize: 14,
            resize: 'none',
            fontFamily: 'inherit',
          }}
        />
      </div>
      <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
        <button
          style={{
            width: 120,
            padding: '12px 0',
            backgroundColor: '#66BB6A',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          通过
        </button>
        <button
          style={{
            width: 120,
            padding: '12px 0',
            backgroundColor: '#FB8C00',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          存疑
        </button>
        <button
          style={{
            width: 120,
            padding: '12px 0',
            backgroundColor: '#E53935',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          驳回
        </button>
      </div>
    </div>
  );
};

export default ReviewPanel;
