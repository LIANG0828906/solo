import React, { useMemo, useState, useCallback } from 'react'
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

  const handleExportClick = useCallback(() => {
    setShowModal(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setShowModal(false)
  }, [])

  return (
    <div className="preview-panel" style={previewStyle}>
      <div className="preview-header">
        <button className="export-button" onClick={handleExportClick}>
          <Download size={16} />
          导出令牌
        </button>
      </div>
      <div className="preview-content">
        <PreviewNavbar tokens={tokens} />
        <PreviewButton tokens={tokens} />
        <PreviewCard tokens={tokens} />
      </div>
      {showModal && <ExportModal tokens={tokens} onClose={handleCloseModal} />}
    </div>
  )
}

export default ComponentPreview
