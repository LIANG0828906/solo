import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import {
  SearchOutlined,
  EyeOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CheckCircleOutlined,
  FilterOutlined,
} from '@ant-design/icons'
import { useInventoryStore } from '@/stores/inventoryStore'
import StockModal from '@/components/StockModal'
import type { Consumable, StockStatus } from '@/types'
import dayjs from 'dayjs'

const statusMap: Record<StockStatus, { label: string; dotClass: string; tagClass: string }> = {
  normal: { label: '正常', dotClass: 'green', tagClass: 'tag-green' },
  low: { label: '偏低', dotClass: 'yellow', tagClass: 'tag-yellow' },
  critical: { label: '严重不足', dotClass: 'red', tagClass: 'tag-red' },
}

const SkeletonRow = () => (
  <tr>
    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
      <td key={i} style={{ padding: '16px 12px' }}>
        <div className="skeleton" style={{ width: i === 7 ? 180 : 80, height: 16 }} />
      </td>
    ))}
  </tr>
)

export default function Inventory() {
  const location = useLocation()
  const {
    fetchInventory,
    fetchRecords,
    updateStock,
    triggerCheck,
    searchKeyword,
    setSearchKeyword,
    statusFilter,
    setStatusFilter,
    getFilteredConsumables,
    getStockStatus,
    loading,
    consumables,
  } = useInventoryStore()

  const [modalVisible, setModalVisible] = useState(false)
  const [selectedConsumable, setSelectedConsumable] = useState<Consumable | null>(null)
  const [modalType, setModalType] = useState<'in' | 'out' | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)

  useEffect(() => {
    fetchInventory()
    fetchRecords()
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [fetchInventory, fetchRecords])

  useEffect(() => {
    const state = location.state as { openDetail?: string } | null
    if (state?.openDetail && consumables.length > 0) {
      const consumable = consumables.find(c => c.id === state.openDetail)
      if (consumable) {
        setSelectedConsumable(consumable)
        setDetailVisible(true)
      }
    }
  }, [location.state, consumables])

  const filteredConsumables = useMemo(() => getFilteredConsumables(), [getFilteredConsumables])

  const handleOpenModal = (consumable: Consumable, type: 'in' | 'out') => {
    setSelectedConsumable(consumable)
    setModalType(type)
    setModalVisible(true)
  }

  const handleSubmit = async (quantity: number, remark: string) => {
    if (!selectedConsumable || !modalType) return
    await updateStock(selectedConsumable.id, modalType, quantity, remark)
  }

  const handleCheck = async (consumable: Consumable) => {
    await triggerCheck(consumable.id)
  }

  const PageTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div style={{ marginBottom: 24 }}>
      <h1
        style={{
          fontSize: 24,
          fontWeight: 600,
          paddingLeft: 12,
          borderLeft: '4px solid #0050b3',
          marginBottom: subtitle ? 4 : 0,
        }}
      >
        {title}
      </h1>
      {subtitle && <p style={{ color: '#8c8c8c', fontSize: 14, marginLeft: 16 }}>{subtitle}</p>}
    </div>
  )

  const MobileCard = ({ item }: { item: Consumable }) => {
    const status = getStockStatus(item.currentStock, item.safetyThreshold)
    const statusInfo = statusMap[status]
    return (
      <div className="card fade-in" style={{ padding: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{item.name}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>编号: {item.code}</div>
          </div>
          <span className={`tag ${statusInfo.tagClass}`}>
            <span className={`status-dot ${statusInfo.dotClass}`} />
            {statusInfo.label}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 13 }}>
          <div>
            <span style={{ color: '#8c8c8c' }}>当前库存: </span>
            <span style={{ fontWeight: 600, color: '#0050b3' }}>{item.currentStock}</span>
          </div>
          <div>
            <span style={{ color: '#8c8c8c' }}>安全阈值: </span>
            <span>{item.safetyThreshold}</span>
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 12 }}>
          上次盘点: {dayjs(item.lastCheckTime).format('YYYY-MM-DD HH:mm')}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-default" style={{ flex: 1 }} onClick={() => { setSelectedConsumable(item); setDetailVisible(true) }}>
            <EyeOutlined /> 详情
          </button>
          <button className="btn btn-success" style={{ flex: 1 }} onClick={() => handleOpenModal(item, 'in')}>
            <ArrowUpOutlined /> 入库
          </button>
          <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleOpenModal(item, 'out')}>
            <ArrowDownOutlined /> 出库
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleCheck(item)}>
            <CheckCircleOutlined /> 盘点
          </button>
        </div>
      </div>
    )
  }

  const DetailModal = () => {
    if (!detailVisible || !selectedConsumable) return null
    const status = getStockStatus(selectedConsumable.currentStock, selectedConsumable.safetyThreshold)
    const statusInfo = statusMap[status]
    return (
      <div className="modal-overlay" onClick={() => { setDetailVisible(false); setSelectedConsumable(null) }}>
        <div className="modal-content fade-in" onClick={(e) => e.stopPropagation()}>
          <h3 style={{ marginBottom: 20, fontSize: 18, fontWeight: 600 }}>耗材详情</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>耗材编号</div>
              <div style={{ fontWeight: 500 }}>{selectedConsumable.code}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>耗材名称</div>
              <div style={{ fontWeight: 500 }}>{selectedConsumable.name}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>分类</div>
              <div>{selectedConsumable.category}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>单位</div>
              <div>{selectedConsumable.unit}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>当前库存</div>
              <div style={{ fontWeight: 600, color: '#0050b3' }}>{selectedConsumable.currentStock}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>安全阈值</div>
              <div>{selectedConsumable.safetyThreshold}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>日均消耗</div>
              <div>{selectedConsumable.dailyConsumption}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>采购周期</div>
              <div>{selectedConsumable.purchaseCycle} 天</div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>库存状态</div>
              <span className={`tag ${statusInfo.tagClass}`}>
                <span className={`status-dot ${statusInfo.dotClass}`} />
                {statusInfo.label}
              </span>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>上次盘点时间</div>
              <div>{dayjs(selectedConsumable.lastCheckTime).format('YYYY-MM-DD HH:mm:ss')}</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
            <button
              className="btn btn-primary"
              onClick={() => { setDetailVisible(false); setSelectedConsumable(null) }}
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageTitle title="库存管理" subtitle="管理所有实验耗材的入库、出库和盘点操作" />

      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <SearchOutlined style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#8c8c8c' }} />
            <input
              type="text"
              placeholder="搜索耗材名称或编号..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                border: '1px solid #d9d9d9',
                borderRadius: 8,
                fontSize: 14,
                transition: 'all 0.2s ease',
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FilterOutlined style={{ color: '#8c8c8c' }} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StockStatus | 'all')}
              style={{
                padding: '10px 12px',
                border: '1px solid #d9d9d9',
                borderRadius: 8,
                fontSize: 14,
                backgroundColor: 'white',
                cursor: 'pointer',
                minWidth: 140,
              }}
            >
              <option value="all">全部状态</option>
              <option value="normal">正常</option>
              <option value="low">偏低</option>
              <option value="critical">严重不足</option>
            </select>
          </div>
        </div>
      </div>

      {isMobile ? (
        <div>
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="card" style={{ padding: 16, marginBottom: 12 }}>
                <div className="skeleton" style={{ width: 150, height: 20, marginBottom: 12 }} />
                <div className="skeleton" style={{ width: 100, height: 14, marginBottom: 12 }} />
                <div className="skeleton" style={{ width: '100%', height: 36 }} />
              </div>
            ))
          ) : filteredConsumables.length === 0 ? (
            <div className="card" style={{ padding: 60, textAlign: 'center', color: '#8c8c8c' }}>
              暂无匹配的耗材
            </div>
          ) : (
            filteredConsumables.map((item) => <MobileCard key={item.id} item={item} />)
          )}
        </div>
      ) : (
        <div className="card fade-in" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#595959' }}>耗材编号</th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#595959' }}>名称</th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#595959' }}>当前库存</th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#595959' }}>安全阈值</th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#595959' }}>状态</th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#595959' }}>上次盘点</th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#595959' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)
                ) : filteredConsumables.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 60, textAlign: 'center', color: '#8c8c8c' }}>
                      暂无匹配的耗材
                    </td>
                  </tr>
                ) : (
                  filteredConsumables.map((item) => {
                    const status = getStockStatus(item.currentStock, item.safetyThreshold)
                    const statusInfo = statusMap[status]
                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid #f5f5f5',
                          transition: 'background-color 0.15s ease',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e6f7ff' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white' }}
                      >
                        <td style={{ padding: '16px 12px', fontSize: 14, fontFamily: 'monospace' }}>{item.code}</td>
                        <td style={{ padding: '16px 12px', fontSize: 14, fontWeight: 500 }}>{item.name}</td>
                        <td style={{ padding: '16px 12px', fontSize: 14, fontWeight: 600, color: '#0050b3' }}>{item.currentStock}</td>
                        <td style={{ padding: '16px 12px', fontSize: 14 }}>{item.safetyThreshold}</td>
                        <td style={{ padding: '16px 12px' }}>
                          <span className={`tag ${statusInfo.tagClass}`}>
                            <span className={`status-dot ${statusInfo.dotClass}`} />
                            {statusInfo.label}
                          </span>
                        </td>
                        <td style={{ padding: '16px 12px', fontSize: 13, color: '#8c8c8c' }}>
                          {dayjs(item.lastCheckTime).format('YYYY-MM-DD HH:mm')}
                        </td>
                        <td style={{ padding: '16px 12px' }}>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <button
                              className="btn btn-default"
                              style={{ padding: '6px 12px', fontSize: 12 }}
                              onClick={() => { setSelectedConsumable(item); setDetailVisible(true) }}
                            >
                              <EyeOutlined /> 详情
                            </button>
                            <button
                              className="btn btn-success"
                              style={{ padding: '6px 12px', fontSize: 12 }}
                              onClick={() => handleOpenModal(item, 'in')}
                            >
                              <ArrowUpOutlined /> 入库
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{ padding: '6px 12px', fontSize: 12 }}
                              onClick={() => handleOpenModal(item, 'out')}
                            >
                              <ArrowDownOutlined /> 出库
                            </button>
                            <button
                              className="btn btn-primary"
                              style={{ padding: '6px 12px', fontSize: 12 }}
                              onClick={() => handleCheck(item)}
                            >
                              <CheckCircleOutlined /> 盘点
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <StockModal
        visible={modalVisible}
        consumable={selectedConsumable}
        type={modalType}
        onClose={() => { setModalVisible(false); setSelectedConsumable(null); setModalType(null) }}
        onSubmit={handleSubmit}
      />

      <DetailModal />
    </div>
  )
}
