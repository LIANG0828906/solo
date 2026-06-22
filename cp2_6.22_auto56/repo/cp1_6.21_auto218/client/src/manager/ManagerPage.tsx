import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DocumentCard from './DocumentCard';
import SearchBar from './SearchBar';
import { Document, DOCUMENT_TYPES } from '../types';

export default function ManagerPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showNewDoc, setShowNewDoc] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('未分类');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchDocuments = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const params: Record<string, string> = {};
      if (typeFilter !== 'all') params.type = typeFilter;
      if (search) params.search = search;
      const res = await axios.get('/api/documents', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(res.data.documents || []);
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  }, [typeFilter, search, navigate]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleCreateDocument = async () => {
    if (!newTitle.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/documents', {
        title: newTitle.trim(),
        type: newType,
        content: `# ${newTitle.trim()}\n\n`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowNewDoc(false);
      setNewTitle('');
      setNewType('未分类');
      navigate(`/documents/${res.data.document.id}`);
    } catch {}
  };

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch { return {}; }
  })();

  if (loading) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0F172A',
        color: '#94A3B8',
        fontSize: '16px'
      }}>
        加载中...
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: '#0F172A',
      padding: isMobile ? '16px' : '32px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <h1 style={{
              color: '#E2E8F0',
              fontSize: '24px',
              fontWeight: 700,
              marginBottom: '4px'
            }}>
              文档中心
            </h1>
            <p style={{ color: '#94A3B8', fontSize: '14px' }}>
              欢迎, {user.username || '用户'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => setShowNewDoc(true)}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: '#6366F1',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#4F46E5'}
              onMouseLeave={e => e.currentTarget.style.background = '#6366F1'}
            >
              + 新建文档
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid #334155',
                background: 'transparent',
                color: '#94A3B8',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#475569';
                e.currentTarget.style.color = '#E2E8F0';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#334155';
                e.currentTarget.style.color = '#94A3B8';
              }}
            >
              退出登录
            </button>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <SearchBar value={search} onChange={setSearch} />
          </div>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              background: '#334155',
              color: '#E2E8F0',
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer',
              minWidth: '140px'
            }}
          >
            <option value="all">全部类型</option>
            {DOCUMENT_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {documents.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#64748B',
            fontSize: '15px'
          }}>
            {search || typeFilter !== 'all' ? '没有找到匹配的文档' : '还没有文档，点击"新建文档"开始创建'}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? '1fr'
              : 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '16px'
          }}>
            {documents.map(doc => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onClick={(id) => navigate(`/documents/${id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {showNewDoc && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowNewDoc(false); }}
        >
          <div style={{
            width: '400px',
            maxWidth: '90vw',
            background: '#1E293B',
            borderRadius: '16px',
            padding: '28px'
          }}>
            <h2 style={{
              color: '#E2E8F0',
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: '24px'
            }}>
              新建文档
            </h2>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                文档标题
              </label>
              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="输入文档标题"
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '2px solid transparent',
                  background: '#334155',
                  color: '#E2E8F0',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#6366F1'}
                onBlur={e => e.currentTarget.style.borderColor = 'transparent'}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                文档类型
              </label>
              <select
                value={newType}
                onChange={e => setNewType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#334155',
                  color: '#E2E8F0',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {DOCUMENT_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowNewDoc(false); setNewTitle(''); }}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  background: 'transparent',
                  color: '#94A3B8',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#475569'; e.currentTarget.style.color = '#E2E8F0'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#94A3B8'; }}
              >
                取消
              </button>
              <button
                onClick={handleCreateDocument}
                disabled={!newTitle.trim()}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: newTitle.trim() ? '#6366F1' : '#475569',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: newTitle.trim() ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={e => { if (newTitle.trim()) e.currentTarget.style.background = '#4F46E5'; }}
                onMouseLeave={e => { if (newTitle.trim()) e.currentTarget.style.background = '#6366F1'; }}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
