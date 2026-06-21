import { useDocStore } from './store/useDocStore'
import DocumentEditor from './moduleA/DocumentEditor'
import VersionTimeline from './moduleB/VersionTimeline'
import UserAuth from './moduleC/UserAuth'

function App() {
  const { annotations, isFading } = useDocStore()

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const sortedAnnotations = [...annotations].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <div className="app-container">
      <div className={`document-section ${isFading ? 'fading' : ''}`}>
        <DocumentEditor />
      </div>

      <div className="sidebar-section">
        <div className="sidebar-content">
          <VersionTimeline />

          <UserAuth />

          <div className="annotation-list-section">
            <h3 className="section-title">批注列表</h3>

            {sortedAnnotations.length > 0 ? (
              sortedAnnotations.map((annotation) => (
                <div
                  key={annotation.id}
                  className="annotation-list-item"
                  style={{ borderLeftColor: annotation.color }}
                >
                  <div className="annotation-list-item-header">
                    <span className="annotation-list-item-user">
                      {annotation.userName}
                    </span>
                    <span className="annotation-list-item-paragraph">
                      第 {annotation.paragraphIndex + 1} 段
                    </span>
                  </div>
                  <p className="annotation-list-item-text">{annotation.text}</p>
                  <div className="annotation-list-item-time">
                    {formatDate(annotation.createdAt)}
                  </div>
                </div>
              ))
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  color: '#b2bec3',
                  padding: '40px 20px',
                }}
              >
                <p style={{ fontSize: '14px' }}>暂无批注</p>
                <p style={{ fontSize: '12px', marginTop: '4px' }}>
                  点击文档段落添加批注
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
