import { useEffect, useCallback } from 'react';
import { Row, Col, Button, Spin, Tag } from 'antd';
import {
  CalendarOutlined,
  EditOutlined,
  MessageOutlined,
  ShareAltOutlined,
  CheckOutlined,
  CoffeeOutlined,
} from '@ant-design/icons';
import { useStore } from '@/stores/store';
import type { Task } from '@/types';

const iconComponents: Record<string, typeof CalendarOutlined> = {
  CalendarOutlined,
  EditOutlined,
  MessageOutlined,
  ShareAltOutlined,
};

function TaskCard({ task, index, completed, loading, onComplete }: {
  task: Task;
  index: number;
  completed: boolean;
  loading: boolean;
  onComplete: (taskId: string) => void;
}) {
  const IconComponent = iconComponents[task.icon] || CalendarOutlined;
  const delayClass = `fade-in-delay-${Math.min(index + 1, 5)}`;

  return (
    <Col xs={24} md={12} key={task.id} className={delayClass}>
      <div className="card" style={{ height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #D4A574 0%, #C4956A 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconComponent style={{ fontSize: '28px', color: '#fff' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#3D2914' }}>
                {task.name}
              </h3>
              <Tag color="gold" icon={<CoffeeOutlined />}>
                +{task.points} 积分
              </Tag>
            </div>
            <p style={{ margin: '0 0 16px 0', color: '#8B7355', fontSize: '14px' }}>
              {task.description}
            </p>
            <Button
              type="primary"
              size="large"
              block
              disabled={completed}
              loading={loading}
              onClick={() => onComplete(task.id)}
              style={{
                background: completed
                  ? '#D9D9D9'
                  : 'linear-gradient(135deg, #D4A574 0%, #C4956A 100%)',
                border: 'none',
                borderRadius: '8px',
                height: '44px',
                fontSize: '15px',
                fontWeight: 500,
              }}
            >
              {completed ? (
                <>
                  <CheckOutlined /> 今日已完成
                </>
              ) : (
                '立即完成'
              )}
            </Button>
          </div>
        </div>
      </div>
    </Col>
  );
}

function TaskPage() {
  const {
    user,
    tasks,
    loading,
    fetchTasks,
    completeTask,
  } = useStore();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleComplete = useCallback(async (taskId: string) => {
    await completeTask(taskId);
  }, [completeTask]);

  const isTaskCompleted = (taskId: string) => {
    return user?.completedTasks.includes(taskId) || false;
  };

  const isLoading = loading.tasks || loading.completeTask;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">任务中心</h1>
        <p className="page-subtitle">
          完成社区任务赚取积分，兑换限定联名咖啡券
          {user && (
            <span style={{ marginLeft: '16px', color: '#D4A574', fontWeight: 500 }}>
              当前积分：{user.points}
            </span>
          )}
        </p>
      </div>

      {isLoading && tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[24, 24]}>
          {tasks.map((task, index) => (
            <TaskCard
              key={task.id}
              task={task}
              index={index}
              completed={isTaskCompleted(task.id)}
              loading={loading.completeTask}
              onComplete={handleComplete}
            />
          ))}
        </Row>
      )}
    </div>
  );
}

export default TaskPage;
