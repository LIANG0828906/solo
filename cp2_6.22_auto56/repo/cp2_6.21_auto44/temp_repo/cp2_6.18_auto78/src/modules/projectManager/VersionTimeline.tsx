import React, { useState } from 'react'
import { useProjectStore } from '../../store/projectStore'
import { CommentBubble } from './CommentBubble'
import { WaveformCompare } from './WaveformCompare'

export const VersionTimeline: React.FC<{ trackId: string }> = ({ trackId }) => {
  const versions = useProjectStore((s) => s.versions[trackId] || [])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [compareIds, setCompareIds] = useState<[string, string] | null>(null)

  const handleToggleExpand = (versionId: string) => {
    setExpandedId(expandedId === versionId ? null : versionId)
  }

  const handleCompare = (oldId: string, newId: string) => {
    setCompareIds(compareIds && compareIds[0] === oldId && compareIds[1] === newId ? null : [oldId, newId])
  }

  if (versions.length === 0) {
    return (
      <div className="empty-state" style={{ padding: 20 }}>
        <p>暂无版本记录</p>
      </div>
    )
  }

  return (
    <div>
      <div className="timeline">
        {versions.map((v, idx) => (
          <div key={v.id} className="timeline-node">
            <div className="timeline-dot" onClick={() => handleToggleExpand(v.id)} />
            <div className="timeline-version-header" onClick={() => handleToggleExpand(v.id)}>
              <span className="timeline-version-number">{v.versionNumber}</span>
              <span className="timeline-version-time">{v.uploadTime}</span>
              {idx > 0 && (
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: 12, padding: '2px 8px' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCompare(versions[idx - 1].id, v.id)
                  }}
                >
                  与上一版对比
                </button>
              )}
            </div>
            {expandedId === v.id && (
              <div className="timeline-version-detail">
                <p><strong>上传者：</strong>{v.uploaderName}</p>
                <p><strong>上传时间：</strong>{v.uploadTime}</p>
                <p><strong>备注：</strong>{v.note}</p>
                <p><strong>文件大小：</strong>{v.fileSize}MB</p>
                <CommentBubble versionId={v.id} />
              </div>
            )}
          </div>
        ))}
      </div>

      {compareIds && (
        <WaveformCompare
          oldVersionId={compareIds[0]}
          newVersionId={compareIds[1]}
          trackId={trackId}
          onClose={() => setCompareIds(null)}
        />
      )}
    </div>
  )
}
