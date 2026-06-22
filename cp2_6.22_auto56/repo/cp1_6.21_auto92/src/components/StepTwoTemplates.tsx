import React, { useState } from 'react'
import { TEMPLATES, PolishSuggestion } from '../App'

interface StepTwoTemplatesProps {
  selectedTemplate: string
  onTemplateChange: (key: string) => void
  suggestions: PolishSuggestion[]
  onAccept: (index: number) => void
  onReject: (index: number) => void
  onUndo: () => void
  canUndo: boolean
  onPolish: () => void
  onExport: (format: 'pdf' | 'txt') => void
  onPrev: () => void
}

const StepTwoTemplates: React.FC<StepTwoTemplatesProps> = ({
  selectedTemplate,
  onTemplateChange,
  suggestions,
  onAccept,
  onReject,
  onUndo,
  canUndo,
  onPolish,
  onExport,
  onPrev,
}) => {
  const [exportDialog, setExportDialog] = useState<'pdf' | 'txt' | null>(null)

  const handleExportConfirm = () => {
    if (exportDialog) {
      onExport(exportDialog)
      setExportDialog(null)
    }
  }

  const categoryLabel: Record<string, string> = {
    education: '教育经历',
    work: '工作经历',
    skills: '技能特长',
    general: '通用',
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>选择风格模板</h2>

      <div style={styles.templateRow}>
        {TEMPLATES.map(t => (
          <div
            key={t.key}
            onClick={() => onTemplateChange(t.key)}
            style={{
              ...styles.templateCard,
              ...(selectedTemplate === t.key ? styles.templateCardSelected : {}),
            }}
          >
            <div style={{ ...styles.templateTitle, color: t.titleColor, fontFamily: t.font }}>
              {t.label}
            </div>
            <div style={styles.templateDesc}>{t.description}</div>
            <div style={{ ...styles.colorDot, background: t.titleColor }} />
          </div>
        ))}
      </div>

      <div style={styles.actionRow}>
        <button onClick={onPrev} style={styles.prevButton}>上一步</button>
        <button onClick={onPolish} style={styles.polishButton}>智能润色</button>
        {canUndo && (
          <button onClick={onUndo} style={styles.undoButton}>撤销</button>
        )}
      </div>

      {suggestions.length > 0 && (
        <div style={styles.suggestionsContainer}>
          <div style={styles.suggestionsTitle}>润色建议（{suggestions.length}条）</div>
          {suggestions.map((s, i) => (
            <div key={`${s.fieldPath}-${i}`} style={styles.suggestionItem}>
              <div style={styles.suggestionTexts}>
                <span style={styles.categoryTag}>{categoryLabel[s.category] || s.category}</span>
                <span style={styles.originalText}>{s.original}</span>
                <span style={styles.arrow}>→</span>
                <span style={styles.recommendedText}>{s.recommended}</span>
              </div>
              <div style={styles.suggestionActions}>
                <button onClick={() => onAccept(i)} style={styles.acceptBtn}>接受</button>
                <button onClick={() => onReject(i)} style={styles.rejectBtn}>拒绝</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={styles.exportRow}>
        <button onClick={() => setExportDialog('pdf')} style={styles.exportPdfBtn}>导出PDF</button>
        <button onClick={() => setExportDialog('txt')} style={styles.exportTxtBtn}>导出TXT</button>
      </div>

      {exportDialog && (
        <div style={styles.dialogOverlay} onClick={() => setExportDialog(null)}>
          <div style={styles.dialog} onClick={e => e.stopPropagation()}>
            <div style={styles.dialogText}>确认导出为{exportDialog === 'pdf' ? 'PDF' : '纯文本'}文件？</div>
            <div style={styles.dialogActions}>
              <button onClick={handleExportConfirm} style={styles.dialogConfirmBtn}>确认导出</button>
              <button onClick={() => setExportDialog(null)} style={styles.dialogCancelBtn}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: '#FFFFFF',
    borderRadius: 8,
    padding: 24,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    color: '#1F2937',
    marginBottom: 20,
  },
  templateRow: {
    display: 'flex',
    gap: 12,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  templateCard: {
    flex: 1,
    minWidth: 120,
    padding: 16,
    background: '#FAFAFA',
    borderRadius: 8,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '2px solid #E5E7EB',
    cursor: 'pointer',
    transition: 'border-color 0.4s, transform 0.2s, box-shadow 0.2s',
    position: 'relative',
  },
  templateCardSelected: {
    border: '2px solid #3B82F6',
    boxShadow: '0 0 0 1px #6366F1, 0 2px 8px rgba(59,130,246,0.2)',
  },
  templateTitle: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 6,
    transition: 'color 0.4s',
  },
  templateDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: '50%',
    position: 'absolute',
    top: 12,
    right: 12,
  },
  actionRow: {
    display: 'flex',
    gap: 10,
    marginBottom: 16,
  },
  prevButton: {
    padding: '8px 18px',
    borderRadius: 8,
    border: '1px solid #D1D5DB',
    background: '#FFFFFF',
    color: '#374151',
    fontSize: 14,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  polishButton: {
    padding: '8px 18px',
    borderRadius: 8,
    border: 'none',
    background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  undoButton: {
    padding: '8px 18px',
    borderRadius: 8,
    border: '1px solid #D1D5DB',
    background: '#F9FAFB',
    color: '#374151',
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  suggestionsContainer: {
    marginTop: 12,
    marginBottom: 16,
    background: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 10,
  },
  suggestionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #E5E7EB',
    transition: 'all 0.2s',
  },
  suggestionTexts: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  categoryTag: {
    fontSize: 10,
    color: '#6366F1',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  originalText: {
    textDecoration: 'line-through',
    color: '#9CA3AF',
    fontSize: 13,
  },
  arrow: {
    color: '#D1D5DB',
    fontSize: 12,
  },
  recommendedText: {
    color: '#1F2937',
    fontSize: 13,
    fontWeight: 500,
  },
  suggestionActions: {
    display: 'flex',
    gap: 6,
    marginLeft: 10,
    flexShrink: 0,
  },
  acceptBtn: {
    padding: '4px 12px',
    borderRadius: 6,
    border: 'none',
    background: '#10B981',
    color: '#FFFFFF',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  rejectBtn: {
    padding: '4px 12px',
    borderRadius: 6,
    border: '1px solid #D1D5DB',
    background: '#FFFFFF',
    color: '#374151',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  exportRow: {
    display: 'flex',
    gap: 10,
    marginTop: 8,
  },
  exportPdfBtn: {
    flex: 1,
    padding: '10px 0',
    borderRadius: 8,
    border: 'none',
    background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s, transform 0.2s',
  },
  exportTxtBtn: {
    flex: 1,
    padding: '10px 0',
    borderRadius: 8,
    border: '1px solid #D1D5DB',
    background: '#FFFFFF',
    color: '#374151',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  dialogOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  dialog: {
    width: 300,
    height: 180,
    borderRadius: 16,
    background: '#FFFFFF',
    boxShadow: '2px 2px 10px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    padding: 20,
    boxSizing: 'border-box' as const,
  },
  dialogText: {
    fontSize: 16,
    fontWeight: 500,
    color: '#1F2937',
    textAlign: 'center' as const,
  },
  dialogActions: {
    display: 'flex',
    gap: 12,
  },
  dialogConfirmBtn: {
    padding: '8px 24px',
    borderRadius: 8,
    border: 'none',
    background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  dialogCancelBtn: {
    padding: '8px 24px',
    borderRadius: 8,
    border: '1px solid #D1D5DB',
    background: '#FFFFFF',
    color: '#374151',
    fontSize: 14,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
}

export default StepTwoTemplates
