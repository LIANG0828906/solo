import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiEdit2, FiTrash2, FiX } from 'react-icons/fi'
import {
  FoodRecord,
  CATEGORY_COLORS,
  CATEGORY_NAMES,
  FOOD_LIBRARY,
} from '../hooks/useFoodData'

interface TimelineProps {
  records: FoodRecord[]
  onEdit: (recordId: string, newGrams: number) => void
  onDelete: (recordId: string) => void
}

interface GroupedRecords {
  dateLabel: string
  dateKey: string
  records: FoodRecord[]
}

const formatTime = (timestamp: number) => {
  const d = new Date(timestamp)
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

const formatDateLabel = (date: Date): string => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today.getTime() - 86400000)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)

  if (target.getTime() === today.getTime()) return '今天'
  if (target.getTime() === yesterday.getTime()) return '昨天'

  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${month}月${day}日 ${weekdays[date.getDay()]}`
}

const Timeline = ({ records, onEdit, onDelete }: TimelineProps) => {
  const [editingRecord, setEditingRecord] = useState<FoodRecord | null>(null)
  const [editGrams, setEditGrams] = useState<number>(0)

  const groupedRecords = useMemo<GroupedRecords[]>(() => {
    const groupsMap = new Map<string, GroupedRecords>()

    records.forEach((record) => {
      const date = new Date(record.timestamp)
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

      if (!groupsMap.has(dateKey)) {
        groupsMap.set(dateKey, {
          dateLabel: formatDateLabel(date),
          dateKey,
          records: [],
        })
      }
      groupsMap.get(dateKey)!.records.push(record)
    })

    return Array.from(groupsMap.values()).sort((a, b) => {
      const [ay, am, ad] = a.dateKey.split('-').map(Number)
      const [by, bm, bd] = b.dateKey.split('-').map(Number)
      return new Date(by, bm, bd).getTime() - new Date(ay, am, ad).getTime()
    })
  }, [records])

  const handleOpenEdit = (record: FoodRecord) => {
    setEditingRecord(record)
    setEditGrams(record.grams)
  }

  const handleConfirmEdit = () => {
    if (editingRecord && editGrams > 0) {
      onEdit(editingRecord.id, editGrams)
      setEditingRecord(null)
    }
  }

  const recalcNutrition = (foodId: string, grams: number) => {
    const food = FOOD_LIBRARY.find((f) => f.id === foodId)!
    return {
      calories: Math.round((food.per100g.calories * grams) / 100),
      protein: ((food.per100g.protein * grams) / 100).toFixed(1),
      fat: ((food.per100g.fat * grams) / 100).toFixed(1),
      carbs: ((food.per100g.carbs * grams) / 100).toFixed(1),
    }
  }

  const previewNutrition =
    editingRecord && editGrams > 0
      ? recalcNutrition(editingRecord.foodId, editGrams)
      : null

  const groupTotalCalories = (groupRecords: FoodRecord[]) => {
    return Math.round(groupRecords.reduce((sum, r) => sum + r.nutrition.calories, 0))
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#2D3436', marginBottom: '4px' }}>
          饮食记录时间线
        </h2>
        <p style={{ fontSize: '12px', color: '#909399' }}>
          共 {records.length} 条记录 · 按日期倒序排列
        </p>
      </div>

      {groupedRecords.length === 0 ? (
        <div
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: '#C0C4CC',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>暂无饮食记录</div>
          <div style={{ fontSize: '12px', color: '#D3D6DB' }}>
            在左侧搜索框添加您的第一条记录吧
          </div>
        </div>
      ) : (
        groupedRecords.map((group, groupIdx) => (
          <motion.div
            key={group.dateKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIdx * 0.05 }}
            style={{ marginBottom: '28px' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #4A90D9 0%, #3A7BC8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  {group.dateLabel === '今天' ? '今' : group.dateLabel === '昨天' ? '昨' : '📅'}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#2D3436' }}>
                    {group.dateLabel}
                  </div>
                  <div style={{ fontSize: '11px', color: '#909399' }}>
                    {group.records.length} 条记录
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#F39C12',
                  background: 'rgba(243, 156, 18, 0.1)',
                  padding: '4px 12px',
                  borderRadius: '12px',
                }}
              >
                {groupTotalCalories(group.records)} kcal
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, 240px)',
                gap: '14px',
              }}
            >
              {group.records.map((record, recordIdx) => (
                <motion.div
                  key={record.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{
                    delay: recordIdx * 0.03,
                    type: 'spring',
                    stiffness: 400,
                    damping: 25,
                  }}
                  whileHover={{
                    y: -4,
                    transition: { duration: 0.2 },
                  }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: '240px',
                    height: '120px',
                    borderRadius: '10px',
                    background: '#FFFFFF',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    transition: 'box-shadow 0.2s',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      '0 8px 24px rgba(0,0,0,0.12)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow =
                      '0 2px 8px rgba(0,0,0,0.06)'
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '2px',
                      background: CATEGORY_COLORS[record.category],
                    }}
                  />

                  <div style={{ padding: '12px 14px 12px 16px', height: '100%', position: 'relative' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '8px',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#2D3436',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {record.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: `${CATEGORY_COLORS[record.category]}15`,
                              color: CATEGORY_COLORS[record.category],
                              fontWeight: 500,
                            }}
                          >
                            {CATEGORY_NAMES[record.category]}
                          </span>
                          <span style={{ fontSize: '10px', color: '#909399' }}>
                            {formatTime(record.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '4px',
                        marginBottom: '8px',
                      }}
                    >
                      <span style={{ fontSize: '18px', fontWeight: 700, color: '#F39C12' }}>
                        {Math.round(record.nutrition.calories)}
                      </span>
                      <span style={{ fontSize: '11px', color: '#909399' }}>kcal</span>
                      <span style={{ fontSize: '11px', color: '#C0C4CC', marginLeft: 'auto' }}>
                        {record.grams}g
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        fontSize: '10px',
                        color: '#909399',
                      }}
                    >
                      <span style={{ color: '#27AE60' }}>
                        蛋白 {record.nutrition.protein.toFixed(1)}g
                      </span>
                      <span style={{ color: '#E74C3C' }}>
                        脂肪 {record.nutrition.fat.toFixed(1)}g
                      </span>
                      <span style={{ color: '#3498DB' }}>
                        碳水 {record.nutrition.carbs.toFixed(1)}g
                      </span>
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        right: '10px',
                        bottom: '10px',
                        display: 'flex',
                        gap: '4px',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                      }}
                      className="card-actions"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenEdit(record)
                        }}
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '6px',
                          background: '#F2F6FC',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#606266',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#4A90D9'
                          e.currentTarget.style.color = '#FFFFFF'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#F2F6FC'
                          e.currentTarget.style.color = '#606266'
                        }}
                      >
                        <FiEdit2 size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(record.id)
                        }}
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '6px',
                          background: '#F2F6FC',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#606266',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#E74C3C'
                          e.currentTarget.style.color = '#FFFFFF'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#F2F6FC'
                          e.currentTarget.style.color = '#606266'
                        }}
                      >
                        <FiTrash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <style>{`
                    div[style*="position: relative"]:hover .card-actions {
                      opacity: 1 !important;
                    }
                  `}</style>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))
      )}

      <AnimatePresence>
        {editingRecord && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setEditingRecord(null)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(8px)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, type: 'spring', stiffness: 400, damping: 30 }}
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '400px',
                height: 'auto',
                background: '#FFFFFF',
                borderRadius: '12px',
                zIndex: 1001,
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '18px 20px',
                  borderBottom: '1px solid #F2F6FC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '4px',
                      height: '24px',
                      borderRadius: '2px',
                      background: CATEGORY_COLORS[editingRecord.category],
                    }}
                  />
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#2D3436' }}>
                    编辑记录
                  </h3>
                </div>
                <button
                  onClick={() => setEditingRecord(null)}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#909399',
                    background: 'transparent',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F2F6FC'
                    e.currentTarget.style.color = '#2D3436'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#909399'
                  }}
                >
                  <FiX size={16} />
                </button>
              </div>

              <div style={{ padding: '20px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: '#F5F7FA',
                    borderRadius: '8px',
                    marginBottom: '18px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#2D3436' }}>
                      {editingRecord.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#909399', marginTop: '2px' }}>
                      {CATEGORY_NAMES[editingRecord.category]} · {formatTime(editingRecord.timestamp)}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      color: '#606266',
                      marginBottom: '8px',
                      fontWeight: 500,
                    }}
                  >
                    修改份量（克）
                  </label>
                  <input
                    type="number"
                    value={editGrams}
                    onChange={(e) => setEditGrams(Math.max(1, Number(e.target.value) || 0))}
                    min={1}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #DCDFE6',
                      borderRadius: '8px',
                      fontSize: '15px',
                      color: '#2D3436',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    {[50, 100, 150, 200, 300].map((g) => (
                      <button
                        key={g}
                        onClick={() => setEditGrams(g)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          background: editGrams === g ? '#4A90D9' : '#F2F6FC',
                          color: editGrams === g ? '#FFFFFF' : '#606266',
                          transition: 'all 0.15s',
                          fontWeight: editGrams === g ? 500 : 400,
                        }}
                      >
                        {g}g
                      </button>
                    ))}
                  </div>
                </div>

                {previewNutrition && (
                  <div
                    style={{
                      padding: '14px',
                      background: 'linear-gradient(135deg, rgba(74,144,217,0.05) 0%, rgba(243,156,18,0.05) 100%)',
                      borderRadius: '8px',
                      marginBottom: '20px',
                    }}
                  >
                    <div style={{ fontSize: '12px', color: '#909399', marginBottom: '10px' }}>
                      营养预览
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '8px',
                        textAlign: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '11px', color: '#909399', marginBottom: '2px' }}>热量</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#F39C12' }}>
                          {previewNutrition.calories}
                          <span style={{ fontSize: '10px', fontWeight: 400 }}>kcal</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#909399', marginBottom: '2px' }}>蛋白</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#27AE60' }}>
                          {previewNutrition.protein}
                          <span style={{ fontSize: '10px', fontWeight: 400 }}>g</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#909399', marginBottom: '2px' }}>脂肪</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#E74C3C' }}>
                          {previewNutrition.fat}
                          <span style={{ fontSize: '10px', fontWeight: 400 }}>g</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#909399', marginBottom: '2px' }}>碳水</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#3498DB' }}>
                          {previewNutrition.carbs}
                          <span style={{ fontSize: '10px', fontWeight: 400 }}>g</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setEditingRecord(null)}
                    style={{
                      flex: 1,
                      padding: '11px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      background: '#F2F6FC',
                      color: '#606266',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(0.97)')}
                    onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
                  >
                    取消
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConfirmEdit}
                    style={{
                      flex: 1,
                      padding: '11px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      background: '#4A90D9',
                      color: '#FFFFFF',
                      transition: 'filter 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(0.95)')}
                    onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
                  >
                    确认修改
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Timeline
