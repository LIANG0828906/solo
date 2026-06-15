import client from './client';

export interface Tool {
  id: string;
  name: string;
  model: string;
  purchase_date: string;
  last_maintenance_date: string;
  maintenance_cycle_months: number;
  next_maintenance_date: string;
  days_until_maintenance: number;
  is_overdue: boolean;
  created_at: string;
}

export interface MaintenanceRecord {
  id: string;
  tool_id: string;
  maintenance_date: string;
  description?: string;
  cost?: number;
}

export interface ToolDetail extends Tool {
  maintenance_records: MaintenanceRecord[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const getTools = async (): Promise<Tool[]> => {
  const response = await client.get<any, ApiResponse<Tool[]>>('/tools');
  return response.data;
};

export const getOverdueTools = async (): Promise<Tool[]> => {
  const response = await client.get<any, ApiResponse<Tool[]>>('/tools/overdue');
  return response.data;
};

export const getToolById = async (id: string): Promise<ToolDetail> => {
  const response = await client.get<any, ApiResponse<ToolDetail>>(`/tools/${id}`);
  return response.data;
};

export const addTool = async (tool: Omit<Tool, 'id' | 'next_maintenance_date' | 'days_until_maintenance' | 'is_overdue' | 'created_at'>): Promise<Tool> => {
  const response = await client.post<any, ApiResponse<Tool>>('/tools', tool);
  return response.data;
};

export const recordMaintenance = async (
  toolId: string,
  maintenanceData: { maintenance_date?: string; description?: string; cost?: number }
): Promise<{ tool: Tool; record: MaintenanceRecord }> => {
  const response = await client.post<any, ApiResponse<{ tool: Tool; record: MaintenanceRecord }>>(
    `/tools/${toolId}/maintenance`,
    maintenanceData
  );
  return response.data;
};

export const deleteTool = async (id: string): Promise<void> => {
  await client.delete(`/tools/${id}`);
};
