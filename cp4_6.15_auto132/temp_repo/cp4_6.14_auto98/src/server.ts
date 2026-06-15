import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type {
  Student,
  CoursePackage,
  ConsumeRecord,
  RenewRecord,
  TransferRecord,
} from './types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const coursePackages: CoursePackage[] = [
  { id: 'pkg-1', name: '英语48课时包', hours: 48 },
  { id: 'pkg-2', name: '数学60课时包', hours: 60 },
  { id: 'pkg-3', name: '语文36课时包', hours: 36 },
  { id: 'pkg-4', name: '物理30课时包', hours: 30 },
  { id: 'pkg-5', name: '化学24课时包', hours: 24 },
  { id: 'pkg-6', name: '英语口语20课时包', hours: 20 },
];

const generateSampleStudents = (): Student[] => {
  const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑一', '冯二'];
  const students: Student[] = names.map((name, idx) => {
    const pkg = coursePackages[idx % coursePackages.length];
    const totalHours = pkg.hours;
    const consumed = Math.floor(Math.random() * (totalHours - 5)) + 2;
    const lastConsume = new Date();
    lastConsume.setDate(lastConsume.getDate() - Math.floor(Math.random() * 30));
    return {
      id: uuidv4(),
      name,
      phone: `138${Math.floor(10000000 + Math.random() * 90000000)}`,
      packages: [
        {
          packageId: pkg.id,
          packageName: pkg.name,
          totalHours,
          remainingHours: totalHours - consumed,
        },
      ],
      status: Math.random() > 0.2 ? 'active' : 'inactive',
      createdAt: new Date().toISOString(),
      lastConsumeTime: lastConsume.toISOString(),
    };
  });
  return students;
};

let students: Student[] = generateSampleStudents();
const consumeRecords: ConsumeRecord[] = [];
const renewRecords: RenewRecord[] = [];
const transferRecords: TransferRecord[] = [];

students.forEach((student) => {
  const now = new Date();
  for (let i = 0; i < 5; i++) {
    const pkg = student.packages[0];
    if (!pkg) continue;
    const hours = Math.floor(Math.random() * 2) + 1;
    const timestamp = new Date(now.getTime() - i * 2 * 24 * 60 * 60 * 1000);
    consumeRecords.push({
      id: uuidv4(),
      studentId: student.id,
      packageId: pkg.packageId,
      packageName: pkg.packageName,
      hours,
      note: i === 0 ? '随堂测试' : '',
      timestamp: timestamp.toISOString(),
    });
  }
});

app.get('/api/course-packages', async (_req, res) => {
  await delay(150);
  res.json(coursePackages);
});

app.get('/api/students', async (req, res) => {
  await delay(200);
  const { search = '', status = '', sort = '', page = '1', pageSize = '10' } = req.query;
  let filtered = [...students];

  if (search) {
    const keyword = (search as string).toLowerCase();
    filtered = filtered.filter((s) => s.name.toLowerCase().includes(keyword));
  }
  if (status) {
    filtered = filtered.filter((s) => s.status === status);
  }
  if (sort === 'hours_desc') {
    filtered.sort(
      (a, b) =>
        b.packages.reduce((sum, p) => sum + p.remainingHours, 0) -
        a.packages.reduce((sum, p) => sum + p.remainingHours, 0)
    );
  } else if (sort === 'hours_asc') {
    filtered.sort(
      (a, b) =>
        a.packages.reduce((sum, p) => sum + p.remainingHours, 0) -
        b.packages.reduce((sum, p) => sum + p.remainingHours, 0)
    );
  }

  const pageNum = parseInt(page as string, 10);
  const size = parseInt(pageSize as string, 10);
  const start = (pageNum - 1) * size;
  const paginated = filtered.slice(start, start + size);

  res.json({
    list: paginated,
    total: filtered.length,
  });
});

app.post('/api/students', async (req, res) => {
  await delay(200);
  const { name, phone, packageId } = req.body;
  const pkg = coursePackages.find((p) => p.id === packageId);
  if (!pkg) {
    return res.status(400).json({ error: '课程包不存在' });
  }
  const student: Student = {
    id: uuidv4(),
    name,
    phone,
    packages: [
      {
        packageId: pkg.id,
        packageName: pkg.name,
        totalHours: pkg.hours,
        remainingHours: pkg.hours,
      },
    ],
    status: 'active',
    createdAt: new Date().toISOString(),
    lastConsumeTime: null,
  };
  students.push(student);
  res.json(student);
});

app.get('/api/students/:id', async (req, res) => {
  await delay(150);
  const student = students.find((s) => s.id === req.params.id);
  if (!student) {
    return res.status(404).json({ error: '学员不存在' });
  }
  res.json(student);
});

app.get('/api/students/:id/consume-records', async (req, res) => {
  await delay(150);
  const records = consumeRecords
    .filter((r) => r.studentId === req.params.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json(records);
});

app.get('/api/students/:id/renew-records', async (req, res) => {
  await delay(150);
  const records = renewRecords
    .filter((r) => r.studentId === req.params.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json(records);
});

app.get('/api/students/:id/transfer-records', async (req, res) => {
  await delay(150);
  const records = transferRecords
    .filter((r) => r.studentId === req.params.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json(records);
});

app.post('/api/students/:id/consume', async (req, res) => {
  await delay(200);
  const { packageId, hours, note = '' } = req.body;
  const student = students.find((s) => s.id === req.params.id);
  if (!student) {
    return res.status(404).json({ error: '学员不存在' });
  }
  const pkg = student.packages.find((p) => p.packageId === packageId);
  if (!pkg) {
    return res.status(400).json({ error: '该学员没有此课程包' });
  }
  if (pkg.remainingHours < hours) {
    return res.status(400).json({ error: '剩余课时不足' });
  }
  pkg.remainingHours -= hours;
  const timestamp = new Date().toISOString();
  student.lastConsumeTime = timestamp;
  const record: ConsumeRecord = {
    id: uuidv4(),
    studentId: student.id,
    packageId,
    packageName: pkg.packageName,
    hours,
    note,
    timestamp,
  };
  consumeRecords.push(record);
  res.json({ success: true, record, student });
});

app.post('/api/students/:id/renew', async (req, res) => {
  await delay(200);
  const { packageId, hours } = req.body;
  const student = students.find((s) => s.id === req.params.id);
  if (!student) {
    return res.status(404).json({ error: '学员不存在' });
  }
  const coursePkg = coursePackages.find((p) => p.id === packageId);
  if (!coursePkg) {
    return res.status(400).json({ error: '课程包不存在' });
  }
  const existingPkg = student.packages.find((p) => p.packageId === packageId);
  if (existingPkg) {
    existingPkg.remainingHours += hours;
    existingPkg.totalHours += hours;
  } else {
    student.packages.push({
      packageId,
      packageName: coursePkg.name,
      totalHours: hours,
      remainingHours: hours,
    });
  }
  const record: RenewRecord = {
    id: uuidv4(),
    studentId: student.id,
    packageId,
    packageName: coursePkg.name,
    addedHours: hours,
    timestamp: new Date().toISOString(),
  };
  renewRecords.push(record);
  res.json({ success: true, record, student });
});

app.post('/api/students/:id/transfer', async (req, res) => {
  await delay(200);
  const { fromPackageId, toPackageId, hours } = req.body;
  const student = students.find((s) => s.id === req.params.id);
  if (!student) {
    return res.status(404).json({ error: '学员不存在' });
  }
  const fromPkg = student.packages.find((p) => p.packageId === fromPackageId);
  if (!fromPkg) {
    return res.status(400).json({ error: '源课程包不存在' });
  }
  if (fromPkg.remainingHours < hours) {
    return res.status(400).json({ error: '调出课时不足' });
  }
  const toCoursePkg = coursePackages.find((p) => p.id === toPackageId);
  if (!toCoursePkg) {
    return res.status(400).json({ error: '目标课程包不存在' });
  }
  fromPkg.remainingHours -= hours;
  fromPkg.totalHours -= hours;
  const toPkg = student.packages.find((p) => p.packageId === toPackageId);
  if (toPkg) {
    toPkg.remainingHours += hours;
    toPkg.totalHours += hours;
  } else {
    student.packages.push({
      packageId: toPackageId,
      packageName: toCoursePkg.name,
      totalHours: hours,
      remainingHours: hours,
    });
  }
  const record: TransferRecord = {
    id: uuidv4(),
    studentId: student.id,
    fromPackageId,
    fromPackageName: fromPkg.packageName,
    toPackageId,
    toPackageName: toCoursePkg.name,
    hours,
    timestamp: new Date().toISOString(),
  };
  transferRecords.push(record);
  res.json({ success: true, record, student });
});

app.get('/api/stats/overview', async (_req, res) => {
  await delay(150);
  const totalStudents = students.length;
  const today = new Date().toDateString();
  const todayConsume = consumeRecords
    .filter((r) => new Date(r.timestamp).toDateString() === today)
    .reduce((sum, r) => sum + r.hours, 0);
  const remainingHours = students.reduce(
    (sum, s) => sum + s.packages.reduce((s2, p) => s2 + p.remainingHours, 0),
    0
  );
  res.json({ totalStudents, todayConsume, remainingHours });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
