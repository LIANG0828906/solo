import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

let io = null;

const trainees = new Map();

function setSocketIO(ioInstance) {
  io = ioInstance;
}

function getDepartmentCompletionRate(dept) {
  const deptTrainees = Array.from(trainees.values()).filter(t => t.department === dept);
  if (deptTrainees.length === 0) return 0;
  const completed = deptTrainees.filter(t => t.status === 'submitted').length;
  return Math.round((completed / deptTrainees.length) * 1000) / 10;
}

router.post('/', (req, res) => {
  const { emails, department } = req.body;

  if (!department) {
    return res.status(400).json({ error: '部门不能为空' });
  }

  if (!emails || !Array.isArray(emails) || emails.length === 0 || emails.length > 50) {
    return res.status(400).json({ error: '邮箱数量必须在1到50之间' });
  }

  const createdTrainees = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  for (const email of emails) {
    const trimmedEmail = email.trim();
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ error: `无效的邮箱: ${email}` });
    }

    const existing = Array.from(trainees.values()).find(
      t => t.email === trimmedEmail && t.department === department
    );

    if (existing) {
      createdTrainees.push(existing);
      continue;
    }

    const id = uuidv4();
    const trainee = {
      id,
      email: trimmedEmail,
      name: trimmedEmail.split('@')[0],
      department,
      status: 'not_viewed',
      viewLink: `/questionnaire/trainee/${id}`,
      createdAt: new Date().toISOString(),
      submittedAt: null,
      answers: null
    };

    trainees.set(id, trainee);
    createdTrainees.push(trainee);
  }

  if (io) {
    io.emit('trainees:updated', {
      action: 'created',
      count: createdTrainees.length,
      department
    });
  }

  res.status(201).json({
    message: `成功添加 ${createdTrainees.length} 名学员`,
    trainees: createdTrainees
  });
});

router.get('/', (req, res) => {
  const { department, search } = req.query;
  let list = Array.from(trainees.values());

  if (department && department !== 'all') {
    list = list.filter(t => t.department === department);
  }

  if (search) {
    const lowerSearch = search.toLowerCase();
    list = list.filter(
      t =>
        t.email.toLowerCase().includes(lowerSearch) ||
        t.name.toLowerCase().includes(lowerSearch)
    );
  }

  res.json(list);
});

router.get('/departments', (req, res) => {
  const departments = [...new Set(Array.from(trainees.values()).map(t => t.department))];
  const stats = departments.map(dept => {
    const deptTrainees = Array.from(trainees.values()).filter(t => t.department === dept);
    const submitted = deptTrainees.filter(t => t.status === 'submitted').length;
    return {
      name: dept,
      total: deptTrainees.length,
      submitted,
      completionRate: getDepartmentCompletionRate(dept)
    };
  });
  res.json(stats);
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const trainee = trainees.get(id);

  if (!trainee) {
    return res.status(404).json({ error: '学员不存在' });
  }

  res.json(trainee);
});

router.patch('/:id/view', (req, res) => {
  const { id } = req.params;
  const trainee = trainees.get(id);

  if (!trainee) {
    return res.status(404).json({ error: '学员不存在' });
  }

  if (trainee.status === 'not_viewed') {
    trainee.status = 'viewed';

    if (io) {
      io.emit('trainee:status', {
        id: trainee.id,
        status: 'viewed',
        department: trainee.department,
        completionRate: getDepartmentCompletionRate(trainee.department)
      });
    }
  }

  res.json(trainee);
});

router.patch('/:id/submit', (req, res) => {
  const { id } = req.params;
  const { answers } = req.body;

  const trainee = trainees.get(id);

  if (!trainee) {
    return res.status(404).json({ error: '学员不存在' });
  }

  if (trainee.status === 'submitted') {
    return res.status(400).json({ error: '该学员已提交问卷' });
  }

  trainee.status = 'submitted';
  trainee.submittedAt = new Date().toISOString();
  trainee.answers = answers || null;

  if (io) {
    io.emit('trainee:status', {
      id: trainee.id,
      status: 'submitted',
      submittedAt: trainee.submittedAt,
      department: trainee.department,
      completionRate: getDepartmentCompletionRate(trainee.department)
    });
  }

  res.json(trainee);
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;

  if (!trainees.has(id)) {
    return res.status(404).json({ error: '学员不存在' });
  }

  const trainee = trainees.get(id);
  trainees.delete(id);

  if (io) {
    io.emit('trainees:updated', {
      action: 'deleted',
      id,
      department: trainee.department,
      completionRate: getDepartmentCompletionRate(trainee.department)
    });
  }

  res.json({ message: '学员已删除' });
});

router.post('/:id/resend', (req, res) => {
  const { id } = req.params;
  const trainee = trainees.get(id);

  if (!trainee) {
    return res.status(404).json({ error: '学员不存在' });
  }

  res.json({ message: '链接已重新发送', link: trainee.viewLink });
});

export default router;
export { setSocketIO, trainees, getDepartmentCompletionRate };
