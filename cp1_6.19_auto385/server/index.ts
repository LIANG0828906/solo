import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type { Request, Response } from 'express';
import type { PunchRecord, EmployeeBalance, AttendanceStatus } from '../src/types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

interface PunchRequest {
  employeeId: string;
  employeeName: string;
  timestamp: number;
}

interface LeaveRequest {
  employeeId: string;
  hours: number;
}

const records: PunchRecord[] = [];
const balances: EmployeeBalance[] = [
  { employeeId: 'emp001', employeeName: '张三', totalOvertime: 32, usedLeave: 8, remaining: 24 },
  { employeeId: 'emp002', employeeName: '李四', totalOvertime: 16, usedLeave: 12, remaining: 4 },
  { employeeId: 'emp003', employeeName: '王五', totalOvertime: 48, usedLeave: 10, remaining: 38 },
  { employeeId: 'emp004', employeeName: '赵六', totalOvertime: 24, usedLeave: 20, remaining: 4 },
  { employeeId: 'emp005', employeeName: '孙七', totalOvertime: 40, usedLeave: 5, remaining: 35 },
];

const generateMockData = () => {
  const employees = [
    { id: 'emp001', name: '张三' },
    { id: 'emp002', name: '李四' },
    { id: 'emp003', name: '王五' },
    { id: 'emp004', name: '赵六' },
    { id: 'emp005', name: '孙七' },
  ];

  const now = new Date();
  
  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    const date = new Date(now);
    date.setDate(date.getDate() - dayOffset);
    const dateStr = date.toISOString().split('T')[0];
    
    employees.forEach(emp => {
      const startHour = 8 + Math.floor(Math.random() * 2);
      const endHour = startHour + 8 + Math.floor(Math.random() * 3);
      
      for (let hour = startHour; hour < endHour; hour++) {
        const status: AttendanceStatus = 
          hour === 9 && Math.random() > 0.7 ? 'late' :
          hour === 10 && Math.random() > 0.85 ? 'absent' : 'normal';
        
        records.push({
          id: uuidv4(),
          employeeId: emp.id,
          employeeName: emp.name,
          timestamp: date.getTime() + hour * 3600000,
          status,
          date: dateStr,
          hour,
        });
      }
    });
  }
};

generateMockData();

const getStatus = (hour: number, minute: number): AttendanceStatus => {
  if (hour < 9) return 'normal';
  if (hour === 9 && minute === 0) return 'normal';
  if (hour === 9 && minute <= 30) return 'late';
  return 'absent';
};

app.get('/api/records', (_req: Request, res: Response) => {
  res.json(records);
});

app.get('/api/balances', (_req: Request, res: Response) => {
  res.json(balances);
});

app.post('/api/punch', (req: Request<unknown, unknown, PunchRequest>, res: Response) => {
  const { employeeId, employeeName, timestamp } = req.body;
  
  const punchTime = new Date(timestamp);
  const hour = punchTime.getHours();
  const minute = punchTime.getMinutes();
  const status = getStatus(hour, minute);
  const date = punchTime.toISOString().split('T')[0];
  
  const record: PunchRecord = {
    id: uuidv4(),
    employeeId,
    employeeName,
    timestamp,
    status,
    date,
    hour,
  };
  
  records.push(record);
  
  if (hour >= 18) {
    const balance = balances.find(b => b.employeeId === employeeId);
    if (balance) {
      const overtimeHours = hour - 18;
      balance.totalOvertime += overtimeHours;
      balance.remaining += overtimeHours;
    }
  }
  
  setTimeout(() => {
    res.json(record);
  }, 100);
});

app.post('/api/leave', (req: Request<unknown, unknown, LeaveRequest>, res: Response) => {
  const { employeeId, hours } = req.body;
  
  const balance = balances.find(b => b.employeeId === employeeId);
  
  if (!balance) {
    return res.status(404).json({ error: '员工不存在' });
  }
  
  if (balance.remaining < hours) {
    return res.status(400).json({ error: '调休余额不足' });
  }
  
  balance.usedLeave += hours;
  balance.remaining -= hours;
  
  setTimeout(() => {
    res.json(balance);
  }, 100);
});

app.listen(PORT, () => {
  console.log(`考勤服务已启动: http://localhost:${PORT}`);
});
