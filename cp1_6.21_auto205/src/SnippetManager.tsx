import { useState, useEffect } from 'react'
import axios from 'axios'
import type { CodeSnippet } from './types'

interface SnippetManagerProps {
  currentCode: {
    html: string
    css: string
    javascript: string
  }
  onLoadSnippet: (snippet: CodeSnippet) => void
}

function SnippetManager({ currentCode, onLoadSnippet }: SnippetManagerProps) {
  const [snippets, setSnippets] = useState<CodeSnippet[]>([])
  const [showModal, setShowModal] = useState(false)
  const [snippetName, setSnippetName] = useState('')
  const [snippetDescription, setSnippetDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchSnippets()
  }, [])

  const fetchSnippets = async () => {
    try {
      const response = await axios.get<CodeSnippet[]>('/api/snippets')
      setSnippets(response.data.sort((a, b) => b.updatedAt - a.updatedAt))
    } catch (error) {
      console.error('获取片段列表失败:', error)
    }
  }

  const handleSave = async () => {
    if (!snippetName.trim()) {
      alert('请输入片段名称')
      return
    }

    if (snippetName.length > 40) {
      alert('片段名称不能超过40个字符')
      return
    }

    if (snippetDescription.length > 200) {
      alert('片段描述不能超过200个字符')
      return
    }

    setIsLoading(true)
    try {
      const response = await axios.post<CodeSnippet>('/api/snippets', {
        name: snippetName.trim(),
        description: snippetDescription.trim(),
        html: currentCode.html,
        css: currentCode.css,
        javascript: currentCode.javascript,
      })

      setSnippets(prev => [response.data, ...prev])
      setShowModal(false)
      setSnippetName('')
      setSnippetDescription('')
    } catch (error) {
      console.error('保存片段失败:', error)
      alert('保存失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoad = (snippet: CodeSnippet) => {
    onLoadSnippet(snippet)
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('确定要删除这个代码片段吗？')) return

    try {
      await axios.delete(`/api/snippets/${id}`)
      setSnippets(prev => prev.filter(s => s.id !== id))
    } catch (error) {
      console.error('删除片段失败:', error)
      alert('删除失败，请重试')
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="snippet-manager">
      <h3>我的代码片段</h3>
      <button
        className="save-btn"
        onClick={() => setShowModal(true)}
      >
        + 保存当前代码
      </button>
      <div className="snippet-list">
        {snippets.length === 0 ? (
          <div style={{
            color: '#64748B',
            fontSize: '13px',
            textAlign: 'center',
            padding: '20px',
          }}>
            暂无保存的片段
          </div>
        ) : (
          snippets.map(snippet => (
            <div
              key={snippet.id}
              className="snippet-item"
              onClick={() => handleLoad(snippet)}
            >
              <div className="snippet-info">
                <div className="snippet-name" title={snippet.name}>
                  {snippet.name}
                </div>
                <div className="snippet-desc" title={snippet.description || formatDate(snippet.updatedAt)}>
                  {snippet.description || formatDate(snippet.updatedAt)}
                </div>
              </div>
              <button
                className="delete-btn"
                onClick={(e) => handleDelete(e, snippet.id)}
                title="删除"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>保存代码片段</h3>
            <div className="form-group">
              <label>片段名称</label>
              <input
                type="text"
                value={snippetName}
                onChange={(e) => setSnippetName(e.target.value)}
                placeholder="输入片段名称（最多40字符）"
                maxLength={40}
                autoFocus
              />
              <div className="char-count">{snippetName.length}/40</div>
            </div>
            <div className="form-group">
              <label>描述（可选）</label>
              <textarea
                value={snippetDescription}
                onChange={(e) => setSnippetDescription(e.target.value)}
                placeholder="输入片段描述（最多200字符）"
                maxLength={200}
              />
              <div className="char-count">{snippetDescription.length}/200</div>
            </div>
            <div className="modal-buttons">
              <button
                className="btn-cancel"
                onClick={() => setShowModal(false)}
                disabled={isLoading}
              >
                取消
              </button>
              <button
                className="btn-confirm"
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SnippetManager
