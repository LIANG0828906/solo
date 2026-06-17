import React from 'react'
import { useDocumentStore, DocumentState } from '@/store/documentStore'

const selector1 = (s: DocumentState) => s.content
const selector2 = (s: DocumentState) => s.activeDocId

const Preview: React.FC = React.memo(() => {
  const content = useDocumentStore(selector1)
  const activeDocId = useDocumentStore(selector2)

  if (!activeDocId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-lg">
        暂无预览内容
      </div>
    )
  }

  return (
    <div
      className="preview-container flex-1 overflow-y-auto bg-gray-50 border border-gray-200 rounded-lg p-4 text-base leading-relaxed"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
})

Preview.displayName = 'Preview'

export default Preview
