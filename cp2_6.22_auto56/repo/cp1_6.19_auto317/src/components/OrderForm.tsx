import { useState } from 'react'
import { useWorkshopStore, ProductCategory, LeatherType } from '../store'
import './OrderForm.css'

interface OrderFormProps {
  onClose: () => void
}

const categoryOptions: { value: ProductCategory; label: string; defaultSize: string }[] = [
  { value: 'wallet', label: '钱包', defaultSize: '标准款 (10x9cm)' },
  { value: 'belt', label: '皮带', defaultSize: '105cm' },
  { value: 'backpack', label: '背包', defaultSize: '大号 (30x40x12cm)' },
  { value: 'cardholder', label: '卡包', defaultSize: '标准款 (10x8cm)' },
  { value: 'keycase', label: '钥匙包', defaultSize: '标准款 (7x11cm)' }
]

const leatherTypeOptions: { value: Exclude<LeatherType, 'all'>; label: string }[] = [
  { value: 'vegetable', label: '植鞣革' },
  { value: 'chrome', label: '铬鞣革' },
  { value: 'shell', label: '马臀皮' }
]

const colorOptions: Record<Exclude<LeatherType, 'all'>, string[]> = {
  vegetable: ['棕色', '原色', '深棕', '红棕'],
  chrome: ['黑色', '酒红', '深蓝', '墨绿'],
  shell: ['深棕', '黑色', '酒红', '深绿']
}

const hardwareOptions = ['黄铜', '银色', '金色', '枪黑色']

function OrderForm({ onClose }: OrderFormProps) {
  const addOrder = useWorkshopStore(state => state.addOrder)
  const inventory = useWorkshopStore(state => state.inventory)

  const [customerName, setCustomerName] = useState('')
  const [category, setCategory] = useState<ProductCategory>('wallet')
  const [size, setSize] = useState('标准款 (10x9cm)')
  const [leatherType, setLeatherType] = useState<Exclude<LeatherType, 'all'>>('vegetable')
  const [color, setColor] = useState('棕色')
  const [hardware, setHardware] = useState('黄铜')

  const handleCategoryChange = (newCategory: ProductCategory) => {
    setCategory(newCategory)
    const cat = categoryOptions.find(c => c.value === newCategory)
    if (cat) setSize(cat.defaultSize)
  }

  const handleLeatherTypeChange = (newType: Exclude<LeatherType, 'all'>) => {
    setLeatherType(newType)
    const colors = colorOptions[newType]
    if (colors && colors.length > 0) {
      setColor(colors[0])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerName.trim()) {
      alert('请输入客户姓名')
      return
    }

    addOrder({
      customerName: customerName.trim(),
      category,
      size,
      color,
      hardware,
      leatherType
    })

    onClose()
  }

  const selectedMaterial = inventory.find(m => m.type === leatherType)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>新建定制订单</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="order-form">
          <div className="form-group">
            <label>客户姓名 <span className="required">*</span></label>
            <input
              type="text"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="请输入客户姓名"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>产品品类</label>
            <div className="category-grid">
              {categoryOptions.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  className={`category-item ${category === cat.value ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(cat.value)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>皮革类型</label>
              <select
                value={leatherType}
                onChange={e => handleLeatherTypeChange(e.target.value as Exclude<LeatherType, 'all'>)}
                className="form-select"
              >
                {leatherTypeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>颜色</label>
              <select
                value={color}
                onChange={e => setColor(e.target.value)}
                className="form-select"
              >
                {colorOptions[leatherType].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>尺寸规格</label>
            <input
              type="text"
              value={size}
              onChange={e => setSize(e.target.value)}
              placeholder="请输入尺寸规格"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>五金件</label>
            <div className="hardware-options">
              {hardwareOptions.map(hw => (
                <button
                  key={hw}
                  type="button"
                  className={`hardware-item ${hardware === hw ? 'active' : ''}`}
                  onClick={() => setHardware(hw)}
                >
                  {hw}
                </button>
              ))}
            </div>
          </div>

          {selectedMaterial && (
            <div className="price-estimate">
              <h3>预估信息</h3>
              <div className="estimate-row">
                <span>皮革单价</span>
                <span>¥{selectedMaterial.unitPrice}/平方英尺</span>
              </div>
              <div className="estimate-row">
                <span>材料成本</span>
                <span className="highlight">¥{(
                  (category === 'wallet' ? 1.2 :
                   category === 'belt' ? 0.8 :
                   category === 'backpack' ? 3.5 :
                   category === 'cardholder' ? 0.5 : 0.3
                  ) * selectedMaterial.unitPrice
                )}</span>
              </div>
              <div className="estimate-row">
                <span>预估工时</span>
                <span className="highlight">
                  {
                    category === 'wallet' ? '8' :
                    category === 'belt' ? '4' :
                    category === 'backpack' ? '24' :
                    category === 'cardholder' ? '3' : '2'
                  } 小时
                </span>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>取消</button>
            <button type="submit" className="btn-primary">创建订单</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default OrderForm
