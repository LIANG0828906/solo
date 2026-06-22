import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Sidebar from './components/Sidebar'
import BookmarkGrid from './components/BookmarkGrid'
import { useStore, useFilteredBookmarks } from './store'
import { searchEngine, highlightText } from './modules/search/searchEngine'
import {
  loadBookmarks, saveBookmarks, loadTags, saveTags,
  importFromContent, mergeBookmarks, extractAllTags,
  getDomain, getFaviconUrl, formatDate
} from './modules/storage/storageService'
import type { Bookmark } from './modules/parser/bookmarkParser'

const App: React.FC = () => {
  const {
    bookmarks, tags, filter, searchQuery, viewMode, sidebarOpen,
    setBookmarks, setTags, setFilter, setSearch, toggleView,
    toggleSidebar, setSidebarOpen
  } = useStore()

  const [importProgress, setImportProgress] = useState(0)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [statsClosing, setStatsClosing] = useState(false)
  const [importStats, setImportStats] = useState({ success: 0, errors: 0 })
  const [pasteContent, setPasteContent] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<Bookmark[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadedBookmarks = loadBookmarks()
    const loadedTags = loadTags()

    if (loadedBookmarks.length > 0) {
      setBookmarks(loadedBookmarks)
    }
    if (loadedTags.length > 0) {
      setTags(loadedTags)
    }

    searchEngine.buildIndex(loadedBookmarks)
    setIsLoading(false)
  }, [setBookmarks, setTags])

  useEffect(() => {
    if (bookmarks.length > 0) {
      saveBookmarks(bookmarks)
      searchEngine.buildIndex(bookmarks)
    }
  }, [bookmarks])

  useEffect(() => {
    if (tags.length > 0) {
      saveTags(tags)
    }
  }, [tags])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSuggestions(false)
        setShowImportModal(false)
        if (showStatsModal) {
          handleCloseStats()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showStatsModal])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearch(query)

    if (query.trim()) {
      const startTime = performance.now()
      const results = searchEngine.getSuggestions(query, 5)
      const elapsed = performance.now() - startTime
      console.log(`搜索耗时: ${elapsed.toFixed(2)}ms`)
      setSuggestions(results)
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [setSearch])

  const handleSuggestionClick = useCallback((bookmark: Bookmark) => {
    window.open(bookmark.url, '_blank', 'noopener,noreferrer')
    setShowSuggestions(false)
    setSearch('')
  }, [setSearch])

  const filteredBookmarks = useMemo(() => {
    if (searchQuery.trim()) {
      const startTime = performance.now()
      const resultIds = searchEngine.search(searchQuery)
      const elapsed = performance.now() - startTime
      if (elapsed > 50) {
        console.warn(`搜索响应时间: ${elapsed.toFixed(2)}ms (超过50ms)`)
      }
      const filtered = bookmarks.filter(b => resultIds.includes(b.id))
        .sort((a, b) => resultIds.indexOf(a.id) - resultIds.indexOf(b.id))

      if (filter.folderPath) {
        const prefix = filter.folderPath === '/' ? '/' : filter.folderPath + '/'
        return filtered.filter(b =>
          b.folderPath === filter.folderPath || b.folderPath.startsWith(prefix)
        )
      }
      if (filter.tagName) {
        return filtered.filter(b => b.tags.includes(filter.tagName as string))
      }
      return filtered
    }

    return useFilteredBookmarks()
  }, [bookmarks, filter, searchQuery])

  const handleFolderSelect = useCallback((folderPath: string | null) => {
    setFilter({ folderPath, tagName: null })
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }, [setFilter, setSidebarOpen])

  const handleTagSelect = useCallback((tagName: string | null) => {
    setFilter({ tagName, folderPath: null })
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }, [setFilter, setSidebarOpen])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    const totalSize = file.size
    let loadedSize = 0

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        loadedSize = event.loaded
        const progress = Math.round((loadedSize / totalSize) * 100)
        setImportProgress(progress)
      }
    }

    reader.onload = (event) => {
      setImportProgress(100)
      const content = event.target?.result as string

      setTimeout(() => {
        processImport(content, file.name)
      }, 300)
    }

    reader.readAsText(file)
    e.target.value = ''
  }, [])

  const processImport = useCallback((content: string, fileName: string) => {
    const type = fileName.toLowerCase().endsWith('.json') ? 'json' : 'csv'
    const result = importFromContent(content, type)

    setImportStats({ success: result.success.length, errors: result.errors })

    if (result.success.length > 0) {
      const merged = mergeBookmarks(bookmarks, result.success)
      setBookmarks(merged)
      const newTags = extractAllTags(merged)
      setTags(newTags)
    }

    setShowImportModal(false)
    setPasteContent('')
    setShowStatsModal(true)
    setStatsClosing(false)

    setTimeout(() => {
      setImportProgress(0)
    }, 500)
  }, [bookmarks, setBookmarks, setTags])

  const handlePasteImport = useCallback(() => {
    if (!pasteContent.trim()) return

    setImportProgress(50)

    setTimeout(() => {
      setImportProgress(100)

      setTimeout(() => {
        const isJSON = pasteContent.trim().startsWith('{') || pasteContent.trim().startsWith('[')
        const result = importFromContent(pasteContent, isJSON ? 'json' : 'csv')

        setImportStats({ success: result.success.length, errors: result.errors })

        if (result.success.length > 0) {
          const merged = mergeBookmarks(bookmarks, result.success)
          setBookmarks(merged)
          const newTags = extractAllTags(merged)
          setTags(newTags)
        }

        setShowImportModal(false)
        setPasteContent('')
        setShowStatsModal(true)
        setStatsClosing(false)

        setTimeout(() => {
          setImportProgress(0)
        }, 500)
      }, 300)
    }, 300)
  }, [pasteContent, bookmarks, setBookmarks, setTags])

  const handleCloseStats = useCallback(() => {
    setStatsClosing(true)
    setTimeout(() => {
      setShowStatsModal(false)
      setStatsClosing(false)
    }, 300)
  }, [])

  const handleOverlayClick = useCallback(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }, [setSidebarOpen])

  const handleBookmarkUpdate = useCallback(() => {
    const { bookmarks } = useStore.getState()
    const newTags = extractAllTags(bookmarks)
    setTags(newTags)
  }, [setTags])

  const clearFilter = useCallback(() => {
    setFilter({ folderPath: null, tagName: null })
    setSearch('')
  }, [setFilter, setSearch])

  const getFilterDescription = useMemo(() => {
    if (filter.folderPath) {
      const parts = filter.folderPath.split('/').filter(p => p)
      return `文件夹: ${parts.join(' / ') || '全部书签'}`
    }
    if (filter.tagName) {
      return `标签: ${filter.tagName}`
    }
    if (searchQuery) {
      return `搜索: "${searchQuery}"`
    }
    return null
  }, [filter, searchQuery])

  if (isLoading) {
    return (
      <div className="app-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔖</div>
          <div>加载中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      {importProgress > 0 && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${importProgress}%` }} />
          <div className="progress-text">{importProgress}%</div>
        </div>
      )}

      <div
        className={`overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={handleOverlayClick}
      />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar
          bookmarks={bookmarks}
          tags={tags}
          selectedFolder={filter.folderPath}
          selectedTag={filter.tagName}
          onFolderSelect={handleFolderSelect}
          onTagSelect={handleTagSelect}
        />
      </aside>

      <main className="main-content">
        <div className="top-bar">
          <button
            className="hamburger"
            onClick={toggleSidebar}
            aria-label="菜单"
          >
            ☰
          </button>

          <div className="search-container" ref={searchContainerRef}>
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="搜索书签标题或网址..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="search-suggestions">
                {suggestions.map((bm) => (
                  <div
                    key={bm.id}
                    className="suggestion-item"
                    onClick={() => handleSuggestionClick(bm)}
                  >
                    <div className="favicon" style={{ width: '24px', height: '24px', fontSize: '12px' }}>
                      {getFaviconUrl(bm.url) ? (
                        <img src={getFaviconUrl(bm.url)} alt="" />
                      ) : '🌐'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                        dangerouslySetInnerHTML={{ __html: highlightText(bm.title, searchQuery) }}
                      />
                      <div style={{
                        fontSize: '11px',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                        dangerouslySetInnerHTML={{ __html: highlightText(getDomain(bm.url), searchQuery) }}
                      />
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                      {formatDate(bm.addTime)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="action-buttons">
            <div className="view-toggle">
              <button
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => viewMode !== 'grid' && toggleView()}
                title="网格视图"
              >
                ▦
              </button>
              <button
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => viewMode !== 'list' && toggleView()}
                title="列表视图"
              >
                ☰
              </button>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setShowImportModal(true)}
            >
              <span>📥</span>
              <span>导入书签</span>
            </button>
          </div>
        </div>

        <div className="content-area">
          {getFilterDescription && (
            <div className="filter-info">
              <span>
                {getFilterDescription} · 找到 {filteredBookmarks.length} 个书签
              </span>
              <button
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={clearFilter}
              >
                清除筛选
              </button>
            </div>
          )}

          {!getFilterDescription && bookmarks.length > 0 && (
            <div className="filter-info" style={{ background: 'transparent', padding: 0, marginBottom: '16px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                共 {bookmarks.length} 个书签
              </span>
            </div>
          )}

          <BookmarkGrid
            bookmarks={filteredBookmarks}
            tags={tags}
            viewMode={viewMode}
            searchQuery={searchQuery}
            onBookmarkUpdate={handleBookmarkUpdate}
          />
        </div>
      </main>

      {showImportModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowImportModal(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-title">导入书签</h2>

            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>
              从 Chrome、Firefox、Safari 或其他浏览器导出书签文件，然后粘贴或上传到这里。
            </p>

            <textarea
              className="paste-area"
              placeholder="在此粘贴书签数据（CSV或JSON格式）..."
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
            />

            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => fileInputRef.current?.click()}
              >
                <span>📁</span> 选择文件
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="file-input"
                accept=".csv,.json,text/csv,application/json"
                onChange={handleFileUpload}
              />

              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handlePasteImport}
                disabled={!pasteContent.trim()}
              >
                <span>✓</span> 解析导入
              </button>
            </div>

            <div style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              padding: '12px',
              background: 'var(--card-bg)',
              borderRadius: '8px'
            }}>
              <strong style={{ color: 'var(--accent-gold)' }}>提示：</strong>
              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                <li>Chrome: 书签管理器 → 右上角菜单 → 导出书签</li>
                <li>Firefox: 书签 → 管理书签 → 导入和备份 → 导出书签</li>
                <li>Safari: 文件 → 导出 → 书签</li>
              </ul>
            </div>

            <button
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '16px' }}
              onClick={() => setShowImportModal(false)}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {showStatsModal && (
        <div
          className="modal-overlay"
          onClick={handleCloseStats}
        >
          <div
            className={`modal-content ${statsClosing ? 'closing' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-title">导入完成</h2>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{importStats.success}</div>
                <div className="stat-label">成功导入</div>
              </div>
              <div className="stat-card">
                <div className="stat-value error">{importStats.errors}</div>
                <div className="stat-label">解析错误</div>
              </div>
            </div>

            {importStats.success > 0 && (
              <p style={{
                color: 'var(--text-secondary)',
                textAlign: 'center',
                fontSize: '14px',
                marginBottom: '20px'
              }}>
                成功导入 {importStats.success} 个书签！现在可以在左侧文件夹树中查看。
              </p>
            )}

            {importStats.errors > 0 && (
              <p style={{
                color: '#e74c3c',
                textAlign: 'center',
                fontSize: '13px',
                marginBottom: '20px'
              }}>
                有 {importStats.errors} 条数据未能正确解析，请检查格式是否正确。
              </p>
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={handleCloseStats}
            >
              确定
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
