import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DailyNutrition,
  CALORIE_TARGET,
  PROTEIN_TARGET,
  FAT_TARGET,
  CARBS_TARGET,
  FoodRecord,
  CATEGORY_COLORS,
} from '../hooks/useFoodData'

interface NutritionPanelProps {
  nutrition: DailyNutrition
  suggestion: string
  todayRecords: FoodRecord[]
}

type NutrientKey = 'protein' | 'fat' | 'carbs' | null

const NutritionPanel = ({ nutrition, suggestion, todayRecords }: NutritionPanelProps) => {
  const [expandedNutrient, setExpandedNutrient] = useState<NutrientKey>(null)

  const caloriePercent = Math.min((nutrition.calories / CALORIE_TARGET) * 100, 100)
  const circumference = 2 * Math.PI * 68

  const macroData = useMemo(() => {
    const totalCaloriesFromMacros =
      nutrition.protein * 4 + nutrition.fat * 9 + nutrition.carbs * 4
    return [
      {
        key: 'protein' as const,
        label: '蛋白质',
        value: nutrition.protein,
        target: PROTEIN_TARGET,
        color: '#27AE60',
        calories: nutrition.protein * 4,
        percent: totalCaloriesFromMacros > 0
          ? (nutrition.protein * 4) / totalCaloriesFromMacros
          : 0,
      },
      {
        key: 'fat' as const,
        label: '脂肪',
        value: nutrition.fat,
        target: FAT_TARGET,
        color: '#E74C3C',
        calories: nutrition.fat * 9,
        percent: totalCaloriesFromMacros > 0
          ? (nutrition.fat * 9) / totalCaloriesFromMacros
          : 0,
      },
      {
        key: 'carbs' as const,
        label: '碳水化合物',
        value: nutrition.carbs,
        target: CARBS_TARGET,
        color: '#3498DB',
        calories: nutrition.carbs * 4,
        percent: totalCaloriesFromMacros > 0
          ? (nutrition.carbs * 4) / totalCaloriesFromMacros
          : 0,
      },
    ]
  }, [nutrition])

  const getMacroBreakdown = (key: 'protein' | 'fat' | 'carbs') => {
    const breakdown: Record<string, { name: string; value: number; category: string; color: string }> = {}
    todayRecords.forEach((r) => {
      const val = key === 'protein' ? r.nutrition.protein : key === 'fat' ? r.nutrition.fat : r.nutrition.carbs
      if (val > 0) {
        if (!breakdown[r.foodId]) {
          breakdown[r.foodId] = {
            name: r.name,
            value: 0,
            category: r.category,
            color: CATEGORY_COLORS[r.category],
          }
        }
        breakdown[r.foodId].value += val
      }
    })
    return Object.values(breakdown)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }

  const renderDonutSegments = () => {
    const segments: JSX.Element[] = []
    let cumulativePercent = 0
    const totalPercent = macroData.reduce((sum, m) => sum + m.percent, 0)

    macroData.forEach((macro, idx) => {
      if (totalPercent === 0) return
      const normalizedPercent = macro.percent / totalPercent
      const dashArray = normalizedPercent * circumference
      const dashOffset = -cumulativePercent * circumference
      cumulativePercent += normalizedPercent

      segments.push(
        <circle
          key={macro.key}
          cx="80"
          cy="80"
          r="60"
          fill="none"
          stroke={macro.color}
          strokeWidth="14"
          strokeDasharray={`${dashArray} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="butt"
          onClick={() =>
            setExpandedNutrient((prev) => (prev === macro.key ? null : macro.key))
          }
          style={{
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            opacity: expandedNutrient && expandedNutrient !== macro.key ? 0.4 : 1,
            transformOrigin: 'center',
          }}
          className={`macro-segment-${idx}`}
        />
      )
    })

    return segments
  }

  return (
    <div style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#2D3436', marginBottom: '20px' }}>
        今日营养概览
      </h2>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '28px',
        }}
      >
        <div style={{ position: 'relative', width: '160px', height: '160px' }}>
          <svg width="160" height="160" viewBox="0 0 160 160">
            <defs>
              <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F39C12" />
                <stop offset="100%" stopColor="#E74C3C" />
              </linearGradient>
            </defs>

            <circle
              cx="80"
              cy="80"
              r="68"
              fill="none"
              stroke="#F2F6FC"
              strokeWidth="10"
            />

            <motion.circle
              cx="80"
              cy="80"
              r="68"
              fill="none"
              stroke="url(#calorieGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{
                strokeDashoffset: circumference - (caloriePercent / 100) * circumference,
              }}
              transition={{ duration: 1, ease: 'easeOut' }}
              transform="rotate(-90 80 80)"
            />
          </svg>

          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              style={{ textAlign: 'center' }}
            >
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#2D3436',
                  lineHeight: 1.2,
                }}
              >
                {Math.round(nutrition.calories)}
              </div>
              <div style={{ fontSize: '11px', color: '#909399', marginTop: '2px' }}>
                / {CALORIE_TARGET} kcal
              </div>
            </motion.div>
          </div>
        </div>

        <div
          style={{
            marginTop: '12px',
            fontSize: '12px',
            fontWeight: 500,
            color: caloriePercent >= 100 ? '#E74C3C' : caloriePercent >= 80 ? '#F39C12' : '#4A90D9',
            background:
              caloriePercent >= 100
                ? 'rgba(231,76,60,0.1)'
                : caloriePercent >= 80
                ? 'rgba(243,156,18,0.1)'
                : 'rgba(74,144,217,0.1)',
            padding: '4px 12px',
            borderRadius: '12px',
          }}
        >
          {caloriePercent.toFixed(0)}% 目标热量
        </div>
      </div>

      <div style={{ marginBottom: '28px' }}>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#2D3436',
            marginBottom: '14px',
          }}
        >
          三大营养素
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <div style={{ position: 'relative', width: '160px', height: '160px' }}>
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r="60"
                fill="none"
                stroke="#F5F7FA"
                strokeWidth="14"
              />

              {macroData.every((m) => m.value === 0) ? (
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  fill="none"
                  stroke="#E4E7ED"
                  strokeWidth="14"
                  strokeDasharray="8 4"
                  opacity="0.5"
                />
              ) : (
                renderDonutSegments()
              )}

              <circle
                cx="80"
                cy="80"
                r="42"
                fill="#FFFFFF"
              />
            </svg>

            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ fontSize: '11px', color: '#909399' }}>总供能</div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#2D3436',
                  marginTop: '2px',
                }}
              >
                {Math.round(
                  nutrition.protein * 4 + nutrition.fat * 9 + nutrition.carbs * 4
                )}
                <span style={{ fontSize: '10px', fontWeight: 400, color: '#909399' }}>
                  kcal
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {macroData.map((macro) => {
            const progress = Math.min((macro.value / macro.target) * 100, 100)
            const isExpanded = expandedNutrient === macro.key
            const breakdown = isExpanded ? getMacroBreakdown(macro.key) : []

            return (
              <motion.div
                key={macro.key}
                layout
                onClick={() =>
                  setExpandedNutrient((prev) => (prev === macro.key ? null : macro.key))
                }
                style={{
                  background: isExpanded ? `${macro.color}08` : '#FFFFFF',
                  borderRadius: '10px',
                  padding: isExpanded ? '14px' : '12px 14px',
                  border: `1px solid ${isExpanded ? `${macro.color}30` : '#E4E7ED'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <motion.div layout style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: macro.color,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        marginBottom: '4px',
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 500, color: '#2D3436' }}>
                        {macro.label}
                      </span>
                      <span style={{ fontSize: '12px', color: '#909399' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: macro.color }}>
                          {macro.value.toFixed(1)}
                        </span>
                        <span> / {macro.target}g</span>
                      </span>
                    </div>
                    <div
                      style={{
                        height: '4px',
                        background: '#F2F6FC',
                        borderRadius: '2px',
                        overflow: 'hidden',
                      }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        style={{
                          height: '100%',
                          background: macro.color,
                          borderRadius: '2px',
                        }}
                      />
                    </div>
                  </div>
                </motion.div>

                <AnimatePresence>
                  {isExpanded && breakdown.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: '12px' }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {breakdown.map((item, idx) => {
                          const maxVal = breakdown[0]?.value || 1
                          const barWidth = (item.value / maxVal) * 100
                          return (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '11px',
                              }}
                            >
                              <span
                                style={{
                                  width: '60px',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  color: '#606266',
                                }}
                              >
                                {item.name}
                              </span>
                              <div
                                style={{
                                  flex: 1,
                                  height: '6px',
                                  background: '#F2F6FC',
                                  borderRadius: '3px',
                                  overflow: 'hidden',
                                }}
                              >
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${barWidth}%` }}
                                  transition={{ delay: 0.1 + idx * 0.05, duration: 0.4 }}
                                  style={{
                                    height: '100%',
                                    background: item.color,
                                    borderRadius: '3px',
                                    opacity: 0.7,
                                  }}
                                />
                              </div>
                              <span
                                style={{
                                  width: '40px',
                                  textAlign: 'right',
                                  color: macro.color,
                                  fontWeight: 500,
                                }}
                              >
                                {item.value.toFixed(1)}g
                              </span>
                            </motion.div>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>

      <div
        style={{
          padding: '14px 16px',
          background:
            'linear-gradient(135deg, rgba(74,144,217,0.08) 0%, rgba(39,174,96,0.08) 100%)',
          borderRadius: '10px',
          border: '1px solid rgba(74,144,217,0.15)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <span style={{ fontSize: '18px', flexShrink: 0 }}>💡</span>
          <div style={{ fontSize: '12px', color: '#606266', lineHeight: 1.6 }}>
            {suggestion}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NutritionPanel
