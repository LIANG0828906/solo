import type { Employee, ScheduleWeek, DayKey, ShiftType } from '../types';

const BASE_URL = '/api/schedules';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || '请求失败');
  }
  return response.json();
}

export const healthApi = {
  async getEmployees(): Promise<Employee[]> {
    const response = await fetch(`${BASE_URL}/employees`);
    return handleResponse(response);
  },

  async createEmployee(data: { name: string }): Promise<Employee> {
    const response = await fetch(`${BASE_URL}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  async reorderEmployees(orders: { employeeId: string; order: number }[]): Promise<Employee[]> {
    const response = await fetch(`${BASE_URL}/employees/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders })
    });
    return handleResponse(response);
  },

  async getWeekSchedule(): Promise<ScheduleWeek> {
    const response = await fetch(`${BASE_URL}/week`);
    return handleResponse(response);
  },

  async updateShift(
    employeeId: string,
    day: DayKey,
    shift: ShiftType | null
  ): Promise<{ employeeId: string; day: DayKey; shift: ShiftType | null }> {
    const response = await fetch(`${BASE_URL}/${employeeId}/${day}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shift })
    });
    return handleResponse(response);
  }
};
