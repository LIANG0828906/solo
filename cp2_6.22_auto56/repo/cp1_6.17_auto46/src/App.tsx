import React, { useEffect } from 'react';
import { Layout, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { Toolbar } from './components/Toolbar';
import { TaskBoard } from './components/TaskBoard';
import { StatsPanel } from './components/StatsPanel';
import { useTaskStore } from './store/useTaskStore';

const { Content, Sider } = Layout;

const theme = {
  token: {
    colorPrimary: '#1890FF',
    colorSuccess: '#52C41A',
    colorWarning: '#FAAD14',
    colorError: '#FF4D4F',
    borderRadius: 8,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
};

const App: React.FC = () => {
  const fetchTasks = useTaskStore((state) => state.fetchTasks);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <ConfigProvider locale={zhCN} theme={theme}>
      <Layout style={{ height: '100vh', overflow: 'hidden' }}>
        <Layout
          style={{
            backgroundColor: '#F0F2F5',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Toolbar />

          <div
            style={{
              flex: 1,
              display: 'flex',
              overflow: 'hidden',
              '@media (max-width: 1100px)': {
                flexDirection: 'column',
              },
            }}
            className="main-container"
          >
            <Content
              style={{
                flex: 1,
                flexBasis: '65%',
                minWidth: 0,
                overflow: 'auto',
                position: 'relative',
              }}
              className="board-wrapper"
            >
              <TaskBoard />
            </Content>

            <div
              style={{
                width: '35%',
                minWidth: 300,
                borderLeft: '1px solid #E8E8E8',
                transition: 'border-color 0.2s ease',
              }}
              className="divider"
            >
              <StatsPanel />
            </div>
          </div>
        </Layout>

        <style>{`
          * {
            box-sizing: border-box;
          }
          
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          #root {
            height: 100vh;
            overflow: hidden;
          }
          
          .task-card:hover {
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12) !important;
            transform: translateX(2px);
          }
          
          .board-container::-webkit-scrollbar {
            height: 8px;
          }
          
          .board-container::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }
          
          .board-container::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 4px;
          }
          
          .board-container::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
          }
          
          @media (max-width: 1100px) {
            .main-container {
              flex-direction: column !important;
            }
            
            .board-wrapper {
              height: 50%;
              flex-basis: 50% !important;
            }
            
            .divider {
              width: 100% !important;
              min-width: auto !important;
              height: 50%;
              border-left: none !important;
              border-top: 1px solid #E8E8E8;
            }
          }
        `}</style>
      </Layout>
    </ConfigProvider>
  );
};

export default App;
