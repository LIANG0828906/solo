import { useState, useEffect, useCallback, useRef } from 'react'
import { Menu, X, Users, Save, Wifi, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import Editor from '@/Editor'
import VersionHistory from '@/components/VersionHistory'
import Avatar from '@/components/Avatar'
import Toast from '@/components/Toast'
import { useScriptStore } from '@/store/useScriptStore'
import { apiClient } from '@/ApiClient'
import { websocketManager } from '@/websocketManager'
import { useDebounce } from '@/hooks/useDebounce'
import type { Script, Version, Collaborator } from '@/types'

const DEMO_SCRIPT_ID = 'demo-script-1'
const CURRENT_USER_ID = 'user-' + Math.random().toString(36).substring(2, 9)
const CURRENT_USER_NAME = '用户' + Math.floor(Math.random() * 1000)

const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
]

function getAvatarColor(name: string) {
  const index = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

export default function App() {
  const {
    script,
    versions,
    collaborators,
    toasts,
    sidebarOpen,
    setScript,
    setVersions,
    addVersion,
    addCollaborator,
    removeCollaborator,
    updateCollaboratorCursor,
    showToast,
    setSidebarOpen,
    toggleSidebar,
  } = useScriptStore()

  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedContentRef = useRef('')

  const debouncedContent = useDebounce(content, 3000)

  const loadScriptData = useCallback(async () => {
    try {
      const [scriptData, versionsData] = await Promise.all([
        apiClient.getScript(DEMO_SCRIPT_ID),
        apiClient.getVersions(DEMO_SCRIPT_ID),
      ])
      setScript(scriptData)
      setContent(scriptData.content)
      lastSavedContentRef.current = scriptData.content
      setVersions(versionsData)
    } catch (error) {
      console.error('Failed to load script data:', error)
      const demoScript: Script = {
        id: DEMO_SCRIPT_ID,
        title: '示例剧本',
        description: '这是一个示例剧本，用于演示协同写作功能',
        content: '第一幕\n\n场景一：清晨的咖啡馆\n\n人物：李明、王芳\n\n（灯光亮起，李明坐在咖啡馆的窗边，手里拿着一杯咖啡，看着窗外）\n\n李明：（自言自语）又是新的一天，不知道今天会发生什么...\n\n（王芳走进咖啡馆，四处张望，然后看到了李明）\n\n王芳：（微笑着走过去）早上好，李明！没想到在这里遇到你。\n\n李明：（抬起头，有些惊讶）王芳？真巧，你也来这里喝咖啡？\n\n王芳：是啊，这里的拿铁很不错。（在李明对面坐下）最近怎么样？工作还忙吗？\n\n李明：（叹了口气）还是老样子，每天都有写不完的代码。有时候真的很想换一种生活方式。\n\n王芳：（理解地点点头）我懂的。不过，你不是一直喜欢写东西吗？有没有想过把你的故事写下来？\n\n李明：（眼睛一亮）其实...我最近确实在写一个剧本。但是总觉得写得不够好。\n\n王芳：（鼓励地）别这么说，每个人刚开始都是这样的。要不要给我看看？也许我能给你一些建议。\n\n李明：（犹豫了一下）好吧...不过你得答应我，不许笑我。\n\n王芳：（笑着举起手）我保证！\n\n（李明从包里拿出一个笔记本，递给王芳）\n\n（灯光渐暗）\n\n第一幕结束',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setScript(demoScript)
      setContent(demoScript.content)
      lastSavedContentRef.current = demoScript.content
      setVersions([])
    }
  }, [setScript, setVersions])

  useEffect(() => {
    loadScriptData()
  }, [loadScriptData])

  useEffect(() => {
    websocketManager.connect(DEMO_SCRIPT_ID, CURRENT_USER_ID, CURRENT_USER_NAME)

    const cleanupEdit = websocketManager.on('edit', (event) => {
      if (event.userId !== CURRENT_USER_ID) {
        setContent(event.content)
        lastSavedContentRef.current = event.content
      }
    })

    const cleanupCursor = websocketManager.on('cursor', (event) => {
      const collaborator: Collaborator = {
        id: event.userId,
        name: event.userName,
        avatarColor: getAvatarColor(event.userName),
        currentLine: event.line,
      }
      addCollaborator(collaborator)
      updateCollaboratorCursor(event.userId, event.line)
    })

    const cleanupUserJoined = websocketManager.on('userJoined', (event) => {
      const collaborator: Collaborator = {
        id: event.userId,
        name: event.userName,
        avatarColor: getAvatarColor(event.userName),
      }
      addCollaborator(collaborator)
      showToast(`${event.userName} 加入了协作`)
    })

    const cleanupUserLeft = websocketManager.on('userLeft', (event) => {
      removeCollaborator(event.userId)
      if (event.userName) {
        showToast(`${event.userName} 离开了`)
      }
    })

    const cleanupCursorRemoved = websocketManager.on('cursorRemoved', (event) => {
      removeCollaborator(event.userId)
    })

    const checkConnection = setInterval(() => {
      setIsConnected(websocketManager.isConnected())
    }, 1000)

    return () => {
      cleanupEdit()
      cleanupCursor()
      cleanupUserJoined()
      cleanupUserLeft()
      cleanupCursorRemoved()
      clearInterval(checkConnection)
      websocketManager.disconnect()
    }
  }, [addCollaborator, removeCollaborator, updateCollaboratorCursor, showToast])

  useEffect(() => {
    const handleCursorPosition = (e: Event) => {
      const customEvent = e as CustomEvent<{ line: number }>
      websocketManager.sendCursor(customEvent.detail.line)
    }

    window.addEventListener('cursorPosition', handleCursorPosition)
    return () => {
      window.removeEventListener('cursorPosition', handleCursorPosition)
    }
  }, [])

  useEffect(() => {
    if (debouncedContent && debouncedContent !== lastSavedContentRef.current && script) {
      handleSave()
    }
  }, [debouncedContent])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const handleSave = useCallback(async () => {
    if (!script || content === lastSavedContentRef.current || isSaving) return

    setIsSaving(true)
    try {
      websocketManager.sendEdit(content)

      const updatedScript = await apiClient.updateScript(script.id, { content })
      const newVersion = await apiClient.createVersion(script.id, content, '自动保存')

      setScript(updatedScript)
      addVersion(newVersion)
      lastSavedContentRef.current = content
      showToast(`已保存版本 ${newVersion.version}`)
    } catch (error) {
      console.error('Failed to save:', error)
      showToast('保存失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }, [script, content, isSaving, setScript, addVersion, showToast])

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    setSelectedVersion(null)
  }

  const handleSelectVersion = (version: Version) => {
    setSelectedVersion(version)
    setContent(version.content)
  }

  const handleRestoreVersion = () => {
    if (selectedVersion) {
      setContent(selectedVersion.content)
      lastSavedContentRef.current = selectedVersion.content
      showToast(`已恢复到版本 ${selectedVersion.version}`)
      setSelectedVersion(null)
    }
  }

  const allCollaborators: Collaborator[] = [
    {
      id: CURRENT_USER_ID,
      name: CURRENT_USER_NAME + ' (我)',
      avatarColor: getAvatarColor(CURRENT_USER_NAME),
    },
    ...collaborators,
  ]

  return (
    <div className="h-screen flex flex-col bg-dark-bg">
      <header className="flex items-center justify-between px-4 py-3 bg-dark-surface border-b border-dark-muted/20">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-lg hover:bg-dark-base transition-colors"
            aria-label="切换侧边栏"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5 text-dark-text" />
            ) : (
              <Menu className="w-5 h-5 text-dark-text" />
            )}
          </button>
          <div>
            <h1 className="text-lg font-bold text-dark-text">
              {script?.title || '剧本协同写作平台'}
            </h1>
            <p className="text-xs text-dark-muted">
              {script?.description || '实时协作，版本回溯'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400" />
            )}
            <span className="text-xs text-dark-muted">
              {isConnected ? '已连接' : '未连接'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-dark-muted" />
            <div className="flex -space-x-2">
              {allCollaborators.slice(0, 4).map((collab) => (
                <Avatar
                  key={collab.id}
                  name={collab.name}
                  color={collab.avatarColor}
                  size="sm"
                  className="border-2 border-dark-surface"
                />
              ))}
              {allCollaborators.length > 4 && (
                <div className="w-8 h-8 rounded-full bg-dark-base flex items-center justify-center text-xs text-dark-muted border-2 border-dark-surface">
                  +{allCollaborators.length - 4}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving || content === lastSavedContentRef.current}
            className={cn(
              'btn btn-success flex items-center gap-2 text-sm',
              (isSaving || content === lastSavedContentRef.current) && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Save className="w-4 h-4" />
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <main
          className={cn(
            'flex-1 overflow-hidden p-4 transition-all duration-300',
            'w-full md:w-[70%]'
          )}
        >
          {selectedVersion && (
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center justify-between">
              <p className="text-sm text-blue-400">
                正在查看版本 {selectedVersion.version}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedVersion(null)
                    setContent(lastSavedContentRef.current)
                  }}
                  className="text-sm text-dark-muted hover:text-dark-text transition-colors"
                >
                  返回当前版本
                </button>
                <button
                  onClick={handleRestoreVersion}
                  className="btn btn-primary text-sm py-1 px-3"
                >
                  恢复此版本
                </button>
              </div>
            </div>
          )}
          <Editor
            content={content}
            onChange={handleContentChange}
            collaborators={collaborators}
            className="h-[calc(100%-80px)]"
          />
        </main>

        <aside
          className={cn(
            'fixed md:relative inset-y-0 right-0 z-40',
            'w-full md:w-[30%]',
            'bg-dark-surface border-l border-dark-muted/20',
            'transform transition-transform duration-300 ease-in-out',
            sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0',
            'md:transform-none'
          )}
        >
          <div className="h-full flex flex-col p-4 pt-16 md:pt-4">
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-dark-base transition-colors"
              aria-label="关闭侧边栏"
            >
              <X className="w-5 h-5 text-dark-text" />
            </button>
            <VersionHistory
              versions={versions}
              onSelectVersion={handleSelectVersion}
              selectedVersionId={selectedVersion?.id}
              className="flex-1"
            />
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>

      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          visible={toast.visible}
          onClose={() => useScriptStore.getState().hideToast(toast.id)}
        />
      ))}
    </div>
  )
}
