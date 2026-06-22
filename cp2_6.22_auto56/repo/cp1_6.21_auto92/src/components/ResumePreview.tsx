import React from 'react'
import { FormData, StructuredResumeData, TemplateConfig } from '../App'

interface ResumePreviewProps {
  formData: FormData
  structuredData: StructuredResumeData | null
  template: TemplateConfig
  step: 1 | 2
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ formData, structuredData, template, step }) => {
  const { titleColor, font } = template

  if (step === 1 || !structuredData) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <div style={{ ...styles.name, color: titleColor, fontFamily: font, transition: 'color 0.4s, font-family 0.4s' }}>
            {formData.name || '姓名'}
          </div>
          {formData.targetPosition && (
            <div style={{ ...styles.position, color: titleColor, transition: 'color 0.4s' }}>
              {formData.targetPosition}
            </div>
          )}
          <div style={styles.contactRow}>
            {formData.phone && <span style={styles.contactItem}>📞 {formData.phone}</span>}
            {formData.email && <span style={styles.contactItem}>✉ {formData.email}</span>}
          </div>
          <div style={styles.divider} />
          <div style={styles.placeholder}>
            <div style={styles.placeholderIcon}>📋</div>
            <div style={styles.placeholderText}>填写基本信息后点击"下一步"</div>
            <div style={styles.placeholderText}>将生成完整简历</div>
          </div>
        </div>
      </div>
    )
  }

  const personalSection = structuredData.sections.find(s => s.title === '个人信息')
  const otherSections = structuredData.sections.filter(s => s.title !== '个人信息')

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        {personalSection && (
          <>
            <div style={{ ...styles.name, color: titleColor, fontFamily: font, transition: 'color 0.4s, font-family 0.4s' }}>
              {personalSection.items.find(i => i.field === 'name')?.value || formData.name}
            </div>
            {personalSection.items.find(i => i.field === 'targetPosition')?.value && (
              <div style={{ ...styles.position, color: titleColor, transition: 'color 0.4s' }}>
                {personalSection.items.find(i => i.field === 'targetPosition')?.value}
              </div>
            )}
            <div style={styles.contactRow}>
              {personalSection.items.find(i => i.field === 'phone')?.value && (
                <span style={styles.contactItem}>
                  📞 {personalSection.items.find(i => i.field === 'phone')?.value}
                </span>
              )}
              {personalSection.items.find(i => i.field === 'email')?.value && (
                <span style={styles.contactItem}>
                  ✉ {personalSection.items.find(i => i.field === 'email')?.value}
                </span>
              )}
            </div>
          </>
        )}

        <div style={styles.divider} />

        {otherSections.map((section, idx) => (
          <div key={idx} style={styles.section}>
            <div style={{
              ...styles.sectionTitle,
              color: titleColor,
              fontFamily: font,
              borderBottom: `2px solid ${titleColor}`,
              transition: 'color 0.4s, font-family 0.4s, border-color 0.4s',
            }}>
              {section.title}
            </div>
            {section.items.map((item, itemIdx) => (
              <div key={itemIdx} style={{
                ...styles.sectionContent,
                fontWeight: item.style?.fontWeight === '600' || item.style?.fontWeight === '700' ? 600 : 400,
                marginTop: item.style?.fontWeight === '600' || item.style?.fontWeight === '700' ? 4 : 0,
                marginLeft: item.style?.fontWeight === '600' || item.style?.fontWeight === '700' ? 0 : 6,
              }}>
                {item.value}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    width: 280,
    flexShrink: 0,
  },
  card: {
    width: 280,
    height: 380,
    background: '#F3F4F6',
    borderRadius: 8,
    padding: 20,
    boxSizing: 'border-box' as const,
    overflow: 'hidden',
    overflowY: 'auto' as const,
    transition: 'background 0.3s',
  },
  name: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 4,
  },
  position: {
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 8,
  },
  contactRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 10,
    marginBottom: 4,
  },
  contactItem: {
    fontSize: 11,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    background: '#D1D5DB',
    margin: '10px 0',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    opacity: 0.5,
  },
  placeholderIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center' as const,
    lineHeight: 1.6,
  },
  section: {
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 3,
    paddingBottom: 2,
  },
  sectionContent: {
    fontSize: 10,
    color: '#4B5563',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap' as const,
  },
}

export default ResumePreview
