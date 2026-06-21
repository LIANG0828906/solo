import React from 'react'
import { useStore, ArtifactType } from '../store'

export default function FragmentPanel() {
  const { fragments, selectedFragmentId, selectFragment, artifactType, fusedFragmentIds } = useStore()

  const unfusedFragments = fragments.filter(f => !fusedFragmentIds.has(f.id))
  const fusedCount = fusedFragmentIds.size

  return (
    <div className="fragment-panel">
      <div className="panel-title">
        碎片清单
      </div>
      <div className="fragment-list">
        {unfusedFragments.map(fragment => (
          <div
            key={fragment.id}
            className={`fragment-item ${selectedFragmentId === fragment.id ? 'selected' : ''}`}
            onClick={() => selectFragment(selectedFragmentId === fragment.id ? null : fragment.id)}
          >
            <div className={`fragment-thumbnail ${artifactType === 'blue-porcelain' ? 'blue' : 'green'}`}>
              {fragment.id + 1}
            </div>
            <div className="fragment-info">
              <div className="fragment-number">碎片 #{String(fragment.id + 1).padStart(2, '0')}</div>
              <div className="fragment-status">待修复</div>
            </div>
          </div>
        ))}
        
        {fusedCount > 0 && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(212, 165, 116, 0.2)' }}>
            <div style={{ fontSize: 14, color: '#8d6e63', marginBottom: 12, letterSpacing: 2, textAlign: 'center' }}>
              已修复 {fusedCount} 块
            </div>
            {fragments.filter(f => fusedFragmentIds.has(f.id)).map(fragment => (
              <div
                key={fragment.id}
                className="fragment-item"
                style={{ opacity: 0.6, cursor: 'default' }}
              >
                <div className={`fragment-thumbnail ${artifactType === 'blue-porcelain' ? 'blue' : 'green'}`} style={{ opacity: 0.5 }}>
                  {fragment.id + 1}
                </div>
                <div className="fragment-info">
                  <div className="fragment-number">碎片 #{String(fragment.id + 1).padStart(2, '0')}</div>
                  <div className="fragment-status fused">已修复</div>
                </div>
                <span className="completed-badge">✓</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
