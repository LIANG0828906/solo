import React, { useState } from 'react'
import { useApp, RecommendationResult, BatchItem } from '../../context/AppContext'
import { jsPDF } from 'jspdf'
import { v4 as uuidv4 } from 'uuid'

type ProductNameSource = {
  productName?: string
}

function getFitColor(score: number): string {
  if (score < 50) return '#EF4444'
  if (score <= 80) return '#F59E0B'
  return '#10B981'
}

function getFitClass(score: number): string {
  if (score < 50) return 'progress-bar-fill--low'
  if (score <= 80) return 'progress-bar-fill--mid'
  return 'progress-bar-fill--high'
}

const pdfLabels: Record<string, string> = {
  title: 'Size Recommendation Report',
  product: 'Product',
  recommendedSize: 'Recommended Size',
  fitScore: 'Fit Score',
  allScores: 'All Size Scores',
  measurements: 'Measurements',
  chartBrand: 'Chart Brand',
  chest: 'Chest',
  waist: 'Waist',
  hip: 'Hip',
  length: 'Length',
  shoulder: 'Shoulder',
  sleeveLength: 'Sleeve Length',
}

function buildPdf(batchItems: BatchItem[]): jsPDF {
  const doc = new jsPDF()

  batchItems.forEach((item, index) => {
    if (index > 0) doc.addPage()

    const r = item.result
    let y = 20

    doc.setFontSize(18)
    doc.text(pdfLabels.title, 20, y)
    y += 14

    doc.setFontSize(12)
    doc.text(`${pdfLabels.product}: ${item.productName}`, 20, y)
    y += 10

    doc.text(`${pdfLabels.recommendedSize}: ${r.recommendedSize}`, 20, y)
    y += 10

    doc.text(`${pdfLabels.fitScore}: ${r.fitScore.toFixed(1)}%`, 20, y)
    y += 14

    doc.setFontSize(14)
    doc.text(pdfLabels.allScores, 20, y)
    y += 10

    doc.setFontSize(11)
    Object.entries(r.allScores).forEach(([size, score]) => {
      doc.text(`  ${size}: ${score.toFixed(1)}%`, 20, y)
      y += 8
    })
    y += 6

    doc.setFontSize(14)
    doc.text(pdfLabels.measurements, 20, y)
    y += 10

    doc.setFontSize(11)
    const m = r.measurements
    const measurementEntries: [string, number][] = [
      [pdfLabels.chest, m.chest],
      [pdfLabels.waist, m.waist],
      [pdfLabels.hip, m.hip],
      [pdfLabels.length, m.length],
      [pdfLabels.shoulder, m.shoulder],
      [pdfLabels.sleeveLength, m.sleeveLength],
    ]
    measurementEntries.forEach(([label, val]) => {
      doc.text(`  ${label}: ${val}`, 20, y)
      y += 8
    })
    y += 6

    doc.setFontSize(14)
    doc.text(`${pdfLabels.chartBrand}: ${r.chartBrand}`, 20, y)
  })

  return doc
}

export default function ResultDisplay() {
  const {
    currentResult,
    batchItems,
    isLoading,
    setBatchItems,
    setIsLoading,
    showToast,
  } = useApp()

  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())

  const handleAddToBatch = () => {
    if (!currentResult) return
    const productName = (currentResult as RecommendationResult & ProductNameSource).productName ?? currentResult.chartBrand
    const id = uuidv4()
    const item: BatchItem = { id, productName, result: currentResult }
    setBatchItems((prev) => [...prev, item])
    setAddedIds((prev) => {
      const next = new Set(prev)
      next.add(currentResult.chartId)
      return next
    })
    showToast('已添加至批次')
  }

  const handleRemoveFromBatch = (id: string) => {
    setBatchItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleExportPdf = async () => {
    if (batchItems.length === 0) return
    setIsLoading(true)
    try {
      const doc = buildPdf(batchItems)
      doc.save('尺码推荐报告.pdf')
      showToast('PDF导出成功')
    } catch {
      showToast('PDF导出失败')
    } finally {
      setIsLoading(false)
    }
  }

  if (!currentResult) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0', color: '#94A3B8' }}>
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>&#128203;</div>
        <p style={{ fontSize: 15, margin: 0 }}>暂无推荐结果，请先进行尺码推算</p>
      </div>
    )
  }

  const r = currentResult
  const productName = (r as RecommendationResult & ProductNameSource).productName ?? r.chartBrand
  const isAdded = addedIds.has(r.chartId)

  return (
    <div>
      <div className="result-card card card-animate" style={{ width: 320 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 16, color: '#334155' }}>{productName}</h3>

        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <div style={{ fontSize: 48, fontWeight: 800, color: '#1E293B', lineHeight: 1.1 }}>
            {r.recommendedSize}
          </div>
          <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>推荐尺码</div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: '#64748B' }}>合身度</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: getFitColor(r.fitScore) }}>
              {r.fitScore.toFixed(1)}%
            </span>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-bar-fill ${getFitClass(r.fitScore)}`}
              style={{ width: `${r.fitScore}%` }}
            />
          </div>
        </div>

        {r.fitScore < 70 && (
          <div
            style={{
              background: '#FFF7ED',
              border: '1px solid #FDBA74',
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 16,
              fontSize: 13,
              color: '#C2410C',
            }}
          >
            合身度较低，建议尝试相邻尺码
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 8 }}>各尺码评分</div>
          {Object.entries(r.allScores).map(([size, score]) => (
            <div
              key={size}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 0',
                borderBottom: '1px solid #F1F5F9',
                fontSize: 13,
              }}
            >
              <span style={{ color: '#334155', fontWeight: size === r.recommendedSize ? 700 : 400 }}>
                {size}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 140px' }}>
                <div className="progress-bar" style={{ flex: 1, height: 6 }}>
                  <div
                    className={`progress-bar-fill ${getFitClass(score)}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <span style={{ color: getFitColor(score), fontWeight: 600, minWidth: 40, textAlign: 'right' }}>
                  {score.toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>

        <button
          className="btn btn-secondary"
          style={{ width: '100%' }}
          onClick={handleAddToBatch}
          disabled={isAdded}
        >
          {isAdded ? '✓ 已添加' : '添加至批次'}
        </button>
      </div>

      <div style={{ marginTop: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, color: '#334155' }}>
            批次列表 ({batchItems.length})
          </h3>
          <button
            className="btn btn-primary"
            style={{ fontSize: 13, padding: '8px 16px' }}
            disabled={batchItems.length === 0 || isLoading}
            onClick={handleExportPdf}
          >
            {isLoading ? '导出中...' : '批量导出PDF'}
          </button>
        </div>

        {batchItems.length === 0 && (
          <p style={{ color: '#94A3B8', fontSize: 14, textAlign: 'center', margin: '32px 0' }}>
            暂无批次项目
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {batchItems.map((item) => (
            <div className="list-item" key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#1E293B' }}>{item.productName}</span>
                <span style={{ fontSize: 14, color: '#6366F1', fontWeight: 700 }}>{item.result.recommendedSize}</span>
                <span style={{ fontSize: 13, color: getFitColor(item.result.fitScore) }}>
                  {item.result.fitScore.toFixed(1)}%
                </span>
              </div>
              <button
                onClick={() => handleRemoveFromBatch(item.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 16,
                  color: '#94A3B8',
                  padding: '4px 8px',
                  borderRadius: 4,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8' }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
