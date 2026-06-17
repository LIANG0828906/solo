import React, { useState } from 'react';
import { Input, Button, Spin } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTaskStore } from '../store/useTaskStore';
import { TaskModal, AddTaskButton } from './TaskModal';

export const Toolbar: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const searchKeyword = useTaskStore((state) => state.searchKeyword);
  const setSearchKeyword = useTaskStore((state) => state.setSearchKeyword);
  const fetchTasks = useTaskStore((state) => state.fetchTasks);
  const fetchStats = useTaskStore((state) => state.fetchStats);

  const handleRefresh = () => {
    setIsRefreshing(true);
    Promise.all([fetchTasks(), fetchStats()]).finally(() => {
      setTimeout(() => setIsRefreshing(false), 500);
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKeyword(e.target.value);
  };

  return (
    <>
      <div
        style={{
          height: 64,
          backgroundColor: '#FFFFFF',
          borderBottom: '2px solid #E8E8E8',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <AddTaskButton onClick={() => setModalVisible(true)} />

        <Input
          prefix={<SearchOutlined style={{ color: '#BFBFBF' }} />}
          placeholder="搜索任务..."
          value={searchKeyword}
          onChange={handleSearch}
          style={{
            width: 280,
            borderRadius: 8,
          }}
          size="middle"
        />

        <div style={{ marginLeft: 'auto' }}>
          <Button
            icon={
              <ReloadOutlined
                style={{
                  animation: isRefreshing ? 'spin 0.5s linear infinite' : 'none',
                }}
              />
            }
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{
              borderRadius: 8,
              height: 36,
            }}
          >
            刷新
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      <TaskModal open={modalVisible} onClose={() => setModalVisible(false)} />
    </>
  );
};
