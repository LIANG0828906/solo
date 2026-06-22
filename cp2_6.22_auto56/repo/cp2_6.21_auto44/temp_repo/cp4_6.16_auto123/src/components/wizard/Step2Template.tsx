import React, { useCallback } from 'react'
import { templates, LuggageTemplate } from '../../utils/templateEngine'

interface Step2TemplateProps {
  selectedTemplateId: string
  onTemplateSelect: (templateId: string) => void
}

const typeIcons: Record<LuggageTemplate['type'], string> = {
  business: '💼',
  beach: '🏖️',
  hiking: '🥾',
  city: '🏙️',
  winter: '❄️'
}

const Step2Template: React.FC<Step2TemplateProps> = React.memo(({
  selectedTemplateId,
  onTemplateSelect
}) => {
  const handleSelect = useCallback((templateId: string) => {
    onTemplateSelect(templateId)
  }, [onTemplateSelect])

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">选择行李模板</h2>
        <p className="text-[var(--text-secondary)]">根据你的旅行类型选择最合适的模板</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {templates.map((template) => {
          const isSelected = selectedTemplateId === template.id
          return (
            <div
              key={template.id}
              onClick={() => handleSelect(template.id)}
              className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 will-change-transform ${
                isSelected
                  ? 'border-[var(--accent-blue)] bg-[var(--accent-blue)]/5 shadow-lg shadow-[var(--accent-blue)]/20 -translate-y-0.5'
                  : 'border-[var(--card-border)] bg-white hover:-translate-y-[3px] hover:shadow-xl hover:border-[var(--accent-light)]'
              }`}
            >
              <div className="absolute top-3 left-3 text-xl">
                {typeIcons[template.type]}
              </div>
              
              <div className="flex items-start justify-between mb-3 ml-8">
                <div className="text-3xl">
                  {template.icon}
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-light)] flex items-center justify-center text-white text-xs font-bold animate-[bounceScale_0.4s_cubic-bezier(0.68,-0.55,0.265,1.55)]">
                    ✓
                  </div>
                )}
              </div>
              
              <h3 className="font-bold text-[var(--text-primary)] mb-1 text-base">
                {template.name}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {template.description}
              </p>
              
              <div className="mt-4 flex flex-wrap gap-1.5">
                {template.categories.slice(0, 3).map((cat) => (
                  <span
                    key={cat.name}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--bg-primary)] rounded-md text-xs text-[var(--text-secondary)]"
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </span>
                ))}
                {template.categories.length > 3 && (
                  <span className="px-2 py-1 text-xs text-[var(--text-secondary)]">
                    +{template.categories.length - 3} 更多
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})

Step2Template.displayName = 'Step2Template'

export default Step2Template
