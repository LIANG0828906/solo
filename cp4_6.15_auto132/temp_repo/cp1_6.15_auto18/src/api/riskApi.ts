export interface DepartmentSummary {
  id: string
  name: string
  riskLevel: 'low' | 'medium' | 'high'
  riskCount: number
  trend: 'up' | 'down' | 'flat'
}

export interface RiskSignal {
  type: 'attendance' | 'delay' | 'overtime'
  title: string
  description: string
  date: string
  value: string
}

export interface EmployeeRisk {
  id: string
  name: string
  position: string
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high'
  attendanceAnomalies: number
  taskDelayRatio: number
  overtimeChangeRate: number
  signals: RiskSignal[]
}

export interface DepartmentDetail {
  id: string
  name: string
  riskTrend: { week: string; score: number }[]
  employees: EmployeeRisk[]
}

export interface EmployeeDetail extends EmployeeRisk {
  timeline: RiskSignal[]
  suggestion: string
}

const BASE_URL = '/api'

async function request<T>(url: string): Promise<T> {
  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data as T
  } catch (error) {
    console.error('API request failed:', error)
    throw error
  }
}

export const riskApi = {
  getRiskSummary: (): Promise<DepartmentSummary[]> => {
    return request<DepartmentSummary[]>('/risk-summary')
  },

  getDepartmentDetail: (id: string): Promise<DepartmentDetail> => {
    return request<DepartmentDetail>(`/department/${id}`)
  },

  getEmployeeDetail: (id: string): Promise<EmployeeDetail> => {
    return request<EmployeeDetail>(`/employee/${id}`)
  }
}
