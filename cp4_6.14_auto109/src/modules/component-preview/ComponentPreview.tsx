import React, { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { useDesignTokens } from '../../context/DesignTokensContext'
import { generateCssVariables } from '../../utils/cssVarGenerator'
import PreviewButton from './PreviewButton'
import PreviewCard from './PreviewCard'
import PreviewNavbar from './PreviewNavbar'
import ExportModal from './ExportModal'

const ComponentPreview: React.FC = () => {
  const { tokens } = useDesignTokens()
  const [showModal, setShowModal] = useState(false)

  const previewStyle = useMemo(
    () => generateCssVariables(tokens) as unknown as React.CSSProperties,
    [tokens]
  )

  return (
    <div className="preview-panel" style={previewStyle}>
      <div className="preview-header">
        <button className="export-button" onClick={() => setShowModal(true)}>
          <Download size={16} />
          导出令牌
        </button>
      </div>
      <div className="preview-content">
        <PreviewNavbar tokens={tokens} />
        <PreviewButton tokens={tokens} />
        <PreviewCard tokens={tokens} />
      </div>
      {showModal && <ExportModal tokens={tokens} onClose={() => setShowModal(false)} />}
    </div>
  )
}

export default ComponentPreview
