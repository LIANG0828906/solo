import React, { useEffect, useState } from 'react'
import { useApp, SizeChart, MeasurementInput } from '../../context/AppContext'

const emptySize: MeasurementInput = {
  chest: 0,
  waist: 0,
  hip: 0,
  length: 0,
  shoulder: 0,
  sleeveLength: 0,
}

const measurementLabels: Record<keyof MeasurementInput, string> = {
  chest: '胸围',
  waist: '腰围',
  hip: '臀围',
  length: '衣长',
  shoulder: '肩宽',
  sleeveLength: '袖长',
}

type ChartFormData = {
  brand: string
  sizes: Record<string, MeasurementInput>
  newSizeName: string
}

const defaultFormData = (): ChartFormData => ({
  brand: '',
  sizes: {},
  newSizeName: '',
})

export default function SizeChartManager() {
  const { sizeCharts, setSizeCharts, showToast, isLoading, setIsLoading } = useApp()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<ChartFormData>(defaultFormData())
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    fetchCharts()
  }, [])

  const fetchCharts = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/sizecharts')
      if (!res.ok) throw new Error('Failed to fetch')
      const data: SizeChart[] = await res.json()
      setSizeCharts(data)
    } catch {
      showToast('获取尺码表失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.brand.trim()) {
      showToast('请输入品牌名称')
      return
    }
    if (Object.keys(formData.sizes).length === 0) {
      showToast('请至少添加一个尺码')
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch('/api/sizecharts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: formData.brand, sizes: formData.sizes }),
      })
      if (!res.ok) throw new Error('Failed to create')
      const created: SizeChart = await res.json()
      setSizeCharts((prev) => [...prev, created])
      setShowCreate(false)
      setFormData(defaultFormData())
      showToast('创建成功')
    } catch {
      showToast('创建失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingId) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/sizecharts/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: formData.brand, sizes: formData.sizes }),
      })
      if (!res.ok) throw new Error('Failed to update')
      const updated: SizeChart = await res.json()
      setSizeCharts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      setEditingId(null)
      setFormData(defaultFormData())
      showToast('更新成功')
    } catch {
      showToast('更新失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/sizecharts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setSizeCharts((prev) => prev.filter((c) => c.id !== id))
      setDeleteConfirmId(null)
      showToast('删除成功')
    } catch {
      showToast('删除失败')
    } finally {
      setIsLoading(false)
    }
  }

  const startEdit = (chart: SizeChart) => {
    setEditingId(chart.id)
    setFormData({ brand: chart.brand, sizes: { ...chart.sizes }, newSizeName: '' })
    setShowCreate(false)
  }

  const addSizeToForm = () => {
    const name = formData.newSizeName.trim()
    if (!name) return
    if (formData.sizes[name]) {
      showToast('该尺码已存在')
      return
    }
    setFormData((prev) => ({
      ...prev,
      sizes: { ...prev.sizes, [name]: { ...emptySize } },
      newSizeName: '',
    }))
  }

  const removeSizeFromForm = (sizeName: string) => {
    const newSizes = { ...formData.sizes }
    delete newSizes[sizeName]
    setFormData((prev) => ({ ...prev, sizes: newSizes }))
  }

  const updateSizeMeasurement = (
    sizeName: string,
    field: keyof MeasurementInput,
    value: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      sizes: {
        ...prev.sizes,
        [sizeName]: { ...prev.sizes[sizeName], [field]: value },
      },
    }))
  }

  const cancelForm = () => {
    setEditingId(null)
    setShowCreate(false)
    setFormData(defaultFormData())
  }

  const isFormOpen = showCreate || editingId !== null

  const renderForm = () => (
    <div className="card" style={{ width: '100%', maxWidth: 600 }}>
      <h3 style={{ margin: '0 0 16px' }}>{editingId ? '编辑尺码表' : '新建尺码表'}</h3>

      <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#64748B' }}>品牌</label>
      <input
        className="input-field"
        value={formData.brand}
        onChange={(e) => setFormData((p) => ({ ...p, brand: e.target.value }))}
        placeholder="输入品牌名称"
        style={{ marginBottom: 16 }}
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          className="input-field"
          value={formData.newSizeName}
          onChange={(e) => setFormData((p) => ({ ...p, newSizeName: e.target.value }))}
          placeholder="新尺码名称 (如 S, M, L)"
          style={{ flex: 1 }}
        />
        <button className="btn btn-secondary" onClick={addSizeToForm}>
          添加
        </button>
      </div>

      {Object.entries(formData.sizes).map(([sizeName, measurements]) => (
        <div
          key={sizeName}
          style={{
            border: '1px solid #E2E8F0',
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <strong style={{ fontSize: 14 }}>{sizeName}</strong>
            <button
              className="btn btn-danger"
              style={{ padding: '4px 10px', fontSize: 12 }}
              onClick={() => removeSizeFromForm(sizeName)}
            >
              移除
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {(Object.keys(measurementLabels) as (keyof MeasurementInput)[]).map((field) => (
              <div key={field}>
                <label style={{ fontSize: 12, color: '#94A3B8' }}>{measurementLabels[field]}</label>
                <input
                  className="input-field"
                  type="number"
                  value={measurements[field] || ''}
                  onChange={(e) =>
                    updateSizeMeasurement(sizeName, field, Number(e.target.value))
                  }
                  style={{ width: '100%' }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button className="btn btn-primary" onClick={editingId ? handleUpdate : handleCreate}>
          {editingId ? '保存' : '创建'}
        </button>
        <button className="btn btn-secondary" onClick={cancelForm}>
          取消
        </button>
      </div>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>尺码对照表管理</h2>
        {!isFormOpen && (
          <button className="btn btn-primary" onClick={() => { setShowCreate(true); setFormData(defaultFormData()) }}>
            + 新建
          </button>
        )}
      </div>

      {isLoading && <div className="loading-spinner" />}

      {isFormOpen && renderForm()}

      {!isFormOpen && sizeCharts.length === 0 && !isLoading && (
        <p style={{ color: '#94A3B8', textAlign: 'center', marginTop: 48 }}>暂无尺码表，点击新建添加</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: isFormOpen ? 24 : 0 }}>
        {sizeCharts.map((chart) => (
          <div className="list-item" key={chart.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: '0 0 4px' }}>{chart.brand}</h4>
                <span style={{ fontSize: 13, color: '#94A3B8' }}>
                  尺码: {Object.keys(chart.sizes).join(', ')}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {deleteConfirmId === chart.id ? (
                  <>
                    <button className="btn btn-danger" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => handleDelete(chart.id)}>
                      确认删除
                    </button>
                    <button className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => setDeleteConfirmId(null)}>
                      取消
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => startEdit(chart)}>
                      编辑
                    </button>
                    <button className="btn btn-danger" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => setDeleteConfirmId(chart.id)}>
                      删除
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
