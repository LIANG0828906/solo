import React from 'react';

interface ReviewQueueProps {
  selectedTaskId: string | null;
  onTaskSelect: (id: string) => void;
}

const ReviewQueue: React.FC<ReviewQueueProps> = ({ selectedTaskId, onTaskSelect }) => {
  const mockTasks = [
    { id: '101', title: '已标注文本 101', annotator: '张三', time: '2分钟前' },
    { id: '102', title: '已标注图片 102', annotator: '李四', time: '10分钟前' },
    { id: '103', title: '已标注文本 103', annotator: '王五', time: '1小时前' },
  ];

  return (
    <div style={{ padding: 24, flex: 1, maxWidth: 360, borderRight: '1px solid #455A64' }}>
      <h3 style={{ color: '#fff', marginBottom: 16, fontSize: 16 }}>待审核任务</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {mockTasks.map((task) => (
          <div
            key={task.id}
            onClick={() => onTaskSelect(task.id)}
            style={{
              padding: 12,
              borderRadius: 6,
              backgroundColor: selectedTaskId === task.id ? '#455A64' : '#37474F',
              cursor: 'pointer',
              color: '#fff',
              fontSize: 14,
              border: selectedTaskId === task.id ? '1px solid #42A5F5' : '1px solid transparent',
            }}
          >
            <div style={{ fontWeight: 500 }}>{task.title}</div>
            <div style={{ fontSize: 12, color: '#90A4AE', marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
              <span>👤 {task.annotator}</span>
              <span>⏰ {task.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewQueue;
