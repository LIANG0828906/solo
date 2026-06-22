import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  ChevronDown,
  GitCompare,
  Clock,
  User,
  FileText,
  Menu,
  ArrowLeft,
  ChevronsUpDown,
} from 'lucide-react'
import { apiClient } from '@/ApiClient'
import { websocketManager } from '@/websocketManager'
import type { Script, Version, Collaborator, DiffResult } from '@/types'
import { cn } from '@/lib/utils'
import Avatar from '@/components/Avatar'
import Modal from '@/components/Modal'
import DiffViewer from '@/components/DiffViewer'
import Toast from '@/components/Toast'
import Empty from '@/components/Empty'

interface VersionHistoryProps {
  currentScriptId: string | null
  currentUserId: string
  currentUserName: string
  onScriptChange: (script: Script) => void
  className?: string
}

export default function VersionHistory({
  currentScriptId,
  currentUserId,
  currentUserName,
  onScriptChange,
  className,
}: VersionHistoryProps) {
  const [scripts, setScripts] = useState<Script[]>([])
  const [versions, setVersions] = useState<Version[]>([])
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null)
  const [previewModalVisible, setPreviewModalVisible] = useState(false)
  const [compareMode, setCompareMode] = useState(false)
  const [compareOldVersionId, setCompareOldVersionId] = useState<string>('')
  const [compareNewVersionId, setCompareNewVersionId] = useState<string>('')
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null)
  const [diffViewerCollapsed, setDiffViewerCollapsed] = useState(false)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [newScriptTitle, setNewScriptTitle] = useState('')
  const [newScriptContent, setNewScriptContent] = useState('')
  const [scriptDropdownOpen, setScriptDropdownOpen] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [toast, setToast] = useState({ visible: false, message: '' })
  const [loading, setLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    loadScripts()
  }, [])

  useEffect(() => {
    if (currentScriptId) {
      loadVersions(currentScriptId)
      connectWebSocket(currentScriptId)
    }
    return () => {
      websocketManager.disconnect()
    }
  }, [currentScriptId, currentUserId, currentUserName])

  useEffect(() => {
    if (!currentScriptId) return

    const unsubscribeJoined = websocketManager.on('userJoined', (data) => {
      const existingIds = collaborators.map((c) => c.id)
      if (!existingIds.includes(data.userId) && data.userId !== currentUserId) {
        const colors = [
          '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
          '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
        ]
        const color = colors[data.userName.charCodeAt(0) % colors.length]
        setCollaborators((prev) => [
          ...prev,
          { id: data.userId, name: data.userName, avatarColor: color },
        ])
      }
    })

    const unsubscribeLeft = websocketManager.on('userLeft', (data) => {
      setCollaborators((prev) => prev.filter((c) => c.id !== data.userId))
    })

    return () => {
      unsubscribeJoined()
      unsubscribeLeft()
    }
  }, [currentScriptId, currentUserId, collaborators])

  const loadScripts = async () => {
    try {
      const data = await apiClient.getScripts()
      setScripts(data)
    } catch (error) {
      console.error('Failed to load scripts:', error)
    }
  }

  const loadVersions = useCallback(async (scriptId: string) => {
    try {
      setLoading(true)
      const data = await apiClient.getVersions(scriptId)
      setVersions(data.sort((a, b) => b.version - a.version))
    } catch (error) {
      console.error('Failed to load versions:', error)
      showToast('加载版本历史失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const connectWebSocket = useCallback((scriptId: string) => {
    websocketManager.connect(scriptId, currentUserId, currentUserName)
  }, [currentUserId, currentUserName])

  const showToast = (message: string) => {
    setToast({ visible: true, message })
  }

  const handleVersionClick = (version: Version) => {
    setSelectedVersion(version)
    setPreviewModalVisible(true)
  }

  const handleCompare = async () => {
    if (!currentScriptId || !compareOldVersionId || !compareNewVersionId) {
      showToast('请选择两个版本进行对比')
      return
    }

    try {
      setLoading(true)
      const result = await apiClient.compareVersions(
        currentScriptId,
        compareOldVersionId,
        compareNewVersionId
      )
      setDiffResult(result)
      setDiffViewerCollapsed(false)
    } catch (error) {
      console.error('Failed to compare versions:', error)
      showToast('版本对比失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateScript = async () => {
    if (!newScriptTitle.trim()) {
      showToast('请输入剧本标题')
      return
    }

    try {
      setLoading(true)
      const newScript = await apiClient.createScript(
        newScriptTitle.trim(),
        newScriptContent.trim() || '# 新剧本\n\n开始编写你的故事...'
      )
      setCreateModalVisible(false)
      setNewScriptTitle('')
      setNewScriptContent('')
      setCompareMode(false)
      setDiffResult(null)
      await loadScripts()
      onScriptChange(newScript)
      showToast('剧本创建成功')
      if (isMobile) {
        setMobileDrawerOpen(false)
      }
    } catch (error) {
      console.error('Failed to create script:', error)
      showToast('创建剧本失败')
    } finally {
      setLoading(false)
    }
  }

  const handleScriptSelect = (script: Script) => {
    setScriptDropdownOpen(false)
    setCompareMode(false)
    setDiffResult(null)
    onScriptChange(script)
    if (isMobile) {
      setMobileDrawerOpen(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getCurrentScript = useCallback(() => {
    return scripts.find((s) => s.id === currentScriptId)
  }, [scripts, currentScriptId])

  const getDiffSummary = () => {
    if (!diffResult) return ''
    const parts: string[] = []
    if (diffResult.added > 0) parts.push(`新增${diffResult.added}行`)
    if (diffResult.removed > 0) parts.push(`删除${diffResult.removed}行`)
    if (diffResult.modified > 0) parts.push(`修改${diffResult.modified}处`)
    return parts.join('，') || '无差异'
  }

  const oldVersion = versions.find((v) => v.id === compareOldVersionId)
  const newVersion = versions.find((v) => v.id === compareNewVersionId)

  const renderCollaborators = () => {
    const maxVisible = 3
    const visibleCollaborators = collaborators.slice(0, maxVisible)
    const hiddenCount = collaborators.length - maxVisible

    return (
      <div className="flex items-center">
        <div className="flex -space-x-2">
          {visibleCollaborators.map((collaborator, index) => (
            <div
              key={collaborator.id}
              className="relative"
              style={{ zIndex: visibleCollaborators.length - index }}
            >
              <Avatar
                name={collaborator.name}
                color={collaborator.avatarColor}
                size="sm"
                className="border-2 border-dark-bg"
              />
            </div>
          ))}
          {hiddenCount > 0 && (
            <div
              className="relative w-8 h-8 rounded-full bg-dark-surface border-2 border-dark-bg flex items-center justify-center text-xs font-semibold text-dark-muted"
              style={{ zIndex: 0 }}
            >
              +{hiddenCount}
            </div>
          )}
        </div>
        {collaborators.length > 0 && (
          <span className="ml-3 text-xs text-dark-muted">
            {collaborators.length} 人在线
          </span>
        )}
      </div>
    )
  }

  const renderVersionList = () => {
    if (loading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-dark-muted text-sm">加载中...</div>
        </div>
      )
    }

    if (versions.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <Empty />
        </div>
      )
    }

    return (
      <div className="flex-1 overflow-y-auto space-y-2">
        {versions.map((version) => (
          <div
            key={version.id}
            onClick={() => handleVersionClick(version)}
            className={cn(
              'p-3 rounded-lg cursor-pointer',
              'bg-dark-surface/50 border border-dark-muted/10',
              'hover:bg-dark-surface hover:border-dark-muted/30',
              'transition-all duration-200',
              'group'
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-dark-text">
                v{version.version}
              </span>
              <div className="flex items-center text-xs text-dark-muted opacity-0 group-hover:opacity-100 transition-opacity">
                <Clock className="w-3 h-3 mr-1" />
                {formatDate(version.createdAt)}
              </div>
            </div>
            <div className="flex items-center text-xs text-dark-muted">
              <User className="w-3 h-3 mr-1" />
              <span>{version.author}</span>
            </div>
            {version.message && (
              <p className="text-xs text-dark-muted mt-2 line-clamp-2">
                {version.message}
              </p>
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderCompareSection = () => {
    return (
      <div className="mt-4 border-t border-dark-muted/20 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-dark-text flex items-center gap-2">
            <GitCompare className="w-4 h-4" />
            版本对比
          </h4>
          <button
            onClick={() => {
              setCompareMode(!compareMode)
              setDiffResult(null)
            }}
            className={cn(
              'btn text-xs py-1.5 px-3',
              compareMode && 'btn-primary'
            )}
          >
            {compareMode ? '退出对比' : '对比版本'}
          </button>
        </div>

        {compareMode && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-dark-muted mb-1 block">旧版本</label>
                <select
                  value={compareOldVersionId}
                  onChange={(e) => setCompareOldVersionId(e.target.value)}
                  className="w-full bg-dark-surface border border-dark-muted/30 rounded-lg px-3 py-2 text-sm text-dark-text focus:outline-none focus:border-blue-500"
                >
                  <option value="">选择版本</option>
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      v{v.version} - {formatDate(v.createdAt)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-dark-muted mb-1 block">新版本</label>
                <select
                  value={compareNewVersionId}
                  onChange={(e) => setCompareNewVersionId(e.target.value)}
                  className="w-full bg-dark-surface border border-dark-muted/30 rounded-lg px-3 py-2 text-sm text-dark-text focus:outline-none focus:border-blue-500"
                >
                  <option value="">选择版本</option>
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      v{v.version} - {formatDate(v.createdAt)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleCompare}
              disabled={loading || !compareOldVersionId || !compareNewVersionId}
              className={cn(
                'btn btn-primary w-full',
                (loading || !compareOldVersionId || !compareNewVersionId) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {loading ? '对比中...' : '对比'}
            </button>

            {diffResult && (
              <div className="mt-4">
                <div
                  className="flex items-center justify-between p-3 bg-dark-surface rounded-lg cursor-pointer hover:bg-dark-surface/80 transition-colors"
                  onClick={() => setDiffViewerCollapsed(!diffViewerCollapsed)}
                >
                  <span className="text-sm text-dark-text">
                    {getDiffSummary()}
                  </span>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-dark-muted transition-transform duration-200',
                      !diffViewerCollapsed && 'rotate-180'
                    )}
                  />
                </div>
                {!diffViewerCollapsed && oldVersion && newVersion && (
                  <div className="mt-2 max-h-96 overflow-auto">
                    <DiffViewer
                      oldContent={oldVersion.content}
                      newContent={newVersion.content}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderSidebarContent = () => (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-dark-muted/20">
        <div className="flex items-center justify-between mb-4">
          {isMobile && (
            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="p-1.5 rounded-lg hover:bg-dark-surface transition-colors mr-2"
            >
              <ArrowLeft className="w-5 h-5 text-dark-muted" />
            </button>
          )}
          <div className="relative flex-1">
            <button
              onClick={() => setScriptDropdownOpen(!scriptDropdownOpen)}
              className={cn(
                'w-full flex items-center justify-between',
                'px-3 py-2 rounded-lg',
                'bg-dark-surface border border-dark-muted/30',
                'hover:border-dark-muted/50 transition-colors'
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-dark-muted flex-shrink-0" />
                <span className="text-sm font-medium text-dark-text truncate">
                  {getCurrentScript()?.title || '选择剧本'}
                </span>
              </div>
              <ChevronsUpDown className="w-4 h-4 text-dark-muted flex-shrink-0" />
            </button>

            {scriptDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-dark-surface border border-dark-muted/30 rounded-lg shadow-xl z-20 overflow-hidden">
                {scripts.map((script) => (
                  <div
                    key={script.id}
                    onClick={() => handleScriptSelect(script)}
                    className={cn(
                      'px-3 py-2 cursor-pointer text-sm',
                      'hover:bg-dark-muted/20 transition-colors',
                      script.id === currentScriptId && 'bg-blue-600/20 text-blue-400'
                    )}
                  >
                    {script.title}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setCreateModalVisible(true)}
            className="btn btn-primary ml-2 px-3 py-2 flex items-center gap-1"
            title="新建剧本"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">新建</span>
          </button>
        </div>

        {renderCollaborators()}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-dark-text flex items-center gap-2">
            <Clock className="w-4 h-4" />
            版本历史
          </h3>
          <span className="text-xs text-dark-muted">
            {versions.length} 个版本
          </span>
        </div>

        {renderVersionList()}

        {renderCompareSection()}
      </div>
    </div>
  )

  return (
    <>
      {isMobile && (
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="fixed top-4 right-4 z-30 btn btn-primary p-2.5 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      <div
        className={cn(
          'bg-dark-bg',
          'w-80 h-full border-l border-dark-muted/20',
          'flex flex-col',
          'transition-transform duration-300 ease-out',
          isMobile && [
            'fixed top-0 right-0 z-40 h-full w-full sm:w-80',
            mobileDrawerOpen ? 'translate-x-0' : 'translate-x-full',
          ],
          className
        )}
      >
        {renderSidebarContent()}
      </div>

      {isMobile && mobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      <Modal
        visible={previewModalVisible}
        onClose={() => setPreviewModalVisible(false)}
        title={`版本 v${selectedVersion?.version}`}
        className="max-w-3xl"
      >
        {selectedVersion && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-dark-muted">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{selectedVersion.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{formatDate(selectedVersion.createdAt)}</span>
              </div>
            </div>

            {selectedVersion.message && (
              <div className="p-3 bg-dark-surface rounded-lg">
                <p className="text-sm text-dark-text">{selectedVersion.message}</p>
              </div>
            )}

            <div className="max-h-96 overflow-auto rounded-lg border border-dark-muted/20">
              <pre className="p-4 text-sm font-mono text-dark-text whitespace-pre-wrap bg-dark-surface/50">
                {selectedVersion.content}
              </pre>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        title="新建剧本"
        className="max-w-lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-text mb-2">
              标题 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={newScriptTitle}
              onChange={(e) => setNewScriptTitle(e.target.value)}
              placeholder="输入剧本标题..."
              className="w-full bg-dark-surface border border-dark-muted/30 rounded-lg px-4 py-2.5 text-dark-text placeholder-dark-muted/50 focus:outline-none focus:border-blue-500 transition-colors"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-text mb-2">
              初始内容
            </label>
            <textarea
              value={newScriptContent}
              onChange={(e) => setNewScriptContent(e.target.value)}
              placeholder="输入剧本初始内容（可选）..."
              rows={6}
              className="w-full bg-dark-surface border border-dark-muted/30 rounded-lg px-4 py-2.5 text-dark-text placeholder-dark-muted/50 focus:outline-none focus:border-blue-500 transition-colors resize-none font-mono text-sm"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setCreateModalVisible(false)}
              className="btn"
            >
              取消
            </button>
            <button
              onClick={handleCreateScript}
              disabled={loading || !newScriptTitle.trim()}
              className={cn(
                'btn btn-primary',
                (loading || !newScriptTitle.trim()) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {loading ? '创建中...' : '创建'}
            </button>
          </div>
        </div>
      </Modal>

      <Toast
        message={toast.message}
        visible={toast.visible}
        onClose={() => setToast({ visible: false, message: '' })}
      />
    </>
  )
}
