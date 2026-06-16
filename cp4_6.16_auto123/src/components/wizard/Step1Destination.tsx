import React, { useState, useCallback, useMemo } from 'react'

interface Step1DestinationProps {
  destination: string
  startDate: string
  endDate: string
  onDestinationChange: (value: string) => void
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  onCalendarImport: () => void
}

interface FormErrors {
  destination?: string
  startDate?: string
  endDate?: string
}

const Step1Destination: React.FC<Step1DestinationProps> = React.memo(({
  destination,
  startDate,
  endDate,
  onDestinationChange,
  onStartDateChange,
  onEndDateChange,
  onCalendarImport
}) => {
  const [errors, setErrors] = useState<FormErrors>({})
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {}
    
    if (!destination.trim()) {
      newErrors.destination = '请输入目的地'
    }
    
    if (!startDate) {
      newErrors.startDate = '请选择出发日期'
    }
    
    if (!endDate) {
      newErrors.endDate = '请选择返回日期'
    }
    
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      newErrors.endDate = '返回日期不能早于出发日期'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [destination, startDate, endDate])

  const handleDestinationBlur = useCallback(() => {
    validate()
  }, [validate])

  const handleDateChange = useCallback((field: 'startDate' | 'endDate', value: string) => {
    if (field === 'startDate') {
      onStartDateChange(value)
    } else {
      onEndDateChange(value)
    }
    validate()
  }, [onStartDateChange, onEndDateChange, validate])

  const handleCalendarImport = useCallback(() => {
    onCalendarImport()
  }, [onCalendarImport])

  const toggleCalendar = useCallback(() => {
    setIsCalendarOpen(prev => !prev)
  }, [])

  const minDate = useMemo(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }, [])

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">计划你的旅行</h2>
        <p className="text-[var(--text-secondary)]">告诉我们你要去哪里，什么时候出发</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
            📍 目的地
          </label>
          <input
            type="text"
            value={destination}
            onChange={(e) => onDestinationChange(e.target.value)}
            onBlur={handleDestinationBlur}
            placeholder="例如：三亚、北京、东京..."
            className={`w-full px-4 py-3 border-2 rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none transition-all duration-200 ${
              errors.destination 
                ? 'border-red-400 focus:border-red-500' 
                : 'border-[var(--card-border)] focus:border-[var(--accent-blue)]'
            }`}
          />
          {errors.destination && (
            <p className="mt-1 text-sm text-red-500">{errors.destination}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
              📅 出发日期
            </label>
            <input
              type="date"
              value={startDate}
              min={minDate}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              onClick={toggleCalendar}
              className={`w-full px-4 py-3 border-2 rounded-xl text-[var(--text-primary)] focus:outline-none transition-all duration-200 ${
                errors.startDate 
                  ? 'border-red-400 focus:border-red-500' 
                  : 'border-[var(--card-border)] focus:border-[var(--accent-blue)]'
              }`}
            />
            {errors.startDate && (
              <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
              📅 返回日期
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate || minDate}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              onClick={toggleCalendar}
              className={`w-full px-4 py-3 border-2 rounded-xl text-[var(--text-primary)] focus:outline-none transition-all duration-200 ${
                errors.endDate 
                  ? 'border-red-400 focus:border-red-500' 
                  : 'border-[var(--card-border)] focus:border-[var(--accent-blue)]'
              }`}
            />
            {errors.endDate && (
              <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>
            )}
          </div>
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isCalendarOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="p-4 bg-[var(--bg-primary)] rounded-xl mt-2">
            <p className="text-sm text-[var(--text-secondary)] text-center">
              💡 选择日期后，我们会根据目的地天气为你推荐合适的行李
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCalendarImport}
          className="w-full py-3 px-4 border-2 border-dashed border-[var(--card-border)] rounded-xl text-[var(--text-secondary)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/5 transition-all duration-200 font-medium flex items-center justify-center gap-2"
        >
          <span>📅</span>
          从 Google Calendar 导入行程
        </button>
      </div>
    </div>
  )
})

Step1Destination.displayName = 'Step1Destination'

export default Step1Destination
