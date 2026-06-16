import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { useAppStore } from '@/store/appStore'
import { TEMPLATE_TYPE_LABELS } from '@/types'
import type { ContractTemplate } from '@/types'
import './ContractEdit.css'

export default function ContractEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    templates,
    getContractById,
    addContract,
    updateContract,
    markRentPaid,
    renewContract,
  } = useAppStore()

  const isNew = id === 'new' || !id
  const existingContract = !isNew ? getContractById(id!) : null

  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [tenantName, setTenantName] = useState('')
  const [tenantPhone, setTenantPhone] = useState('')
  const [tenantIdCard, setTenantIdCard] = useState('')
  const [startDate, setStartDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [endDate, setEndDate] = useState(dayjs().add(1, 'year').format('YYYY-MM-DD'))
  const [monthlyRent, setMonthlyRent] = useState(3000)
  const [depositRatio, setDepositRatio] = useState(2)

  const [showRenewModal, setShowRenewModal] = useState(false)
  const [renewEndDate, setRenewEndDate] = useState('')
  const rentTableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (existingContract) {
      setSelectedTemplateId(existingContract.templateId)
      setTenantName(existingContract.tenantName)
      setTenantPhone(existingContract.tenantPhone)
      setTenantIdCard(existingContract.tenantIdCard)
      setStartDate(existingContract.startDate)
      setEndDate(existingContract.endDate)
      setMonthlyRent(existingContract.monthlyRent)
      setDepositRatio(existingContract.depositRatio)
    } else if (templates.length > 0) {
      setSelectedTemplateId(templates[0].id)
    }
  }, [existingContract, templates])

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId),
    [templates, selectedTemplateId]
  )

  const rentRecords = useMemo(() => {
    if (existingContract) return existingContract.rentRecords
    if (!selectedTemplate) return []

    const records = []
    const start = dayjs(startDate)
    const end = dayjs(endDate)
    const now = dayjs()

    let current = start.startOf('month')
    const endMonth = end.endOf('month')

    while (current.isBefore(endMonth) || current.isSame(endMonth, 'month')) {
      const monthStart = current.startOf('month')
      const monthEnd = current.endOf('month')

      const periodStart = current.isBefore(start) ? start : monthStart
      const periodEnd = current.isAfter(end, 'month') ? end : monthEnd

      const daysInMonth = monthEnd.diff(monthStart, 'day') + 1
      const daysInPeriod = periodEnd.diff(periodStart, 'day') + 1

      const dueAmount = Math.round((monthlyRent / daysInMonth) * daysInPeriod * 100) / 100

      let status: 'paid' | 'overdue' | 'pending' = 'pending'
      const paidAmount = 0

      if (now.isAfter(monthEnd)) {
        status = 'overdue'
      }

      records.push({
        id: `temp-${current.format('YYYY-MM')}`,
        month: current.format('YYYY-MM'),
        dueAmount,
        paidAmount,
        pendingAmount: dueAmount - paidAmount,
        status,
      })

      current = current.add(1, 'month')
    }

    return records
  }, [existingContract, selectedTemplate, startDate, endDate, monthlyRent])

  const depositAmount = useMemo(
    () => Math.round(monthlyRent * depositRatio * 100) / 100,
    [monthlyRent, depositRatio]
  )

  const contractText = useMemo(() => {
    if (!selectedTemplate) return ''

    const template = selectedTemplate as ContractTemplate
    const leaseMonths = dayjs(endDate).diff(dayjs(startDate), 'month', true).toFixed(1)

    let text = `\n\n                    《${template.name}》\n\n`
    text += `出租方（以下简称甲方）：________________\n\n`
    text += `承租方（以下简称乙方）：${tenantName || '___________'}\n`
    text += `身份证号：${tenantIdCard || '___________'}\n`
    text += `联系电话：${tenantPhone || '___________'}\n\n`
    text += `根据《中华人民共和国民法典》及相关法律法规的规定，甲乙双方在平等、自愿的基础上，就租赁事宜达成如下协议：\n\n`

    text += `第一条 租赁期限\n`
    text += `${template.fixedClauses.leaseTerm}\n`
    text += `租赁期限自 ${startDate} 起至 ${endDate} 止，共计 ${leaseMonths} 个月。\n\n`

    text += `第二条 租金及支付方式\n`
    text += `${template.fixedClauses.rent}\n`
    text += `月租金为人民币 ${monthlyRent} 元整，乙方应于每月5日前支付当月租金。\n\n`

    text += `第三条 押金\n`
    text += `${template.fixedClauses.deposit}\n`
    text += `押金为 ${depositRatio} 个月租金，共计人民币 ${depositAmount} 元整。\n\n`

    template.customClauses.forEach((clause, index) => {
      text += `第${['四', '五', '六', '七', '八', '九', '十'][index] || index + 4}条 ${clause.title}\n`
      text += `${clause.content}\n\n`
    })

    text += `本合同一式两份，甲乙双方各执一份，自双方签字之日起生效。\n\n\n`
    text += `甲方签字：________________    日期：___________\n\n`
    text += `乙方签字：________________    日期：___________\n`

    return text
  }, [selectedTemplate, tenantName, tenantPhone, tenantIdCard, startDate, endDate, monthlyRent, depositRatio, depositAmount])

  const handleCopyContract = async () => {
    try {
      await navigator.clipboard.writeText(contractText)
      alert('合同文本已复制到剪贴板')
    } catch {
      alert('复制失败，请手动选择复制')
    }
  }

  const handleSave = async () => {
    if (!selectedTemplate) {
      alert('请选择模板')
      return
    }
    if (!tenantName.trim()) {
      alert('请输入承租方姓名')
      return
    }
    if (!startDate || !endDate) {
      alert('请选择租赁起止日期')
      return
    }
    if (dayjs(endDate).isBefore(dayjs(startDate))) {
      alert('结束日期不能早于开始日期')
      return
    }

    const contractData = {
      templateId: selectedTemplateId,
      templateName: selectedTemplate.name,
      tenantName: tenantName.trim(),
      tenantPhone: tenantPhone.trim(),
      tenantIdCard: tenantIdCard.trim(),
      startDate,
      endDate,
      monthlyRent: Number(monthlyRent),
      depositRatio: Number(depositRatio),
    }

    if (isNew) {
      await addContract(contractData)
      alert('合同创建成功')
    } else {
      await updateContract(id!, contractData)
      alert('合同更新成功')
    }
    navigate('/dashboard')
  }

  const handleMarkPaid = async (rentRecordId: string) => {
    if (!existingContract) return
    await markRentPaid(existingContract.id, rentRecordId)
  }

  const handleRenew = async () => {
    if (!existingContract || !renewEndDate) return

    const newContractId = await renewContract(existingContract.id, renewEndDate)
    if (newContractId) {
      setShowRenewModal(false)
      navigate(`/contract/${newContractId}`)
    } else {
      alert('续租失败，请检查日期')
    }
  }

  const getStatusBadge = (status: 'paid' | 'overdue' | 'pending') => {
    switch (status) {
      case 'paid':
        return <span className="badge badge-success">已付</span>
      case 'overdue':
        return <span className="badge badge-danger">逾期</span>
      case 'pending':
        return <span className="badge badge-warning">待付</span>
    }
  }

  const Row = useCallback(({ record, isPaid, onMarkPaid }: {
    record: typeof rentRecords[number]
    isPaid: boolean
    onMarkPaid: () => void
  }) => (
    <div className="rent-table-row">
      <div className="rent-table-cell rent-month">{record.month}</div>
      <div className="rent-table-cell rent-amount">¥{record.dueAmount.toFixed(2)}</div>
      <div className="rent-table-cell rent-amount">¥{record.paidAmount.toFixed(2)}</div>
      <div className="rent-table-cell rent-amount">¥{record.pendingAmount.toFixed(2)}</div>
      <div className="rent-table-cell rent-status">{getStatusBadge(record.status)}</div>
      <div className="rent-table-cell rent-action">
        {!isPaid && existingContract && (
          <button
            className="btn btn-primary btn-sm"
            onClick={onMarkPaid}
          >
            标记已付款
          </button>
        )}
      </div>
    </div>
  ), [existingContract])

  return (
    <div className="contract-edit-page page-container">
      <div className="page-header">
        <h1 className="page-title">
          {isNew ? '新建合同' : '合同详情'}
        </h1>
        <div className="page-actions">
          {!isNew && existingContract && (
            <button
              className="btn btn-secondary"
              onClick={() => setShowRenewModal(true)}
            >
              🔄 续租
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={handleSave}
          >
            {isNew ? '创建合同' : '保存修改'}
          </button>
        </div>
      </div>

      <div className="contract-edit-layout">
        <div className="contract-form-section">
          <div className="form-card card">
            <h2 className="section-title">基本信息</h2>

            <div className="form-group">
              <label className="form-label">选择模板</label>
              <select
                className="form-input"
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                disabled={!isNew}
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}（{TEMPLATE_TYPE_LABELS[t.type]}）
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">承租方姓名</label>
              <input
                type="text"
                className="form-input"
                placeholder="请输入承租方姓名"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">联系电话</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="请输入联系电话"
                  value={tenantPhone}
                  onChange={(e) => setTenantPhone(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">身份证号</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="请输入身份证号"
                  value={tenantIdCard}
                  onChange={(e) => setTenantIdCard(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">开始日期</label>
                <input
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">结束日期</label>
                <input
                  type="date"
                  className="form-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">月租金（元）</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="请输入月租金"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(Number(e.target.value))}
                  min={0}
                />
              </div>
              <div className="form-group">
                <label className="form-label">押金（月数）</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="请输入押金月数"
                  value={depositRatio}
                  onChange={(e) => setDepositRatio(Number(e.target.value))}
                  min={0}
                  step={0.5}
                />
              </div>
            </div>

            <div className="deposit-summary">
              <span>押金金额：</span>
              <span className="deposit-amount">¥{depositAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="contract-preview-section">
          <div className="preview-card card">
            <div className="preview-header">
              <h2 className="section-title">合同预览</h2>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleCopyContract}
              >
                📋 复制全文
              </button>
            </div>
            <pre className="contract-preview-text">
              {contractText}
            </pre>
          </div>
        </div>
      </div>

      <div className="rent-section card">
        <div className="section-header">
          <h2 className="section-title">租金明细表</h2>
          <div className="rent-stats">
            <span className="stat-item">
              <span className="stat-label">总期数：</span>
              <span className="stat-value">{rentRecords.length}期</span>
            </span>
            <span className="stat-item">
              <span className="stat-label">已付：</span>
              <span className="stat-value stat-success">
                {rentRecords.filter(r => r.status === 'paid').length}期
              </span>
            </span>
            <span className="stat-item">
              <span className="stat-label">待付：</span>
              <span className="stat-value stat-warning">
                {rentRecords.filter(r => r.status === 'pending').length}期
              </span>
            </span>
            <span className="stat-item">
              <span className="stat-label">逾期：</span>
              <span className="stat-value stat-danger">
                {rentRecords.filter(r => r.status === 'overdue').length}期
              </span>
            </span>
          </div>
        </div>

        <div className="rent-table-container" ref={rentTableRef}>
          <div className="rent-table-header">
            <div className="rent-table-cell rent-month">月份</div>
            <div className="rent-table-cell rent-amount">应付金额</div>
            <div className="rent-table-cell rent-amount">已付金额</div>
            <div className="rent-table-cell rent-amount">待付金额</div>
            <div className="rent-table-cell rent-status">状态</div>
            <div className="rent-table-cell rent-action">操作</div>
          </div>
          <div className="rent-table-body">
            {rentRecords.map((record) => (
              <Row
                key={record.id}
                record={record}
                isPaid={record.status === 'paid'}
                onMarkPaid={() => handleMarkPaid(record.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {showRenewModal && existingContract && (
        <div className="modal-overlay" onClick={() => setShowRenewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">续租合同</h2>
            <p className="modal-desc">
              原合同租期：{existingContract.startDate} 至 {existingContract.endDate}
            </p>
            <p className="modal-desc">
              续租开始日期：{dayjs(existingContract.endDate).add(1, 'day').format('YYYY-MM-DD')}
            </p>

            <div className="form-group">
              <label className="form-label">续租结束日期</label>
              <input
                type="date"
                className="form-input"
                value={renewEndDate}
                onChange={(e) => setRenewEndDate(e.target.value)}
                min={dayjs(existingContract.endDate).add(1, 'day').format('YYYY-MM-DD')}
              />
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowRenewModal(false)}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleRenew}
                disabled={!renewEndDate}
              >
                确认续租
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
