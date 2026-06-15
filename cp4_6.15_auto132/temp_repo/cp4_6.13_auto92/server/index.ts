import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import {
  createUser,
  findUserByEmail,
  findUserById,
  createCourse,
  getCourses,
  getCourseById,
  getCoursesByInstructor,
  createEnrollment,
  getEnrollmentsByCourse,
  getEnrollmentsByUser,
  getEnrollmentCount,
  createMaterial,
  getMaterialsByCourse,
  getMaterialById,
  createMaterialSupporter,
  updateMaterialQuantity,
  getMaterialSupporters,
} from './database.js';
import { authMiddleware, instructorMiddleware, generateToken, JwtPayload } from './auth.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password || !role) {
      res.status(400).json({ error: '请填写所有必填字段' });
      return;
    }
    if (role !== 'student' && role !== 'instructor') {
      res.status(400).json({ error: '无效的角色' });
      return;
    }
    const existing = findUserByEmail.get(email) as any;
    if (existing) {
      res.status(400).json({ error: '邮箱已被注册' });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();
    createUser.run(id, username, email, hashedPassword, role, '', '');
    const user = findUserById.get(id) as any;
    const token = generateToken(user);
    res.json({ token, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: '请填写邮箱和密码' });
      return;
    }
    const user = findUserByEmail.get(email) as any;
    if (!user) {
      res.status(401).json({ error: '邮箱或密码错误' });
      return;
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: '邮箱或密码错误' });
      return;
    }
    const userPayload = findUserById.get(user.id) as any;
    const token = generateToken(userPayload);
    res.json({ token, user: userPayload });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const payload = (req as any).user as JwtPayload;
  const user = findUserById.get(payload.id) as any;
  if (!user) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }
  res.json({ user });
});

app.get('/api/courses', (req, res) => {
  try {
    const { category, difficulty, minPrice, maxPrice, page = '1', limit = '12' } = req.query;
    let courses = getCourses.all() as any[];
    
    if (category) {
      courses = courses.filter(c => c.category === category);
    }
    if (difficulty) {
      courses = courses.filter(c => c.difficulty === difficulty);
    }
    if (minPrice !== undefined) {
      courses = courses.filter(c => c.price >= Number(minPrice));
    }
    if (maxPrice !== undefined) {
      courses = courses.filter(c => c.price <= Number(maxPrice));
    }
    
    const coursesWithEnrollment = courses.map(course => {
      const countResult = getEnrollmentCount.get(course.id) as any;
      return {
        ...course,
        enrolled_count: countResult?.count || 0,
      };
    });
    
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const total = coursesWithEnrollment.length;
    const paginated = coursesWithEnrollment.slice((pageNum - 1) * limitNum, pageNum * limitNum);
    
    res.json({
      courses: paginated,
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/courses/:id', (req, res) => {
  try {
    const course = getCourseById.get(req.params.id) as any;
    if (!course) {
      res.status(404).json({ error: '课程不存在' });
      return;
    }
    const countResult = getEnrollmentCount.get(course.id) as any;
    course.enrolled_count = countResult?.count || 0;
    const materials = getMaterialsByCourse.all(course.id) as any[];
    res.json({ course, materials });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/courses', authMiddleware, instructorMiddleware, (req, res) => {
  try {
    const user = (req as any).user as JwtPayload;
    const { title, description, sessions, difficulty, category, price, capacity, images, schedule } = req.body;
    if (!title || !description || !sessions || !difficulty || !category || price === undefined || !capacity) {
      res.status(400).json({ error: '请填写所有必填字段' });
      return;
    }
    const id = uuidv4();
    createCourse.run(
      id,
      title,
      description,
      sessions,
      difficulty,
      category,
      price,
      capacity,
      JSON.stringify(images || []),
      JSON.stringify(schedule || []),
      user.id,
      user.username,
      '',
      ''
    );
    const course = getCourseById.get(id);
    res.status(201).json({ course });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/instructor/courses', authMiddleware, instructorMiddleware, (req, res) => {
  try {
    const user = (req as any).user as JwtPayload;
    const courses = getCoursesByInstructor.all(user.id) as any[];
    const coursesWithData = courses.map(course => {
      const countResult = getEnrollmentCount.get(course.id) as any;
      return {
        ...course,
        enrolled_count: countResult?.count || 0,
      };
    });
    res.json({ courses: coursesWithData });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/courses/:id/enroll', authMiddleware, (req, res) => {
  try {
    const user = (req as any).user as JwtPayload;
    const course = getCourseById.get(req.params.id) as any;
    if (!course) {
      res.status(404).json({ error: '课程不存在' });
      return;
    }
    const countResult = getEnrollmentCount.get(course.id) as any;
    const enrolledCount = countResult?.count || 0;
    if (enrolledCount >= course.capacity) {
      res.status(400).json({ error: '课程已满' });
      return;
    }
    const id = uuidv4();
    createEnrollment.run(id, course.id, user.id, user.username, 1);
    res.status(201).json({ message: '报名成功' });
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) {
      res.status(400).json({ error: '您已经报名过该课程' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

app.get('/api/courses/:id/enrollments', authMiddleware, instructorMiddleware, (req, res) => {
  try {
    const enrollments = getEnrollmentsByCourse.all(req.params.id);
    res.json({ enrollments });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/my-enrollments', authMiddleware, (req, res) => {
  try {
    const user = (req as any).user as JwtPayload;
    const enrollments = getEnrollmentsByUser.all(user.id);
    res.json({ enrollments });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/courses/:id/materials', authMiddleware, instructorMiddleware, (req, res) => {
  try {
    const course = getCourseById.get(req.params.id) as any;
    if (!course) {
      res.status(404).json({ error: '课程不存在' });
      return;
    }
    const { name, specs, target_quantity, deadline } = req.body;
    if (!name || !specs || !target_quantity || !deadline) {
      res.status(400).json({ error: '请填写所有必填字段' });
      return;
    }
    const id = uuidv4();
    createMaterial.run(id, course.id, name, specs, target_quantity, deadline);
    const material = getMaterialById.get(id);
    res.status(201).json({ material });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/materials/:id/supporters', authMiddleware, (req, res) => {
  try {
    const supporters = getMaterialSupporters.all(req.params.id);
    res.json({ supporters });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/materials/:id/support', authMiddleware, (req, res) => {
  try {
    const user = (req as any).user as JwtPayload;
    const material = getMaterialById.get(req.params.id) as any;
    if (!material) {
      res.status(404).json({ error: '材料包不存在' });
      return;
    }
    const { quantity } = req.body;
    if (!quantity || quantity < 1) {
      res.status(400).json({ error: '请选择支持的份数' });
      return;
    }
    const id = uuidv4();
    createMaterialSupporter.run(id, material.id, user.id, user.username, quantity);
    updateMaterialQuantity.run(quantity, material.id);
    res.status(201).json({ message: '支持成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/courses/:id/materials', (req, res) => {
  try {
    const materials = getMaterialsByCourse.all(req.params.id) as any[];
    const materialsWithSupporters = materials.map(m => ({
      ...m,
    }));
    res.json({ materials: materialsWithSupporters });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
