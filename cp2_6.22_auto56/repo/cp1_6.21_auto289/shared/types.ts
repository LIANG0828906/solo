export interface Task {
  id: string;
  name: string;
  clientId: string | null;
  clientName?: string;
  startTime: string;
  endTime: string | null;
  duration: number;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  address: string;
  createdAt: string;
}

export interface TimerState {
  isRunning: boolean;
  currentTask: string;
  clientId: string | null;
  startTime: string | null;
  accumulatedTime: number;
}

export interface Settings {
  userName: string;
  hourlyRate: number;
  logoData: string;
}

export interface TaskSummary {
  date: string;
  totalHours: number;
}

export interface TaskGroup {
  taskName: string;
  clientName: string | null;
  clientId: string | null;
  totalDuration: number;
  count: number;
}

export interface SummaryResponse {
  dailySummary: TaskSummary[];
  taskGroups: TaskGroup[];
  totalHours: number;
}

export interface InvoiceData {
  client: Client;
  tasks: Task[];
  settings: Settings;
  totalHours: number;
  totalAmount: number;
  dateRange: {
    start: string;
    end: string;
  };
}
