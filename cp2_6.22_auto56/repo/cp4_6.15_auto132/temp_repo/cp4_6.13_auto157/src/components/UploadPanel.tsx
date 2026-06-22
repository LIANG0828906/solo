import React, { useState, useRef, useCallback } from 'react'
import Papa from 'papaparse'

export interface ParsedTransaction {
  date: string
  amount: number
  category: string
  description: string
}

interface UploadPanelProps {
  onImport: (data: ParsedTransaction[]) => void
}

const UploadPanel: React.FC<UploadPanelProps> = ({ onImport }) => {
  const [previewData, setPreviewData] = useState<ParsedTransaction[]>([])
  const [selectedRow, setSelectedRow] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [rippleActive, setRippleActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadAreaRef = useRef<HTMLDivElement>(null)

  const parseCSV = useCallback((file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, unknown>[]
        const parsed: ParsedTransaction[] = rows.map((row) => {
          const keys = Object.keys(row)
          const findValue = (keywords: string[]): string => {
            for (const key of keys) {
              const lowerKey = key.toLowerCase()
              if (keywords.some(kw => lowerKey.includes(kw))) {
                return String(row[key] ?? '')
              }
            }
            return ''
          }

          const findAmount = (): number => {
            for (const key of keys) {
              const lowerKey = key.toLowerCase()
              if (['amount', '金额', 'money', 'value'].some(kw => lowerKey.includes(kw))) {
                const val = parseFloat(String(row[key] ?? '0'))
                return isNaN(val) ? 0 : val
              }
            }
            return 0
          }

          return {
            date: findValue(['date', '日期', '时间', 'time']),
            amount: findAmount(),
            category: findValue(['category', '类别', '分类', 'type']),
            description: findValue(['description', '描述', '备注', 'remark', 'desc'])
          }
        })
        setPreviewData(parsed)
      }
    })
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!isDragging) {
      setIsDragging(true)
    }
  }, [isDragging])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setRippleActive(true)
    setTimeout(() => setRippleActive(false), 600)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (uploadAreaRef.current && !uploadAreaRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0 && files[0].name.toLowerCase().endsWith('.csv')) {
      parseCSV(files[0])
    }
  }, [parseCSV])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      parseCSV(files[0])
    }
  }, [parseCSV])

  const handleCellEdit = useCallback((rowIndex: number, field: keyof ParsedTransaction, value: string) => {
    setPreviewData(prev => {
      const next = [...prev]
      if (field === 'amount') {
        next[rowIndex] = { ...next[rowIndex], amount: parseFloat(value) || 0 }
      } else {
        next[rowIndex] = { ...next[rowIndex], [field]: value } as ParsedTransaction
      }
      return next
    })
  }, [])

  const handleImport = useCallback(() => {
    if (previewData.length > 0) {
      onImport(previewData)
    }
  }, [previewData, onImport])

  return (
    <div className="upload-section">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes rippleExpand {
          0% { transform: scale(0); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes btnPress {
          0% { transform: scale(1); }
          50% { transform: scale(0.98); }
          100% { transform: scale(1); }
        }
        .upload-section {
          animation: fadeIn 0.3s ease-in;
          flex: 1;
          min-width: 0;
        }
        .upload-area {
          position: relative;
          border: 2px dashed #ccc;
          border-radius: 12px;
          padding: 48px 24px;
          text-align: center;
          background: #fff;
          cursor: pointer;
          transition: all 0.25s ease;
          overflow: hidden;
        }
        .upload-area.dragging {
          border: 2px solid #3498db;
          background: rgba(52, 152, 219, 0.04);
        }
        .upload-area:hover {
          border-color: #3498db;
          background: rgba(52, 152, 219, 0.02);
        }
        .ripple {
          position: absolute;
          border-radius: 50%;
          border: 2px solid #3498db;
          width: 120px;
          height: 120px;
          top: 50%;
          left: 50%;
          margin-left: -60px;
          margin-top: -60px;
          pointer-events: none;
          animation: rippleExpand 0.6s ease-out forwards;
        }
        .upload-icon {
          font-size: 48px;
          color: #3498db;
          margin-bottom: 16px;
          line-height: 1;
        }
        .upload-title {
          font-size: 18px;
          font-weight: 600;
          color: #2c3e50;
          margin: 0 0 8px 0;
        }
        .upload-subtitle {
          font-size: 14px;
          color: #888;
          margin: 0 0 4px 0;
        }
        .upload-hint {
          font-size: 12px;
          color: #aaa;
          margin: 0;
        }
        .preview-container {
          margin-top: 24px;
          animation: fadeIn 0.3s ease-in;
        }
        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .preview-title {
          font-size: 16px;
          font-weight: 600;
          color: #2c3e50;
          margin: 0;
        }
        .import-btn {
          padding: 10px 28px;
          background: #3498db;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        .import-btn:active {
          animation: btnPress 0.2s ease;
        }
        .import-btn:hover {
          background: #2980b9;
        }
        .import-btn:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
        }
        .table-wrapper {
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          overflow: hidden;
          max-height: 420px;
          overflow-y: auto;
          background: #fff;
        }
        table.preview-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .preview-table thead {
          position: sticky;
          top: 0;
          z-index: 1;
        }
        .preview-table th {
          background: #f8f9fa;
          padding: 12px 14px;
          text-align: left;
          font-weight: 600;
          color: #2c3e50;
          border-bottom: 2px solid #e0e0e0;
          white-space: nowrap;
        }
        .preview-table td {
          padding: 10px 14px;
          border-bottom: 1px solid #f0f0f0;
          transition: background 0.15s;
        }
        .preview-table tbody tr:hover td {
          background: #f5f5f5;
        }
        .preview-table tbody tr.selected td {
          background: rgba(52, 152, 219, 0.05);
        }
        .preview-table tbody tr.selected {
          box-shadow: inset 3px 0 0 #3498db;
        }
        .cell-input {
          width: 100%;
          padding: 6px 8px;
          border: 1px solid transparent;
          border-radius: 5px;
          font-size: 13px;
          background: transparent;
          transition: border-color 0.15s;
          box-sizing: border-box;
          font-family: inherit;
          color: #333;
        }
        .cell-input:focus {
          outline: none;
          border-color: #3498db;
          background: #fff;
        }
        .amount-negative {
          color: #e74c3c;
          font-weight: 500;
        }
        .amount-positive {
          color: #2ecc71;
          font-weight: 500;
        }
      `}</style>

      <div
        ref={uploadAreaRef}
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {rippleActive && <div className="ripple" />}
        <div className="upload-icon">📊</div>
        <p className="upload-title">上传银行流水 CSV 文件</p>
        <p className="upload-subtitle">拖拽文件到此处，或点击选择文件</p>
        <p className="upload-hint">支持列：日期、金额、类别、描述</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </div>

      {previewData.length > 0 && (
        <div className="preview-container">
          <div className="preview-header">
            <p className="preview-title">数据预览（共 {previewData.length} 条）</p>
            <button className="import-btn" onClick={handleImport}>导入</button>
          </div>
          <div className="table-wrapper">
            <table className="preview-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>#</th>
                  <th>日期</th>
                  <th>金额</th>
                  <th>类别</th>
                  <th>描述</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, idx) => (
                  <tr
                    key={idx}
                    className={selectedRow === idx ? 'selected' : ''}
                    onClick={() => setSelectedRow(idx)}
                  >
                    <td style={{ color: '#999', userSelect: 'none' }}>{idx + 1}</td>
                    <td>
                      <input
                        className="cell-input"
                        value={row.date}
                        onChange={(e) => handleCellEdit(idx, 'date', e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="YYYY-MM-DD"
                      />
                    </td>
                    <td>
                      <input
                        className={`cell-input ${row.amount < 0 ? 'amount-negative' : 'amount-positive'}`}
                        type="number"
                        step="0.01"
                        value={row.amount}
                        onChange={(e) => handleCellEdit(idx, 'amount', e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td>
                      <input
                        className="cell-input"
                        value={row.category}
                        onChange={(e) => handleCellEdit(idx, 'category', e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="餐饮/交通/..."
                      />
                    </td>
                    <td>
                      <input
                        className="cell-input"
                        value={row.description}
                        onChange={(e) => handleCellEdit(idx, 'description', e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="备注信息"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default UploadPanel
