import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = 3001;
const JWT_SECRET = 'ancient-medical-hall-secret-key';

app.use(cors());
app.use(express.json());

interface User {
  id: number;
  username: string;
  password: string;
  role: 'patient' | 'doctor' | 'owner';
  name: string;
}

interface Schedule {
  id: number;
  doctorId: number;
  doctorName: string;
  dayOfWeek: number;
  timeSlot: 'morning' | 'afternoon';
  totalSlots: number;
  bookedSlots: number;
}

interface Appointment {
  id: string;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  scheduleId: number;
  date: string;
  timeSlot: 'morning' | 'afternoon';
  status: 'pending' | 'in-progress' | 'completed';
}

interface Message {
  id: number;
  appointmentId: string;
  senderId: number;
  senderRole: 'patient' | 'doctor';
  content: string;
  timestamp: Date;
}

interface Herb {
  id: number;
  name: string;
  nature: '温' | '热' | '寒' | '凉' | '平';
  flavor: '辛' | '甘' | '酸' | '苦' | '咸';
  defaultDosage: string;
  processing: string;
  stock: number;
}

interface PrescriptionItem {
  herbId: number;
  herbName: string;
  dosage: number;
  unit: string;
  processing: string;
}

interface Prescription {
  id: number;
  appointmentId: string;
  doctorId: number;
  items: PrescriptionItem[];
  status: '待抓' | '称药中' | '分装中' | '煎煮中' | '已完成';
  createdAt: Date;
}

const mockUsers: User[] = [
  { id: 1, username: 'patient1', password: '123456', role: 'patient', name: '张小明' },
  { id: 2, username: 'patient2', password: '123456', role: 'patient', name: '李小花' },
  { id: 3, username: 'doctor1', password: '123456', role: 'doctor', name: '华佗' },
  { id: 4, username: 'doctor2', password: '123456', role: 'doctor', name: '张仲景' },
  { id: 5, username: 'doctor3', password: '123456', role: 'doctor', name: '孙思邈' },
  { id: 6, username: 'owner', password: '123456', role: 'owner', name: '王掌柜' },
];

const mockHerbs: Herb[] = [
  { id: 1, name: '黄芪', nature: '温', flavor: '甘', defaultDosage: '15g', processing: '生用', stock: 500 },
  { id: 2, name: '人参', nature: '温', flavor: '甘', defaultDosage: '10g', processing: '另煎', stock: 100 },
  { id: 3, name: '当归', nature: '温', flavor: '甘', defaultDosage: '12g', processing: '酒炒', stock: 300 },
  { id: 4, name: '肉桂', nature: '热', flavor: '辛', defaultDosage: '6g', processing: '研末冲服', stock: 200 },
  { id: 5, name: '附子', nature: '热', flavor: '辛', defaultDosage: '9g', processing: '先煎', stock: 150 },
  { id: 6, name: '薄荷', nature: '凉', flavor: '辛', defaultDosage: '6g', processing: '后下', stock: 250 },
  { id: 7, name: '菊花', nature: '凉', flavor: '甘', defaultDosage: '10g', processing: '生用', stock: 400 },
  { id: 8, name: '金银花', nature: '寒', flavor: '甘', defaultDosage: '15g', processing: '生用', stock: 350 },
  { id: 9, name: '黄连', nature: '寒', flavor: '苦', defaultDosage: '6g', processing: '酒炒', stock: 180 },
  { id: 10, name: '甘草', nature: '平', flavor: '甘', defaultDosage: '6g', processing: '炙用', stock: 600 },
  { id: 11, name: '茯苓', nature: '平', flavor: '甘', defaultDosage: '15g', processing: '生用', stock: 450 },
  { id: 12, name: '川芎', nature: '温', flavor: '辛', defaultDosage: '10g', processing: '生用', stock: 280 },
];

function generateWeekSchedule(): Schedule[] {
  const schedules: Schedule[] = [];
  const doctors = mockUsers.filter(u => u.role === 'doctor');
  let id = 1;
  for (let day = 1; day <= 7; day++) {
    for (const slot of ['morning', 'afternoon'] as const) {
      for (const doctor of doctors) {
        if (Math.random() > 0.4) {
          const total = Math.floor(Math.random() * 8) + 3;
          const booked = Math.floor(Math.random() * total);
          schedules.push({
            id: id++,
            doctorId: doctor.id,
            doctorName: doctor.name,
            dayOfWeek: day,
            timeSlot: slot,
            totalSlots: total,
            bookedSlots: booked
          });
        }
      }
    }
  }
  return schedules;
}

let schedules = generateWeekSchedule();
let appointments: Appointment[] = [];
let messages: Message[] = [];
let prescriptions: Prescription[] = [];
let appointmentCounter: Record<string, number> = {};

function generateAppointmentCode(dateStr: string): string {
  if (!appointmentCounter[dateStr]) {
    appointmentCounter[dateStr] = 0;
  }
  appointmentCounter[dateStr]++;
  return `${dateStr}-${String(appointmentCounter[dateStr]).padStart(3, '0')}`;
}

function formatDate(date: Date): string {
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return y + m + d;
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未授权' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: '无效令牌' });
    (req as any).user = user as User;
    next();
  });
}

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { username, password, name } = req.body;
  if (mockUsers.find(u => u.username === username)) {
    return res.status(400).json({ error: '用户名已存在' });
  }
  const newUser: User = {
    id: mockUsers.length + 1,
    username,
    password,
    role: 'patient',
    name
  };
  mockUsers.push(newUser);
  const token = jwt.sign({ id: newUser.id, role: newUser.role, name: newUser.name }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: newUser.id, role: newUser.role, name: newUser.name } });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = mockUsers.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(400).json({ error: '用户名或密码错误' });
  }
  const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, role: user.role, name: user.name } });
});

app.get('/api/schedules', authenticateToken, (req: Request, res: Response) => {
  const monday = getMonday(new Date());
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    weekDates.push(`${d.getMonth() + 1}/${d.getDate()}`);
  }
  res.json({ schedules, weekDates });
});

app.post('/api/appointments', authenticateToken, (req: Request, res: Response) => {
  const { scheduleId, dayOffset } = req.body;
  const schedule = schedules.find(s => s.id === scheduleId);
  const user = (req as any).user;
  if (!schedule) return res.status(404).json({ error: '排班不存在' });
  if (schedule.bookedSlots >= schedule.totalSlots) {
    return res.status(400).json({ error: '该时段已约满' });
  }
  const monday = getMonday(new Date());
  const apptDate = new Date(monday);
  apptDate.setDate(apptDate.getDate() + (schedule.dayOfWeek - 1));
  const dateStr = formatDate(apptDate);
  const id = generateAppointmentCode(dateStr);
  const patient = mockUsers.find(u => u.id === user.id);
  const doctor = mockUsers.find(u => u.id === schedule.doctorId);
  const appointment: Appointment = {
    id,
    patientId: user.id,
    patientName: patient?.name || '',
    doctorId: schedule.doctorId,
    doctorName: doctor?.name || '',
    scheduleId: schedule.id,
    date: `${apptDate.getFullYear()}-${String(apptDate.getMonth() + 1).padStart(2, '0')}-${String(apptDate.getDate()).padStart(2, '0')}`,
    timeSlot: schedule.timeSlot,
    status: 'pending'
  };
  appointments.push(appointment);
  schedule.bookedSlots++;
  res.json({ appointment, schedule });
});

app.get('/api/appointments/my', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user;
  let result: Appointment[] = [];
  if (user.role === 'patient') {
    result = appointments.filter(a => a.patientId === user.id);
  } else if (user.role === 'doctor') {
    result = appointments.filter(a => a.doctorId === user.id);
  } else {
    result = appointments;
  }
  res.json(result);
});

app.get('/api/messages/:appointmentId', authenticateToken, (req: Request, res: Response) => {
  const msgs = messages.filter(m => m.appointmentId === req.params.appointmentId);
  res.json(msgs);
});

app.post('/api/messages', authenticateToken, (req: Request, res: Response) => {
  const { appointmentId, content } = req.body;
  const user = (req as any).user;
  const message: Message = {
    id: messages.length + 1,
    appointmentId,
    senderId: user.id,
    senderRole: user.role === 'doctor' ? 'doctor' : 'patient',
    content,
    timestamp: new Date()
  };
  messages.push(message);
  res.json(message);
});

app.get('/api/herbs', authenticateToken, (_req: Request, res: Response) => {
  res.json(mockHerbs);
});

app.post('/api/prescriptions', authenticateToken, (req: Request, res: Response) => {
  const { appointmentId, items } = req.body;
  const user = (req as any).user;
  const prescription: Prescription = {
    id: prescriptions.length + 1,
    appointmentId,
    doctorId: user.id,
    items,
    status: '待抓',
    createdAt: new Date()
  };
  prescriptions.push(prescription);
  res.json(prescription);
});

app.get('/api/prescriptions/:appointmentId', authenticateToken, (req: Request, res: Response) => {
  const pres = prescriptions.find(p => p.appointmentId === req.params.appointmentId);
  res.json(pres || null);
});

app.put('/api/prescriptions/:id/status', authenticateToken, (req: Request, res: Response) => {
  const { status } = req.body;
  const pres = prescriptions.find(p => p.id === parseInt(req.params.id));
  if (pres) {
    pres.status = status;
  }
  res.json(pres);
});

app.get('/api/pharmacy/dashboard', authenticateToken, (req: Request, res: Response) => {
  res.json({
    herbs: mockHerbs,
    prescriptions: prescriptions,
    totalPrescriptions: prescriptions.length,
    completedCount: prescriptions.filter(p => p.status === '已完成').length
  });
});

app.get('/api/doctor/today', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user;
  const today = new Date().toISOString().split('T')[0];
  const todaysAppointments = appointments.filter(
    a => a.doctorId === user.id && a.date === today
  );
  res.json(todaysAppointments);
});

app.listen(PORT, () => {
  console.log(`医馆服务已启动：http://localhost:${PORT}`);
});
