import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

const dataDir = path.join(__dirname, 'data')
const coursesPath = path.join(dataDir, 'courses.json')
const studentsPath = path.join(dataDir, 'students.json')

interface Course {
  id: string
  name: string
  instructor: string
  date: string
  startTime: string
  endTime: string
  maxStudents: number
  description: string
  enrolledCount: number
}

interface Student {
  id: string
  name: string
  courseIds: string[]
}

function readCourses(): Course[] {
  const data = fs.readFileSync(coursesPath, 'utf-8')
  return JSON.parse(data)
}

function writeCourses(courses: Course[]): void {
  fs.writeFileSync(coursesPath, JSON.stringify(courses, null, 2))
}

function readStudents(): Student[] {
  const data = fs.readFileSync(studentsPath, 'utf-8')
  return JSON.parse(data)
}

function writeStudents(students: Student[]): void {
  fs.writeFileSync(studentsPath, JSON.stringify(students, null, 2))
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function parseDateToTimestamp(dateStr: string, timeStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hours, minutes] = timeStr.split(':').map(Number)
  return new Date(year, month - 1, day, hours, minutes).getTime()
}

function getTimeInterval(
  date: string,
  startTime: string,
  endTime: string,
): { start: number; end: number } {
  const startTs = parseDateToTimestamp(date, startTime)
  let endTs = parseDateToTimestamp(date, endTime)

  if (endTs <= startTs) {
    endTs += 24 * 60 * 60 * 1000
  }

  return { start: startTs, end: endTs }
}

function calculateOverlapMinutes(
  interval1: { start: number; end: number },
  interval2: { start: number; end: number },
): number {
  const overlapStart = Math.max(interval1.start, interval2.start)
  const overlapEnd = Math.min(interval1.end, interval2.end)
  const overlapMs = overlapEnd - overlapStart

  if (overlapMs <= 0) return 0
  return Math.floor(overlapMs / (1000 * 60))
}

function checkTimeConflict(
  newCourse: Omit<Course, 'id' | 'enrolledCount'>,
  existingCourses: Course[],
): Course[] {
  return existingCourses.filter((course) => {
    if (course.instructor !== newCourse.instructor) return false

    const newInterval = getTimeInterval(
      newCourse.date,
      newCourse.startTime,
      newCourse.endTime,
    )
    const existInterval = getTimeInterval(
      course.date,
      course.startTime,
      course.endTime,
    )

    const overlapMinutes = calculateOverlapMinutes(newInterval, existInterval)
    return overlapMinutes >= 1
  })
}

app.get('/api/courses', (_req, res) => {
  try {
    const courses = readCourses()
    res.json({ success: true, data: courses })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取课程列表失败' })
  }
})

app.get('/api/courses/:id', (req, res) => {
  try {
    const courses = readCourses()
    const course = courses.find((c) => c.id === req.params.id)
    if (!course) {
      return res.status(404).json({ success: false, message: '课程不存在' })
    }
    res.json({ success: true, data: course })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取课程详情失败' })
  }
})

app.post('/api/courses/check-conflict', (req, res) => {
  try {
    const { name, instructor, date, startTime, endTime, maxStudents, description } = req.body
    const courses = readCourses()
    const conflictCourses = checkTimeConflict(
      { name, instructor, date, startTime, endTime, maxStudents, description },
      courses,
    )
    res.json({
      success: true,
      data: {
        hasConflict: conflictCourses.length > 0,
        conflictCourses,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: '冲突检测失败' })
  }
})

app.post('/api/courses', (req, res) => {
  try {
    const { name, instructor, date, startTime, endTime, maxStudents, description, force = false } =
      req.body

    if (!name || name.length < 2 || name.length > 20) {
      return res
        .status(400)
        .json({ success: false, message: '课程名必须为2-20个字符' })
    }

    if (!instructor || instructor.length < 2 || instructor.length > 10) {
      return res
        .status(400)
        .json({ success: false, message: '讲师名必须为2-10个汉字' })
    }

    if (!date || !startTime || !endTime) {
      return res
        .status(400)
        .json({ success: false, message: '请选择完整的上课时段' })
    }

    if (!maxStudents || maxStudents < 1 || maxStudents > 30) {
      return res
        .status(400)
        .json({ success: false, message: '最大学员数必须为1-30的整数' })
    }

    if (description && description.length > 200) {
      return res
        .status(400)
        .json({ success: false, message: '课程简介不能超过200字' })
    }

    const courses = readCourses()

    if (!force) {
      const conflictCourses = checkTimeConflict(
        { name, instructor, date, startTime, endTime, maxStudents, description },
        courses,
      )
      if (conflictCourses.length > 0) {
        return res.status(409).json({
          success: false,
          message: '存在排课冲突',
          data: { conflictCourses },
        })
      }
    }

    const newCourse: Course = {
      id: uuidv4(),
      name,
      instructor,
      date,
      startTime,
      endTime,
      maxStudents,
      description: description || '',
      enrolledCount: 0,
    }

    courses.push(newCourse)
    writeCourses(courses)

    res.json({ success: true, data: newCourse })
  } catch (error) {
    res.status(500).json({ success: false, message: '添加课程失败' })
  }
})

app.get('/api/courses/:id/students', (req, res) => {
  try {
    const courseId = req.params.id
    const students = readStudents()
    const enrolledStudents = students.filter((s) => s.courseIds.includes(courseId))
    res.json({ success: true, data: enrolledStudents })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取学员列表失败' })
  }
})

app.post('/api/courses/:id/enroll', (req, res) => {
  try {
    const courseId = req.params.id
    const { studentName } = req.body

    if (!studentName || !/^[a-zA-Z0-9]+$/.test(studentName) || studentName.length > 16) {
      return res
        .status(400)
        .json({ success: false, message: '学员名必须由字母数字组成，最多16字符' })
    }

    const courses = readCourses()
    const courseIndex = courses.findIndex((c) => c.id === courseId)

    if (courseIndex === -1) {
      return res.status(404).json({ success: false, message: '课程不存在' })
    }

    if (courses[courseIndex].enrolledCount >= courses[courseIndex].maxStudents) {
      return res.status(400).json({ success: false, message: '课程已满' })
    }

    const students = readStudents()
    let student = students.find((s) => s.name === studentName)

    if (!student) {
      student = {
        id: uuidv4(),
        name: studentName,
        courseIds: [],
      }
      students.push(student)
    }

    if (student.courseIds.includes(courseId)) {
      return res.status(400).json({ success: false, message: '您已选过此课程' })
    }

    student.courseIds.push(courseId)
    courses[courseIndex].enrolledCount += 1

    writeStudents(students)
    writeCourses(courses)

    res.json({ success: true, data: courses[courseIndex] })
  } catch (error) {
    res.status(500).json({ success: false, message: '选课失败' })
  }
})

app.get('/api/students', (_req, res) => {
  try {
    const students = readStudents()
    res.json({ success: true, data: students })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取学员列表失败' })
  }
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
