import type {
  Student,
  CoursePackage,
  ConsumeRecord,
  RenewRecord,
  TransferRecord,
} from './types';

export interface StudentListResponse {
  list: Student[];
  total: number;
}

export interface StatsOverview {
  totalStudents: number;
  todayConsume: number;
  remainingHours: number;
}

const request = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
};

export const api = {
  getCoursePackages: () =>
    request<CoursePackage[]>('/api/course-packages'),

  getStudents: (params: {
    search?: string;
    status?: string;
    sort?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== null) {
        qs.set(k, String(v));
      }
    });
    return request<StudentListResponse>(`/api/students?${qs.toString()}`);
  },

  createStudent: (data: { name: string; phone: string; packageId: string }) =>
    request<Student>('/api/students', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getStudent: (id: string) => request<Student>(`/api/students/${id}`),

  getConsumeRecords: (studentId: string) =>
    request<ConsumeRecord[]>(`/api/students/${studentId}/consume-records`),

  getRenewRecords: (studentId: string) =>
    request<RenewRecord[]>(`/api/students/${studentId}/renew-records`),

  getTransferRecords: (studentId: string) =>
    request<TransferRecord[]>(`/api/students/${studentId}/transfer-records`),

  consumeHours: (
    studentId: string,
    data: { packageId: string; hours: number; note?: string }
  ) =>
    request<{ success: boolean; record: ConsumeRecord; student: Student }>(
      `/api/students/${studentId}/consume`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  renewPackage: (
    studentId: string,
    data: { packageId: string; hours: number }
  ) =>
    request<{ success: boolean; record: RenewRecord; student: Student }>(
      `/api/students/${studentId}/renew`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  transferHours: (
    studentId: string,
    data: { fromPackageId: string; toPackageId: string; hours: number }
  ) =>
    request<{ success: boolean; record: TransferRecord; student: Student }>(
      `/api/students/${studentId}/transfer`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  getOverviewStats: () =>
    request<StatsOverview>('/api/stats/overview'),
};
