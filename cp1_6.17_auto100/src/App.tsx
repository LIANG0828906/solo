import { useEffect, useRef } from 'react';
import { useStore } from './store';
import UserManager from './UserManager';
import StoryEditor from './StoryEditor';

const App: React.FC = () => {
  const isLoginModalOpen = useStore((s) => s.isLoginModalOpen);
  const currentUser = useStore((s) => s.currentUser);
  const fetchUsers = useStore((s) => s.fetchUsers);
  const fetchStoryNodes = useStore((s) => s.fetchStoryNodes);
  const logout = useStore((s) => s.logout);
  const unlockAllOwnedNodes = useStore((s) => s.unlockAllOwnedNodes);

  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    fetchUsers();
    fetchStoryNodes();
    pollRef.current = window.setInterval(() => {
      fetchUsers();
      fetchStoryNodes();
    }, 15000);
    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [currentUser, fetchUsers, fetchStoryNodes]);

  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (currentUser) {
        await unlockAllOwnedNodes();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUser, unlockAllOwnedNodes]);

  const handleLogout = async () => {
    if (confirm('确定要退出分支叙事工坊吗？')) {
      await logout();
    }
  };

  return (
    <div className="app-container">
      {!isLoginModalOpen && currentUser && (
        <header className="app-header">
          <div className="app-header-left">
            <span className="app-logo">✨ 分支叙事工坊</span>
          </div>
          <div className="app-user-info">
            <div
              className="author-avatar is-current"
              style={{
                backgroundColor: currentUser.avatarColor,
                width: '32px',
                height: '32px',
                fontSize: '13px'
              }}
            >
              {currentUser.nickname.charAt(0)}
            </div>
            <span style={{ fontWeight: 500 }}>{currentUser.nickname}</span>
            <button className="logout-btn" onClick={handleLogout}>
              退出
            </button>
          </div>
        </header>
      )}

      <div className="app-main">
        {!isLoginModalOpen && currentUser && (
          <>
            <StoryEditor.TreePanel />
            <StoryEditor.EditorArea />
            <UserManager.AuthorPanel />
          </>
        )}
      </div>

      {isLoginModalOpen && <UserManager.LoginModal />}
    </div>
  );
};

export default App;
