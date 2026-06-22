import { memo, useState } from 'react'
import type { VariableEntry, VarValue } from './StepRunner'

export interface VariableVisualizerProps {
  variables: VariableEntry[]
}

function formatValue(value: VarValue): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return `"${value}"`
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'function') return '[Function]'
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    return `Array(${value.length})`
  }
  if (typeof value === 'object') {
    try {
      const keys = Object.keys(value as object)
      if (keys.length === 0) return '{}'
      return `{ ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? ', ...' : ''} }`
    } catch {
      return '[Object]'
    }
  }
  return String(value)
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'string': return '#16a34a'
    case 'number': return '#3b82f6'
    case 'boolean': return '#a855f7'
    case 'null':
    case 'undefined': return '#94a3b8'
    case 'array': return '#0891b2'
    case 'object': return '#ea580c'
    case 'function': return '#db2777'
    default: return '#334155'
  }
}

interface TreeNodeProps {
  entry: VariableEntry
  level: number
}

const TreeNode = memo(function TreeNode({ entry, level }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(level < 1)
  const hasChildren = entry.children && entry.children.length > 0
  const isObject = entry.type === 'object' || entry.type === 'array'
  const paddingLeft = 8 + level * 16

  return (
    <div style={{ display: 'block' }}>
      <div
        className={`var-row ${entry.isNewlyChanged ? 'var-changed' : ''}`}
        style={{ paddingLeft }}
        key={entry.changeTimestamp || entry.name}
      >
        {hasChildren ? (
          <button
            type="button"
            className="var-toggle"
            onClick={() => setExpanded(v => !v)}
            aria-label={expanded ? '折叠' : '展开'}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 150ms' }}>
              <path d="M3 1 L7 5 L3 9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <span className="var-toggle-spacer" />
        )}
        <span className="var-name">{entry.name}</span>
        <span className="var-colon">:</span>
        <span className="var-type" style={{ color: getTypeColor(entry.type) }}>{entry.type}</span>
        <span className="var-eq">=</span>
        <span className={`var-value ${entry.isNewlyChanged ? 'var-value-changed' : ''}`}>
          {isObject && hasChildren && !expanded ? formatValue(entry.value) : formatValue(entry.value)}
        </span>
      </div>
      {expanded && hasChildren && (
        <div>
          {entry.children!.map(child => (
            <TreeNode key={child.name} entry={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
})

function VariableVisualizerImpl({ variables }: VariableVisualizerProps) {
  return (
    <div className="viz-panel variable-visualizer">
      <div className="viz-panel-header">
        <div className="viz-panel-title">
          <span className="viz-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </span>
          变量状态
        </div>
        <div className="viz-panel-count">共 {variables.length} 个</div>
      </div>
      <div className="viz-panel-body variable-list">
        {variables.length === 0 ? (
          <div className="viz-empty">
            <div className="viz-empty-icon">📦</div>
            <div className="viz-empty-text">暂无变量</div>
            <div className="viz-empty-hint">输入代码并点击单步执行开始调试</div>
          </div>
        ) : (
          variables.map(v => (
            <TreeNode key={v.name} entry={v} level={0} />
          ))
        )}
      </div>
    </div>
  )
}

export const VariableVisualizer = memo(VariableVisualizerImpl)
