export type OrderStatus = 'design' | 'cutting' | 'stitching' | 'edge' | 'quality' | 'done';

export type ProcessStatus = 'pending' | 'running' | 'paused' | 'completed';

export interface Process {
  id: string;
  name: string;
  status: ProcessStatus;
  hourlyRate: number;
  elapsedMs: number;
  startTime: number | null;
  isRunning: boolean;
}

export interface MaterialRecord {
  id: string;
  processId: string;
  leatherArea: number;
  hardwareCount: number;
  edgeOilAmount: number;
}

export interface Order {
  id: string;
  orderNo: string;
  customerName: string;
  productName: string;
  status: OrderStatus;
  createdAt: string;
  currentProcessIndex: number;
  processes: Process[];
  materials: MaterialRecord[];
}

export interface Settings {
  leatherPrice: number;
  hardwarePrice: number;
  edgeOilPrice: number;
  processRates: Record<string, number>;
}
