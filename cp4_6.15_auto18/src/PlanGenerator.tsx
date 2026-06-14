import { useEffect, useCallback, useMemo } from 'react'
import type { Inspiration, GeneratedPlan, PlanStep } from './types'
import { generateId, calculateRelevance } from './utils'

interface PlanGeneratorProps {
  inspirations: Inspiration[]
  selectedIds: string[]
  isGenerating: boolean
  generatedPlan: GeneratedPlan | null
  onToggleSelect: (id: string) => void
  onClearSelection: () => void
  onGenerate: () => void
  onPlanGenerated: (plan: GeneratedPlan) => void
  onError: () => void
}

function PlanGenerator({
  inspirations,
  selectedIds,
  isGenerating,
  generatedPlan,
  onToggleSelect,
  onClearSelection,
  onGenerate,
  onPlanGenerated,
  onError,
}: PlanGeneratorProps) {
  const selectedInspirations = useMemo(
    () => inspirations.filter(i => selectedIds.includes(i.id)),
    [inspirations, selectedIds]
  )

  const canGenerate = selectedIds.length >= 2 && selectedIds.length <= 5

  const generatePlan = useCallback(() => {
    if (!canGenerate) {
      return
    }

    onGenerate()

    setTimeout(() => {
      try {
        const plan = createPlanFromInspirations(selectedInspirations)
        onPlanGenerated(plan)
      } catch (e) {
        console.error('生成计划失败:', e)
        onError()
      }
    }, 1500)
  }, [canGenerate, selectedInspirations, onGenerate, onPlanGenerated, onError])

  const createPlanFromInspirations = (items: Inspiration[]): GeneratedPlan => {
    const sorted = sortByRelevance(items)
    const steps = generateSteps(sorted)
    const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0)

    const allKeywords = sorted.flatMap(i => i.keywords)
    const topKeywords = [...new Set(allKeywords)].slice(0, 3)
    const planTitle = `${topKeywords.join(' · ')} 创作计划`
    const planDesc = `基于 ${items.length} 个灵感自动生成的创作执行方案`

    return {
      id: generateId(),
      title: planTitle,
      description: planDesc,
      steps,
      totalDuration,
      createdAt: Date.now(),
      selectedInspirationIds: items.map(i => i.id),
    }
  }

  const sortByRelevance = (items: Inspiration[]): Inspiration[] => {
    if (items.length <= 1) {
      return items
    }

    const relevanceGraph: Map<string, Map<string, number>> = new Map()

    items.forEach(a => {
      relevanceGraph.set(a.id, new Map())
      items.forEach(b => {
        if (a.id !== b.id) {
          relevanceGraph.get(a.id)!.set(b.id, calculateRelevance(a, b))
        }
      })
    })

    const startItem = items[0]
    const visited = new Set<string>([startItem.id])
    const result: Inspiration[] = [startItem]

    while (visited.size < items.length) {
      const lastItem = result[result.length - 1]
      const relations = relevanceGraph.get(lastItem.id)!

      let maxScore = -1
      let nextItem: Inspiration | null = null

      items.forEach(item => {
        if (!visited.has(item.id)) {
          const score = relations.get(item.id) || 0
          if (score > maxScore) {
            maxScore = score
            nextItem = item
          }
        }
      })

      if (nextItem) {
        visited.add(nextItem.id)
        result.push(nextItem)
      } else {
        const remaining = items.find(i => !visited.has(i.id))
        if (remaining) {
          visited.add(remaining.id)
          result.push(remaining)
        }
      }
    }

    return result
  }

  const generateSteps = (sortedItems: Inspiration[]): PlanStep[] => {
    const steps: PlanStep[] = []

    steps.push({
      id: generateId(),
      title: '需求梳理与框架搭建',
      description: `整合灵感：${sortedItems.map(i => i.title).join('、')}。明确核心目标与产出物，搭建整体框架。`,
      duration: 30,
      prerequisites: ['整理所有灵感素材', '确认最终目标'],
      inspirationIds: sortedItems.map(i => i.id),
      order: 0,
    })

    sortedItems.forEach((item, index) => {
      const baseDuration = 45 + index * 15
      const prerequisites: string[] = []

      if (index === 0) {
        prerequisites.push('完成需求梳理')
      } else {
        prerequisites.push(`完成步骤 ${index + 1}`)
      }

      const relatedItems = sortedItems
        .filter((_, i) => i !== index)
        .slice(0, 2)
      if (relatedItems.length > 0) {
        prerequisites.push(`参考灵感：${relatedItems.map(i => i.title).join('、')}`)
      }

      const stepTitles = [
        `核心内容创作：${item.title}`,
        `深化设计：${item.title}`,
        `实现细节：${item.title}`,
        `打磨优化：${item.title}`,
        `整合串联：${item.title}`,
      ]

      const stepDescs = [
        `基于「${item.title}」的核心创意，完成主要内容的创作与输出。${item.description ? '要点：' + item.description : ''}`,
        `围绕「${item.title}」进行细节设计，确保创意完整呈现。`,
        `将「${item.title}」的创意落地，完成具体实现工作。`,
        `对「${item.title}」相关内容进行精雕细琢，提升质量。`,
        `将「${item.title}」与其他部分无缝整合，形成完整作品。`,
      ]

      steps.push({
        id: generateId(),
        title: stepTitles[index % stepTitles.length],
        description: stepDescs[index % stepDescs.length],
        duration: baseDuration,
        prerequisites,
        inspirationIds: [item.id],
        order: steps.length,
      })
    })

    steps.push({
      id: generateId(),
      title: '整合优化与最终审查',
      description: '将所有部分整合为完整作品，进行全面检查与优化，确保质量达标。',
      duration: 60,
      prerequisites: [
        '完成所有创作步骤',
        '检查各部分衔接流畅度',
        '确认整体风格一致性',
      ],
      inspirationIds: sortedItems.map(i => i.id),
      order: steps.length,
    })

    return steps
  }

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} 分钟`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours} 小时 ${mins} 分钟` : `${hours} 小时`
  }

  useEffect(() => {
    if (isGenerating) {
      generatePlan()
    }
  }, [isGenerating, generatePlan])

  return (
    <div className="generate-section">
      <div className="section-header">
        <h2 className="section-title">
          计划生成
          {generatedPlan && <span>(已生成)</span>}
        </h2>
      </div>

      <div className="selection-info">
        <div className="selection-count">
          已选择 <strong>{selectedIds.length}</strong> 个灵感
          <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>
            (需选择 2-5 个)
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {selectedIds.length > 0 && (
            <button
              className="icon-btn"
              onClick={onClearSelection}
              title="清空选择"
              style={{ width: 'auto', padding: '0 16px', fontWeight: 500 }}
            >
              清空
            </button>
          )}
          <button
            className="generate-btn"
            onClick={generatePlan}
            disabled={!canGenerate || isGenerating}
          >
            {isGenerating ? '生成中...' : '✨ 生成计划'}
          </button>
        </div>
      </div>

      <div className="selected-inspirations">
        {selectedInspirations.length === 0 ? (
          <span
            style={{
              color: 'var(--text-muted)',
              fontSize: '13px',
              padding: '4px 8px',
            }}
          >
            点击左侧灵感卡片进行选择
          </span>
        ) : (
          selectedInspirations.map(inspiration => (
            <div key={inspiration.id} className="selected-tag">
              {inspiration.title}
              <button onClick={() => onToggleSelect(inspiration.id)}>✕</button>
            </div>
          ))
        )}
      </div>

      {isGenerating && (
        <div className="loading-overlay">
          <svg className="hourglass" viewBox="0 0 100 100" fill="none">
            <path
              d="M30 10h40v20c0 15-10 25-20 25s-20-10-20-25V10z"
              fill="var(--accent-gold)"
              opacity="0.9"
            />
            <path
              d="M30 90h40V70c0-15-10-25-20-25s-20 10-20 25v20z"
              fill="var(--accent-gold)"
            />
            <rect x="25" y="8" width="50" height="4" fill="var(--accent-gold-dim)" rx="2" />
            <rect x="25" y="88" width="50" height="4" fill="var(--accent-gold-dim)" rx="2" />
          </svg>
          <div className="loading-text">正在为您生成创作计划...</div>
        </div>
      )}

      {generatedPlan && (
        <div className="plan-results">
          <div className="plan-header">
            <h3 className="plan-title">{generatedPlan.title}</h3>
            <p className="plan-desc">{generatedPlan.description}</p>
            <div className="plan-stats">
              <div className="plan-stat">
                <div className="plan-stat-value">{generatedPlan.steps.length}</div>
                <div className="plan-stat-label">步骤</div>
              </div>
              <div className="plan-stat">
                <div className="plan-stat-value">
                  {formatDuration(generatedPlan.totalDuration)}
                </div>
                <div className="plan-stat-label">预计时长</div>
              </div>
            </div>
          </div>

          <div className="plan-masonry">
            {generatedPlan.steps.map((step, index) => (
              <div key={step.id} className="plan-step-card">
                <div className="step-number">{index + 1}</div>
                <h4 className="step-title">{step.title}</h4>
                <p className="step-desc">{step.description}</p>
                <div className="step-meta">
                  <div className="step-meta-item">
                    <span>⏱</span>
                    <strong>{formatDuration(step.duration)}</strong>
                  </div>
                </div>
                {step.prerequisites.length > 0 && (
                  <div className="step-prerequisites">
                    <div className="prereq-label">前置条件</div>
                    <div className="prereq-list">
                      {step.prerequisites.map((prereq, pIndex) => (
                        <span key={pIndex} className="prereq-tag">
                          {prereq}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!generatedPlan && !isGenerating && selectedInspirations.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p className="empty-state-text">
            选择 2-5 个灵感卡片
            <br />
            系统将根据灵感关联度自动生成可执行的创作计划
          </p>
        </div>
      )}

      {!generatedPlan && !isGenerating && selectedInspirations.length > 0 && selectedInspirations.length < 2 && (
        <div className="empty-state">
          <div className="empty-state-icon">💡</div>
          <p className="empty-state-text">
            再选择 {2 - selectedInspirations.length} 个灵感
            <br />
            就可以生成创作计划了
          </p>
        </div>
      )}
    </div>
  )
}

export default PlanGenerator
