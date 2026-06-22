import { v4 as uuidv4 } from 'uuid'
import type { Task, TaskSubmission, PracticeRecord } from '@/types'
import { taskDB, submissionDB, practiceDB } from '@/utils/db'
import { useStore } from '@/store/useStore'

export class TaskManager {
  static async loadAll(): Promise<Task[]> {
    const tasks = await taskDB.getAll()
    useStore.getState().setTasks(tasks.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ))
    return tasks
  }

  static async loadSubmissions(): Promise<TaskSubmission[]> {
    const submissions = await submissionDB.getAll()
    useStore.getState().setSubmissions(submissions)
    return submissions
  }

  static async loadPracticeRecords(): Promise<PracticeRecord[]> {
    const records = await practiceDB.getAll()
    useStore.getState().setPracticeRecords(records)
    return records
  }

  static async create(data: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    const task: Task = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    }
    await taskDB.set(task.id, task)
    useStore.getState().addTask(task)
    return task
  }

  static async update(id: string, data: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task | null> {
    const existing = await taskDB.getById(id)
    if (!existing) return null
    
    const updated: Task = { ...existing, ...data }
    await taskDB.set(id, updated)
    useStore.getState().updateTask(updated)
    return updated
  }

  static async delete(id: string): Promise<boolean> {
    const submissions = await submissionDB.getByTaskId(id)
    for (const submission of submissions) {
      await submissionDB.delete(submission.id)
    }
    await taskDB.delete(id)
    useStore.getState().deleteTask(id)
    return true
  }

  static getByCourseId(courseId: string): Task[] {
    return useStore.getState().tasks.filter(t => t.courseId === courseId)
  }

  static getById(id: string): Task | undefined {
    return useStore.getState().tasks.find(t => t.id === id)
  }

  static async submit(
    taskId: string,
    studentId: string,
    content: string,
    fileUrl: string = ''
  ): Promise<TaskSubmission> {
    const existing = useStore.getState().submissions.find(
      s => s.taskId === taskId && s.studentId === studentId
    )

    if (existing) {
      const updated: TaskSubmission = {
        ...existing,
        content,
        fileUrl,
        submittedAt: new Date().toISOString(),
      }
      await submissionDB.set(existing.id, updated)
      useStore.getState().updateSubmission(updated)
      return updated
    }

    const submission: TaskSubmission = {
      id: uuidv4(),
      taskId,
      studentId,
      content,
      fileUrl,
      submittedAt: new Date().toISOString(),
      score: 0,
      feedback: '',
    }
    await submissionDB.set(submission.id, submission)
    useStore.getState().addSubmission(submission)
    return submission
  }

  static async grade(submissionId: string, score: number, feedback: string): Promise<TaskSubmission | null> {
    const existing = await submissionDB.getById(submissionId)
    if (!existing) return null
    
    const updated: TaskSubmission = { ...existing, score, feedback }
    await submissionDB.set(submissionId, updated)
    useStore.getState().updateSubmission(updated)
    return updated
  }

  static getSubmission(taskId: string, studentId: string): TaskSubmission | undefined {
    return useStore.getState().submissions.find(
      s => s.taskId === taskId && s.studentId === studentId
    )
  }

  static getSubmissionsByTaskId(taskId: string): TaskSubmission[] {
    return useStore.getState().submissions.filter(s => s.taskId === taskId)
  }

  static getSubmissionsByStudentId(studentId: string): TaskSubmission[] {
    return useStore.getState().submissions.filter(s => s.studentId === studentId)
  }

  static getCompletionRate(courseId: string): number {
    const state = useStore.getState()
    const courseTasks = state.tasks.filter(t => t.courseId === courseId)
    const courseStudents = state.students.filter(s => s.courseId === courseId)
    
    if (courseTasks.length === 0 || courseStudents.length === 0) return 0
    
    const totalExpected = courseTasks.length * courseStudents.length
    const completed = state.submissions.filter(
      s => courseTasks.some(t => t.id === s.taskId) && s.content.length > 0
    ).length
    
    return Math.round((completed / totalExpected) * 100)
  }

  static getAverageScore(courseId: string): number {
    const state = useStore.getState()
    const courseTasks = state.tasks.filter(t => t.courseId === courseId)
    const scoredSubmissions = state.submissions.filter(
      s => courseTasks.some(t => t.id === s.taskId) && s.score > 0
    )
    
    if (scoredSubmissions.length === 0) return 0
    
    const total = scoredSubmissions.reduce((sum, s) => sum + s.score, 0)
    return Math.round((total / scoredSubmissions.length) * 10) / 10
  }

  static getTaskProgress(taskId: string, studentId: string): number {
    const submission = this.getSubmission(taskId, studentId)
    if (!submission) return 0
    if (submission.content.length === 0) return 0
    if (submission.score > 0) return 100
    return 50
  }

  static async addPracticeRecord(data: Omit<PracticeRecord, 'id'>): Promise<PracticeRecord> {
    const record: PracticeRecord = {
      ...data,
      id: uuidv4(),
    }
    await practiceDB.set(record.id, record)
    useStore.getState().addPracticeRecord(record)
    return record
  }

  static async updatePracticeRecord(id: string, data: Partial<Omit<PracticeRecord, 'id'>>): Promise<PracticeRecord | null> {
    const existing = await practiceDB.getById(id)
    if (!existing) return null
    
    const updated: PracticeRecord = { ...existing, ...data }
    await practiceDB.set(id, updated)
    useStore.getState().updatePracticeRecord(updated)
    return updated
  }

  static getPracticeRecordsByStudentId(studentId: string): PracticeRecord[] {
    return useStore.getState().practiceRecords.filter(p => p.studentId === studentId)
  }

  static getPracticeRecordByDate(studentId: string, date: string): PracticeRecord | undefined {
    return useStore.getState().practiceRecords.find(
      p => p.studentId === studentId && p.date === date
    )
  }
}
