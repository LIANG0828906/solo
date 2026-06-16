import { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '../store/useStore'
import { renderMarkdownHTML } from '../utils/markdown'
import { computeDiff, DiffLine } from '../utils/diff'
import { EntryVersion } from '../types'

export function Editor() {
  const { 
    entries, 
    currentEntryId, 
    updateEntry, 
    saveToDB, 
    saveStatus,
    activeTags,
    toggleTag
  } = useStore()
  
  const currentEntry = entries.find(e => e.id === currentEntryId)
  
  const [content, setContent] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<EntryVersion | null>(null)
  const [showDiff, setShowDiff] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const autoSaveTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (currentEntry) {
      setContent(currentEntry.content)
      setTagsInput(currentEntry.tags.join(' '))
    } else {
      setContent('')
      setTagsInput('')
    }
  }, [currentEntryId])

  const saveContent = useCallback(() => {
    if (!currentEntryId || !currentEntry) return
    const tags = parseTags(tagsInput)
    if (content !== currentEntry.content || JSON.stringify(tags) !== JSON.stringify(currentEntry.tags)) {
      updateEntry(currentEntryId, { content, tags })
      saveToDB()
    }
  }, [content, tagsInput, currentEntryId, currentEntry, updateEntry, saveToDB])

  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }
    autoSaveTimerRef.current = window.setTimeout(() => {
      saveContent()
    }, 30000)
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [content, tagsInput, saveContent])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        saveContent()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [saveContent])

  const parseTags = (input: string): string[] => {
    return input
      .split(/\s+/)
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .map(t => t.startsWith('#') ? t : `#${t}`)
      .slice(0, 5)
  }

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const tags = parseTags(value)
    if (tags.length <= 5) {
      setTagsInput(value)
    }
  }

  const allTags = Array.from(new Set(entries.flatMap(e => e.tags))).sort()
  const currentTags = currentEntry?.tags || []
  
  const lines = content.split('\n')
  const lineNumbers = lines.map((_, i) => i + 1)

  const handleTextareaScroll = () => {
    if (textareaRef.current && editorRef.current) {
      const lineNumbersEl = editorRef.current.querySelector('.line-numbers')
      if (lineNumbersEl) {
        lineNumbersEl.scrollTop = textareaRef.current.scrollTop
      }
    }
  }

  const handleRestoreVersion = (version: EntryVersion) => {
    setContent(version.content)
    setTagsInput(version.tags.join(' '))
    setShowVersionHistory(false)
    setSelectedVersion(null)
  }

  const renderDiff = () => {
    if (!currentEntry || !selectedVersion) return null
    
    const diffLines = computeDiff(selectedVersion.content, currentEntry.content)
    
    return (
      <div className="diff-view">
        {diffLines.map((line, idx) => (
          <div key={idx} className={`diff-line diff-${line.type}`}>
            <span className="diff-line-num">{line.lineNumber}</span>
            <span className="diff-content">
              {line.type === 'added' ? '+ ' : line.type === 'removed' ? '- ' : '  '}
              {line.content || ' '}
            </span>
          </div>
        ))}
      </div>
    )
  }

  if (!currentEntry) {
    return (
      <div className="editor-empty">
        <div className="empty-content">
          <p className="empty-icon">📝</p>
          <p>No entry selected</p>
          <p className="empty-hint">Select an entry from the timeline or create a new one</p>
        </div>
      </div>
    )
  }

  return (
    <div className="editor">
      <div className="editor-header">
        <div className="editor-tabs">
          <button 
            className={`tab-btn ${!showPreview ? 'active' : ''}`}
            onClick={() => setShowPreview(false)}
          >
            Editor
          </button>
          <button 
            className={`tab-btn ${showPreview ? 'active' : ''}`}
            onClick={() => setShowPreview(true)}
          >
            Preview
          </button>
        </div>
        <div className="editor-tools">
          <span className={`save-status save-${saveStatus}`}>
            {saveStatus === 'saving' && <span className="saving-dot"></span>}
            {saveStatus === 'saved' && <span className="saved-check">✓</span>}
            {saveStatus === 'idle' && <span className="idle-dot"></span>}
            <span className="save-text">
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Auto-save'}
            </span>
          </span>
          <button 
            className="tool-btn" 
            onClick={() => setShowVersionHistory(true)}
            title="Version History"
          >
            📜
          </button>
        </div>
      </div>

      <div className="tag-filter-row">
        <span className="tag-filter-label">Tags:</span>
        {allTags.map(tag => (
          <button
            key={tag}
            className={`tag-pill ${activeTags.includes(tag) ? 'active' : ''}`}
            onClick={() => toggleTag(tag)}
          >
            {tag}
          </button>
        ))}
        {activeTags.length > 0 && (
          <button className="clear-tags-btn" onClick={() => useStore.getState().clearActiveTags()}>
            Clear
          </button>
        )}
      </div>

      <div className="editor-tags-input">
        <span className="tags-label">Tags:</span>
        <input
          type="text"
          className="tags-input"
          value={tagsInput}
          onChange={handleTagsChange}
          placeholder="Enter up to 5 tags (e.g. #React #Debug)"
          spellCheck={false}
        />
        <button className="save-btn" onClick={saveContent}>
          Save
        </button>
      </div>

      {showPreview ? (
        <div 
          className="markdown-preview"
          dangerouslySetInnerHTML={{ __html: renderMarkdownHTML(content) }}
        />
      ) : (
        <div className="editor-container" ref={editorRef}>
          <div className="line-numbers">
            {lineNumbers.map(num => (
              <div key={num} className="line-number">{num}</div>
            ))}
          </div>
          <div className="textarea-wrapper">
            <textarea
              ref={textareaRef}
              className="editor-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onScroll={handleTextareaScroll}
              spellCheck={false}
              placeholder="// Start coding your thoughts..."
            />
            <span className="cursor-blink"></span>
          </div>
        </div>
      )}

      {showVersionHistory && (
        <div className="modal-overlay" onClick={() => { setShowVersionHistory(false); setSelectedVersion(null); setShowDiff(false) }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Version History</h3>
              <button className="modal-close" onClick={() => { setShowVersionHistory(false); setSelectedVersion(null); setShowDiff(false) }}>×</button>
            </div>
            <div className="modal-body">
              <div className="version-list">
                {currentEntry.versions.length === 0 ? (
                  <p className="no-versions">No saved versions yet</p>
                ) : (
                  currentEntry.versions.map((version, index) => (
                    <div
                      key={version.id}
                      className={`version-item ${selectedVersion?.id === version.id ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedVersion(version)
                        setShowDiff(false)
                      }}
                    >
                      <div className="version-info">
                        <span className="version-badge">v{currentEntry.versions.length - index}</span>
                        <span className="version-date">
                          {new Date(version.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="version-preview">
                        {version.content.slice(0, 80)}{version.content.length > 80 ? '...' : ''}
                      </div>
                      <div className="version-tags">
                        {version.tags.map(tag => (
                          <span key={tag} className="version-tag">{tag}</span>
                        ))}
                      </div>
                      <div className="version-actions">
                        <button 
                          className="version-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedVersion(version)
                            setShowDiff(true)
                          }}
                        >
                          Diff
                        </button>
                        <button 
                          className="version-btn primary"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRestoreVersion(version)
                          }}
                        >
                          Restore
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {showDiff && selectedVersion && (
                <div className="diff-panel">
                  <h4>Diff (current vs selected)</h4>
                  {renderDiff()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
