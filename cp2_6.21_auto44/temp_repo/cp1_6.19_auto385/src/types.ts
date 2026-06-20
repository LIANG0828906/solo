export type AttendanceStatus = 'normal' | 'late' | 'absent';

export interface PunchRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  timestamp: number;
  status: AttendanceStatus;
  date: string;
  hour: number;
}

export interface EmployeeBalance {
  employeeId: string;
  employeeName: string;
  totalOvertime: number;
  usedLeave: number;
  remaining: number;
}

export interface DailyStats {
  date: string;
  totalHours: number;
  lateCount: number;
}

export interface AttendanceStore {
  records: PunchRecord[];
  balances: EmployeeBalance[];
  dailyStats: DailyStats[];
  message: { text: string; type: AttendanceStatus | 'leave' } | null;
  messageVisible: boolean;
  isPunching: boolean;
  currentEmployee: { id: string; name: string };
  actions: {
    punchIn: () => Promise<void>;
    fetchRecords: () => Promise<void>;
    applyLeave: (employeeId: string, hours: number) => Promise<void>;
    setMessage: (msg: { text: string; type: AttendanceStatus | 'leave' } | null) => void;
    setMessageVisible: (visible: boolean) => void;
  };
}
