import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import BrainstormBoard from './components/BrainstormBoard';
import MatrixChart from './components/MatrixChart';
import type { Idea, Comment } from './types';

const socket: Socket = io('http://localhost:3001');

function App() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [matrixExpanded, setMatrixExpanded] = useState(false);
  const [userId] = useState(() => Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    socket.on('initialIdeas', (initialIdeas: Idea[]) => {
      setIdeas(initialIdeas);
    });

    socket.on('onlineUsers', (count: number) => {
      setOnlineUsers(count);
    });

    socket.on('ideaAdded', (idea: Idea) => {
      setIdeas(prev => [idea, ...prev]);
    });

    socket.on('ideaUpdated', (updatedIdea: Idea) => {
      setIdeas(prev => prev.map(idea => 
        idea.id === updatedIdea.id ? updatedIdea : idea
      ));
    });

    socket.on('commentAdded', ({ ideaId, comment }: { ideaId: string; comment: Comment }) => {
      setIdeas(prev => prev.map(idea => {
        if (idea.id === ideaId) {
          return { ...idea, comments: [...idea.comments, comment] };
        }
        return idea;
      }));
    });

    socket.on('groupUpdated', ({ ideaId, group }: { ideaId: string; group: string }) => {
      setIdeas(prev => prev.map(idea => {
        if (idea.id === ideaId) {
          return { ...idea, group: group as Idea['group'] };
        }
        return idea;
      }));
    });

    socket.on('matrixScoreUpdated', ({ ideaId, feasibility, influence }: { ideaId: string; feasibility: number; influence: number }) => {
      setIdeas(prev => prev.map(idea => {
        if (idea.id === ideaId) {
          return { ...idea, matrixScore: { feasibility, influence } };
        }
        return idea;
      }));
    });

    return () => {
      socket.off('initialIdeas');
      socket.off('onlineUsers');
      socket.off('ideaAdded');
      socket.off('ideaUpdated');
      socket.off('commentAdded');
      socket.off('groupUpdated');
      socket.off('matrixScoreUpdated');
    };
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    socket.emit('addIdea', {
      title: newTitle,
      description: newDescription,
      author: '用户' + userId.substr(0, 4)
    });

    setNewTitle('');
    setNewDescription('');
  }, [newTitle, newDescription, userId]);

  const handleLike = useCallback((ideaId: string) => {
    socket.emit('likeIdea', { ideaId, userId });
  }, [userId]);

  const handleAddComment = useCallback((ideaId: string, text: string) => {
    socket.emit('addComment', {
      ideaId,
      comment: text,
      author: '用户' + userId.substr(0, 4)
    });
  }, [userId]);

  const handleUpdateGroup = useCallback((ideaId: string, group: Idea['group']) => {
    socket.emit('updateGroup', { ideaId, group });
  }, []);

  const handleUpdateMatrixScore = useCallback((ideaId: string, feasibility: number, influence: number) => {
    socket.emit('updateMatrixScore', { ideaId, feasibility, influence });
  }, []);

  const generateMatrixScores = useCallback(() => {
    setIdeas(prev => prev.map(idea => {
      const feasibility = Math.min(100, idea.likes * 10 + idea.comments.length * 5);
      const influence = Math.min(100, idea.likes * 8 + idea.comments.length * 7);
      const updatedIdea = { ...idea, matrixScore: { feasibility, influence } };
      socket.emit('updateMatrixScore', { ideaId: idea.id, feasibility, influence });
      return updatedIdea;
    }));
  }, []);

  return (
    <div className="app-container">
      <header className="header">
        <h1>💡 团队头脑风暴</h1>
        <div className="header-right">
          <div className="online-users">
            <span className="online-dot"></span>
            <span>在线用户: </span>
            <span className="count" key={onlineUsers}>{onlineUsers}</span>
          </div>
        </div>
      </header>

      <div className="input-section">
        <form className="input-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="输入想法标题..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <textarea
            placeholder="描述你的想法..."
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            rows={1}
          />
          <button type="submit">提交想法</button>
        </form>
      </div>

      <div className="main-content">
        <div className="board-container">
          <BrainstormBoard
            ideas={ideas}
            onLike={handleLike}
            onAddComment={handleAddComment}
            onUpdateGroup={handleUpdateGroup}
            userId={userId}
          />
        </div>

        <button
          className="matrix-toggle"
          onClick={() => setMatrixExpanded(!matrixExpanded)}
          style={{ right: matrixExpanded ? '340px' : '0' }}
        >
          {matrixExpanded ? '›' : '‹'}
        </button>

        <div className={`matrix-panel ${matrixExpanded ? 'expanded' : ''}`}>
          {matrixExpanded && (
            <div className="matrix-content">
              <h3 className="matrix-title">📊 决策矩阵</h3>
              <button
                className="matrix-generate-btn"
                onClick={generateMatrixScores}
              >
                生成矩阵评分
              </button>
              <MatrixChart
                ideas={ideas}
                onUpdateScore={handleUpdateMatrixScore}
              />
              <div className="matrix-legend">
                <div className="legend-item">
                  <span className="legend-dot pending"></span>
                  <span>待讨论</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot in-progress"></span>
                  <span>进行中</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot completed"></span>
                  <span>已完成</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
