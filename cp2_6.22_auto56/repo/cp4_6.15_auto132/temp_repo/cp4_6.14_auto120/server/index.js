import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const MEMBERSHIP_DAYS = {
  '月卡': 30,
  '季卡': 90,
  '年卡': 365,
};

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d, days) {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

function getTodayStr() {
  return formatDate(new Date());
}

function getSevenDaysLaterStr() {
  return formatDate(addDays(new Date(), 7));
}

function computeStatus(expiryDate) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return '已过期';
  if (diffDays <= 7) return '即将到期';
  return '有效';
}

function createSeedMembers() {
  const today = new Date();
  return [
    { id: uuidv4(), name: '张伟', membershipType: '月卡', expiryDate: formatDate(addDays(today, -10)) },
    { id: uuidv4(), name: '李娜', membershipType: '季卡', expiryDate: formatDate(addDays(today, -2)) },
    { id: uuidv4(), name: '王芳', membershipType: '年卡', expiryDate: formatDate(addDays(today, 2)) },
    { id: uuidv4(), name: '赵磊', membershipType: '月卡', expiryDate: formatDate(addDays(today, 5)) },
    { id: uuidv4(), name: '孙丽', membershipType: '季卡', expiryDate: formatDate(addDays(today, 15)) },
    { id: uuidv4(), name: '周洋', membershipType: '年卡', expiryDate: formatDate(addDays(today, 60)) },
    { id: uuidv4(), name: '吴强', membershipType: '月卡', expiryDate: formatDate(addDays(today, 25)) },
    { id: uuidv4(), name: '郑雪', membershipType: '季卡', expiryDate: formatDate(addDays(today, 90)) },
    { id: uuidv4(), name: '刘明远', membershipType: '年卡', expiryDate: formatDate(addDays(today, 200)) },
    { id: uuidv4(), name: '陈静怡', membershipType: '年卡', expiryDate: formatDate(addDays(today, 365)) },
  ];
}

function createSeedCourses() {
  const courseNames = ['瑜伽', '动感单车', '搏击操', '普拉提', 'CrossFit', 'BodyPump', '拉伸放松'];
  const coaches = ['王教练', '李教练', '张教练', '刘教练', '陈教练', '赵教练', '杨教练'];
  const timeSlots = ['09:00', '14:00', '19:00'];
  const courses = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let day = 0; day < 7; day++) {
    const date = addDays(today, day);
    const dateStr = formatDate(date);
    for (let slot = 0; slot < 3; slot++) {
      const idx = (day * 3 + slot) % courseNames.length;
      const coachIdx = (day * 3 + slot) % coaches.length;
      courses.push({
        id: uuidv4(),
        name: courseNames[idx],
        coach: coaches[coachIdx],
        date: dateStr,
        timeSlot: timeSlots[slot],
        capacity: 20,
        bookings: [],
      });
    }
  }
  return courses;
}

let members = createSeedMembers();
let courses = createSeedCourses();

function getDaysDiff(expiryDate) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffMs = expiry.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

const SORT_PRIORITY = {
  '即将到期': 0,
  '有效': 1,
  '已过期': 2,
};

app.get('/api/members', (req, res) => {
  const result = members
    .map(m => ({ ...m, status: computeStatus(m.expiryDate) }))
    .sort((a, b) => {
      const pa = SORT_PRIORITY[a.status];
      const pb = SORT_PRIORITY[b.status];
      if (pa !== pb) return pa - pb;
      return getDaysDiff(a.expiryDate) - getDaysDiff(b.expiryDate);
    });
  res.json({ success: true, data: result });
});

app.post('/api/members', (req, res) => {
  const { name, membershipType } = req.body;

  if (!name || !/^[\u4e00-\u9fa5]{2,10}$/.test(name)) {
    res.status(400).json({ success: false, error: '姓名必须为2-10个中文字符' });
    return;
  }

  if (!MEMBERSHIP_DAYS[membershipType]) {
    res.status(400).json({ success: false, error: '会员类型无效，可选：月卡、季卡、年卡' });
    return;
  }

  const expiryDate = formatDate(addDays(new Date(), MEMBERSHIP_DAYS[membershipType]));

  const member = {
    id: uuidv4(),
    name,
    membershipType,
    expiryDate,
  };

  members.push(member);

  res.status(201).json({ success: true, data: { ...member, status: computeStatus(member.expiryDate) } });
});

app.put('/api/members/:id/renew', (req, res) => {
  const { id } = req.params;
  const { membershipType } = req.body;

  if (!MEMBERSHIP_DAYS[membershipType]) {
    res.status(400).json({ success: false, error: '会员类型无效，可选：月卡、季卡、年卡' });
    return;
  }

  const member = members.find(m => m.id === id);

  if (!member) {
    res.status(404).json({ success: false, error: '会员不存在' });
    return;
  }

  member.membershipType = membershipType;
  member.expiryDate = formatDate(addDays(new Date(), MEMBERSHIP_DAYS[membershipType]));

  res.json({ success: true, data: { ...member, status: computeStatus(member.expiryDate) } });
});

app.get('/api/bookings', (req, res) => {
  const todayStr = getTodayStr();
  const sevenDaysLater = formatDate(addDays(new Date(), 6));

  const result = courses
    .filter(c => c.date >= todayStr && c.date <= sevenDaysLater)
    .map(c => ({
      ...c,
      remainingCapacity: c.capacity - c.bookings.length,
    }));

  res.json({ success: true, data: result });
});

app.post('/api/bookings', (req, res) => {
  const { courseId, memberName, memberId } = req.body;

  if (!courseId || !memberName || !memberId) {
    res.status(400).json({ success: false, error: '缺少必要参数：courseId, memberName, memberId' });
    return;
  }

  const member = members.find(m => m.id === memberId);
  if (!member) {
    res.status(404).json({ success: false, error: '会员不存在' });
    return;
  }

  const status = computeStatus(member.expiryDate);
  if (status === '已过期') {
    res.status(400).json({ success: false, error: '会员已过期，无法预约课程' });
    return;
  }

  const course = courses.find(c => c.id === courseId);
  if (!course) {
    res.status(404).json({ success: false, error: '课程不存在' });
    return;
  }

  if (course.bookings.length >= course.capacity) {
    res.status(400).json({ success: false, error: '课程已满，无法预约' });
    return;
  }

  const booking = {
    id: uuidv4(),
    courseId,
    memberName,
    memberId,
  };

  course.bookings.push(booking);

  res.status(201).json({ success: true, data: booking });
});

app.delete('/api/bookings/:id', (req, res) => {
  const { id } = req.params;

  for (const course of courses) {
    const idx = course.bookings.findIndex(b => b.id === id);
    if (idx !== -1) {
      course.bookings.splice(idx, 1);
      res.json({ success: true, message: '取消预约成功' });
      return;
    }
  }

  res.status(404).json({ success: false, error: '预约记录不存在' });
});

app.get('/api/coach/schedule', (req, res) => {
  const todayStr = getTodayStr();

  const result = courses
    .filter(c => c.date === todayStr)
    .map(c => ({
      id: c.id,
      name: c.name,
      coach: c.coach,
      date: c.date,
      timeSlot: c.timeSlot,
      capacity: c.capacity,
      bookedStudents: c.bookings.map(b => b.memberName),
      totalBooked: c.bookings.length,
    }))
    .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

  res.json({ success: true, data: result });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'API not found' });
});

app.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
});
