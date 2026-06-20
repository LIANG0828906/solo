import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());

interface Employee {
  id: string;
  name: string;
  annualLeaveBalance: number;
}

interface TimeSheet {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  hours: number;
  remark: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const employees: Employee[] = [
  { id: '1', name: '张三', annualLeaveBalance: 15 },
  { id: '2', name: '李四', annualLeaveBalance: 15 },
  { id: '3', name: '王五', annualLeaveBalance: 15 },
];

const timesheets: TimeSheet[] = [];

app.get('/api/timesheets', (req: Request, res: Response) => {
  const { status, employee, month } = req.query;
  let result = [...timesheets];

  if (status && typeof status === 'string') {
    result = result.filter((t) => t.status === status);
  }
  if (employee && typeof employee === 'string') {
    result = result.filter((t) => t.employeeName === employee);
  }
  if (month && typeof month === 'string') {
    result = result.filter((t) => t.date.startsWith(month));
  }

  res.json(result);
});

app.post('/api/timesheets', (req: Request, res: Response) => {
  const { employeeId, date, hours, remark } = req.body;

  const employee = employees.find((e) => e.id === employeeId);
  if (!employee) {
    res.status(404).json({ error: '员工不存在' });
    return;
  }

  const dateObj = new Date(date);
  const dayOfWeek = dateObj.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    res.status(400).json({ error: '不能提交周末的工时' });
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const submitDate = new Date(date);
  submitDate.setHours(0, 0, 0, 0);

  if (submitDate < firstOfMonth || submitDate >= today) {
    res.status(400).json({ error: '日期必须在当月1日至昨日之间' });
    return;
  }

  if (hours < 0.5 || hours > 24) {
    res.status(400).json({ error: '工时必须在0.5-24小时之间' });
    return;
  }

  if (remark && remark.length > 100) {
    res.status(400).json({ error: '备注不能超过100字' });
    return;
  }

  const newTimesheet: TimeSheet = {
    id: uuidv4(),
    employeeId,
    employeeName: employee.name,
    date,
    hours,
    remark: remark || '',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  timesheets.push(newTimesheet);
  res.status(201).json(newTimesheet);
});

app.patch('/api/timesheets/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const timesheet = timesheets.find((t) => t.id === id);
  if (!timesheet) {
    res.status(404).json({ error: '工时记录不存在' });
    return;
  }

  if (timesheet.status !== 'pending') {
    res.status(400).json({ error: '只能审批pending状态的工时' });
    return;
  }

  if (status !== 'approved' && status !== 'rejected') {
    res.status(400).json({ error: '状态只能改为approved或rejected' });
    return;
  }

  if (status === 'approved') {
    const employee = employees.find((e) => e.id === timesheet.employeeId);
    if (!employee) {
      res.status(404).json({ error: '员工不存在' });
      return;
    }

    if (employee.annualLeaveBalance <= 0) {
      res.status(409).json({ error: '该员工年假余额不足' });
      return;
    }

    employee.annualLeaveBalance -= 1;
  }

  timesheet.status = status;

  res.json({
    timesheet,
    employees: employees.map((e) => ({ id: e.id, name: e.name, annualLeaveBalance: e.annualLeaveBalance })),
  });
});

app.get('/api/leaves', (_req: Request, res: Response) => {
  res.json(
    employees.map((e) => ({
      id: e.id,
      name: e.name,
      annualLeaveBalance: e.annualLeaveBalance,
    }))
  );
});

app.get('/api/employees', (_req: Request, res: Response) => {
  res.json(employees.map((e) => ({ id: e.id, name: e.name })));
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
