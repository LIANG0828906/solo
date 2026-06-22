import { useState } from 'react';
import Editor from './components/Editor';
import { v4 as uuidv4 } from 'uuid';
import type { User } from './types';

const USER_NAMES = ['张三', '李四', '王五', '赵六', '陈七', '周八', '吴九', '郑十'];
const RANDOM_NAME = USER_NAMES[Math.floor(Math.random() * USER_NAMES.length)];

function App() {
  const [documentId] = useState('demo-doc-001');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userName, setUserName] = useState(RANDOM_NAME);
  const [inviteToken, setInviteToken] = useState('');
  const [showJoin, setShowJoin] = useState(true);
  const [useInvite, setUseInvite] = useState(false);
  const [joinError, setJoinError] = useState('');

  const handleJoin = async () => {
    setJoinError('');
    if (!userName.trim()) {
      setJoinError('请输入您的姓名');
      return;
    }

    try {
      const userId = uuidv4();
      let role: 'editor' | 'viewer' = 'editor';
      let createdUser: User | null = null;

      if (useInvite && inviteToken.trim()) {
        const response = await fetch(`/api/documents/${documentId}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: userName.trim(),
            role: 'viewer',
            inviteLink: inviteToken.trim(),
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          setJoinError(error.error || '加入失败');
          return;
        }
        const data = await response.json();
        createdUser = {
          id: data.id,
          name: data.name,
          role: data.role,
          color: data.color,
        };
        role = data.role;
      } else {
        createdUser = {
          id: userId,
          name: userName.trim(),
          role: 'editor',
          color: '#FF8C42',
        };
      }

      setCurrentUser(createdUser);
      setShowJoin(false);
    } catch (err) {
      setJoinError('网络错误，请稍后重试');
    }
  };

  if (showJoin) {
    return (
      <div className="join-container">
        <div className="join-card">
          <div className="join-header">
            <div className="join-logo">📝</div>
            <h1>团队文档协作编辑器</h1>
            <p>多人实时协作，版本历史追踪，权限管理</p>
          </div>
          <div className="join-form">
            <div className="form-group">
              <label>您的姓名</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="请输入姓名"
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              />
            </div>
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={useInvite}
                  onChange={(e) => setUseInvite(e.target.checked)}
                />
                使用邀请链接加入
              </label>
            </div>
            {useInvite && (
              <div className="form-group">
                <label>邀请令牌</label>
                <input
                  type="text"
                  value={inviteToken}
                  onChange={(e) => setInviteToken(e.target.value)}
                  placeholder="输入8位邀请令牌"
                  maxLength={8}
                />
              </div>
            )}
            {joinError && <div className="join-error">{joinError}</div>}
            <button className="btn-primary" onClick={handleJoin}>
              进入编辑器
            </button>
          </div>
          <div className="join-tips">
            <p>💡 提示：打开多个浏览器标签页即可模拟多人协作</p>
          </div>
        </div>
      </div>
    );
  }

  return <Editor documentId={documentId} currentUser={currentUser!} />;
}

export default App;
