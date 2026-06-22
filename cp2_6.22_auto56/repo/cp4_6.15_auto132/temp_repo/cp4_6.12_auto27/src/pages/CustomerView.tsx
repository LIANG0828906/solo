import { useState, useEffect, useCallback, useRef } from 'react'
import {
  useAppStore,
  GLAZE_COLORS,
  CLAY_TYPES,
  CLAY_NAMES,
  CATEGORY_ICONS,
  Product,
} from '@/store'
import { productsApi, ordersApi } from '@/api'

function ProductSkeleton() {
  return (
    <div className="product-card" style={{ cursor: 'default' }}>
      <div className="product-card-image skeleton" style={{ height: 200 }} />
      <div className="product-card-body">
        <div className="skeleton" style={{ height: 20, marginBottom: 8, width: '70%' }} />
        <div className="skeleton" style={{ height: 36, marginBottom: 12 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div className="skeleton" style={{ height: 24, width: 80 }} />
          <div className="skeleton" style={{ height: 24, width: 60 }} />
        </div>
      </div>
    </div>
  )
}

function ProductCard({ product, onOpen }: { product: Product; onOpen: () => void }) {
  const icon = CATEGORY_ICONS[product.category] || '🏺'
  return (
    <div className="product-card fade-in-up" onClick={onOpen}>
      <div className="product-card-image">{icon}</div>
      <div className="product-card-body">
        <div className="product-card-title">{product.name}</div>
        <div className="product-card-desc">{product.description}</div>
        <div className="product-card-footer">
          <div className="product-card-price">
            <small>¥</small>
            {product.base_price}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {product.category}
          </div>
        </div>
      </div>
      <div className="glaze-strip">
        <div className="glaze-strip-label">可选釉色</div>
        <div className="glaze-swatches">
          {product.glaze_colors.map((g) => {
            const gc = GLAZE_COLORS[g]
            return gc ? (
              <div
                key={g}
                className="glaze-swatch"
                style={{ background: gc.hex }}
                title={gc.name}
              />
            ) : null
          })}
        </div>
      </div>
    </div>
  )
}

interface CustomFormState {
  clay: string
  glaze: string
  quantity: number
  customerName: string
  customerPhone: string
  customerEmail: string
  specialNotes: string
  images: string[]
}

function CustomizeModal({
  product,
  onClose,
}: {
  product: Product
  onClose: () => void
}) {
  const addToast = useAppStore((s) => s.addToast)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  const availableClays = product.clay_types
  const availableGlazes = product.glaze_colors
  const defaultClay = availableClays[0] || '白瓷'
  const defaultGlaze = availableGlazes[0] || '青釉'

  const [form, setForm] = useState<CustomFormState>({
    clay: defaultClay,
    glaze: defaultGlaze,
    quantity: 1,
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    specialNotes: '',
    images: [],
  })

  const glazeInfo = GLAZE_COLORS[form.glaze]
  const clayInfo = CLAY_TYPES[CLAY_NAMES[form.clay]]
  const previewBg = `linear-gradient(135deg, ${clayInfo?.hex || '#D2B48C'}20 0%, ${
    glazeInfo?.hex || '#7BA23F'
  }40 100%)`

  const totalPrice = Math.round(product.base_price * form.quantity * 100) / 100

  const updateForm = <K extends keyof CustomFormState>(key: K, val: CustomFormState[K]) => {
    setForm((f) => ({ ...f, [key]: val }))
    if (errors[key as string]) {
      setErrors((e) => ({ ...e, [key as string]: false }))
    }
  }

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const remaining = Math.max(0, 5 - form.images.length)
    const toProcess = Array.from(files).slice(0, remaining)
    Promise.all(
      toProcess.map(
        (f) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(f)
          })
      )
    ).then((urls) => {
      updateForm('images', [...form.images, ...urls].slice(0, 5))
    })
  }

  const removeImage = (idx: number) => {
    updateForm(
      'images',
      form.images.filter((_, i) => i !== idx)
    )
  }

  const handleSubmit = async () => {
    const newErrors: Record<string, boolean> = {}
    if (!form.customerName.trim()) newErrors.customerName = true
    if (!form.customerPhone.trim() && !form.customerEmail.trim()) {
      newErrors.customerPhone = true
      newErrors.customerEmail = true
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      addToast('error', '请填写必填的联系信息')
      return
    }

    setSubmitting(true)
    try {
      await ordersApi.create({
        product_id: product.id,
        product_name: product.name,
        quantity: form.quantity,
        clay_type: CLAY_NAMES[form.clay],
        glaze_color: form.glaze,
        customer_name: form.customerName.trim(),
        customer_phone: form.customerPhone.trim(),
        customer_email: form.customerEmail.trim(),
        reference_images: form.images,
        special_notes: form.specialNotes.trim(),
        total_price: totalPrice,
      })
      addToast('success', `定制订单提交成功！共${form.quantity}件 · ¥${totalPrice}`)
      setTimeout(onClose, 400)
    } catch (e) {
      addToast('error', '提交失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">{product.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              {product.description}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="product-detail-grid">
            <div>
              <div className="section-label">效果预览</div>
              <div className="product-preview" style={{ background: previewBg }}>
                {CATEGORY_ICONS[product.category] || '🏺'}
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  marginTop: 14,
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'white',
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                  }}
                >
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: clayInfo?.hex,
                      border: '1px solid rgba(0,0,0,0.1)',
                    }}
                  />
                  {form.clay}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'white',
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                  }}
                >
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: glazeInfo?.hex,
                    }}
                  />
                  {form.glaze}
                </div>
              </div>
            </div>

            <div>
              <div className="section-label">选择泥料</div>
              <div className="clay-selector">
                {availableClays.map((c) => {
                  const ci = CLAY_TYPES[CLAY_NAMES[c]]
                  return (
                    <div
                      key={c}
                      className={`clay-option ${form.clay === c ? 'selected' : ''}`}
                      onClick={() => updateForm('clay', c)}
                    >
                      <span className="clay-dot" style={{ background: ci?.hex }} />
                      {c}
                    </div>
                  )
                })}
              </div>

              <div className="section-label">选择釉色</div>
              <div className="glaze-selector">
                {availableGlazes.map((g) => {
                  const gc = GLAZE_COLORS[g]
                  if (!gc) return null
                  return (
                    <div
                      key={g}
                      className={`glaze-option ${form.glaze === g ? 'selected' : ''}`}
                      style={{ background: gc.hex }}
                      title={gc.name}
                      onClick={() => updateForm('glaze', g)}
                    />
                  )
                })}
              </div>

              <div className="section-label">定制数量（1-50件）</div>
              <div className="quantity-input">
                <button
                  className="qty-btn"
                  disabled={form.quantity <= 1}
                  onClick={() => updateForm('quantity', Math.max(1, form.quantity - 1))}
                >
                  −
                </button>
                <input
                  type="number"
                  className="qty-value"
                  min={1}
                  max={50}
                  step={1}
                  value={form.quantity}
                  onChange={(e) => {
                    const v = parseInt(e.target.value) || 1
                    updateForm('quantity', Math.min(50, Math.max(1, v)))
                  }}
                />
                <button
                  className="qty-btn"
                  disabled={form.quantity >= 50}
                  onClick={() => updateForm('quantity', Math.min(50, form.quantity + 1))}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div style={{ height: 1 }} />

          <div className="form-group">
            <label className="form-label">
              您的称呼 <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              className={`form-input ${errors.customerName ? 'error' : ''}`}
              placeholder="请输入您的姓名"
              value={form.customerName}
              onChange={(e) => updateForm('customerName', e.target.value)}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
            }}
          >
            <div className="form-group">
              <label className="form-label">联系电话（邮箱或电话必填一项）</label>
              <input
                className={`form-input ${errors.customerPhone ? 'error' : ''}`}
                placeholder="手机号"
                value={form.customerPhone}
                onChange={(e) => updateForm('customerPhone', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">电子邮箱</label>
              <input
                className={`form-input ${errors.customerEmail ? 'error' : ''}`}
                placeholder="your@email.com"
                value={form.customerEmail}
                onChange={(e) => updateForm('customerEmail', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">参考图片（最多5张，可选）</label>
            <div
              className={`file-drop ${dragging ? 'dragging' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragging(false)
                handleFiles(e.dataTransfer.files)
              }}
            >
              <div className="file-drop-icon">📷</div>
              <div className="file-drop-text">
                <strong>点击选择</strong> 或拖拽图片到此处（最多5张）
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => handleFiles(e.target.files)}
            />
            {form.images.length > 0 && (
              <div className="preview-images">
                {form.images.map((src, i) => (
                  <div key={i} className="preview-image" style={{ position: 'relative' }}>
                    <img
                      src={src}
                      alt={`参考图${i + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }}
                    />
                    <div className="preview-image-remove" onClick={() => removeImage(i)}>
                      ✕
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">特殊要求 / 备注（可选）</label>
            <textarea
              className="form-textarea"
              placeholder="如有尺寸、图案、文字刻印等特殊要求请在此说明..."
              value={form.specialNotes}
              onChange={(e) => updateForm('specialNotes', e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>
              合计金额
            </div>
            <div className="total-price">
              <small style={{ fontSize: 14, marginRight: 2 }}>¥</small>
              {totalPrice}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              取消
            </button>
            <button
              className="btn btn-primary ripple-btn"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? '提交中...' : '提交定制需求'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CustomerView() {
  const { products, loading, setProducts, setLoading, selectedProduct, setSelectedProduct } =
    useAppStore()

  const [filter, setFilter] = useState<string>('全部')
  const categories = ['全部', '杯子', '碗', '花瓶', '茶壶', '摆件']

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading('products', true)
      try {
        const list = await productsApi.getList()
        if (!cancelled) setProducts(list)
      } finally {
        if (!cancelled) setLoading('products', false)
      }
    }
    if (products.length === 0) load()
    return () => {
      cancelled = true
    }
  }, [products.length, setProducts, setLoading])

  const filteredProducts =
    filter === '全部' ? products : products.filter((p) => p.category === filter)

  const openModal = useCallback(
    (p: Product) => {
      setSelectedProduct(p)
    },
    [setSelectedProduct]
  )

  return (
    <div className="fade-in-up">
      <div className="page-header">
        <div>
          <div className="page-title">浏览定制器型</div>
          <div className="page-subtitle">匠心手作 · 每一件都是独一无二的艺术品</div>
        </div>
        <div className="tabs" style={{ marginBottom: 0 }}>
          {categories.map((c) => (
            <div
              key={c}
              className={`tab ${filter === c ? 'active' : ''}`}
              onClick={() => setFilter(c)}
            >
              {c}
            </div>
          ))}
        </div>
      </div>

      <div className="products-grid">
        {loading.products && products.length === 0 ? (
          Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
        ) : filteredProducts.length === 0 ? (
          <div
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: 60,
              color: 'var(--text-secondary)',
              background: 'white',
              borderRadius: 16,
              boxShadow: 'var(--shadow)',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏺</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>暂无该分类的器型</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>请尝试选择其他分类</div>
          </div>
        ) : (
          filteredProducts.map((p) => (
            <ProductCard key={p.id} product={p} onOpen={() => openModal(p)} />
          ))
        )}
      </div>

      {selectedProduct && (
        <CustomizeModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  )
}
