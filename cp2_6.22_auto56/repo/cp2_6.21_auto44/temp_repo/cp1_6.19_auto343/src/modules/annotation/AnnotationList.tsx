import React from 'react';

interface AnnotationListProps {
  selectedTaskId: string | null;
  onTaskSelect: (id: string) => void;
}

const AnnotationList: React.FC<AnnotationListProps> = ({ selectedTaskId, onTaskSelect }) => {
  const mockTasks = [
    { id: '1', title: '文本标注任务 001', status: 'pending', type: 'text' },
    { id: '2', title: '图片标注任务 002', status: 'pending', type: 'image' },
    { id: '3', title: '文本标注任务 003', status: 'annotated', type: 'text' },
  ];

  return (
    <div style={{ padding: 24, flex: 1, maxWidth: 320, borderRight: '1px solid #455A64' }}>
      <h3 style={{ color: '#fff', marginBottom: 16, fontSize: 16 }}>标注任务列表</h3>
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
            <div style={{ fontSize: 12, color: '#90A4AE', marginTop: 4 }}>
              {task.type === 'text' ? '📝 文本' : '🖼️ 图片'} · {task.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnnotationList;
