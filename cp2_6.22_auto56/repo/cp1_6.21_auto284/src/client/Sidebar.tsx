import { Comment, Version } from './types';

interface SidebarProps {
  comments: Comment[];
  versions: Version[];
  selectedText: string;
  onAddComment: () => void;
  onPreviewVersion: (version: Version) => void;
  onSaveVersion: () => void;
  formatTime: (timestamp: number) => string;
}

function Sidebar({
  comments,
  versions,
  selectedText,
  onAddComment,
  onPreviewVersion,
  onSaveVersion,
  formatTime,
}: SidebarProps) {
  const renderCommentContent = (content: string) => {
    const parts = content.split(/(@\S+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <strong key={index} style={{ color: '#3B82F6' }}>
            {part}
          </strong>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <>
      <div className="sidebar-card comments-section">
        <div className="sidebar-card-header">
          <div className="sidebar-card-title">评论 ({comments.length})</div>
          <button
            className="btn btn-primary"
            style={{ padding: '6px 12px', fontSize: '13px' }}
            onClick={onSaveVersion}
          >
            保存版本
          </button>
        </div>
        <div className="sidebar-card-body">
          {selectedText && (
            <button className="add-comment-btn" onClick={onAddComment}>
              + 添加评论
            </button>
          )}

          {comments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💬</div>
              <div className="empty-state-text">
                暂无评论
                <br />
                <span style={{ fontSize: '12px' }}>
                  选中文档内容后点击"添加评论"
                </span>
              </div>
            </div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="comment-item">
                <div className="comment-header">
                  <div
                    className="comment-avatar"
                    style={{ background: comment.authorColor }}
                  >
                    {comment.authorName[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="comment-author">{comment.authorName}</div>
                    <div className="comment-time">
                      {formatTime(comment.timestamp)}
                    </div>
                  </div>
                </div>
                {comment.selectedText && (
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#92400E',
                      background: '#FEF3C7',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      marginBottom: '8px',
                      marginLeft: '42px',
                      fontFamily: "'Fira Code', monospace",
                    }}
                  >
                    「{comment.selectedText}」
                  </div>
                )}
                <div className="comment-content">
                  {renderCommentContent(comment.content)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="sidebar-card versions-section">
        <div className="sidebar-card-header">
          <div className="sidebar-card-title">版本历史</div>
        </div>
        <div className="sidebar-card-body">
          {versions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-text">
                暂无历史版本
                <br />
                <span style={{ fontSize: '12px' }}>
                  点击"保存版本"创建新的版本记录
                </span>
              </div>
            </div>
          ) : (
            <div className="versions-list">
              {versions.map((version, index) => {
                const hue = 220 + (index * 20) % 80;
                const color = `hsl(${hue}, 70%, 60%)`;

                return (
                  <div
                    key={version.id}
                    className="version-card"
                    onClick={() => onPreviewVersion(version)}
                  >
                    <div
                      className="version-color-bar"
                      style={{
                        background: `linear-gradient(180deg, #3B82F6, ${color})`,
                      }}
                    />
                    <div className="version-info">
                      <div className="version-title">{version.title}</div>
                      <div className="version-meta">
                        <div className="version-author">
                          <div
                            className="version-author-avatar"
                            style={{ background: version.authorColor }}
                          >
                            {version.authorName[0]}
                          </div>
                          <span>{version.authorName}</span>
                        </div>
                        <span>·</span>
                        <span>{formatTime(version.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Sidebar;
