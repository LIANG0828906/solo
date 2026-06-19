import React, { useState, useEffect, useCallback, useRef } from 'react';
import MemoCard from './components/MemoCard';
import './App.css';

export interface Memo {
  id: string;
  title: string;
  content: string;
  creator: string;
  creatorAvatar: string;
  createdAt: string;
  dueTime: string | null;
  completed: boolean;
  notified: boolean;
}

type FilterType = 'all' | 'active' | 'completed' | 'expired';

const currentUser = '张三';
const currentUserAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan';

const App: React.FC = () => {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newDueTime, setNewDueTime] = useState('');
  const [notifiedIds, setNotifiedIds] = useState<Set<string>>(new Set());
  const pollIntervalRef = useRef<number | null>(null);

  const fetchMemos = useCallback(async () => {
    try {
      const response = await fetch('/api/memos');
      const data = await response.json();
      setMemos(data);
    } catch (error) {
      console.error('Failed to fetch memos:', error);
    }
  }, []);

  const checkDueMemos = useCallback(async () => {
    try {
      const response = await fetch('/api/memos/check-due');
      const dueMemos: Memo[] = await response.json();
      
      dueMemos.forEach((memo) => {
        if (!notifiedIds.has(memo.id) && Notification.permission === 'granted') {
          new Notification('备忘录提醒', {
            body: `${memo.title} - 已到提醒时间`,
            icon: memo.creatorAvatar,
          });
          setNotifiedIds(prev => new Set(prev).add(memo.id));
          
          fetch(`/api/memos/${memo.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notified: true }),
          });
        }
      });
    } catch (error) {
      console.error('Failed to check due memos:', error);
    }
  }, [notifiedIds]);

  useEffect(() => {
    fetchMemos();
    
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    pollIntervalRef.current = window.setInterval(() => {
      fetchMemos();
      checkDueMemos();
    }, 3000);
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchMemos, checkDueMemos]);

  const createMemo = async () => {
    if (!newTitle.trim()) return;
    
    try {
      const response = await fetch('/api/memos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          creator: currentUser,
          creatorAvatar: currentUserAvatar,
          dueTime: newDueTime || null,
        }),
      });
      
      if (response.ok) {
        const newMemo = await response.json();
        setMemos(prev => [newMemo, ...prev]);
        setNewTitle('');
        setNewContent('');
        setNewDueTime('');
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Failed to create memo:', error);
    }
  };

  const toggleComplete = async (id: string) => {
    const memo = memos.find(m => m.id === id);
    if (!memo) return;
    
    try {
      const response = await fetch(`/api/memos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !memo.completed }),
      });
      
      if (response.ok) {
        const updated = await response.json();
        setMemos(prev => prev.map(m => m.id === id ? updated : m));
      }
    } catch (error) {
      console.error('Failed to update memo:', error);
    }
  };

  const deleteMemo = async (id: string) => {
    try {
      const response = await fetch(`/api/memos/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setMemos(prev => prev.filter(m => m.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete memo:', error);
    }
  };

  const applyFormat = (format: string) => {
    const textarea = document.getElementById('memo-content') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = newContent.substring(start, end);
    
    let prefix = '';
    let suffix = '';
    
    switch (format) {
      case 'bold':
        prefix = '**';
        suffix = '**';
        break;
      case 'title':
        prefix = '# ';
        break;
      case 'list':
        prefix = '- ';
        break;
      case 'highlight':
        prefix = '==';
        suffix = '==';
        break;
    }
    
    const newText = newContent.substring(0, start) + prefix + selectedText + suffix + newContent.substring(end);
    setNewContent(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + prefix.length;
      textarea.selectionEnd = end + prefix.length;
    }, 0);
  };

  const getPlainText = (content: string) => {
    return content
      .replace(/^# (.*$)/gm, '$1')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/==(.*?)==/g, '$1')
      .replace(/^- (.*$)/gm, '• $1')
      .replace(/\n/g, ' ');
  };

  const renderContent = (content: string) => {
    let html = content
      .replace(/^# (.*$)/gm, '<h3 style="font-size:18px;font-weight:700;margin:12px 0;color:var(--primary-dark);">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight:600">$1</strong>')
      .replace(/==(.*?)==/g, '<mark style="background:#fef3c7;padding:2px 4px;border-radius:3px">$1</mark>')
      .replace(/^- (.*$)/gm, '<li style="margin-left:20px;list-style:disc;">$1</li>')
      .replace(/\n/g, '<br/>');
    
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const now = new Date();
  
  const filteredMemos = memos.filter(memo => {
    const isExpired = memo.dueTime && new Date(memo.dueTime) < now && !memo.completed;
    
    if (filter === 'active') {
      return !memo.completed && !isExpired;
    }
    if (filter === 'completed') {
      return memo.completed;
    }
    if (filter === 'expired') {
      return isExpired;
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return memo.title.toLowerCase().includes(query) || 
             memo.content.toLowerCase().includes(query);
    }
    
    return true;
  });

  const activeMemos = filteredMemos.filter(m => {
    const isExpired = m.dueTime && new Date(m.dueTime) < now && !m.completed;
    return !m.completed && !isExpired;
  });
  
  const bottomMemos = filteredMemos.filter(m => {
    const isExpired = m.dueTime && new Date(m.dueTime) < now && !m.completed;
    return m.completed || isExpired;
  });

  const filterLabels: Record<FilterType, string> = {
    all: '全部',
    active: '进行中',
    completed: '已完成',
    expired: '过期',
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="app-title">备忘录协作</h1>
          <div className="user-info">
            <img src={currentUserAvatar} alt={currentUser} className="user-avatar" />
            <span className="user-name">{currentUser}</span>
          </div>
        </div>
        
        <div className="search-box">
          <input
            type="text"
            placeholder="搜索备忘录..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        
        <nav className="filter-nav">
          {(Object.keys(filterLabels) as FilterType[]).map(key => (
            <button
              key={key}
              className={`filter-btn ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {filterLabels[key]}
            </button>
          ))}
        </nav>
        
        <button className="create-btn" onClick={() => setIsCreating(true)}>
          + 新建备忘录
        </button>
      </aside>
      
      <main className="main-content">
        {isCreating && (
          <div className="create-modal" onClick={(e) => e.target === e.currentTarget && setIsCreating(false)}>
            <div className="create-panel">
              <h2 className="create-title">新建备忘录</h2>
              
              <div className="form-group">
                <label>标题</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="输入备忘录标题..."
                  className="title-input"
                />
              </div>
              
              <div className="form-group">
                <label>内容</label>
                <div className="toolbar">
                  <button type="button" onClick={() => applyFormat('title')} className="tool-btn">H</button>
                  <button type="button" onClick={() => applyFormat('bold')} className="tool-btn"><b>B</b></button>
                  <button type="button" onClick={() => applyFormat('list')} className="tool-btn">•</button>
                  <button type="button" onClick={() => applyFormat('highlight')} className="tool-btn">
                    <span style={{background:'#fef3c7',padding:'0 4px'}}>Hl</span>
                  </button>
                </div>
                <textarea
                  id="memo-content"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="输入备忘录内容，支持Markdown格式..."
                  className="content-textarea"
                  rows={8}
                />
              </div>
              
              <div className="form-group">
                <label>到期提醒时间</label>
                <input
                  type="datetime-local"
                  value={newDueTime}
                  onChange={(e) => setNewDueTime(e.target.value)}
                  className="datetime-input"
                />
              </div>
              
              <div className="form-actions">
                <button className="cancel-btn" onClick={() => setIsCreating(false)}>取消</button>
                <button className="submit-btn" onClick={createMemo}>创建</button>
              </div>
            </div>
          </div>
        )}
        
        <div className="memos-section">
          <h3 className="section-title">进行中</h3>
          <div className="memos-grid">
            {activeMemos.map(memo => (
              <MemoCard
                key={memo.id}
                memo={memo}
                onToggleComplete={toggleComplete}
                onDelete={deleteMemo}
                renderContent={renderContent}
                getPlainText={getPlainText}
              />
            ))}
          </div>
        </div>
        
        {bottomMemos.length > 0 && (
          <div className="memos-section bottom-section">
            <h3 className="section-title">已完成 / 过期</h3>
            <div className="memos-grid">
              {bottomMemos.map(memo => (
                <MemoCard
                  key={memo.id}
                  memo={memo}
                  onToggleComplete={toggleComplete}
                  onDelete={deleteMemo}
                  renderContent={renderContent}
                  getPlainText={getPlainText}
                  isBottom={true}
                />
              ))}
            </div>
          </div>
        )}
        
        {filteredMemos.length === 0 && (
          <div className="empty-state">
            <p>暂无备忘录</p>
            <button className="create-btn-small" onClick={() => setIsCreating(true)}>
              创建第一条备忘录
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
