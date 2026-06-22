import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Poem, Annotation, Reply } from './types';
import PoemEditor from './PoemEditor';

const STORAGE_KEY_POEMS = 'poem_collaboration_poems';
const STORAGE_KEY_ANNOTATIONS = 'poem_collaboration_annotations';
const STORAGE_KEY_USER = 'poem_collaboration_user';

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

const getCurrentUser = (): { id: string; name: string } => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_USER);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    // ignore
  }
  const user = {
    id: generateId(),
    name: '游客' + Math.floor(Math.random() * 10000),
  };
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  return user;
};

const App: React.FC = () => {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string }>({ id: '', name: '' });
  const [selectedPoemId, setSelectedPoemId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(true);

  useEffect(() => {
    try {
      const storedPoems = localStorage.getItem(STORAGE_KEY_POEMS);
      const storedAnnotations = localStorage.getItem(STORAGE_KEY_ANNOTATIONS);
      if (storedPoems) {
        setPoems(JSON.parse(storedPoems));
      }
      if (storedAnnotations) {
        setAnnotations(JSON.parse(storedAnnotations));
      }
    } catch (e) {
      console.error('Failed to load from localStorage', e);
    }
    setCurrentUser(getCurrentUser());
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_POEMS, JSON.stringify(poems));
    } catch (e) {
      console.error('Failed to save poems to localStorage', e);
    }
  }, [poems]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ANNOTATIONS, JSON.stringify(annotations));
    } catch (e) {
      console.error('Failed to save annotations to localStorage', e);
    }
  }, [annotations]);

  const selectedPoem = useMemo(() => {
    return poems.find(p => p.id === selectedPoemId) || null;
  }, [poems, selectedPoemId]);

  const poemAnnotations = useMemo(() => {
    if (!selectedPoemId) return [];
    return annotations.filter(a => a.poemId === selectedPoemId);
  }, [annotations, selectedPoemId]);

  const filteredPoems = useMemo(() => {
    if (!searchQuery.trim()) return poems;
    const query = searchQuery.toLowerCase();
    return poems.filter(p =>
      p.title.toLowerCase().includes(query) ||
      p.author.toLowerCase().includes(query)
    );
  }, [poems, searchQuery]);

  const handleSavePoem = useCallback((data: Omit<Poem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    const now = Date.now();
    if (data.id) {
      setPoems(prev => prev.map(p =>
        p.id === data.id
          ? { ...p, title: data.title, author: data.author, content: data.content, updatedAt: now }
          : p
      ));
      setSelectedPoemId(data.id);
    } else {
      const newPoem: Poem = {
        id: generateId(),
        title: data.title,
        author: data.author,
        content: data.content,
        createdAt: now,
        updatedAt: now,
      };
      setPoems(prev => [newPoem, ...prev]);
      setSelectedPoemId(newPoem.id);
    }
    setIsEditing(false);
  }, []);

  const handleNewPoem = useCallback(() => {
    setSelectedPoemId(null);
    setIsEditing(true);
  }, []);

  const handleClearEditor = useCallback(() => {
    setSelectedPoemId(null);
    setIsEditing(true);
  }, []);

  const handleToggleEdit = useCallback(() => {
    if (isEditing) {
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  }, [isEditing]);

  const handleSelectPoem = useCallback((poemId: string) => {
    setSelectedPoemId(poemId);
    setIsEditing(false);
    if (window.innerWidth < 768) {
      setMobileMenuOpen(false);
    }
  }, []);

  const handleAddAnnotation = useCallback((poemId: string, lineIndex: number, content: string) => {
    const newAnnotation: Annotation = {
      id: generateId(),
      poemId,
      lineIndex,
      userId: currentUser.id,
      userName: currentUser.name,
      content,
      likes: 0,
      likedBy: [],
      replies: [],
      createdAt: Date.now(),
    };
    setAnnotations(prev => [...prev, newAnnotation]);
  }, [currentUser]);

  const handleLikeAnnotation = useCallback((annotationId: string) => {
    setAnnotations(prev => prev.map(a => {
      if (a.id !== annotationId) return a;
      const alreadyLiked = a.likedBy.includes(currentUser.id);
      if (alreadyLiked) {
        return {
          ...a,
          likes: a.likes - 1,
          likedBy: a.likedBy.filter(id => id !== currentUser.id),
        };
      } else {
        return {
          ...a,
          likes: a.likes + 1,
          likedBy: [...a.likedBy, currentUser.id],
        };
      }
    }));
  }, [currentUser]);

  const handleAddReply = useCallback((annotationId: string, content: string) => {
    const newReply: Reply = {
      id: generateId(),
      userId: currentUser.id,
      userName: currentUser.name,
      content,
      createdAt: Date.now(),
    };
    setAnnotations(prev => prev.map(a =>
      a.id === annotationId
        ? { ...a, replies: [...a.replies, newReply] }
        : a
    ));
  }, [currentUser]);

  return (
    <div>
      <nav className="navbar">
        <button
          className="hamburger-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          ☰
        </button>
        <div className="navbar-title">诗词创作与协作批注平台</div>
        <div style={{ color: 'white', fontSize: '14px', opacity: 0.8 }}>
          {currentUser.name}
        </div>
      </nav>

      <div className="main-container">
        <aside className={`sidebar ${!mobileMenuOpen ? 'mobile-hidden' : ''}`}>
          <button className="new-poem-btn" onClick={handleNewPoem}>
            + 新建诗词
          </button>
          <input
            type="text"
            className="search-box"
            placeholder="搜索标题或作者..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="poem-list">
            {filteredPoems.length === 0 ? (
              <div style={{ color: '#8B7355', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
                {searchQuery ? '没有找到匹配的诗词' : '还没有诗词，点击上方按钮新建'}
              </div>
            ) : (
              filteredPoems.map(poem => (
                <div
                  key={poem.id}
                  className={`poem-card ${selectedPoemId === poem.id ? 'active' : ''}`}
                  onClick={() => handleSelectPoem(poem.id)}
                >
                  <div className="poem-card-title">{poem.title}</div>
                  <div className="poem-card-author">{poem.author}</div>
                  <div className="poem-card-preview">
                    {poem.content.split('\n').slice(0, 2).join(' / ')}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        <main className="editor-container">
          <PoemEditor
            poem={selectedPoem}
            annotations={poemAnnotations}
            currentUserId={currentUser.id}
            currentUserName={currentUser.name}
            isEditing={isEditing}
            onSave={handleSavePoem}
            onToggleEdit={handleToggleEdit}
            onClear={handleClearEditor}
            onAddAnnotation={handleAddAnnotation}
            onLikeAnnotation={handleLikeAnnotation}
            onAddReply={handleAddReply}
          />
        </main>
      </div>
    </div>
  );
};

export default App;
