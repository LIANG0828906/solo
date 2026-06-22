import React, { useState } from 'react'
import { ChevronDown, RotateCcw } from 'lucide-react'
import { useDesignTokens } from '../../context/DesignTokensContext'
import ColorGroup from './ColorGroup'
import SpacingGroup from './SpacingGroup'
import FontGroup from './FontGroup'
import ShadowGroup from './ShadowGroup'

type GroupKey = 'colors' | 'spacing' | 'fonts' | 'shadows'

const groupTitles: Record<GroupKey, string> = {
  colors: '颜色',
  spacing: '间距',
  fonts: '字体',
  shadows: '阴影',
}

const TokenEditor: React.FC = () => {
  const [expandedGroups, setExpandedGroups] = useState<Set<GroupKey>>(new Set())
  const { resetTokens } = useDesignTokens()

  const toggleGroup = (key: GroupKey) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const renderGroup = (key: GroupKey) => {
    const isExpanded = expandedGroups.has(key)
    let content: React.ReactNode = null
    switch (key) {
      case 'colors':
        content = <ColorGroup />
        break
      case 'spacing':
        content = <SpacingGroup />
        break
      case 'fonts':
        content = <FontGroup />
        break
      case 'shadows':
        content = <ShadowGroup />
        break
    }

    return (
      <div className="group-wrapper" key={key}>
        <div className="group-header" onClick={() => toggleGroup(key)}>
          <span className="group-title">{groupTitles[key]}</span>
          <ChevronDown className={`group-arrow ${isExpanded ? 'expanded' : ''}`} />
        </div>
        <div className={`group-body ${isExpanded ? 'expanded' : ''}`}>
          <div className="group-content">{content}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="editor-panel">
      <div className="editor-header">设计令牌编辑器</div>
      <div className="editor-content">
        {(Object.keys(groupTitles) as GroupKey[]).map((key) => renderGroup(key))}
      </div>
      <div className="editor-footer">
        <button className="reset-button" onClick={resetTokens}>
          <RotateCcw size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} />
          重置为默认
        </button>
      </div>
    </div>
  )
}

export default TokenEditor
