import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiPlus } from 'react-icons/fi'
import { FoodItem, CATEGORY_COLORS, CATEGORY_NAMES } from '../hooks/useFoodData'

interface FoodSearchProps {
  onSearch: (query: string) => FoodItem[]
  onSelect: (food: FoodItem, grams: number) => void
}

const FoodSearch = ({ onSearch, onSelect }: FoodSearchProps) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodItem[]>([])
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
  const [grams, setGrams] = useState<number>(100)
  const [showResults, setShowResults] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.trim()) {
      const res = onSearch(query)
      setResults(res)
      setShowResults(true)
    } else {
      setResults([])
      setShowResults(false)
    }
  }, [query, onSearch])

  const handleFoodSelect = (food: FoodItem) => {
    setSelectedFood(food)
    setQuery(food.name)
    setShowResults(false)
    setGrams(100)
  }

  const handleAdd = () => {
    if (selectedFood && grams > 0) {
      onSelect(selectedFood, grams)
      setSelectedFood(null)
      setQuery('')
      setGrams(100)
      setShowResults(false)
      inputRef.current?.focus()
    }
  }

  const estimatedCalories = selectedFood
    ? Math.round((selectedFood.per100g.calories * grams) / 100)
    : 0

  return (
    <div ref={containerRef} style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#2D3436' }}>
        添加食物记录
      </h2>

      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#FFFFFF',
            border: '1px solid #E4E7ED',
            borderRadius: '8px',
            padding: '10px 14px',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
        >
          <FiSearch style={{ color: '#909399', marginRight: '8px', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (selectedFood) setSelectedFood(null)
            }}
            onFocus={() => query.trim() && setShowResults(true)}
            placeholder="搜索食物名称或类别..."
            style={{
              flex: 1,
              border: 'none',
              fontSize: '14px',
              color: '#2D3436',
              background: 'transparent',
            }}
          />
        </div>

        <AnimatePresence>
          {showResults && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                right: 0,
                background: '#FFFFFF',
                border: '1px solid #E4E7ED',
                borderRadius: '8px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                maxHeight: '280px',
                overflowY: 'auto',
                zIndex: 100,
              }}
            >
              {results.map((food) => (
                <div
                  key={food.id}
                  onClick={() => handleFoodSelect(food)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    borderBottom: '1px solid #F2F6FC',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#F5F7FA')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '4px',
                        height: '24px',
                        borderRadius: '2px',
                        background: CATEGORY_COLORS[food.category],
                      }}
                    />
                    <div>
                      <div style={{ fontSize: '14px', color: '#2D3436', fontWeight: 500 }}>
                        {food.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#909399', marginTop: '2px' }}>
                        {CATEGORY_NAMES[food.category]}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#606266' }}>
                    {food.per100g.calories} kcal/100g
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {showResults && query.trim() && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              background: '#FFFFFF',
              border: '1px solid #E4E7ED',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              color: '#909399',
              fontSize: '13px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              zIndex: 100,
            }}
          >
            未找到相关食物
          </motion.div>
        )}
      </div>

      {selectedFood && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          style={{ marginBottom: '16px' }}
        >
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E4E7ED',
              borderRadius: '10px',
              padding: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '4px',
                    height: '28px',
                    borderRadius: '2px',
                    background: CATEGORY_COLORS[selectedFood.category],
                  }}
                />
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#2D3436' }}>
                    {selectedFood.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#909399', marginTop: '2px' }}>
                    {CATEGORY_NAMES[selectedFood.category]}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', color: '#606266', whiteSpace: 'nowrap' }}>
                份量(克):
              </label>
              <input
                type="number"
                value={grams}
                onChange={(e) => setGrams(Math.max(1, Number(e.target.value) || 0))}
                min={1}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #DCDFE6',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#2D3436',
                  transition: 'border-color 0.2s',
                }}
              />
              <div style={{ display: 'flex', gap: '6px' }}>
                {[50, 100, 150, 200].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGrams(g)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      background: grams === g ? '#4A90D9' : '#F2F6FC',
                      color: grams === g ? '#FFFFFF' : '#606266',
                      transition: 'all 0.15s',
                      fontWeight: grams === g ? 500 : 400,
                    }}
                  >
                    {g}g
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                padding: '12px',
                background: '#F5F7FA',
                borderRadius: '8px',
                marginBottom: '14px',
              }}
            >
              {[
                { label: '热量', value: estimatedCalories, unit: 'kcal', color: '#F39C12' },
                {
                  label: '蛋白质',
                  value: ((selectedFood.per100g.protein * grams) / 100).toFixed(1),
                  unit: 'g',
                  color: '#27AE60',
                },
                {
                  label: '脂肪',
                  value: ((selectedFood.per100g.fat * grams) / 100).toFixed(1),
                  unit: 'g',
                  color: '#E74C3C',
                },
                {
                  label: '碳水',
                  value: ((selectedFood.per100g.carbs * grams) / 100).toFixed(1),
                  unit: 'g',
                  color: '#3498DB',
                },
              ].map((item) => (
                <div key={item.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#909399', marginBottom: '4px' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: item.color }}>
                    {item.value}
                    <span style={{ fontSize: '11px', fontWeight: 400, marginLeft: '2px' }}>
                      {item.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleAdd}
              style={{
                width: '100%',
                padding: '11px',
                background: '#4A90D9',
                color: '#FFFFFF',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'filter 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(0.95)')}
              onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
            >
              <FiPlus size={16} />
              添加记录
            </motion.button>
          </div>
        </motion.div>
      )}

      {!selectedFood && (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: '#C0C4CC',
            fontSize: '13px',
            border: '1px dashed #DCDFE6',
            borderRadius: '10px',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>🍽️</div>
          搜索并选择食物开始记录
          <div style={{ fontSize: '11px', marginTop: '8px', color: '#D3D6DB' }}>
            例如：米饭、鸡胸肉、苹果...
          </div>
        </div>
      )}
    </div>
  )
}

export default FoodSearch
