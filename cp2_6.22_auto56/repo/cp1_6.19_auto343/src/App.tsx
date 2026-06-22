import React, { useEffect, useState } from 'react';
import { useAppStore } from './store';
import RoleSelectModal from './components/RoleSelectModal';
import Sidebar from './components/Sidebar';
import AnnotationList from './modules/annotation/AnnotationList';
import AnnotationPanel from './modules/annotation/AnnotationPanel';
import ReviewQueue from './modules/review/ReviewQueue';
import ReviewPanel from './modules/review/ReviewPanel';
import Dashboard from './modules/dashboard/Dashboard';

type Role = 'annotator' | 'reviewer' | 'admin';

const App: React.FC = () => {
  const {
    role,
    setRole,
    activeModule,
    setActiveModule,
    errorMessage,
    setErrorMessage,
    currentUser,
    selectedTaskId,
    setSelectedTaskId,
    logout,
  } = useAppStore();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, setErrorMessage]);

  const handleRoleSelect = (selectedRole: Role) => {
    setRole(selectedRole);
    const userNames: Record<Role, string> = {
      annotator: '标注员小王',
      reviewer: '审核员小李',
      admin: '管理员小赵',
    };
    useAppStore.getState().setCurrentUser(userNames[selectedRole]);
  };

  const renderAdminTabs = () => {
    const tabs = [
      { key: 'annotation', label: '标注任务' },
      { key: 'review', label: '审核任务' },
      { key: 'dashboard', label: '数据看板' },
    ];

    return (
      <div
        style={{
          display: 'flex',
          backgroundColor: '#263238',
          borderBottom: '1px solid #455A64',
          padding: '0 24px',
        }}
      >
        {tabs.map((tab) => (
          <div
            key={tab.key}
            onClick={() => setActiveModule(tab.key)}
            style={{
              padding: '14px 24px',
              cursor: 'pointer',
              color: activeModule === tab.key ? '#42A5F5' : '#B0BEC5',
              fontSize: 14,
              fontWeight: activeModule === tab.key ? 600 : 400,
              borderBottom: activeModule === tab.key ? '2px solid #42A5F5' : '2px solid transparent',
              transition: 'color 0.2s',
              userSelect: 'none',
            }}
          >
            {tab.label}
          </div>
        ))}
      </div>
    );
  };

  const renderModuleContent = () => {
    if (role === 'annotator') {
      return (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <AnnotationList
            selectedTaskId={selectedTaskId}
            onTaskSelect={setSelectedTaskId}
          />
          <AnnotationPanel taskId={selectedTaskId} />
        </div>
      );
    }

    if (role === 'reviewer') {
      return (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <ReviewQueue
            selectedTaskId={selectedTaskId}
            onTaskSelect={setSelectedTaskId}
          />
          <ReviewPanel taskId={selectedTaskId} />
        </div>
      );
    }

    if (role === 'admin') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {renderAdminTabs()}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {activeModule === 'annotation' && (
              <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
                <AnnotationList
                  selectedTaskId={selectedTaskId}
                  onTaskSelect={setSelectedTaskId}
                />
                <AnnotationPanel taskId={selectedTaskId} />
              </div>
            )}
            {activeModule === 'review' && (
              <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
                <ReviewQueue
                  selectedTaskId={selectedTaskId}
                  onTaskSelect={setSelectedTaskId}
                />
                <ReviewPanel taskId={selectedTaskId} />
              </div>
            )}
            {activeModule === 'dashboard' && <Dashboard />}
          </div>
        </div>
      );
    }

    return null;
  };

  if (role === null) {
    return <RoleSelectModal onSelect={handleRoleSelect} />;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        width: '100vw',
        height: '100vh',
        backgroundColor: '#263238',
        overflow: 'hidden',
      }}
    >
      {errorMessage && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: '#E57373',
            color: '#fff',
            padding: '12px 24px',
            zIndex: 9999,
            fontSize: 14,
            fontWeight: 500,
            textAlign: 'center',
          }}
        >
          {errorMessage}
        </div>
      )}

      <Sidebar
        role={role}
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        currentUser={currentUser}
        onLogout={logout}
      />

      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        {renderModuleContent()}
      </main>
    </div>
  );
};

export default App;
