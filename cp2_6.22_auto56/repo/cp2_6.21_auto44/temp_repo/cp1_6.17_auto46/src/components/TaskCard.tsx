import React, { useState } from 'react';
import { Card, Tag, Popconfirm } from 'antd';
import { DeleteOutlined, ClockCircleOutlined, HourglassOutlined, UserOutlined } from '@ant-design/icons';
import type { DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import { Task } from '../types';
import { InlineEdit } from './InlineEdit';
import dayjs from 'dayjs';
import { useTaskStore } from '../store/useTaskStore';

interface TaskCardProps {
  task: Task;
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, provided, snapshot }) => {
  const updateTask = useTaskStore((state) => state.updateTask);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      deleteTask(task.id);
    }, 300);
  };

  const handleTitleSave = (newValue: string | number) => {
    updateTask(task.id, { title: String(newValue) });
  };

  const handleEstimatedHoursSave = (newValue: string | number) => {
    updateTask(task.id, { estimatedHours: Number(newValue) });
  };

  const handleActualHoursSave = (newValue: string | number) => {
    updateTask(task.id, { actualHours: Number(newValue) });
  };

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      style={{
        ...provided.draggableProps.style,
        transition: 'all 0.2s ease',
        transform: snapshot.isDragging
          ? `${provided.draggableProps.style?.transform} scale(0.9)`
          : isDeleting
          ? 'translateX(100%)'
          : provided.draggableProps.style?.transform,
        opacity: snapshot.isDragging ? 0.8 : isDeleting ? 0 : 1,
        boxShadow: snapshot.isDragging ? '0 8px 16px rgba(0,0,0,0.2)' : 'none',
      }}
    >
      <Card
        size="small"
        style={{
          width: 280,
          marginBottom: 12,
          borderRadius: 8,
          border: '1px solid #E8E8E8',
          transition: 'all 0.2s ease',
        }}
        bodyStyle={{ padding: '12px 14px' }}
        className="task-card"
      >
        <div style={{ position: 'relative' }}>
          <h4
            style={{
              margin: '0 0 10px 0',
              fontSize: 16,
              fontWeight: 600,
              lineHeight: 1.4,
              paddingRight: 24,
            }}
            title="双击编辑"
          >
            <InlineEdit value={task.title} onSave={handleTitleSave} />
          </h4>
          <Popconfirm
            title="确定要删除该任务？"
            onConfirm={handleDelete}
            okText="确定"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <DeleteOutlined
              style={{
                position: 'absolute',
                right: 0,
                top: 2,
                color: '#FF4D4F',
                cursor: 'pointer',
                fontSize: 14,
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            />
          </Popconfirm>
        </div>

        <div style={{ marginBottom: 10 }}>
          <Tag
            color="blue"
            icon={<UserOutlined />}
            style={{
              borderRadius: 4,
              margin: 0,
              fontSize: 12,
            }}
          >
            {task.assignee}
          </Tag>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 16,
            marginBottom: 8,
            fontSize: 13,
            color: '#595959',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }} title="预估工时，双击编辑">
            <HourglassOutlined style={{ color: '#1890FF' }} />
            <InlineEdit
              value={task.estimatedHours}
              onSave={handleEstimatedHoursSave}
              type="number"
              min={0.5}
              step={0.5}
            />
            h
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }} title="实际工时，双击编辑">
            <ClockCircleOutlined style={{ color: '#52C41A' }} />
            <InlineEdit
              value={task.actualHours}
              onSave={handleActualHoursSave}
              type="number"
              min={0}
              step={0.5}
            />
            h
          </span>
        </div>

        <div style={{ fontSize: 12, color: '#8C8C8C' }}>
          {dayjs(task.createdAt).format('YYYY-MM-DD HH:mm')}
        </div>
      </Card>
    </div>
  );
};
