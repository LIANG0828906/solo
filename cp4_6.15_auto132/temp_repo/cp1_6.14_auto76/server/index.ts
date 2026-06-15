import express from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import { initDB, db, type Course, type Employee, type QuizResult, type SkillScore } from './db.js'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

initDB()

app.get('/api/courses', async (_req, res) => {
  await db.read()
  res.json(db.data!.courses)
})

app.get('/api/courses/:id', async (req, res) => {
  await db.read()
  const course = db.data!.courses.find(c => c.id === req.params.id)
  if (!course) return res.status(404).json({ error: '课程不存在' })
  res.json(course)
})

app.post('/api/courses', async (req, res) => {
  await db.read()
  const course: Course = {
    id: uuidv4(),
    name: req.body.name,
    category: req.body.category,
    difficulty: req.body.difficulty,
    outline: req.body.outline || [],
    quizzes: req.body.quizzes || [],
    targetSkills: req.body.targetSkills || [],
    createdAt: new Date().toISOString()
  }
  db.data!.courses.push(course)
  await db.write()
  res.status(201).json(course)
})

app.put('/api/courses/:id', async (req, res) => {
  await db.read()
  const index = db.data!.courses.findIndex(c => c.id === req.params.id)
  if (index === -1) return res.status(404).json({ error: '课程不存在' })
  db.data!.courses[index] = { ...db.data!.courses[index], ...req.body }
  await db.write()
  res.json(db.data!.courses[index])
})

app.delete('/api/courses/:id', async (req, res) => {
  await db.read()
  db.data!.courses = db.data!.courses.filter(c => c.id !== req.params.id)
  await db.write()
  res.json({ success: true })
})

app.get('/api/employees', async (_req, res) => {
  await db.read()
  res.json(db.data!.employees)
})

app.get('/api/employees/:id', async (req, res) => {
  await db.read()
  const employee = db.data!.employees.find(e => e.id === req.params.id)
  if (!employee) return res.status(404).json({ error: '员工不存在' })
  res.json(employee)
})

app.post('/api/employees/:id/enroll', async (req, res) => {
  await db.read()
  const employeeIndex = db.data!.employees.findIndex(e => e.id === req.params.id)
  if (employeeIndex === -1) return res.status(404).json({ error: '员工不存在' })
  const { courseId } = req.body
  const exists = db.data!.employees[employeeIndex].enrollments.find(e => e.courseId === courseId)
  if (exists) return res.status(400).json({ error: '已报名该课程' })
  db.data!.employees[employeeIndex].enrollments.push({
    courseId,
    progress: 0,
    completedChapters: [],
    enrolledAt: new Date().toISOString()
  })
  await db.write()
  res.json(db.data!.employees[employeeIndex])
})

app.post('/api/employees/:id/progress', async (req, res) => {
  await db.read()
  const employeeIndex = db.data!.employees.findIndex(e => e.id === req.params.id)
  if (employeeIndex === -1) return res.status(404).json({ error: '员工不存在' })
  const { courseId, chapterId, progress } = req.body
  const enrollmentIndex = db.data!.employees[employeeIndex].enrollments.findIndex(e => e.courseId === courseId)
  if (enrollmentIndex === -1) return res.status(404).json({ error: '未报名该课程' })
  if (chapterId && !db.data!.employees[employeeIndex].enrollments[enrollmentIndex].completedChapters.includes(chapterId)) {
    db.data!.employees[employeeIndex].enrollments[enrollmentIndex].completedChapters.push(chapterId)
  }
  if (progress !== undefined) {
    db.data!.employees[employeeIndex].enrollments[enrollmentIndex].progress = progress
  }
  await db.write()
  res.json(db.data!.employees[employeeIndex])
})

app.post('/api/quiz/submit', async (req, res) => {
  await db.read()
  const { employeeId, courseId, answers } = req.body
  const course = db.data!.courses.find(c => c.id === courseId)
  if (!course) return res.status(404).json({ error: '课程不存在' })

  let correctCount = 0
  const evaluated = answers.map((a: { questionId: string; selected: number }) => {
    const question = course.quizzes.find(q => q.id === a.questionId)
    const correct = question ? question.correctAnswer === a.selected : false
    if (correct) correctCount++
    return { ...a, correct }
  })

  const result: QuizResult = {
    id: uuidv4(),
    employeeId,
    courseId,
    score: correctCount,
    totalQuestions: course.quizzes.length,
    answers: evaluated,
    completedAt: new Date().toISOString()
  }
  db.data!.quizResults.push(result)

  const employeeIndex = db.data!.employees.findIndex(e => e.id === employeeId)
  if (employeeIndex !== -1) {
    const enrollmentIndex = db.data!.employees[employeeIndex].enrollments.findIndex(e => e.courseId === courseId)
    if (enrollmentIndex !== -1) {
      db.data!.employees[employeeIndex].enrollments[enrollmentIndex].progress = 100
    }
  }

  const scorePercentage = Math.round((correctCount / course.quizzes.length) * 100)
  let skillIndex = db.data!.skillMatrix.findIndex(s => s.employeeId === employeeId)
  const defaultSkills: SkillScore = {
    coding: 50,
    architecture: 50,
    projectManagement: 50,
    teamCollaboration: 50,
    productThinking: 50,
    businessUnderstanding: 50
  }
  if (skillIndex === -1) {
    db.data!.skillMatrix.push({
      employeeId,
      skills: { ...defaultSkills },
      updatedAt: new Date().toISOString()
    })
    skillIndex = db.data!.skillMatrix.length - 1
  }
  course.targetSkills.forEach(skill => {
    const current = (db.data!.skillMatrix[skillIndex].skills as any)[skill] || 50
    const improvement = (scorePercentage - 50) * 0.1
    const newScore = Math.max(0, Math.min(100, current + improvement))
    ;(db.data!.skillMatrix[skillIndex].skills as any)[skill] = Math.round(newScore)
  })
  db.data!.skillMatrix[skillIndex].updatedAt = new Date().toISOString()

  await db.write()
  res.json(result)
})

app.get('/api/skill-matrix', async (_req, res) => {
  await db.read()
  const employees = db.data!.employees
  const matrix = employees.map(emp => {
    const skills = db.data!.skillMatrix.find(s => s.employeeId === emp.id)?.skills || {
      coding: 50,
      architecture: 50,
      projectManagement: 50,
      teamCollaboration: 50,
      productThinking: 50,
      businessUnderstanding: 50
    }
    return { employee: emp, skills }
  })
  res.json(matrix)
})

app.get('/api/skill-matrix/:employeeId', async (req, res) => {
  await db.read()
  const employee = db.data!.employees.find(e => e.id === req.params.employeeId)
  if (!employee) return res.status(404).json({ error: '员工不存在' })
  const skills = db.data!.skillMatrix.find(s => s.employeeId === req.params.employeeId)?.skills || {
    coding: 50,
    architecture: 50,
    projectManagement: 50,
    teamCollaboration: 50,
    productThinking: 50,
    businessUnderstanding: 50
  }
  res.json({ employee, skills })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
