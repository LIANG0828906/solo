export type TemplateType = 'residential' | 'commercial' | 'equipment'

export interface CustomClause {
  id: string
  title: string
  content: string
}

export interface ContractTemplate {
  id: string
  name: string
  type: TemplateType
  fixedClauses: {
    leaseTerm: string
    rent: string
    deposit: string
  }
  customClauses: CustomClause[]
  createdAt: number
  updatedAt: number
}

export type ContractStatus = 'active' | 'expiring' | 'expired' | 'terminated'

export interface RentRecord {
  id: string
  month: string
  dueAmount: number
  paidAmount: number
  pendingAmount: number
  status: 'paid' | 'overdue' | 'pending'
}

export interface Contract {
  id: string
  templateId: string
  templateName: string
  tenantName: string
  tenantPhone: string
  tenantIdCard: string
  startDate: string
  endDate: string
  monthlyRent: number
  depositRatio: number
  depositAmount: number
  status: ContractStatus
  rentRecords: RentRecord[]
  createdAt: number
  updatedAt: number
}

export const TEMPLATE_TYPE_LABELS: Record<TemplateType, string> = {
  residential: '住宅租赁',
  commercial: '商铺租赁',
  equipment: '设备租赁',
}

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  active: '有效',
  expiring: '即将到期',
  expired: '已过期',
  terminated: '已终止',
}
