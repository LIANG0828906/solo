import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'
import type { ContractTemplate, Contract, RentRecord, ContractStatus, CustomClause, TemplateType } from '@/types'
import { dbStore } from './dbStore'

interface AppState {
  templates: ContractTemplate[]
  contracts: Contract[]
  isLoading: boolean

  initData: () => Promise<void>

  addTemplate: (template: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateTemplate: (id: string, template: Partial<ContractTemplate>) => Promise<void>
  deleteTemplate: (id: string) => Promise<void>
  getTemplateById: (id: string) => ContractTemplate | undefined

  addContract: (contract: Omit<Contract, 'id' | 'createdAt' | 'updatedAt' | 'rentRecords' | 'status' | 'depositAmount'> & {
    startDate: string
    endDate: string
    monthlyRent: number
    depositRatio: number
  }) => Promise<void>
  updateContract: (id: string, contract: Partial<Contract>) => Promise<void>
  deleteContract: (id: string) => Promise<void>
  getContractById: (id: string) => Contract | undefined
  updateContractStatus: (id: string, status: ContractStatus) => Promise<void>
  markRentPaid: (contractId: string, rentRecordId: string) => Promise<void>
  renewContract: (contractId: string, newEndDate: string) => Promise<string | null>
}

function generateRentRecords(startDate: string, endDate: string, monthlyRent: number): RentRecord[] {
  const records: RentRecord[] = []
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
      id: uuidv4(),
      month: current.format('YYYY-MM'),
      dueAmount,
      paidAmount,
      pendingAmount: dueAmount - paidAmount,
      status,
    })

    current = current.add(1, 'month')
  }

  return records
}

function getDefaultCustomClauses(type: TemplateType): CustomClause[] {
  const baseClauses: CustomClause[] = [
    { id: uuidv4(), title: '维修责任', content: '租赁期间，房屋及其附属设施的维修责任由双方协商确定。' },
    { id: uuidv4(), title: '违约责任', content: '任何一方违反合同约定，应承担相应的违约责任。' },
  ]

  if (type === 'residential') {
    return [
      ...baseClauses,
      { id: uuidv4(), title: '水电费', content: '租赁期间的水费、电费、燃气费、物业费等由承租方承担。' },
    ]
  }
  if (type === 'commercial') {
    return [
      ...baseClauses,
      { id: uuidv4(), title: '经营范围', content: '承租方应在合法范围内从事经营活动，不得擅自改变房屋用途。' },
    ]
  }
  if (type === 'equipment') {
    return [
      ...baseClauses,
      { id: uuidv4(), title: '设备保养', content: '承租方应妥善保管和保养设备，租赁期满后设备应完好归还。' },
    ]
  }

  return baseClauses
}

function createDefaultTemplate(type: TemplateType, name: string): Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name,
    type,
    fixedClauses: {
      leaseTerm: '租赁期限自起始日期起至结束日期止，共计若干个月。',
      rent: '租金按月支付，承租方应于每月规定日期前支付当月租金。',
      deposit: '押金为X个月租金，合同期满且无违约情况下全额退还。',
    },
    customClauses: getDefaultCustomClauses(type),
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  templates: [],
  contracts: [],
  isLoading: true,

  initData: async () => {
    try {
      const [templates, contracts] = await Promise.all([
        dbStore.getAllTemplates(),
        dbStore.getAllContracts(),
      ])

      if (templates.length === 0) {
        const defaultTemplates: ContractTemplate[] = [
          { ...createDefaultTemplate('residential', '住宅租赁合同模板'), id: uuidv4(), createdAt: Date.now(), updatedAt: Date.now() },
          { ...createDefaultTemplate('commercial', '商铺租赁合同模板'), id: uuidv4(), createdAt: Date.now(), updatedAt: Date.now() },
          { ...createDefaultTemplate('equipment', '设备租赁合同模板'), id: uuidv4(), createdAt: Date.now(), updatedAt: Date.now() },
        ]
        for (const t of defaultTemplates) {
          await dbStore.addTemplate(t)
        }
        set({ templates: defaultTemplates, contracts, isLoading: false })
      } else {
        set({ templates, contracts, isLoading: false })
      }
    } catch (error) {
      console.error('Failed to initialize data:', error)
      set({ isLoading: false })
    }
  },

  addTemplate: async (template) => {
    const newTemplate: ContractTemplate = {
      ...template,
      id: uuidv4(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    await dbStore.addTemplate(newTemplate)
    set((state) => ({
      templates: [newTemplate, ...state.templates].sort((a, b) => b.updatedAt - a.updatedAt),
    }))
  },

  updateTemplate: async (id, updates) => {
    const template = get().templates.find((t) => t.id === id)
    if (!template) return

    const updated: ContractTemplate = {
      ...template,
      ...updates,
      updatedAt: Date.now(),
    }
    await dbStore.updateTemplate(updated)
    set((state) => ({
      templates: state.templates.map((t) => (t.id === id ? updated : t)).sort((a, b) => b.updatedAt - a.updatedAt),
    }))
  },

  deleteTemplate: async (id) => {
    await dbStore.deleteTemplate(id)
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id),
    }))
  },

  getTemplateById: (id) => {
    return get().templates.find((t) => t.id === id)
  },

  addContract: async (contractData) => {
    const rentRecords = generateRentRecords(
      contractData.startDate,
      contractData.endDate,
      contractData.monthlyRent
    )

    const depositAmount = Math.round(contractData.monthlyRent * contractData.depositRatio * 100) / 100

    const newContract: Contract = {
      ...contractData,
      id: uuidv4(),
      depositAmount,
      rentRecords,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    await dbStore.addContract(newContract)
    set((state) => ({
      contracts: [newContract, ...state.contracts].sort((a, b) => b.createdAt - a.createdAt),
    }))
  },

  updateContract: async (id, updates) => {
    const contract = get().contracts.find((c) => c.id === id)
    if (!contract) return

    const updated: Contract = {
      ...contract,
      ...updates,
      updatedAt: Date.now(),
    }
    await dbStore.updateContract(updated)
    set((state) => ({
      contracts: state.contracts.map((c) => (c.id === id ? updated : c)),
    }))
  },

  deleteContract: async (id) => {
    await dbStore.deleteContract(id)
    set((state) => ({
      contracts: state.contracts.filter((c) => c.id !== id),
    }))
  },

  getContractById: (id) => {
    return get().contracts.find((c) => c.id === id)
  },

  updateContractStatus: async (id, status) => {
    await get().updateContract(id, { status })
  },

  markRentPaid: async (contractId, rentRecordId) => {
    const contract = get().contracts.find((c) => c.id === contractId)
    if (!contract) return

    const updatedRecords = contract.rentRecords.map((r) =>
      r.id === rentRecordId
        ? { ...r, paidAmount: r.dueAmount, pendingAmount: 0, status: 'paid' as const }
        : r
    )

    await get().updateContract(contractId, { rentRecords: updatedRecords })
  },

  renewContract: async (contractId, newEndDate) => {
    const contract = get().contracts.find((c) => c.id === contractId)
    if (!contract) return null

    const oldEnd = dayjs(contract.endDate)
    const newStart = oldEnd.add(1, 'day')

    if (newStart.isAfter(dayjs(newEndDate))) {
      return null
    }

    const rentRecords = generateRentRecords(
      newStart.format('YYYY-MM-DD'),
      newEndDate,
      contract.monthlyRent
    )

    const newContract: Contract = {
      ...contract,
      id: uuidv4(),
      startDate: newStart.format('YYYY-MM-DD'),
      endDate: newEndDate,
      rentRecords,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    await dbStore.addContract(newContract)
    set((state) => ({
      contracts: [newContract, ...state.contracts].sort((a, b) => b.createdAt - a.createdAt),
    }))

    return newContract.id
  },
}))
