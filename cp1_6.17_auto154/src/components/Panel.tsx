import React, { useState, useMemo } from 'react'
import {
  useStandStore,
  CATEGORIES,
  TIME_SLOTS,
  getRevenueColor,
  StandRecord,
} from '@/store/standStore'
import { ChevronDown, ChevronUp, Calendar, Tag, Clock, DollarSign, MapPin, Download, X } from 'lucide-react'

const Panel: React.FC = () => {
  const selectedLocation = useStandStore((s) => s.selectedLocation)
  const addRecord = useStandStore((s) => s.addRecord)
  const filterRecords = useStandStore((s) => s.filterRecords)
  const filteredRecords = useStandStore((s) => s.filteredRecords)
  const filters = useStandStore((s) => s.filters)
  const setShowStats = useStandStore((s) => s.setShowStats)
  const setSelectedLocation = useStandStore((s) => s.setSelectedLocation)

  const [timeSlot, setTimeSlot] = useState<'morning' | 'noon' | 'evening'>('morning')
  const [categories, setCategories] = useState<string[]>([])
  const [revenue, setRevenue] = useState<string>('')
  const [historyExpanded, setHistoryExpanded] = useState(true)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [filterCategoryDropdown, setFilterCategoryDropdown] = useState(false)

  const handleCategoryToggle = (category: string) => {
    setCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category)
      }
      if (prev.length >= 3) {
        return prev
      }
      return [...prev, category]
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLocation) return

    const revenueNum = parseFloat(revenue)
    if (isNaN(revenueNum) || revenueNum <= 0) return
    if (categories.length === 0) return

    await addRecord({
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
      address: selectedLocation.address,
      timeSlot,
      categories,
      revenue: revenueNum,
    })

    setCategories([])
    setRevenue('')
    setTimeSlot('morning')
  }

  const displayRecords = useMemo(() => {
    return filteredRecords.slice(0, 20)
  }, [filteredRecords])

  const handleDateFilterChange = (type: 'start' | 'end', value: string) => {
    const currentRange = filters.dateRange || [null, null]
    const newRange: [string, string] = [
      type === 'start' ? value : currentRange[0] || '',
      type === 'end' ? value : currentRange[1] || '',
    ]
    if (newRange[0] && newRange[1]) {
      filterRecords({ dateRange: newRange })
    } else {
      filterRecords({ dateRange: null })
    }
  }

  const handleFilterCategoryToggle = (category: string) => {
    const current = filters.categories
    const updated = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category]
    filterRecords({ categories: updated })
  }

  const handleTimeSlotFilter = (slot: string | null) => {
    filterRecords({ timeSlot: slot })
  }

  const clearFilters = () => {
    filterRecords({
      dateRange: null,
      categories: [],
      timeSlot: null,
    })
  }

  const timeSlotLabel = (slot: string) => {
    return TIME_SLOTS[slot as keyof typeof TIME_SLOTS]?.label || slot
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN')
  }

  const hasActiveFilters =
    filters.dateRange || filters.categories.length > 0 || filters.timeSlot

  return (
    <div
      className="panel-container flex flex-col h-full overflow-hidden"
      style={{
        width: '100%',
        backgroundColor: '#FAF8F5',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #BDC3C7;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #95A5A6;
        }
        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          z-index: 50;
          max-height: 200px;
          overflow-y: auto;
        }
        .dropdown-item {
          padding: 8px 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.15s;
        }
        .dropdown-item:hover {
          background: #F4F6F7;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>

      <div className="p-4 border-b" style={{ borderColor: '#E5E7EB' }}>
        <h1 className="text-xl font-bold" style={{ color: '#2C3E50' }}>
          摊位管理系统
        </h1>
        <p className="text-sm mt-1" style={{ color: '#7F8C8D' }}>
          记录摆摊数据，智能预测客流
        </p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#2C3E50' }}>
              <MapPin size={16} className="inline mr-2" />
              位置信息
            </label>
            {selectedLocation ? (
              <div
                className="p-3 rounded-lg relative"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedLocation(null)}
                  className="absolute top-2 right-2 p-1 rounded hover:bg-gray-100"
                  style={{ color: '#95A5A6' }}
                >
                  <X size={14} />
                </button>
                <p className="text-sm pr-6" style={{ color: '#34495E' }}>
                  {selectedLocation.address}
                </p>
                <p className="text-xs mt-1" style={{ color: '#95A5A6' }}>
                  {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </p>
              </div>
            ) : (
              <div
                className="p-4 rounded-lg text-center border-2 border-dashed"
                style={{ borderColor: '#D5D8DC', color: '#95A5A6' }}
              >
                <p className="text-sm">请在右侧地图上点击选择位置</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#2C3E50' }}>
              <Clock size={16} className="inline mr-2" />
              时段
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(TIME_SLOTS).map(([key, { label }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTimeSlot(key as 'morning' | 'noon' | 'evening')}
                  className="py-2 px-2 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{
                    backgroundColor: timeSlot === key ? '#E67E22' : '#FFFFFF',
                    color: timeSlot === key ? '#FFFFFF' : '#5D6D7E',
                    border: `1px solid ${timeSlot === key ? '#E67E22' : '#E5E7EB'}`,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium mb-2" style={{ color: '#2C3E50' }}>
              <Tag size={16} className="inline mr-2" />
              销售品类（最多3个）
            </label>
            <button
              type="button"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="w-full p-3 rounded-lg text-left flex items-center justify-between"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                color: categories.length > 0 ? '#2C3E50' : '#95A5A6',
              }}
            >
              <span className="text-sm">
                {categories.length > 0 ? categories.join(', ') : '请选择品类'}
              </span>
              <ChevronDown size={16} style={{ color: '#95A5A6' }} />
            </button>
            {showCategoryDropdown && (
              <div className="dropdown-menu">
                {CATEGORIES.map((category) => (
                  <div
                    key={category}
                    className="dropdown-item"
                    onClick={() => handleCategoryToggle(category)}
                  >
                    <input
                      type="checkbox"
                      checked={categories.includes(category)}
                      onChange={() => {}}
                      className="rounded"
                      style={{ accentColor: '#E67E22' }}
                    />
                    <span className="text-sm" style={{ color: '#34495E' }}>
                      {category}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#2C3E50' }}>
              <DollarSign size={16} className="inline mr-2" />
              当日收入（元）
            </label>
            <input
              type="number"
              value={revenue}
              onChange={(e) => setRevenue(e.target.value)}
              min="0.01"
              step="0.01"
              required
              placeholder="请输入收入金额"
              className="w-full p-3 rounded-lg text-sm"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                color: '#2C3E50',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!selectedLocation || categories.length === 0 || !revenue || parseFloat(revenue) <= 0}
            className="w-full py-3 rounded-lg font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            style={{
              backgroundColor: '#E67E22',
              color: '#FFFFFF',
            }}
          >
            提交记录
          </button>
        </form>

        <div className="mt-6 pt-4 border-t" style={{ borderColor: '#E5E7EB' }}>
          <button
            onClick={() => setShowStats(true)}
            className="w-full py-3 rounded-lg font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center gap-2"
            style={{
              backgroundColor: '#2C3E50',
              color: '#FFFFFF',
            }}
          >
            <Download size={18} />
            导出报表（30天）
          </button>
        </div>

        <div className="mt-6 pt-4 border-t" style={{ borderColor: '#E5E7EB' }}>
          <h3 className="font-medium mb-3" style={{ color: '#2C3E50' }}>
            <Calendar size={16} className="inline mr-2" />
            筛选条件
          </h3>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs mb-1" style={{ color: '#7F8C8D' }}>
                  开始日期
                </label>
                <input
                  type="date"
                  value={filters.dateRange?.[0] || ''}
                  onChange={(e) => handleDateFilterChange('start', e.target.value)}
                  className="w-full p-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    color: '#2C3E50',
                  }}
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: '#7F8C8D' }}>
                  结束日期
                </label>
                <input
                  type="date"
                  value={filters.dateRange?.[1] || ''}
                  onChange={(e) => handleDateFilterChange('end', e.target.value)}
                  className="w-full p-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    color: '#2C3E50',
                  }}
                />
              </div>
            </div>

            <div className="relative">
              <label className="block text-xs mb-1" style={{ color: '#7F8C8D' }}>
                品类筛选
              </label>
              <button
                type="button"
                onClick={() => setFilterCategoryDropdown(!filterCategoryDropdown)}
                className="w-full p-2 rounded-lg text-left flex items-center justify-between text-sm"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  color: filters.categories.length > 0 ? '#2C3E50' : '#95A5A6',
                }}
              >
                <span>
                  {filters.categories.length > 0
                    ? `${filters.categories.length}个品类`
                    : '全部品类'}
                </span>
                <ChevronDown size={14} style={{ color: '#95A5A6' }} />
              </button>
              {filterCategoryDropdown && (
                <div className="dropdown-menu">
                  {CATEGORIES.map((category) => (
                    <div
                      key={category}
                      className="dropdown-item"
                      onClick={() => handleFilterCategoryToggle(category)}
                    >
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(category)}
                        onChange={() => {}}
                        className="rounded"
                        style={{ accentColor: '#E67E22' }}
                      />
                      <span className="text-sm" style={{ color: '#34495E' }}>
                        {category}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs mb-1" style={{ color: '#7F8C8D' }}>
                时段筛选
              </label>
              <div className="grid grid-cols-4 gap-1">
                <button
                  type="button"
                  onClick={() => handleTimeSlotFilter(null)}
                  className="py-1.5 px-1 rounded text-xs transition-all"
                  style={{
                    backgroundColor: !filters.timeSlot ? '#2C3E50' : '#FFFFFF',
                    color: !filters.timeSlot ? '#FFFFFF' : '#5D6D7E',
                    border: `1px solid ${!filters.timeSlot ? '#2C3E50' : '#E5E7EB'}`,
                  }}
                >
                  全部
                </button>
                {Object.entries(TIME_SLOTS).map(([key, { label }]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleTimeSlotFilter(key)}
                    className="py-1.5 px-1 rounded text-xs transition-all"
                    style={{
                      backgroundColor: filters.timeSlot === key ? '#2C3E50' : '#FFFFFF',
                      color: filters.timeSlot === key ? '#FFFFFF' : '#5D6D7E',
                      border: `1px solid ${filters.timeSlot === key ? '#2C3E50' : '#E5E7EB'}`,
                    }}
                  >
                    {label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="w-full py-2 rounded-lg text-sm transition-all hover:bg-gray-100"
                style={{
                  color: '#E74C3C',
                  border: '1px solid #E74C3C',
                }}
              >
                清除筛选
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t" style={{ borderColor: '#E5E7EB' }}>
          <button
            onClick={() => setHistoryExpanded(!historyExpanded)}
            className="w-full flex items-center justify-between text-left"
          >
            <h3 className="font-medium" style={{ color: '#2C3E50' }}>
              历史记录（{filteredRecords.length}条）
            </h3>
            {historyExpanded ? (
              <ChevronUp size={18} style={{ color: '#95A5A6' }} />
            ) : (
              <ChevronDown size={18} style={{ color: '#95A5A6' }} />
            )}
          </button>

          {historyExpanded && (
            <div className="mt-3 space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
              {displayRecords.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: '#95A5A6' }}>
                  暂无记录
                </p>
              ) : (
                displayRecords.map((record) => (
                  <HistoryRow key={record.id} record={record} />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface HistoryRowProps {
  record: StandRecord
}

const HistoryRow: React.FC<HistoryRowProps> = ({ record }) => {
  const timeSlotLabel = (slot: string) => {
    return TIME_SLOTS[slot as keyof typeof TIME_SLOTS]?.label || slot
  }

  return (
    <div
      className="p-3 rounded-lg transition-all hover:shadow-md"
      style={{ backgroundColor: '#FFFFFF' }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium" style={{ color: '#2C3E50' }}>
          {new Date(record.createdAt).toLocaleDateString('zh-CN')}
        </span>
        <span
          className="text-sm font-bold"
          style={{ color: getRevenueColor(record.revenue) }}
        >
          ¥{record.revenue}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs" style={{ color: '#7F8C8D' }}>
        <span
          className="px-2 py-0.5 rounded-full"
          style={{ backgroundColor: '#F4F6F7' }}
        >
          {timeSlotLabel(record.timeSlot)}
        </span>
        <span className="truncate">
          {record.categories.join(', ')}
        </span>
      </div>
    </div>
  )
}

export default Panel
