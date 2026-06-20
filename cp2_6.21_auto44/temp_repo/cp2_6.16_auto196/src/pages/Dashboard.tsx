import { useState, useRef, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { useAppStore } from '@/store/appStore'
import { CONTRACT_STATUS_LABELS, type Contract, type ContractStatus } from '@/types'
import './Dashboard.css'

const STATUS_ORDER: ContractStatus[] = ['active', 'expiring', 'expired', 'terminated']

export default function Dashboard() {
  const navigate = useNavigate()
  const { contracts, updateContractStatus, deleteContract } = useAppStore()

  const [draggedCard, setDraggedCard] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<ContractStatus | null>(null)
  const [now, setNow] = useState(dayjs())

  const cardsByStatus = useMemo(() => {
    const result: Record<ContractStatus, Contract[]> = {
      active: [],
      expiring: [],
      expired: [],
      terminated: [],
    }

    contracts.forEach((contract) => {
      result[contract.status].push(contract)
    })

    return result
  }, [contracts])

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(dayjs())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  const getDaysRemaining = (contract: Contract): number => {
    return dayjs(contract.endDate).diff(now, 'day')
  }

  const getContractStatusLevel = (contract: Contract): 'normal' | 'expiring' | 'danger' => {
    const days = getDaysRemaining(contract)
    if (days <= 7) return 'danger'
    if (days <= 30) return 'expiring'
    return 'normal'
  }

  const handleDragStart = (e: React.DragEvent, contractId: string) => {
    setDraggedCard(contractId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', contractId)
  }

  const handleDragEnd = () => {
    setDraggedCard(null)
    setDragOverColumn(null)
  }

  const handleDragOver = (e: React.DragEvent, status: ContractStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverColumn !== status) {
      setDragOverColumn(status)
    }
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, status: ContractStatus) => {
    e.preventDefault()
    const contractId = e.dataTransfer.getData('text/plain')
    if (contractId) {
      await updateContractStatus(contractId, status)
    }
    setDraggedCard(null)
    setDragOverColumn(null)
  }

  const handleCardClick = (contractId: string) => {
    navigate(`/contract/${contractId}`)
  }

  const handleDeleteContract = (contractId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('确定要删除这份合同吗？')) {
      deleteContract(contractId)
    }
  }

  const getStatusColor = (status: ContractStatus) => {
    switch (status) {
      case 'active': return 'var(--primary)'
      case 'expiring': return 'var(--expiring)'
      case 'expired': return 'var(--danger)'
      case 'terminated': return 'var(--text-secondary)'
    }
  }

  const getStatusBgColor = (status: ContractStatus) => {
    switch (status) {
      case 'active': return 'var(--primary-light)'
      case 'expiring': return 'var(--expiring-light)'
      case 'expired': return 'var(--danger-light)'
      case 'terminated': return '#F3F4F6'
    }
  }

  return (
    <div className="dashboard-page page-container">
      <div className="page-header">
        <h1 className="page-title">合同状态看板</h1>
        <div className="dashboard-stats">
          <span className="dashboard-stat">
            <span className="stat-number">{contracts.length}</span>
            <span className="stat-label">总合同数</span>
          </span>
        </div>
      </div>

      <div className="kanban-board">
        {STATUS_ORDER.map((status) => (
          <div
            key={status}
            className={`kanban-column ${dragOverColumn === status ? 'kanban-column-highlight' : ''}`}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="kanban-column-header">
              <div
                className="kanban-column-title"
                style={{
                  color: getStatusColor(status),
                  background: getStatusBgColor(status),
                }}
              >
                {CONTRACT_STATUS_LABELS[status]}
                <span className="kanban-count">{cardsByStatus[status].length}</span>
              </div>
            </div>

            <div className={`kanban-cards ${cardsByStatus[status].length === 0 ? 'kanban-empty' : ''}`}>
              {cardsByStatus[status].length === 0 ? (
                <div className="kanban-empty-hint">
                  <span className="empty-icon">📭</span>
                  <span>拖拽合同到此处</span>
                </div>
              ) : (
                cardsByStatus[status].map((contract) => {
                  const statusLevel = getContractStatusLevel(contract)
                  const daysRemaining = getDaysRemaining(contract)
                  const isDragging = draggedCard === contract.id

                  return (
                    <div
                      key={contract.id}
                      className={`kanban-card ${isDragging ? 'kanban-card-dragging' : ''} ${
                        status === 'active' && statusLevel === 'expiring' ? 'contract-card-expiring' : ''
                      } ${
                        status === 'active' && statusLevel === 'danger' ? 'contract-card-danger' : ''
                      }`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, contract.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleCardClick(contract.id)}
                    >
                      <div className="kanban-card-header">
                        <h3 className="kanban-card-title">{contract.tenantName}</h3>
                        <button
                          className="kanban-card-delete"
                          onClick={(e) => handleDeleteContract(contract.id, e)}
                          title="删除合同"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="kanban-card-meta">
                        <div className="meta-item">
                          <span className="meta-label">模板</span>
                          <span className="meta-value">{contract.templateName}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">月租金</span>
                          <span className="meta-value meta-amount">¥{contract.monthlyRent}</span>
                        </div>
                      </div>

                      <div className="kanban-card-date">
                        <span className="date-range">
                          {contract.startDate} ~ {contract.endDate}
                        </span>
                      </div>

                      <div className="kanban-card-footer">
                        {status === 'active' && daysRemaining > 0 && (
                          <div className={`countdown ${statusLevel}`}>
                            <span className="countdown-icon">⏰</span>
                            <span className="countdown-text">
                              剩余 {daysRemaining} 天
                            </span>
                            {statusLevel === 'danger' && (
                              <span className="badge badge-danger badge-sm">即将到期</span>
                            )}
                          </div>
                        )}
                        {daysRemaining <= 0 && status !== 'terminated' && (
                          <div className="countdown danger">
                            <span className="countdown-icon">⚠️</span>
                            <span className="countdown-text">
                              已过期 {Math.abs(daysRemaining)} 天
                            </span>
                          </div>
                        )}
                        {status === 'terminated' && (
                          <div className="countdown terminated">
                            <span className="countdown-icon">🔒</span>
                            <span className="countdown-text">已终止</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
