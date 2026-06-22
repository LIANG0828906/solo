import React, { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import StoryTimeline from './StoryTimeline';
import BranchManager from './BranchManager';
import { storyApi, branchApi } from './api';
import { getUsername, setUsername } from './utils';
import type { Story } from './types';

const App: React.FC = () => {
  const [username, setUsernameState] = useState<string | null>(null);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'home' | 'story'>('home');
  const [newStoryTitle, setNewStoryTitle] = useState('');
  const [newStoryFirstParagraph, setNewStoryFirstParagraph] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const savedUsername = getUsername();
    if (savedUsername) {
      setUsernameState(savedUsername);
    } else {
      setShowUsernameModal(true);
    }
  }, []);

  useEffect(() => {
    const loadFirstStory = async () => {
      if (!username) return;
      
      try {
        setIsLoading(true);
        const stories = await storyApi.getAllStories();
        if (stories.length > 0) {
          setCurrentStory(stories[0]);
          setView('story');
        }
      } catch (error) {
        console.error('Failed to load stories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (username) {
      loadFirstStory();
    }
  }, [username]);

  const handleSetUsername = () => {
    if (tempUsername.trim()) {
      const name = tempUsername.trim();
      setUsername(name);
      setUsernameState(name);
      setShowUsernameModal(false);
    }
  };

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !newStoryTitle.trim() || !newStoryFirstParagraph.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const story = await storyApi.createStory({
        title: newStoryTitle.trim(),
        firstParagraph: newStoryFirstParagraph.trim(),
        author: username,
      });
      setCurrentStory(story);
      setNewStoryTitle('');
      setNewStoryFirstParagraph('');
      setView('story');
    } catch (error) {
      console.error('Failed to create story:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddParagraph = async (content: string) => {
    if (!currentStory || !username) return;

    try {
      const updatedStory = await storyApi.addParagraph(currentStory.id, {
        content,
        author: username,
        branchId: currentStory.activeBranchId,
      });
      setCurrentStory(updatedStory);
    } catch (error) {
      console.error('Failed to add paragraph:', error);
    }
  };

  const handleCreateBranch = async (paragraphId: string) => {
    if (!currentStory || !username) return;

    try {
      const newBranch = await branchApi.createBranch({
        storyId: currentStory.id,
        parentBranchId: currentStory.activeBranchId,
        parentParagraphId: paragraphId,
        author: username,
      });

      const updatedStory = await branchApi.activateBranch(newBranch.id, currentStory.id);
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStory(updatedStory);
        setIsTransitioning(false);
      }, 200);
    } catch (error) {
      console.error('Failed to create branch:', error);
    }
  };

  const handleSelectBranch = async (branchId: string) => {
    if (!currentStory || branchId === currentStory.activeBranchId) return;

    try {
      setIsTransitioning(true);
      const updatedStory = await branchApi.activateBranch(branchId, currentStory.id);
      setTimeout(() => {
        setCurrentStory(updatedStory);
        setIsTransitioning(false);
      }, 200);
    } catch (error) {
      console.error('Failed to switch branch:', error);
      setIsTransitioning(false);
    }
  };

  const handleNewStory = () => {
    setView('home');
    setCurrentStory(null);
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#0F172A',
        }}
      >
        <Loader2 style={{ animation: 'spin 1s linear infinite', color: '#3B82F6' }} size={48} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#0F172A' }}>
      {showUsernameModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#1E293B',
              borderRadius: '12px',
              padding: '32px',
              width: '400px',
              animation: 'fadeIn 0.3s ease-out',
            }}
          >
            <h2
              style={{
                color: '#F1F5F9',
                fontSize: '20px',
                fontWeight: 600,
                marginBottom: '16px',
              }}
            >
              欢迎来到AI故事接龙
            </h2>
            <p style={{ color: '#94A3B8', marginBottom: '24px' }}>
              请设置您的用户名，它将显示在您续写的段落上。
            </p>
            <input
              type="text"
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
              placeholder="输入您的用户名"
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#334155',
                border: 'none',
                borderRadius: '8px',
                color: '#F1F5F9',
                fontSize: '14px',
                marginBottom: '20px',
                outline: 'none',
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleSetUsername();
              }}
            />
            <button
              onClick={handleSetUsername}
              disabled={!tempUsername.trim()}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: tempUsername.trim() ? 'pointer' : 'not-allowed',
                opacity: tempUsername.trim() ? 1 : 0.5,
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (tempUsername.trim()) {
                  e.currentTarget.style.backgroundColor = '#2563EB';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3B82F6';
              }}
            >
              开始使用
            </button>
          </div>
        </div>
      )}

      {view === 'home' && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '24px',
          }}
        >
          <div
            style={{
              backgroundColor: '#1E293B',
              borderRadius: '12px',
              padding: '40px',
              width: '100%',
              maxWidth: '600px',
              animation: 'fadeInUp 0.5s ease-out',
            }}
          >
            <h1
              style={{
                color: '#F1F5F9',
                fontSize: '28px',
                fontWeight: 700,
                marginBottom: '8px',
                textAlign: 'center',
              }}
            >
              📖 AI故事接龙
            </h1>
            <p
              style={{
                color: '#94A3B8',
                textAlign: 'center',
                marginBottom: '32px',
              }}
            >
              多人协作，共同创作精彩故事
            </p>

            <form onSubmit={handleCreateStory}>
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    color: '#E2E8F0',
                    fontSize: '14px',
                    fontWeight: 500,
                    marginBottom: '8px',
                  }}
                >
                  故事标题
                </label>
                <input
                  type="text"
                  value={newStoryTitle}
                  onChange={(e) => setNewStoryTitle(e.target.value)}
                  placeholder="输入故事标题..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#334155',
                    border: '2px solid transparent',
                    borderRadius: '8px',
                    color: '#F1F5F9',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#3B82F6';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'block',
                    color: '#E2E8F0',
                    fontSize: '14px',
                    fontWeight: 500,
                    marginBottom: '8px',
                  }}
                >
                  第一段
                </label>
                <textarea
                  value={newStoryFirstParagraph}
                  onChange={(e) => setNewStoryFirstParagraph(e.target.value)}
                  placeholder="写下故事的开头..."
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '12px 16px',
                    backgroundColor: '#334155',
                    border: '2px solid transparent',
                    borderRadius: '8px',
                    color: '#F1F5F9',
                    fontSize: '14px',
                    lineHeight: 1.6,
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#3B82F6';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                  maxLength={500}
                />
              </div>

              <button
                type="submit"
                disabled={!newStoryTitle.trim() || !newStoryFirstParagraph.trim() || isCreating}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor:
                    newStoryTitle.trim() && newStoryFirstParagraph.trim() && !isCreating
                      ? 'pointer'
                      : 'not-allowed',
                  opacity:
                    newStoryTitle.trim() && newStoryFirstParagraph.trim() && !isCreating ? 1 : 0.5,
                  transition: 'background-color 0.2s ease, transform 0.2s ease',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onMouseEnter={(e) => {
                  if (newStoryTitle.trim() && newStoryFirstParagraph.trim() && !isCreating) {
                    e.currentTarget.style.backgroundColor = '#2563EB';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3B82F6';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {isCreating ? (
                  <>
                    <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={18} />
                    创建中...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    创建故事
                  </>
                )}
              </button>
            </form>

            {currentStory && (
              <button
                onClick={() => setView('story')}
                style={{
                  width: '100%',
                  marginTop: '12px',
                  padding: '12px',
                  backgroundColor: 'transparent',
                  color: '#60A5FA',
                  border: '1px solid #3B82F6',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                返回已有故事
              </button>
            )}
          </div>
        </div>
      )}

      {view === 'story' && currentStory && username && (
        <>
          <div
            style={{
              height: '60px',
              backgroundColor: '#1E293B',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 32px',
              borderBottom: '1px solid #334155',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            }}
          >
            <h1
              style={{
                color: '#FFFFFF',
                fontSize: '24px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '60%',
              }}
            >
              {currentStory.title}
            </h1>
            <button
              onClick={handleNewStory}
              style={{
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s ease, transform 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563EB';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3B82F6';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Plus size={16} />
              新建故事
            </button>
          </div>

          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <StoryTimeline
              paragraphs={currentStory.paragraphs}
              activeBranchId={currentStory.activeBranchId}
              username={username}
              isTransitioning={isTransitioning}
              onAddParagraph={handleAddParagraph}
              onCreateBranch={handleCreateBranch}
            />
            <BranchManager
              branches={currentStory.branches}
              paragraphs={currentStory.paragraphs}
              activeBranchId={currentStory.activeBranchId}
              onSelectBranch={handleSelectBranch}
            />
          </div>
        </>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default App;
