import { useState, useEffect, useMemo } from 'react'
import { Activity, ActivityType, ActivityStatus } from '../types'
import { api } from '../api'

interface FormData {
  name: string
  type: ActivityType
  startTime: string
  endTime: string
  rules: {
    fullAmount: number
    reductionAmount: number
    discountRate: number
    giftName: string
  }
}

const defaultFormData: FormData = {
  name: '',
  type: 'full_reduction',
  startTime: '',
  endTime: '',
  rules: {
    fullAmount: 100,
    reductionAmount: 20,
    discountRate: 0.8,
    giftName: ''
  }
}

const PAGE_SIZE = 15

function getStatusLabel(status: ActivityStatus): string {
  switch (status) {
    case 'ongoing': return '进行中'
    case 'not_started': return '未开始'
    case 'ended': return '已结束'
  }
}

function getStatusColor(status: ActivityStatus): string {
  switch (status) {
    case 'ongoing': return '#52c41a'
    case 'not_started': return '#faad14'
    case 'ended': return '#999'
  }
}

function getTypeLabel(type: ActivityType): string {
  switch (type) {
    case 'full_reduction': return '满减'
    case 'discount': return '折扣'
    case 'buy_gift': return '买赠'
  }
}

function getTypeColor(type: ActivityType): string {
  switch (type) {
    case 'full_reduction': return '#1890ff'
    case 'discount': return '#52c41a'
    case 'buy_gift': return '#fa8c16'
  }
}

function ActivityManager() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>(defaultFormData)
  const [statusFilter, setStatusFilter] = useState<ActivityStatus | 'all'>('all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const loadActivities = () => {
    api.getActivities().then(setActivities)
  }

  useEffect(() => {
    loadActivities()
  }, [])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2500)
  }

  const filteredAndSorted = useMemo(() => {
    let result = [...activities]
    
    if (statusFilter !== 'all') {
      result = result.filter(a => a.status === statusFilter)
    }
    
    result.sort((a, b) => {
      const diff = new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      return sortOrder === 'asc' ? diff : -diff
    })
    
    return result
  }, [activities, statusFilter, sortOrder])

  const totalPages = Math.ceil(filteredAndSorted.length / PAGE_SIZE)
  const paginatedData = filteredAndSorted.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const data: Omit<Activity, 'id'> = {
        name: formData.name,
        type: formData.type,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        rules: {}
      }

      switch (formData.type) {
        case 'full_reduction':
          data.rules = {
            fullAmount: formData.rules.fullAmount,
            reductionAmount: formData.rules.reductionAmount
          }
          break
        case 'discount':
          data.rules = { discountRate: formData.rules.discountRate }
          break
        case 'buy_gift':
          data.rules = { giftName: formData.rules.giftName }
          break
      }

      if (editingId) {
        await api.updateActivity(editingId, data)
        showToast('活动更新成功', 'success')
      } else {
        await api.createActivity(data)
        showToast('活动创建成功', 'success')
      }

      loadActivities()
      resetForm()
    } catch (err: any) {
      showToast(err.message || '操作失败', 'error')
    }
  }

  const handleEdit = (activity: Activity) => {
    setEditingId(activity.id)
    setShowForm(true)
    setFormData({
      name: activity.name,
      type: activity.type,
      startTime: activity.startTime.slice(0, 16),
      endTime: activity.endTime.slice(0, 16),
      rules: {
        fullAmount: activity.rules.fullAmount || 100,
        reductionAmount: activity.rules.reductionAmount || 20,
        discountRate: activity.rules.discountRate || 0.8,
        giftName: activity.rules.giftName || ''
      }
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个活动吗？')) return
    try {
      await api.deleteActivity(id)
      showToast('活动删除成功', 'success')
      loadActivities()
    } catch (err: any) {
      showToast(err.message || '删除失败', 'error')
    }
  }

  const resetForm = () => {
    setFormData(defaultFormData)
    setShowForm(false)
    setEditingId(null)
  }

  const getRulePreview = (): string => {
    switch (formData.type) {
      case 'full_reduction':
        return `满${formData.rules.fullAmount}元减${formData.rules.reductionAmount}元`
      case 'discount':
        return `打${(formData.rules.discountRate * 10).toFixed(1)}折`
      case 'buy_gift':
        return formData.rules.giftName ? `买指定商品送${formData.rules.giftName}` : '请输入赠品名称'
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>促销活动管理</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + 创建活动
        </button>
      </div>

      {showForm && (
        <div className="card form-card">
          <h3>{editingId ? '编辑活动' : '创建新活动'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>活动名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入活动名称"
                  required
                />
              </div>
              <div className="form-group">
                <label>活动类型</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value as ActivityType })}
                >
                  <option value="full_reduction">满减：满X减Y</option>
                  <option value="discount">折扣：打Z折</option>
                  <option value="buy_gift">买赠：买A送B</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>开始时间</label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>结束时间</label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>规则详情</label>
              {formData.type === 'full_reduction' && (
                <div className="rule-inputs">
                  <div className="form-group inline">
                    <label>满额（元）</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.rules.fullAmount}
                      onChange={e => setFormData({
                        ...formData,
                        rules: { ...formData.rules, fullAmount: Number(e.target.value) }
                      })}
                    />
                  </div>
                  <div className="form-group inline">
                    <label>减额（元）</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.rules.reductionAmount}
                      onChange={e => setFormData({
                        ...formData,
                        rules: { ...formData.rules, reductionAmount: Number(e.target.value) }
                      })}
                    />
                  </div>
                </div>
              )}
              {formData.type === 'discount' && (
                <div className="rule-inputs">
                  <div className="form-group inline">
                    <label>折扣率（0-1）</label>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={formData.rules.discountRate}
                      onChange={e => setFormData({
                        ...formData,
                        rules: { ...formData.rules, discountRate: Number(e.target.value) }
                      })}
                    />
                  </div>
                </div>
              )}
              {formData.type === 'buy_gift' && (
                <div className="rule-inputs">
                  <div className="form-group inline">
                    <label>赠品名称</label>
                    <input
                      type="text"
                      placeholder="请输入赠品名称"
                      value={formData.rules.giftName}
                      onChange={e => setFormData({
                        ...formData,
                        rules: { ...formData.rules, giftName: e.target.value }
                      })}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="rule-preview">
              <span className="preview-label">规则预览：</span>
              <span className="preview-text">{getRulePreview()}</span>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                取消
              </button>
              <button type="submit" className="btn btn-primary">
                {editingId ? '保存修改' : '创建活动'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="table-header">
          <div className="filters">
            <label>状态筛选：</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
            >
              <option value="all">全部</option>
              <option value="ongoing">进行中</option>
              <option value="not_started">未开始</option>
              <option value="ended">已结束</option>
            </select>
            <label style={{ marginLeft: 16 }}>排序：</label>
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as any)}
            >
              <option value="desc">开始时间降序</option>
              <option value="asc">开始时间升序</option>
            </select>
          </div>
          <div className="count-info">
            共 {filteredAndSorted.length} 条记录
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>活动名称</th>
                <th>类型</th>
                <th>规则简述</th>
                <th>开始时间</th>
                <th>结束时间</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-row">暂无数据</td>
                </tr>
              ) : (
                paginatedData.map(activity => (
                  <tr
                    key={activity.id}
                    className={activity.status === 'ongoing' ? 'breathing-row' : ''}
                  >
                    <td className="name-cell">{activity.name}</td>
                    <td>
                      <span
                        className="type-tag"
                        style={{ backgroundColor: getTypeColor(activity.type) }}
                      >
                        {getTypeLabel(activity.type)}
                      </span>
                    </td>
                    <td>{activity.ruleSummary}</td>
                    <td>{new Date(activity.startTime).toLocaleString('zh-CN')}</td>
                    <td>{new Date(activity.endTime).toLocaleString('zh-CN')}</td>
                    <td>
                      <span className="status-cell">
                        <span
                          className="status-dot"
                          style={{ backgroundColor: getStatusColor(activity.status!) }}
                        ></span>
                        {getStatusLabel(activity.status!)}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-link"
                        onClick={() => handleEdit(activity)}
                      >
                        编辑
                      </button>
                      <button
                        className="btn-link btn-danger"
                        onClick={() => handleDelete(activity.id)}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="btn btn-secondary"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              上一页
            </button>
            <span className="page-info">
              第 {currentPage} / {totalPages} 页
            </span>
            <button
              className="btn btn-secondary"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              下一页
            </button>
          </div>
        )}
      </div>

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default ActivityManager
