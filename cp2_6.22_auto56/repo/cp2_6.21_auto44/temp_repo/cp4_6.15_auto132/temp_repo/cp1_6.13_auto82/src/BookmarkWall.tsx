import { useState, useEffect, useCallback } from 'react'
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd'
import BookmarkCard from './BookmarkCard'
import { getBookmarks, getCategories, createBookmark, updateBookmark, type Bookmark, type Category } from './api'

export default function BookmarkWall() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [inputUrl, setInputUrl] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadBookmarks()
    loadCategories()
  }, [])

  const loadBookmarks = async () => {
    const data = await getBookmarks()
    setBookmarks(data)
  }

  const loadCategories = async () => {
    const data = await getCategories()
    setCategories(data)
  }

  const handleAddBookmark = async () => {
    if (!inputUrl.trim()) return
    
    setIsAdding(true)
    try {
      await createBookmark(inputUrl.trim())
      await loadBookmarks()
      setInputUrl('')
    } finally {
      setIsAdding(false)
    }
  }

  const handleDelete = useCallback((id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id))
  }, [])

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const { source, destination } = result
    
    if (source.droppableId !== destination.droppableId) {
      const newCategory = destination.droppableId
      setBookmarks(prev => {
        const newBookmarks = [...prev]
        const [moved] = newBookmarks.splice(source.index, 1)
        moved.category = newCategory
        newBookmarks.splice(destination.index, 0, moved)
        return newBookmarks
      })
      
      await updateBookmark(result.draggableId, { 
        category: newCategory,
        position: destination.index 
      })
    } else {
      setBookmarks(prev => {
        const newBookmarks = [...prev]
        const [moved] = newBookmarks.splice(source.index, 1)
        newBookmarks.splice(destination.index, 0, moved)
        return newBookmarks
      })
      
      await updateBookmark(result.draggableId, { position: destination.index })
    }
  }

  const toggleCategoryCollapse = (categoryId: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  const filteredBookmarks = activeCategory === 'all' 
    ? bookmarks 
    : bookmarks.filter(b => b.category === activeCategory)

  const getBookmarksByCategory = (categoryId: string) => {
    return bookmarks.filter(b => b.category === categoryId)
  }

  return (
    <div className="bookmark-wall">
      <header className="header">
        <h1 className="title">BookmarkBloom</h1>
        <p className="subtitle">收藏你的精彩网页</p>
      </header>

      <div className="search-bar">
        <input
          type="url"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddBookmark()}
          placeholder="粘贴URL添加书签..."
          className="url-input"
        />
        <button className="add-btn" onClick={handleAddBookmark} disabled={isAdding || !inputUrl.trim()}>
          {isAdding ? '添加中...' : '+ 添加'}
        </button>
      </div>

      <div className="category-tabs">
        <button
          className={`tab ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          全部 ({bookmarks.length})
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`tab ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
            style={{ '--category-color': cat.color } as React.CSSProperties}
          >
            {cat.name} ({getBookmarksByCategory(cat.id).length})
          </button>
        ))}
      </div>

      {activeCategory === 'all' ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="category-panels">
            {categories.map(cat => {
              const categoryBookmarks = getBookmarksByCategory(cat.id)
              return (
                <div key={cat.id} className="category-panel">
                  <button 
                    className="panel-header"
                    onClick={() => toggleCategoryCollapse(cat.id)}
                    style={{ '--category-color': cat.color } as React.CSSProperties}
                  >
                    <span className="panel-title">{cat.name}</span>
                    <span className="panel-count">{categoryBookmarks.length}</span>
                    <svg 
                      className={`expand-icon ${collapsedCategories.has(cat.id) ? 'rotated' : ''}`} 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                    >
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className={`panel-content ${collapsedCategories.has(cat.id) ? 'collapsed' : ''}`}>
                    <Droppable droppableId={cat.id}>
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="bookmark-grid"
                        >
                          {categoryBookmarks.map((bookmark, index) => (
                            <BookmarkCard
                              key={bookmark.id}
                              bookmark={bookmark}
                              index={index}
                              onDelete={handleDelete}
                            />
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                </div>
              )
            })}
          </div>
        </DragDropContext>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId={activeCategory}>
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="single-grid"
              >
                {filteredBookmarks.map((bookmark, index) => (
                  <BookmarkCard
                    key={bookmark.id}
                    bookmark={bookmark}
                    index={index}
                    onDelete={handleDelete}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  )
}