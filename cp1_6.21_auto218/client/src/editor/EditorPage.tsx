import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocument } from './useDocument';
import CommentList from './CommentList';
import { formatRelativeTime } from '../types';

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const doc = useDocument(id);
  const [editContent, setEditContent] = useState('');
  const [showComments, setShowComments] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (doc.document && editContent === '' && !doc.viewingVersion) {
      setEditContent(doc.document.content);
    }
  }, [doc.document]);

  useEffect(() => {
    if (doc.viewingVersion) {
      setEditContent(doc.viewingVersion.content);
    } else if (doc.document) {
      setEditContent(doc.document.content);
    }
  }, [doc.viewingVersion]);

  const handleSave = useCallback(async () => {
    if (doc.viewingVersion) return;
    await doc.saveDocument(editContent);
  }, [editContent, doc]);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditContent(e.target.value);
    if (doc.document && !doc.viewingVersion) {
      doc.document.content = e.target.value;
    }
  }, [doc.document, doc.viewingVersion]);

  const currentVersionIndex = doc.viewingVersion
    ? doc.versions.findIndex(v => v.id === doc.viewingVersion!.id)
    : doc.versions.length - 1;

  const goToPrevVersion = () => {
    if (currentVersionIndex > 0) {
      doc.switchToVersion(doc.versions[currentVersionIndex - 1]);
    }
  };

  const goToNextVersion = () => {
    if (currentVersionIndex < doc.versions.length - 1) {
      doc.switchToVersion(doc.versions[currentVersionIndex + 1]);
    } else {
      doc.switchToVersion(null);
    }
  };

  const goToLatestVersion = () => {
    doc.switchToVersion(null);
    if (doc.document) {
      setEditContent(doc.document.content);
    }
  };

  if (doc.loading) {
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

  if (doc.error || !doc.document) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0F172A',
        color: '#94A3B8',
        gap: '16px'
      }}>
        <p>{doc.error || '文档不存在'}</p>
        <button
          onClick={() => navigate('/documents')}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: 'none',
            background: '#6366F1',
            color: '#fff',
            cursor: 'pointer',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#4F46E5'}
          onMouseLeave={e => e.currentTarget.style.background = '#6366F1'}
        >
          返回文档列表
        </button>
      </div>
    );
  }

  const commentPanel = (
    <CommentList comments={doc.comments} onAddComment={doc.addComment} />
  );

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#0F172A',
      overflow: 'hidden'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        borderBottom: '1px solid #1E293B',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/documents')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: '#334155',
              color: '#E2E8F0',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#475569'}
            onMouseLeave={e => e.currentTarget.style.background = '#334155'}
          >
            ← 返回
          </button>
          <input
            value={doc.document.title}
            onChange={e => doc.updateTitle(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#E2E8F0',
              fontSize: '18px',
              fontWeight: 600,
              outline: 'none',
              width: '300px',
              maxWidth: '40vw'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {doc.saved && (
            <span style={{ color: '#22C55E', fontSize: '13px', fontWeight: 500 }}>
              已保存
            </span>
          )}
          {doc.saving && (
            <span style={{ color: '#94A3B8', fontSize: '13px' }}>
              保存中...
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={doc.saving || !!doc.viewingVersion}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              background: doc.viewingVersion ? '#475569' : '#6366F1',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              cursor: doc.viewingVersion ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s ease',
              opacity: doc.saving ? 0.7 : 1
            }}
            onMouseEnter={e => { if (!doc.viewingVersion) e.currentTarget.style.background = '#4F46E5'; }}
            onMouseLeave={e => { if (!doc.viewingVersion) e.currentTarget.style.background = '#6366F1'; }}
          >
            保存
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          marginRight: isMobile ? '0' : '320px'
        }}>
          {doc.viewingVersion && (
            <div style={{
              padding: '8px 16px',
              background: 'rgba(234,179,8,0.1)',
              border: '1px solid rgba(234,179,8,0.3)',
              borderRadius: '8px',
              margin: '12px 20px 0',
              color: '#EAB308',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>⚠ 此时查看的是历史版本 (v{doc.viewingVersion.versionNumber})</span>
              <button
                onClick={goToLatestVersion}
                style={{
                  padding: '4px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  background: '#EAB308',
                  color: '#0F172A',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
              >
                返回最新版本
              </button>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={editContent}
            onChange={handleContentChange}
            readOnly={!!doc.viewingVersion}
            placeholder="开始编写文档内容（支持 Markdown 格式）..."
            style={{
              flex: 1,
              background: '#1E293B',
              borderRadius: '12px',
              margin: '12px 20px',
              padding: '20px',
              border: 'none',
              color: doc.viewingVersion ? '#94A3B8' : '#E2E8F0',
              fontSize: '16px',
              lineHeight: 1.6,
              outline: 'none',
              resize: 'none',
              fontFamily: 'inherit',
              overflowY: 'auto'
            }}
          />

          {doc.versions.length > 0 && (
            <div style={{
              height: '40px',
              background: '#0F172A',
              borderRadius: '8px',
              margin: '0 20px 12px',
              padding: '0 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0
            }}>
              <button
                onClick={goToPrevVersion}
                disabled={currentVersionIndex <= 0}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: 'none',
                  background: currentVersionIndex <= 0 ? '#1E293B' : '#334155',
                  color: currentVersionIndex <= 0 ? '#475569' : '#E2E8F0',
                  fontSize: '12px',
                  cursor: currentVersionIndex <= 0 ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={e => { if (currentVersionIndex > 0) e.currentTarget.style.background = '#475569'; }}
                onMouseLeave={e => { if (currentVersionIndex > 0) e.currentTarget.style.background = '#334155'; }}
              >
                ← 上一版本
              </button>
              <span style={{ color: '#94A3B8', fontSize: '12px', flex: 1, textAlign: 'center' }}>
                v{doc.viewingVersion ? doc.viewingVersion.versionNumber : doc.versions.length} · {
                  doc.viewingVersion
                    ? formatRelativeTime(doc.viewingVersion.createdAt)
                    : formatRelativeTime(doc.versions[doc.versions.length - 1]?.createdAt || doc.document.updatedAt)
                }
              </span>
              <button
                onClick={goToNextVersion}
                disabled={currentVersionIndex >= doc.versions.length - 1 && !doc.viewingVersion}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: 'none',
                  background: (currentVersionIndex >= doc.versions.length - 1 && !doc.viewingVersion) ? '#1E293B' : '#334155',
                  color: (currentVersionIndex >= doc.versions.length - 1 && !doc.viewingVersion) ? '#475569' : '#E2E8F0',
                  fontSize: '12px',
                  cursor: (currentVersionIndex >= doc.versions.length - 1 && !doc.viewingVersion) ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={e => { if (currentVersionIndex < doc.versions.length - 1 || doc.viewingVersion) e.currentTarget.style.background = '#475569'; }}
                onMouseLeave={e => { if (currentVersionIndex < doc.versions.length - 1 || doc.viewingVersion) e.currentTarget.style.background = '#334155'; }}
              >
                下一版本 →
              </button>
            </div>
          )}
        </div>

        {!isMobile && (
          <div style={{
            width: '320px',
            flexShrink: 0,
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {commentPanel}
          </div>
        )}

        {isMobile && (
          <>
            <button
              onClick={() => setShowComments(!showComments)}
              style={{
                position: 'fixed',
                right: '20px',
                bottom: '20px',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                border: 'none',
                background: '#6366F1',
                color: '#fff',
                fontSize: '20px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
                transition: 'transform 0.3s ease, background 0.2s ease',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#4F46E5'}
              onMouseLeave={e => e.currentTarget.style.background = '#6366F1'}
            >
              💬
            </button>

            {showComments && (
              <div style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1001,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px'
              }}
                onClick={(e) => { if (e.target === e.currentTarget) setShowComments(false); }}
              >
                <div style={{
                  width: '100%',
                  maxWidth: '480px',
                  height: '80vh',
                  background: '#0F172A',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    borderBottom: '1px solid #1E293B'
                  }}>
                    <span style={{ color: '#E2E8F0', fontSize: '16px', fontWeight: 600 }}>评论</span>
                    <button
                      onClick={() => setShowComments(false)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#334155',
                        color: '#E2E8F0',
                        fontSize: '16px',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#475569'}
                      onMouseLeave={e => e.currentTarget.style.background = '#334155'}
                    >
                      ✕
                    </button>
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    {commentPanel}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
