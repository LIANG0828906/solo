import { useMemo, useState, useRef, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { renderMarkdownPreview, renderMarkdownHTML } from '../utils/markdown'
import { Entry } from '../types'

export function Timeline() {
  const { 
    entries, 
    currentEntryId, 
    setCurrentEntry, 
    activeTags,
    createNewEntry,
    toggleTag
  } = useStore()

  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null)
  const [filterKey, setFilterKey] = useState(0)
  const prevTagCountRef = useRef(0)

  useEffect(() => {
    if (activeTags.length !== prevTagCountRef.current) {
      setFilterKey(k => k + 1)
      prevTagCountRef.current = activeTags.length
    }
  }, [activeTags])

  const filteredEntries = useMemo(() => {
    if (activeTags.length === 0) return entries
    return entries.filter(entry => 
      activeTags.some(tag => entry.tags.includes(tag))
    )
  }, [entries, activeTags])

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    } else if (diffDays === 1) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getPreviewContent = (entry: Entry, expanded: boolean) => {
    if (expanded) {
      return entry.content
    }
    return renderMarkdownPreview(entry.content, 200)
  }

  const allTags = Array.from(new Set(entries.flatMap(e => e.tags))).sort()

  const handleEntryClick = (entry: Entry) => {
    setCurrentEntry(entry.id)
    if (expandedEntryId === entry.id) {
      setExpandedEntryId(null)
    }
  }

  const handleEntryDoubleClick = (entryId: string) => {
    setExpandedEntryId(prev => prev === entryId ? null : entryId)
  }

  return (
    <div className="timeline">
      <div className="timeline-header">
        <h2 className="timeline-title">
          <span className="title-prompt">❯</span>
          CodeChronicle
        </h2>
        <button 
          className="new-entry-btn"
          onClick={createNewEntry}
          title="New Entry"
        >
          + New
        </button>
      </div>

      <div className="entries-count">
        {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
        {activeTags.length > 0 && (
          <span className="filtered-hint"> (filtered by {activeTags.length} tag{activeTags.length > 1 ? 's' : ''})</span>
        )}
      </div>

      <div className="timeline-entries" key={filterKey}>
        {filteredEntries.length === 0 ? (
          <div className="empty-timeline">
            <p className="empty-icon">📭</p>
            <p>No entries found</p>
            <p className="empty-hint">
              {activeTags.length > 0 ? 'Try clearing the tag filter' : 'Create your first entry!'}
            </p>
          </div>
        ) : (
          filteredEntries.map((entry, index) => {
            const isSelected = entry.id === currentEntryId
            const isExpanded = entry.id === expandedEntryId

            return (
              <div
                key={entry.id}
                className={`timeline-entry ${isSelected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''}`}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
                onClick={() => handleEntryClick(entry)}
                onDoubleClick={() => handleEntryDoubleClick(entry.id)}
              >
                {isSelected && <div className="entry-indicator" />}
                
                <div className="entry-header">
                  <span className="entry-date">
                    {formatDate(entry.updatedAt)}
                  </span>
                  <span className="entry-expand-icon">
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </div>
                
                <div 
                  className="entry-content-preview markdown-inline"
                  dangerouslySetInnerHTML={{ 
                    __html: isExpanded 
                      ? renderMarkdownHTML(entry.content) 
                      : renderMarkdownHTML(renderMarkdownPreview(entry.content, 200))
                  }}
                />
                
                <div className="entry-tags">
                  {entry.tags.map(tag => (
                    <span 
                      key={tag} 
                      className={`entry-tag ${activeTags.includes(tag) ? 'active-filter' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleTag(tag)
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
