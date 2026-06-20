import { useState, useEffect, useRef } from 'react';
import { useStore } from './store';
import ProjectBoard from './ProjectBoard';
import GanttChart from './GanttChart';
import './styles.css';

type View = 'projects' | 'project-detail';

function App() {
  const [view, setView] = useState<View>('projects');
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const {
    user,
    currentProject,
    notifications,
    initSocket,
    fetchProjects,
    fetchProjectTasks,
    fetchProjectMilestones,
    selectProject,
    removeNotification
  } = useStore();

  useEffect(() => {
    initSocket();
    fetchProjects();
  }, []);

  const triggerAnimation = () => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    setIsAnimating(false);
    animationTimeoutRef.current = setTimeout(() => {
      setIsAnimating(true);
    }, 10);
  };

  const handleProjectClick = async (projectId: string) => {
    selectProject(projectId);
    await fetchProjectTasks(projectId);
    await fetchProjectMilestones(projectId);
    triggerAnimation();
    setTimeout(() => setView('project-detail'), 10);
  };

  const handleBackToProjects = () => {
    triggerAnimation();
    setTimeout(() => {
      setView('projects');
      selectProject(null);
    }, 10);
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-left">
          {view === 'project-detail' && (
            <button className="back-btn" onClick={handleBackToProjects}>
              ← 返回
            </button>
          )}
          <span className="app-title">团队项目管理</span>
        </div>
        <div className="navbar-right">
          <div className="user-info">
            <span className="role-tag">{user.role}</span>
            <div className="user-avatar" style={{ backgroundColor: user.avatarColor }}>
              {user.name.charAt(0)}
            </div>
          </div>
        </div>
      </nav>

      <main className={`main-content ${isAnimating ? 'slide-enter' : ''}`}>
        {view === 'projects' ? (
          <ProjectBoard onProjectClick={handleProjectClick} />
        ) : (
          currentProject && <GanttChart project={currentProject} />
        )}
      </main>

      <div className="notification-container">
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            className="notification-item notification-enter"
            style={{ bottom: `${index * 60 + 20}px` }}
          >
            <span className="notification-user">{notification.userName}</span>
            <span className="notification-message">{notification.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
