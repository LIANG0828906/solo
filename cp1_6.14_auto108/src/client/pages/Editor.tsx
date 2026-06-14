import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { worksAPI, inspirationsAPI } from '../api';
import { useAuth } from '../App';
import OutlinePanel from '../components/OutlinePanel';
import InspirationBoard from '../components/InspirationBoard';
import VersionCompare from '../components/VersionCompare';
import { OutlineNode, InspirationCard, Work, Collaborator } from '../../types';
import { formatRelativeTime } from '../utils';

interface EditorProps {
  showToast: (message: string, type: 'success' | 'error') => void;
}

const editorContainerStyle: React.CSSProperties = {
  height: 'calc(100vh - 70px)',
  display: 'flex',
  flexDirection: 'column',
  padding: '16px',
  boxSizing: 'border-box',
};

const editorHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '12px',
  flexWrap: 'wrap',
  gap: '12px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 600,
  color: '#2D3748',
  border: 'none',
  background: 'transparent',
  outline: 'none',
  width: '300px',
};

const headerActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  alignItems: 'center',
};

const actionBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '8px',
  fontSize: '0.85rem',
  fontWeight: 500,
  cursor: 'pointer',
  border: 'none',
  background: 'white',
  color: '#3B4A6B',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const mainContentStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  gap: '12px',
  minHeight: 0,
  position: 'relative',
};

const panelStyle = (width: string | number): React.CSSProperties => ({
  minWidth: '200px',
  flex: `0 0 ${width}`,
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
});

const dividerStyle = (isDragging: boolean): React.CSSProperties => ({
  width: isDragging ? '6px' : '4px',
  cursor: 'col-resize',
  background: isDragging ? '#74C0FC' : 'transparent',
  borderRadius: '3px',
  transition: 'background 0.2s ease, width 0.2s ease',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const editorAreaStyle: React.CSSProperties = {
  flex: 1,
  background: 'white',
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  minWidth: 0,
};

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  gap: '6px',
  padding: '10px 16px',
  borderBottom: '1px solid #E2E8F0',
  flexWrap: 'wrap',
  alignItems: 'center',
};

const toolbarBtnStyle = (active: boolean): React.CSSProperties => ({
  width: '32px',
  height: '32px',
  borderRadius: '6px',
  border: 'none',
  background: active ? '#3B4A6B' : 'transparent',
  color: active ? 'white' : '#4A5568',
  cursor: 'pointer',
  fontSize: '0.9rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s ease',
  fontWeight: active ? 700 : 400,
});

const toolbarDividerStyle: React.CSSProperties = {
  width: '1px',
  height: '20px',
  background: '#E2E8F0',
  margin: '0 4px',
};

const editorContentStyle: React.CSSProperties = {
  flex: 1,
  padding: '24px 32px',
  overflowY: 'auto',
  outline: 'none',
  fontSize: '1rem',
  lineHeight: 1.8,
  color: '#2D3748',
};

const saveStatusStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#718096',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const collaboratorsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '-6px',
};

const collaboratorAvatarStyle = (color: string, index: number): React.CSSProperties => ({
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  background: color,
  border: '2px solid white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontSize: '0.7rem',
  fontWeight: 600,
  marginLeft: index > 0 ? '-8px' : '0',
  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
  zIndex: 10 - index,
});

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 999,
  animation: 'fadeIn 0.2s ease',
};

const modalContentStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: '16px',
  padding: '24px',
  maxWidth: '400px',
  width: '90%',
  maxHeight: '80vh',
  overflowY: 'auto',
  animation: 'scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  fontSize: '0.95rem',
  borderRadius: '8px',
  border: '2px solid #E2E8F0',
  boxSizing: 'border-box',
  marginBottom: '12px',
};

const roleSelectStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  marginBottom: '16px',
};

const roleOptionStyle = (selected: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '12px',
  borderRadius: '10px',
  border: selected ? '2px solid #3B4A6B' : '2px solid #E2E8F0',
  background: selected ? '#F5F0EB' : 'white',
  cursor: 'pointer',
  textAlign: 'center',
  transition: 'all 0.2s ease',
});

const submitBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  fontSize: '1rem',
  fontWeight: 600,
  borderRadius: '10px',
  background: 'linear-gradient(135deg, #3B4A6B, #5A6B8C)',
  color: 'white',
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
};

const backBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 16px',
  borderRadius: '8px',
  border: 'none',
  background: 'white',
  color: '#3B4A6B',
  cursor: 'pointer',
  fontSize: '0.9rem',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  transition: 'all 0.2s ease',
};

export default function Editor({ showToast }: EditorProps) {
  const { workId } = useParams<{ workId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const editorRef = useRef<HTMLDivElement>(null);

  const [work, setWork] = useState<Work | null>(null);
  const [content, setContent] = useState('');
  const [outline, setOutline] = useState<OutlineNode[]>([]);
  const [inspirationCards, setInspirationCards] = useState<InspirationCard[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();
  const [leftWidth, setLeftWidth] = useState(250);
  const [rightWidth, setRightWidth] = useState(280);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [showCollaborateModal, setShowCollaborateModal] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [showVersionCompare, setShowVersionCompare] = useState(false);
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [collaboratorRole, setCollaboratorRole] = useState<'editor' | 'commenter'>('editor');
  const [versions, setVersions] = useState<any[]>([]);
  const [isAuthor, setIsAuthor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (workId) {
      loadWork();
    }
  }, [workId]);

  const loadWork = async () => {
    if (!workId) return;
    setLoading(true);
    try {
      const [workData, inspirationData] = await Promise.all([
        worksAPI.getById(workId),
        inspirationsAPI.getByWork(workId),
      ]);
      setWork(workData);
      setContent(workData.content || '');
      setOutline(workData.outline || []);
      setInspirationCards(inspirationData || []);
      setIsAuthor(workData.authorId === user?.id);
      if (editorRef.current) {
        editorRef.current.innerHTML = workData.content || '';
      }
    } catch (err) {
      console.error('加载作品失败:', err);
      showToast('加载作品失败', 'error');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const debouncedSave = useCallback(() => {
    setSaveStatus('unsaved');
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await worksAPI.update(workId!, {
          content,
          outline,
        });
        setSaveStatus('saved');
        showToast('已保存', 'success');
      } catch (err) {
        console.error('保存失败:', err);
        setSaveStatus('unsaved');
        showToast('保存失败', 'error');
      }
    }, 2000);
  }, [content, outline, workId, showToast]);

  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.innerHTML;
    setContent(newContent);
    debouncedSave();
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!work) return;
    setWork({ ...work, title: e.target.value });
    debouncedSave();
  };

  const handleOutlineChange = (newOutline: OutlineNode[]) => {
    setOutline(newOutline);
    debouncedSave();
  };

  const handleInspirationChange = (cards: InspirationCard[]) => {
    setInspirationCards(cards);
    debouncedSaveInspirations(cards);
  };

  const saveInspirationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSaveInspirations = (cards: InspirationCard[]) => {
    if (saveInspirationTimeoutRef.current) {
      clearTimeout(saveInspirationTimeoutRef.current);
    }
    saveInspirationTimeoutRef.current = setTimeout(async () => {
      try {
        const localCards = cards.filter((c) => c.id && !c.authorId);
        for (const card of localCards) {
          if (!card.content.trim()) {
            await inspirationsAPI.delete(card.id);
          } else {
            await inspirationsAPI.create({
              content: card.content,
              color: card.color,
              priority: card.priority,
              workId,
            });
          }
        }
        const existingCards = cards.filter((c) => c.authorId);
        if (existingCards.length > 0) {
          await inspirationsAPI.reorder(
            existingCards.map((c) => ({
              id: c.id,
              order: c.order,
              completed: c.completed,
            }))
          );
        }
      } catch (err) {
        console.error('保存灵感失败:', err);
      }
    }, 1000);
  };

  const handleMouseDownLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingLeft(true);
  };

  const handleMouseDownRight = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingRight(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingLeft) {
        const newWidth = e.clientX - 16;
        if (newWidth > 180 && newWidth < 400) {
          setLeftWidth(newWidth);
        }
      }
      if (isDraggingRight) {
        const container = document.querySelector('.editor-main') as HTMLElement;
        if (container) {
          const rect = container.getBoundingClientRect();
          const newWidth = rect.right - e.clientX;
          if (newWidth > 200 && newWidth < 400) {
            setRightWidth(newWidth);
          }
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingLeft(false);
      setIsDraggingRight(false);
    };

    if (isDraggingLeft || isDraggingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingLeft, isDraggingRight]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    const newContent = editorRef.current?.innerHTML || '';
    setContent(newContent);
    debouncedSave();
  };

  const handleAddCollaborator = async () => {
    if (!collaboratorEmail.trim()) {
      showToast('请输入邮箱', 'error');
      return;
    }
    try {
      await worksAPI.addCollaborator(workId!, collaboratorEmail, collaboratorRole);
      setShowCollaborateModal(false);
      setCollaboratorEmail('');
      showToast('邀请已发送', 'success');
      loadWork();
    } catch (err: any) {
      showToast(err.response?.data?.error || '邀请失败', 'error');
    }
  };

  const loadVersions = async () => {
    try {
      const data = await worksAPI.getVersions(workId!);
      setVersions(data || []);
      setShowVersionsModal(true);
    } catch (err) {
      showToast('加载版本失败', 'error');
    }
  };

  const getCollaboratorColor = (index: number) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#DDA0DD', '#F7DC6F'];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div style={{ ...editorContainerStyle, alignItems: 'center', justifyContent: 'center' }}>
        <div>加载中...</div>
      </div>
    );
  }

  if (!work) {
    return null;
  }

  return (
    <div style={editorContainerStyle}>
      <div style={editorHeaderStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            style={backBtnStyle}
            onClick={() => navigate('/dashboard')}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F5F0EB';
              e.currentTarget.style.transform = 'translateX(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            ← 返回
          </button>
          <input
            style={titleStyle}
            value={work.title}
            onChange={handleTitleChange}
            placeholder="作品标题"
          />
        </div>

        <div style={headerActionsStyle}>
          <div style={saveStatusStyle}>
            {saveStatus === 'saved' && '✓ 已保存'}
            {saveStatus === 'saving' && '⏳ 保存中...'}
            {saveStatus === 'unsaved' && '● 未保存'}
          </div>

          {work.collaborators && work.collaborators.length > 0 && (
            <div style={collaboratorsStyle}>
              {work.collaborators.slice(0, 3).map((collab, index) => (
                <div
                  key={collab.userId}
                  style={collaboratorAvatarStyle(getCollaboratorColor(index), index)}
                  title={`${collab.name || collab.email} (${collab.role === 'editor' ? '编辑者' : '评论者'})`}
                >
                  {(collab.name || collab.email || '?').charAt(0).toUpperCase()}
                </div>
              ))}
              {work.collaborators.length > 3 && (
                <div
                  style={{
                    ...collaboratorAvatarStyle('#A0AEC0', 3),
                    fontSize: '0.6rem',
                  }}
                >
                  +{work.collaborators.length - 3}
                </div>
              )}
            </div>
          )}

          {isAuthor && (
            <button
              style={actionBtnStyle}
              onClick={() => setShowCollaborateModal(true)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#3B4A6B';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = '#3B4A6B';
              }}
            >
              👥 协作
            </button>
          )}

          <button
            style={actionBtnStyle}
            onClick={loadVersions}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#3B4A6B';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = '#3B4A6B';
            }}
          >
            🕓 版本
          </button>
        </div>
      </div>

      <div
        className="editor-main"
        style={{
          ...mainContentStyle,
          flexDirection: isMobile ? 'column' : 'row',
        }}
      >
        {!isMobile && (
          <div style={panelStyle(leftWidth)}>
            <OutlinePanel
              outline={outline}
              onOutlineChange={handleOutlineChange}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
            />
          </div>
        )}

        {!isMobile && (
          <div
            style={dividerStyle(isDraggingLeft)}
            onMouseDown={handleMouseDownLeft}
            onMouseEnter={(e) => {
              if (!isDraggingLeft) {
                e.currentTarget.style.background = '#BEE3F8';
                e.currentTarget.style.width = '6px';
              }
            }}
            onMouseLeave={(e) => {
              if (!isDraggingLeft) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.width = '4px';
              }
            }}
          >
            <div
              style={{
                width: '2px',
                height: '40px',
                background: isDraggingLeft ? '#3182CE' : '#CBD5E0',
                borderRadius: '1px',
              }}
            />
          </div>
        )}

        {isMobile && (
          <div style={{ maxHeight: '200px', overflow: 'hidden' }}>
            <OutlinePanel
              outline={outline}
              onOutlineChange={handleOutlineChange}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
            />
          </div>
        )}

        <div style={editorAreaStyle}>
          <div style={toolbarStyle}>
            <button
              style={toolbarBtnStyle(false)}
              onClick={() => execCommand('bold')}
              title="加粗"
            >
              <strong>B</strong>
            </button>
            <button
              style={toolbarBtnStyle(false)}
              onClick={() => execCommand('italic')}
              title="斜体"
            >
              <em>I</em>
            </button>
            <button
              style={toolbarBtnStyle(false)}
              onClick={() => execCommand('underline')}
              title="下划线"
            >
              <u>U</u>
            </button>

            <div style={toolbarDividerStyle} />

            <button
              style={toolbarBtnStyle(false)}
              onClick={() => execCommand('formatBlock', 'h1')}
              title="标题1"
            >
              H1
            </button>
            <button
              style={toolbarBtnStyle(false)}
              onClick={() => execCommand('formatBlock', 'h2')}
              title="标题2"
            >
              H2
            </button>
            <button
              style={toolbarBtnStyle(false)}
              onClick={() => execCommand('formatBlock', 'h3')}
              title="标题3"
            >
              H3
            </button>

            <div style={toolbarDividerStyle} />

            <button
              style={toolbarBtnStyle(false)}
              onClick={() => execCommand('formatBlock', 'blockquote')}
              title="引用"
            >
              "
            </button>
            <button
              style={toolbarBtnStyle(false)}
              onClick={() => execCommand('insertUnorderedList')}
              title="无序列表"
            >
              •
            </button>
            <button
              style={toolbarBtnStyle(false)}
              onClick={() => execCommand('insertOrderedList')}
              title="有序列表"
            >
              1.
            </button>

            <div style={toolbarDividerStyle} />

            <button
              style={toolbarBtnStyle(false)}
              onClick={() => execCommand('justifyLeft')}
              title="左对齐"
            >
              ⬅
            </button>
            <button
              style={toolbarBtnStyle(false)}
              onClick={() => execCommand('justifyCenter')}
              title="居中"
            >
              ↔
            </button>
            <button
              style={toolbarBtnStyle(false)}
              onClick={() => execCommand('justifyRight')}
              title="右对齐"
            >
              ➡
            </button>
          </div>

          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            style={editorContentStyle}
            onInput={handleContentChange}
            data-placeholder="开始写作..."
          />
        </div>

        {!isMobile && (
          <div
            style={dividerStyle(isDraggingRight)}
            onMouseDown={handleMouseDownRight}
            onMouseEnter={(e) => {
              if (!isDraggingRight) {
                e.currentTarget.style.background = '#BEE3F8';
                e.currentTarget.style.width = '6px';
              }
            }}
            onMouseLeave={(e) => {
              if (!isDraggingRight) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.width = '4px';
              }
            }}
          >
            <div
              style={{
                width: '2px',
                height: '40px',
                background: isDraggingRight ? '#3182CE' : '#CBD5E0',
                borderRadius: '1px',
              }}
            />
          </div>
        )}

        {!isMobile && (
          <div style={panelStyle(rightWidth)}>
            <InspirationBoard
              cards={inspirationCards}
              onCardsChange={handleInspirationChange}
              workId={workId!}
            />
          </div>
        )}

        {isMobile && (
          <div style={{ maxHeight: '250px', overflow: 'hidden' }}>
            <InspirationBoard
              cards={inspirationCards}
              onCardsChange={handleInspirationChange}
              workId={workId!}
            />
          </div>
        )}
      </div>

      {showCollaborateModal && (
        <div style={modalOverlayStyle} onClick={() => setShowCollaborateModal(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '16px', color: '#2D3748' }}>邀请协作者</h3>
            <input
              style={inputStyle}
              type="email"
              placeholder="输入对方邮箱"
              value={collaboratorEmail}
              onChange={(e) => setCollaboratorEmail(e.target.value)}
            />
            <p style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '10px' }}>
              选择角色:
            </p>
            <div style={roleSelectStyle}>
              <div
                style={roleOptionStyle(collaboratorRole === 'editor')}
                onClick={() => setCollaboratorRole('editor')}
              >
                <div style={{ fontSize: '1.25rem', marginBottom: '4px' }}>✏️</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#2D3748' }}>编辑者</div>
                <div style={{ fontSize: '0.75rem', color: '#718096', marginTop: '4px' }}>
                  可以修改作品内容
                </div>
              </div>
              <div
                style={roleOptionStyle(collaboratorRole === 'commenter')}
                onClick={() => setCollaboratorRole('commenter')}
              >
                <div style={{ fontSize: '1.25rem', marginBottom: '4px' }}>💬</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#2D3748' }}>评论者</div>
                <div style={{ fontSize: '0.75rem', color: '#718096', marginTop: '4px' }}>
                  只能添加评论批注
                </div>
              </div>
            </div>
            <button
              style={submitBtnStyle}
              onClick={handleAddCollaborator}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #C99A3E, #E8B85C)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #3B4A6B, #5A6B8C)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              发送邀请
            </button>
          </div>
        </div>
      )}

      {showVersionsModal && (
        <div style={modalOverlayStyle} onClick={() => setShowVersionsModal(false)}>
          <div
            style={{ ...modalContentStyle, maxWidth: '500px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '16px', color: '#2D3748' }}>历史版本</h3>
            <p style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '12px' }}>
              选择两个版本进行对比:
            </p>
            <div
              style={{
                maxHeight: '300px',
                overflowY: 'auto',
                marginBottom: '16px',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
              }}
            >
              {versions.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#A0AEC0' }}>
                  暂无历史版本
                </div>
              ) : (
                versions.map((v) => (
                  <div
                    key={v.id}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #F0F0F0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F7FAFC';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                    onClick={() => {
                      setShowVersionCompare(true);
                      setShowVersionsModal(false);
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3B4A6B, #5A6B8C)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      v{v.version}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, color: '#2D3748', fontSize: '0.9rem' }}>
                        版本 {v.version}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#718096' }}>
                        {formatRelativeTime(v.createdAt)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button
              style={submitBtnStyle}
              onClick={() => setShowVersionsModal(false)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #C99A3E, #E8B85C)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #3B4A6B, #5A6B8C)';
              }}
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {showVersionCompare && (
        <VersionCompare
          workId={workId!}
          versions={versions}
          onClose={() => setShowVersionCompare(false)}
        />
      )}
    </div>
  );
}
