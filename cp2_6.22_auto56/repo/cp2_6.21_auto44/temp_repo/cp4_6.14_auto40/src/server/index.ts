import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { v4 as uuid } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

interface TeacherData {
  id: string;
  name: string;
  role: 'teacher';
  avatar: string;
  bio: string;
  courses: { id: string; teacherId: string; type: string; duration: 30 | 45 | 60; price: number }[];
}

interface StudentData {
  id: string;
  name: string;
  role: 'student';
  avatar: string;
}

interface TimeSlotData {
  id: string;
  teacherId: string;
  dayOfWeek: number;
  startTime: string;
  isBooked: boolean;
}

interface BookingData {
  id: string;
  studentId: string;
  teacherId: string;
  courseId: string;
  date: string;
  startTime: string;
  endTime: string;
  note: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  review?: { id: string; bookingId: string; rating: number; description: string; createdAt: string };
  tasks?: { id: string; bookingId: string; title: string; description: string; dueDate: string; isCompleted: boolean; recordingUrl?: string; recordingName?: string }[];
}

let teachers: TeacherData[] = [
  {
    id: 't1',
    name: '李明老师',
    role: 'teacher',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20asian%20male%20music%20teacher%20portrait%20headshot%20warm%20lighting&image_size=square',
    bio: '中央音乐学院钢琴系毕业，15年教学经验，擅长古典与爵士钢琴',
    courses: [
      { id: 'c1', teacherId: 't1', type: '钢琴', duration: 30, price: 150 },
      { id: 'c2', teacherId: 't1', type: '钢琴', duration: 45, price: 200 },
      { id: 'c3', teacherId: 't1', type: '钢琴', duration: 60, price: 260 },
    ],
  },
  {
    id: 't2',
    name: '王芳老师',
    role: 'teacher',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20asian%20female%20guitar%20teacher%20portrait%20headshot%20warm%20lighting&image_size=square',
    bio: '吉他演奏硕士，8年教学经验，精通民谣吉他与指弹',
    courses: [
      { id: 'c4', teacherId: 't2', type: '吉他', duration: 30, price: 120 },
      { id: 'c5', teacherId: 't2', type: '吉他', duration: 45, price: 170 },
      { id: 'c6', teacherId: 't2', type: '吉他', duration: 60, price: 220 },
    ],
  },
  {
    id: 't3',
    name: '张华老师',
    role: 'teacher',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20asian%20female%20vocal%20teacher%20portrait%20headshot%20warm%20lighting&image_size=square',
    bio: '声乐博士，10年舞台经验，专攻美声与流行唱法',
    courses: [
      { id: 'c7', teacherId: 't3', type: '声乐', duration: 30, price: 130 },
      { id: 'c8', teacherId: 't3', type: '声乐', duration: 45, price: 180 },
      { id: 'c9', teacherId: 't3', type: '声乐', duration: 60, price: 240 },
    ],
  },
];

let students: StudentData[] = [
  { id: 's1', name: '小明同学', role: 'student', avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=young%20asian%20male%20student%20portrait%20headshot%20warm%20lighting&image_size=square' },
  { id: 's2', name: '小红同学', role: 'student', avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=young%20asian%20female%20student%20portrait%20headshot%20warm%20lighting&image_size=square' },
];

let timeSlots: TimeSlotData[] = [];
let bookings: BookingData[] = [];

function initializeTimeSlots() {
  const slots: TimeSlotData[] = [];
  for (const teacher of teachers) {
    for (let day = 1; day <= 5; day++) {
      for (let hour = 9; hour <= 20; hour++) {
        for (let min = 0; min < 60; min += 30) {
          slots.push({
            id: uuid(),
            teacherId: teacher.id,
            dayOfWeek: day,
            startTime: `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
            isBooked: false,
          });
        }
      }
    }
  }
  return slots;
}

timeSlots = initializeTimeSlots();

const sampleBookingDates = [
  getDateStr(-14), getDateStr(-12), getDateStr(-10), getDateStr(-7),
  getDateStr(-5), getDateStr(-3), getDateStr(-1), getDateStr(0),
  getDateStr(2), getDateStr(4), getDateStr(7),
];

function getDateStr(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

const sampleBookings: BookingData[] = [
  {
    id: uuid(), studentId: 's1', teacherId: 't1', courseId: 'c2',
    date: sampleBookingDates[0], startTime: '10:00', endTime: '10:45',
    note: '想练习贝多芬月光奏鸣曲第一乐章', status: 'completed',
    review: { id: uuid(), bookingId: '', rating: 4, description: '节奏感有进步，注意左手和弦的连贯性', createdAt: sampleBookingDates[0] },
    tasks: [
      { id: uuid(), bookingId: '', title: '练习C大调音阶', description: '每天15分钟，注意指法', dueDate: sampleBookingDates[1], isCompleted: true },
      { id: uuid(), bookingId: '', title: '月光奏鸣曲第一页', description: '右手旋律线条要连贯', dueDate: sampleBookingDates[1], isCompleted: true },
      { id: uuid(), bookingId: '', title: '和弦转换练习', description: 'C-Am-F-G进行', dueDate: sampleBookingDates[2], isCompleted: true },
    ],
  },
  {
    id: uuid(), studentId: 's1', teacherId: 't1', courseId: 'c3',
    date: sampleBookingDates[2], startTime: '14:00', endTime: '15:00',
    note: '肖邦夜曲Op.9 No.2', status: 'completed',
    review: { id: uuid(), bookingId: '', rating: 5, description: '表现力提升很大，踏板运用更细腻了', createdAt: sampleBookingDates[2] },
    tasks: [
      { id: uuid(), bookingId: '', title: '肖邦夜曲第9-16小节', description: '注意rubato的处理', dueDate: sampleBookingDates[3], isCompleted: true },
      { id: uuid(), bookingId: '', title: '哈农练习曲第31条', description: '提高手指独立性', dueDate: sampleBookingDates[3], isCompleted: true },
      { id: uuid(), bookingId: '', title: '视奏练习', description: '每天一首新谱', dueDate: sampleBookingDates[4], isCompleted: false },
    ],
  },
  {
    id: uuid(), studentId: 's1', teacherId: 't2', courseId: 'c4',
    date: sampleBookingDates[4], startTime: '16:00', endTime: '16:30',
    note: '想学指弹天空之城', status: 'completed',
    review: { id: uuid(), bookingId: '', rating: 3, description: '左手按弦力度需要加强，继续练习', createdAt: sampleBookingDates[4] },
    tasks: [
      { id: uuid(), bookingId: '', title: '天空之城前奏部分', description: '注意泛音技巧', dueDate: sampleBookingDates[5], isCompleted: true },
      { id: uuid(), bookingId: '', title: 'C-G-Am-Em进行', description: '转换要流畅', dueDate: sampleBookingDates[5], isCompleted: false },
    ],
  },
  {
    id: uuid(), studentId: 's1', teacherId: 't1', courseId: 'c2',
    date: sampleBookingDates[6], startTime: '10:00', endTime: '10:45',
    note: '复习月光奏鸣曲', status: 'completed',
    review: { id: uuid(), bookingId: '', rating: 4, description: '整体不错，第三页的力度变化可以更明显', createdAt: sampleBookingDates[6] },
    tasks: [
      { id: uuid(), bookingId: '', title: '月光奏鸣曲完整练习', description: '注意段落间的衔接', dueDate: sampleBookingDates[8], isCompleted: false },
      { id: uuid(), bookingId: '', title: '音阶提速练习', description: '目标120BPM', dueDate: sampleBookingDates[8], isCompleted: false },
    ],
  },
  {
    id: uuid(), studentId: 's1', teacherId: 't2', courseId: 'c5',
    date: sampleBookingDates[7], startTime: '11:00', endTime: '11:45',
    note: '继续天空之城', status: 'confirmed',
    tasks: [],
  },
  {
    id: uuid(), studentId: 's1', teacherId: 't3', courseId: 'c7',
    date: sampleBookingDates[8], startTime: '15:00', endTime: '15:30',
    note: '想学流行歌曲演唱技巧', status: 'confirmed',
    tasks: [],
  },
  {
    id: uuid(), studentId: 's1', teacherId: 't1', courseId: 'c3',
    date: sampleBookingDates[9], startTime: '14:00', endTime: '15:00',
    note: '准备考级曲目', status: 'pending',
    tasks: [],
  },
  {
    id: uuid(), studentId: 's2', teacherId: 't1', courseId: 'c1',
    date: sampleBookingDates[3], startTime: '09:00', endTime: '09:30',
    note: '零基础入门', status: 'completed',
    review: { id: uuid(), bookingId: '', rating: 4, description: '第一节课，乐感不错', createdAt: sampleBookingDates[3] },
    tasks: [
      { id: uuid(), bookingId: '', title: '认识键盘', description: '记住中央C的位置', dueDate: sampleBookingDates[5], isCompleted: true },
    ],
  },
  {
    id: uuid(), studentId: 's2', teacherId: 't3', courseId: 'c8',
    date: sampleBookingDates[5], startTime: '17:00', endTime: '17:45',
    note: '想学美声', status: 'completed',
    review: { id: uuid(), bookingId: '', rating: 5, description: '气息控制有进步', createdAt: sampleBookingDates[5] },
    tasks: [
      { id: uuid(), bookingId: '', title: '腹式呼吸练习', description: '每天5分钟', dueDate: sampleBookingDates[7], isCompleted: true },
      { id: uuid(), bookingId: '', title: '元音发声练习', description: 'a-e-i-o-u', dueDate: sampleBookingDates[7], isCompleted: false },
    ],
  },
];

sampleBookings.forEach(b => {
  if (b.review) b.review.bookingId = b.id;
  if (b.tasks) b.tasks.forEach(t => t.bookingId = b.id);
  const slot = timeSlots.find(s =>
    s.teacherId === b.teacherId &&
    s.startTime === b.startTime &&
    !s.isBooked
  );
  if (slot) slot.isBooked = true;
});

bookings = [...sampleBookings];

function saveToLocalStorage() {
  try {
    const data = JSON.stringify({ teachers, students, timeSlots, bookings });
    process.env.BROWSER
      ? localStorage.setItem('music-tutor-backup', data)
      : require('fs').writeFileSync('backup.json', data);
  } catch {}
}

setInterval(saveToLocalStorage, 5 * 60 * 1000);

const wsClients = new Map<string, WebSocket>();

function broadcast(message: { type: string; payload: any }, excludeId?: string) {
  const msg = JSON.stringify(message);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

wss.on('connection', (ws) => {
  const clientId = uuid();
  wsClients.set(clientId, ws);

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'identify') {
        (ws as any).userId = msg.userId;
      }
    } catch {}
  });

  ws.on('close', () => {
    wsClients.delete(clientId);
  });
});

app.get('/api/teachers', (req, res) => {
  const { search, courseType } = req.query;
  let result = [...teachers];
  if (search && typeof search === 'string') {
    const s = search.toLowerCase();
    result = result.filter(t => t.name.toLowerCase().includes(s));
  }
  if (courseType && typeof courseType === 'string') {
    result = result.filter(t => t.courses.some(c => c.type === courseType));
  }
  res.json(result);
});

app.get('/api/teachers/:id', (req, res) => {
  const teacher = teachers.find(t => t.id === req.params.id);
  if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
  res.json(teacher);
});

app.get('/api/teachers/:id/slots', (req, res) => {
  const { date } = req.query;
  const teacherSlots = timeSlots.filter(s => s.teacherId === req.params.id);
  res.json(teacherSlots);
});

app.get('/api/teachers/:id/calendar', (req, res) => {
  const teacherId = req.params.id;
  const teacherBookings = bookings.filter(b => b.teacherId === teacherId);
  const teacherSlots = timeSlots.filter(s => s.teacherId === teacherId);
  res.json({ bookings: teacherBookings, slots: teacherSlots });
});

app.post('/api/bookings', (req, res) => {
  const { studentId, teacherId, courseId, date, startTime, note } = req.body;
  const course = teachers.flatMap(t => t.courses).find(c => c.id === courseId);
  if (!course) return res.status(400).json({ error: 'Invalid course' });

  const [h, m] = startTime.split(':').map(Number);
  const endMinutes = h * 60 + m + course.duration;
  const endH = Math.floor(endMinutes / 60);
  const endM = endMinutes % 60;
  const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

  const slot = timeSlots.find(s =>
    s.teacherId === teacherId &&
    s.startTime === startTime &&
    !s.isBooked
  );
  if (slot) slot.isBooked = true;

  const booking: BookingData = {
    id: uuid(),
    studentId,
    teacherId,
    courseId,
    date,
    startTime,
    endTime,
    note: note || '',
    status: 'pending',
    tasks: [],
  };
  bookings.push(booking);

  broadcast({ type: 'booking_created', payload: booking });

  res.status(201).json(booking);
});

app.get('/api/students/:id/bookings', (req, res) => {
  const studentBookings = bookings.filter(b => b.studentId === req.params.id);
  res.json(studentBookings);
});

app.get('/api/teachers/:id/bookings', (req, res) => {
  const teacherBookings = bookings.filter(b => b.teacherId === req.params.id);
  res.json(teacherBookings);
});

app.put('/api/bookings/:id/status', (req, res) => {
  const booking = bookings.find(b => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  booking.status = req.body.status;
  broadcast({ type: 'booking_updated', payload: booking });
  res.json(booking);
});

app.post('/api/bookings/:id/review', (req, res) => {
  const booking = bookings.find(b => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const review = {
    id: uuid(),
    bookingId: booking.id,
    rating: req.body.rating,
    description: req.body.description,
    createdAt: new Date().toISOString().split('T')[0],
  };
  booking.review = review;
  booking.status = 'completed';
  broadcast({ type: 'review_added', payload: { bookingId: booking.id, review } });
  res.status(201).json(review);
});

app.post('/api/bookings/:id/tasks', (req, res) => {
  const booking = bookings.find(b => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const tasks = (req.body.tasks || []).slice(0, 5).map((t: any) => ({
    id: uuid(),
    bookingId: booking.id,
    title: t.title,
    description: t.description,
    dueDate: t.dueDate,
    isCompleted: false,
  }));

  booking.tasks = [...(booking.tasks || []), ...tasks];
  broadcast({ type: 'booking_updated', payload: booking });
  res.status(201).json(tasks);
});

app.put('/api/tasks/:id/complete', (req, res) => {
  for (const booking of bookings) {
    const task = (booking.tasks || []).find(t => t.id === req.params.id);
    if (task) {
      task.isCompleted = true;
      broadcast({ type: 'task_completed', payload: { bookingId: booking.id, task } });
      return res.json(task);
    }
  }
  res.status(404).json({ error: 'Task not found' });
});

app.put('/api/tasks/:id/uncomplete', (req, res) => {
  for (const booking of bookings) {
    const task = (booking.tasks || []).find(t => t.id === req.params.id);
    if (task) {
      task.isCompleted = false;
      broadcast({ type: 'task_completed', payload: { bookingId: booking.id, task } });
      return res.json(task);
    }
  }
  res.status(404).json({ error: 'Task not found' });
});

app.post('/api/tasks/:id/recording', (req, res) => {
  for (const booking of bookings) {
    const task = (booking.tasks || []).find(t => t.id === req.params.id);
    if (task) {
      task.recordingUrl = req.body.recordingUrl;
      task.recordingName = req.body.recordingName;
      broadcast({ type: 'task_completed', payload: { bookingId: booking.id, task } });
      return res.json(task);
    }
  }
  res.status(404).json({ error: 'Task not found' });
});

app.get('/api/students/:id/progress', (req, res) => {
  const studentId = req.params.id;
  const studentBookings = bookings.filter(b => b.studentId === studentId);

  const totalBookings = studentBookings.length;
  const completedBookings = studentBookings.filter(b => b.status === 'completed').length;
  const completionRate = totalBookings > 0 ? completedBookings / totalBookings : 0;

  const allTasks = studentBookings.flatMap(b => b.tasks || []);
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(t => t.isCompleted).length;
  const taskCompletionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

  const reviews = studentBookings.filter(b => b.review).map(b => b.review!);
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const ratingHistory = reviews.map(r => ({
    date: r.createdAt,
    rating: r.rating,
  }));

  const weekMap = new Map<string, number>();
  studentBookings.forEach(b => {
    const course = teachers.flatMap(t => t.courses).find(c => c.id === b.courseId);
    const duration = course ? course.duration : 30;
    const weekLabel = b.date;
    weekMap.set(weekLabel, (weekMap.get(weekLabel) || 0) + duration / 60);
  });
  const weeklyHours = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, hours]) => ({ week, hours: Math.round(hours * 100) / 100 }));

  res.json({
    totalBookings,
    completedBookings,
    completionRate: Math.round(completionRate * 100) / 100,
    totalTasks,
    completedTasks,
    taskCompletionRate: Math.round(taskCompletionRate * 100) / 100,
    averageRating: Math.round(averageRating * 10) / 10,
    ratingHistory,
    weeklyHours,
  });
});

app.post('/api/teachers/:id/slots', (req, res) => {
  const { dayOfWeek, startTime } = req.body;
  const existing = timeSlots.find(s =>
    s.teacherId === req.params.id &&
    s.dayOfWeek === dayOfWeek &&
    s.startTime === startTime
  );
  if (existing) {
    return res.json(existing);
  }
  const slot: TimeSlotData = {
    id: uuid(),
    teacherId: req.params.id,
    dayOfWeek,
    startTime,
    isBooked: false,
  };
  timeSlots.push(slot);
  res.status(201).json(slot);
});

app.delete('/api/slots/:id', (req, res) => {
  const idx = timeSlots.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Slot not found' });
  if (timeSlots[idx].isBooked) return res.status(400).json({ error: 'Cannot delete booked slot' });
  timeSlots.splice(idx, 1);
  res.status(204).send();
});

app.post('/api/teachers', (req, res) => {
  const { name, bio, courses } = req.body;
  const teacher: TeacherData = {
    id: uuid(),
    name,
    role: 'teacher',
    avatar: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20music%20teacher%20portrait%20headshot&image_size=square`,
    bio,
    courses: (courses || []).map((c: any) => ({
      id: uuid(),
      teacherId: '',
      type: c.type,
      duration: c.duration,
      price: c.price,
    })),
  };
  teacher.courses.forEach(c => c.teacherId = teacher.id);
  teachers.push(teacher);
  res.status(201).json(teacher);
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
