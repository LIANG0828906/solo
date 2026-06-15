import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import BrainstormBoard from './components/BrainstormBoard';
import MatrixChart from './components/MatrixChart';
import type { Idea, Comment } from './types';

const socket: Socket = io();

function App() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [matrixExpanded, setMatrixExpanded] = useState(false);
  const [userId] = useState(() => Math.random().toString(36).substr(2, 9));
  const [newestIdeaId, setNewestIdeaId] = useState<string | null>(null);
  const [newIdeaStartPosition, setNewIdeaStartPosition] = useState<{ x: number; y: number } | null>(null);
  const [countAnimating, setCountAnimating] = useState(false);
  const inputFormRef = useRef<HTMLFormElement>(null);
  const previousUserCountRef = useRef(0);

  useEffect(() => {
    console.log('[WebSocket] Connecting to server...');
    
    socket.on('connect', () => {
      console.log('[WebSocket] Connected successfully');
    });

    socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
    });

    socket.on('initialIdeas', (initialIdeas: Idea[]) => {
      console.log('[WebSocket] Received initial ideas:', initialIdeas.length);
      setIdeas(initialIdeas);
    });

    socket.on('onlineUsers', (count: number) => {
      console.log('[WebSocket] Online users updated:', count);
      if (count > previousUserCountRef.current) {
        setCountAnimating(true);
        setTimeout(() => setCountAnimating(false), 500);
      }
      previousUserCountRef.current = count;
      setOnlineUsers(count);
    });

    socket.on('ideaAdded', (idea: Idea) => {
      console.log('[WebSocket] Idea added:', idea.title);
      
      if (inputFormRef.current) {
        const rect = inputFormRef.current.getBoundingClientRect();
        setNewIdeaStartPosition({
          x: rect.left + rect.width / 2,
          y: rect.bottom
        });
        setNewestIdeaId(idea.id);
        
        setTimeout(() => {
          setNewestIdeaId(null);
          setNewIdeaStartPosition(null);
        }, 800);
      }
      
      setIdeas(prev => [idea, ...prev]);
    });

    socket.on('ideaUpdated', (updatedIdea: Idea) => {
      console.log('[WebSocket] Idea updated:', updatedIdea.title);
      setIdeas(prev => prev.map(idea => 
        idea.id === updatedIdea.id ? updatedIdea : idea
      ));
    });

    socket.on('commentAdded', ({ ideaId, comment }: { ideaId: string; comment: Comment }) => {
      console.log('[WebSocket] Comment added to idea:', ideaId);
      setIdeas(prev => prev.map(idea => {
        if (idea.id === ideaId) {
          return { ...idea, comments: [...idea.comments, comment] };
        }
        return idea;
      }));
    });

    socket.on('groupUpdated', ({ ideaId, group }: { ideaId: string; group: string }) => {
      console.log('[WebSocket] Group updated for idea:', ideaId, '->', group);
      setIdeas(prev => prev.map(idea => {
        if (idea.id === ideaId) {
          return { ...idea, group: group as Idea['group'] };
        }
        return idea;
      }));
    });

    socket.on('matrixScoreUpdated', ({ ideaId, feasibility, influence }: { ideaId: string; feasibility: number; influence: number }) => {
      console.log('[WebSocket] Matrix score updated:', ideaId, feasibility, influence);
      setIdeas(prev => prev.map(idea => {
        if (idea.id === ideaId) {
          return { ...idea, matrixScore: { feasibility, influence } };
        }
        return idea;
      }));
    });

    socket.on('allMatrixScoresUpdated', (scores: { id: string; feasibility: number; influence: number }[]) => {
      console.log('[WebSocket] All matrix scores updated');
      setIdeas(prev => prev.map(idea => {
        const score = scores.find(s => s.id === idea.id);
        if (score) {
          return { ...idea, matrixScore: { feasibility: score.feasibility, influence: score.influence } };
        }
        return idea;
      }));
    });

    socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected from server');
    });

    return () => {
      console.log('[WebSocket] Cleaning up event listeners');
      socket.off('connect');
      socket.off('connect_error');
      socket.off('initialIdeas');
      socket.off('onlineUsers');
      socket.off('ideaAdded');
      socket.off('ideaUpdated');
      socket.off('commentAdded');
      socket.off('groupUpdated');
      socket.off('matrixScoreUpdated');
      socket.off('allMatrixScoresUpdated');
      socket.off('disconnect');
    };
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    console.log('[App] Submitting new idea:', newTitle);
    
    socket.emit('addIdea', {
      title: newTitle,
      description: newDescription,
      author: '用户' + userId.substr(0, 4)
    });

    setNewTitle('');
    setNewDescription('');
  }, [newTitle, newDescription, userId]);

  const handleLike = useCallback((ideaId: string) => {
    console.log('[App] Like idea:', ideaId);
    socket.emit('likeIdea', { ideaId, userId });
  }, [userId]);

  const handleAddComment = useCallback((ideaId: string, text: string) => {
    console.log('[App] Add comment to idea:', ideaId);
    socket.emit('addComment', {
      ideaId,
      comment: text,
      author: '用户' + userId.substr(0, 4)
    });
  }, [userId]);

  const handleUpdateGroup = useCallback((ideaId: string, group: Idea['group']) => {
    console.log('[App] Update group for idea:', ideaId, '->', group);
    socket.emit('updateGroup', { ideaId, group });
  }, []);

  const handleUpdateMatrixScore = useCallback((ideaId: string, feasibility: number, influence: number) => {
    socket.emit('updateMatrixScore', { ideaId, feasibility, influence });
  }, []);

  const handleScoresRecalculated = useCallback(() => {
    console.log('[App] Scores recalculated, fetching updated rankings');
  }, []);

  const generateMatrixScores = useCallback(() => {
    console.log('[App] Generating matrix scores');
    
    const maxRawFeasibility = Math.max(...ideas.map(i => i.likes * 0.6 + i.comments.length * 0.4), 1);
    const maxRawInfluence = Math.max(...ideas.map(i => i.likes * 0.4 + i.comments.length * 0.6), 1);

    setIdeas(prev => prev.map(idea => {
      const rawFeasibility = idea.likes * 0.6 + idea.comments.length * 0.4;
      const rawInfluence = idea.likes * 0.4 + idea.comments.length * 0.6;
      
      const feasibility = maxRawFeasibility > 0 
        ? Math.max(0, Math.min(100, (rawFeasibility / maxRawFeasibility) * 100))
        : 0;
      const influence = maxRawInfluence > 0 
        ? Math.max(0, Math.min(100, (rawInfluence / maxRawInfluence) * 100))
        : 0;
      
      socket.emit('updateMatrixScore', { ideaId: idea.id, feasibility: Math.round(feasibility), influence: Math.round(influence) });
      
      return { ...idea, matrixScore: { feasibility: Math.round(feasibility), influence: Math.round(influence) } };
    }));
  }, [ideas]);

  return (
    <div className="app-container">
      <header className="header">
        <h1>💡 团队头脑风暴</h1>
        <div className="header-right">
          <div className="online-users">
            <span className="online-dot"></span>
            <span>在线用户: </span>
            <span 
              className={`count ${countAnimating ? 'bounce' : ''}`}
            >
              {onlineUsers}
            </span>
          </div>
        </div>
      </header>

      <div className="input-section">
        <form className="input-form" ref={inputFormRef} onSubmit={handleSubmit}>
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
            setIdeas={setIdeas}
            newestIdeaId={newestIdeaId}
            newIdeaStartPosition={newIdeaStartPosition}
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
                onScoresRecalculated={handleScoresRecalculated}
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
