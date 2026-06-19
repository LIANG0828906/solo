import React, { useState, useMemo } from 'react'
import type { Bookmark } from '../modules/parser/bookmarkParser'
import type { Tag } from '../modules/storage/storageService'

interface FolderNode {
  path: string
  name: string
  children: FolderNode[]
  count: number
}

interface SidebarProps {
  bookmarks: Bookmark[]
  tags: Tag[]
  selectedFolder: string | null
  selectedTag: string | null
  onFolderSelect: (folderPath: string | null) => void
  onTagSelect: (tagName: string | null) => void
}

const Sidebar: React.FC<SidebarProps> = ({
  bookmarks,
  tags,
  selectedFolder,
  selectedTag,
  onFolderSelect,
  onTagSelect
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']))

  const folderTree = useMemo(() => {
    const root: FolderNode = { path: '/', name: '全部书签', children: [], count: bookmarks.length }

    const folderMap = new Map<string, FolderNode>()
    folderMap.set('/', root)

    const folderCounts = new Map<string, number>()
    for (const b of bookmarks) {
      const path = b.folderPath
      folderCounts.set(path, (folderCounts.get(path) || 0) + 1)
      let current = ''
      const parts = path.split('/').filter(p => p)
      for (const part of parts) {
        current = current + '/' + part
        folderCounts.set(current, (folderCounts.get(current) || 0))
      }
    }

    for (const b of bookmarks) {
      const parts = b.folderPath.split('/').filter(p => p)
      let currentPath = ''
      let parentNode = root

      for (const part of parts) {
        currentPath = currentPath + '/' + part
        let node = folderMap.get(currentPath)

        if (!node) {
          node = {
            path: currentPath,
            name: part,
            children: [],
            count: folderCounts.get(currentPath) || 0
          }
          folderMap.set(currentPath, node)
          parentNode.children.push(node)
        }

        parentNode = node
      }
    }

    const sortNodes = (node: FolderNode): FolderNode => {
      node.children.sort((a, b) => a.name.localeCompare(b.name))
      node.children.forEach(sortNodes)
      return node
    }

    return sortNodes(root)
  }, [bookmarks])

  const toggleFolder = (path: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  const handleFolderClick = (path: string) => {
    if (selectedFolder === path) {
      onFolderSelect(null)
    } else {
      onFolderSelect(path)
      onTagSelect(null)
    }
  }

  const handleTagClick = (tagName: string) => {
    if (selectedTag === tagName) {
      onTagSelect(null)
    } else {
      onTagSelect(tagName)
      onFolderSelect(null)
    }
  }

  const renderTreeNode = (node: FolderNode, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedFolders.has(node.path)
    const hasChildren = node.children.length > 0
    const isSelected = selectedFolder === node.path

    return (
      <div key={node.path}>
        <div
          className={`tree-node ${isSelected ? 'active' : ''}`}
          onClick={() => handleFolderClick(node.path)}
          style={{ paddingLeft: `${10 + depth * 16}px` }}
        >
          {hasChildren ? (
            <span
              className={`tree-icon ${isExpanded ? 'expanded' : ''}`}
              onClick={(e) => toggleFolder(node.path, e)}
            >
              ▶
            </span>
          ) : (
            <span className="tree-icon" />
          )}
          <span style={{ fontSize: '14px' }}>
            {node.path === '/' ? '📁' : '📂'} {node.name}
          </span>
          <span className="folder-count">{node.count}</span>
        </div>
        {hasChildren && isExpanded && (
          <div className="tree-children">
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const b of bookmarks) {
      for (const tag of b.tags) {
        counts.set(tag, (counts.get(tag) || 0) + 1)
      }
    }
    return counts
  }, [bookmarks])

  return (
    <>
      <div className="sidebar-header">
        <div className="sidebar-title">
          <span style={{ fontSize: '24px' }}>🔖</span>
          <span>书签管理器</span>
        </div>
      </div>
      <div className="sidebar-content">
        <div style={{ marginBottom: '24px' }}>
          <div className="section-title">文件夹</div>
          {renderTreeNode(folderTree)}
        </div>

        <div>
          <div className="section-title">标签</div>
          {tags.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: '12px', padding: '8px' }}>
              暂无标签，点击书签可添加标签
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {tags.map(tag => (
                <div
                  key={tag.name}
                  className={`tag-item ${selectedTag === tag.name ? 'active' : ''}`}
                  style={{ backgroundColor: tag.color + '30', color: tag.color }}
                  onClick={() => handleTagClick(tag.name)}
                  title={`${tagCounts.get(tag.name) || 0} 个书签`}
                >
                  <span>{tag.name}</span>
                  <span style={{ opacity: 0.7 }}>({tagCounts.get(tag.name) || 0})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Sidebar
