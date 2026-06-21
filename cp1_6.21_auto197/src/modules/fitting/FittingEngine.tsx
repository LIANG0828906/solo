import React, { useState, useMemo } from 'react'
import { useApp, MeasurementInput } from '../../context/AppContext'

type MeasurementKey = keyof MeasurementInput

const measurementFields: { key: MeasurementKey; label: string }[] = [
  { key: 'chest', label: '胸围' },
  { key: 'waist', label: '腰围' },
  { key: 'hip', label: '臀围' },
  { key: 'length', label: '衣长' },
  { key: 'shoulder', label: '肩宽' },
  { key: 'sleeveLength', label: '袖长' },
]

const emptyMeasurements: MeasurementInput = {
  chest: 0,
  waist: 0,
  hip: 0,
  length: 0,
  shoulder: 0,
  sleeveLength: 0,
}

function isValidMeasurement(value: number): boolean {
  return !isNaN(value) && value >= 0 && value <= 200
}

export default function FittingEngine() {
  const {
    sizeCharts,
    selectedChartId,
    isLoading,
    setCurrentMeasurements,
    setSelectedChartId,
    setCurrentResult,
    setIsLoading,
    showToast,
  } = useApp()

  const [productName, setProductName] = useState('')
  const [localMeasurements, setLocalMeasurements] = useState<MeasurementInput>(emptyMeasurements)
  const [touched, setTouched] = useState<Record<MeasurementKey, boolean>>({
    chest: false,
    waist: false,
    hip: false,
    length: false,
    shoulder: false,
    sleeveLength: false,
  })

  const fieldErrors = useMemo(() => {
    const errors: Partial<Record<MeasurementKey, boolean>> = {}
    for (const { key } of measurementFields) {
      if (touched[key] && !isValidMeasurement(localMeasurements[key])) {
        errors[key] = true
      }
    }
    return errors
  }, [localMeasurements, touched])

  const hasEmptyField = useMemo(
    () => measurementFields.some(({ key }) => localMeasurements[key] === 0 && !touched[key]),
    [localMeasurements, touched]
  )

  const hasAnyError = Object.values(fieldErrors).some(Boolean)
  const isButtonDisabled = isLoading || hasAnyError || hasEmptyField

  const handleFieldChange = (key: MeasurementKey, raw: string) => {
    const value = raw === '' ? 0 : Number(raw)
    setLocalMeasurements((prev) => ({ ...prev, [key]: value }))
    setTouched((prev) => ({ ...prev, [key]: true }))
  }

  const handleCalculate = async () => {
    setCurrentMeasurements(localMeasurements)
    setIsLoading(true)
    try {
      const res = await fetch('/api/products/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          measurements: localMeasurements,
          chartId: selectedChartId,
        }),
      })
      if (!res.ok) {
        const errBody = await res.json().catch(() => null)
        throw new Error(errBody?.message || '推算请求失败')
      }
      const data = await res.json()
      setCurrentResult({
        ...data,
        measurements: localMeasurements,
      })
    } catch (err) {
      showToast(err instanceof Error ? err.message : '推算失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fitting-engine">
      <h2 style={{ margin: '0 0 24px' }}>尺码推算</h2>

      <div className="card" style={{ width: '100%', maxWidth: 600 }}>
        <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#64748B' }}>
          商品名称
        </label>
        <input
          className="input-field"
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="输入商品名称（可选）"
          style={{ marginBottom: 20 }}
        />

        <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#64748B' }}>
          尺码对照表
        </label>
        <select
          className="input-field"
          value={selectedChartId}
          onChange={(e) => setSelectedChartId(e.target.value)}
          style={{ marginBottom: 20 }}
        >
          <option value="" disabled>
            请选择尺码表
          </option>
          {sizeCharts.map((chart) => (
            <option key={chart.id} value={chart.id}>
              {chart.brand}
            </option>
          ))}
        </select>

        <div className="fitting-engine__fields">
          {measurementFields.map(({ key, label }) => (
            <div className="fitting-engine__field" key={key}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#64748B' }}>
                {label}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  className={`input-field${fieldErrors[key] ? ' input-field--error' : ''}`}
                  type="number"
                  min={0}
                  max={200}
                  step={0.1}
                  value={localMeasurements[key] || ''}
                  onChange={(e) => handleFieldChange(key, e.target.value)}
                  placeholder="0"
                />
                <span style={{ fontSize: 13, color: '#94A3B8', whiteSpace: 'nowrap' }}>cm</span>
              </div>
              {fieldErrors[key] && (
                <span style={{ fontSize: 12, color: '#EF4444', marginTop: 2, display: 'block' }}>
                  请输入0-200之间的数值
                </span>
              )}
            </div>
          ))}
        </div>

        <button
          className="btn btn-primary"
          disabled={isButtonDisabled}
          onClick={handleCalculate}
          style={{ marginTop: 20, width: '100%' }}
        >
          {isLoading ? <span className="spinner" /> : '推算尺码'}
        </button>
      </div>

      <style>{`
        .fitting-engine__fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 767px) {
          .fitting-engine__fields {
            grid-template-columns: 1fr;
          }
        }
        .spinner {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          vertical-align: middle;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
