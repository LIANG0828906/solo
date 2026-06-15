import { get, set, del, keys } from 'idb-keyval'
import type { StateStorage } from 'zustand/middleware'
import type { Course, Page, AnyBlock, VersionSnapshot } from '@/types'

const DEBOUNCE_MS = 150
const BATCH_WINDOW_MS = 50

type PendingWrite = { value: string }

const pendingWrites = new Map<string, PendingWrite>()
let batchTimer: ReturnType<typeof setTimeout> | null = null

function processBatch() {
  const entries = Array.from(pendingWrites.entries())
  pendingWrites.clear()
  batchTimer = null
  entries.forEach(([key, pending]) => {
    set(key, pending.value).catch(() => {})
  })
}

function batchedSet(key: string, value: string) {
  pendingWrites.set(key, { value })
  if (!batchTimer) {
    batchTimer = setTimeout(processBatch, BATCH_WINDOW_MS)
  }
}

function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  ms: number
): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args: A) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn(...args)
      timer = null
    }, ms)
  }
}

export const idbKeyvalStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await get<string>(name)
    return value ?? null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    debouncedSet(name, value)
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name)
  },
}

const debouncedSet = debounce(async (name: string, value: string) => {
  await set(name, value)
}, DEBOUNCE_MS)

type CourseData = { course: Course; pages: Page[]; blocks: AnyBlock[] }

export async function saveCourse(
  course: Course,
  pages: Page[],
  blocks: AnyBlock[]
): Promise<void> {
  batchedSet(`course:${course.id}`, JSON.stringify({ course, pages, blocks }))
}

export async function loadCourse(
  courseId: string
): Promise<CourseData | null> {
  const data = await get<string>(`course:${courseId}`)
  if (!data) return null
  try {
    return JSON.parse(data) as CourseData
  } catch {
    return null
  }
}

export async function deleteCourse(courseId: string): Promise<void> {
  await del(`course:${courseId}`)
  await del(`versions:${courseId}`)
}

export async function listCourses(): Promise<Course[]> {
  const allKeys = await keys()
  const courseKeys = allKeys.filter(
    (k) => typeof k === 'string' && k.startsWith('course:')
  )
  const courses: Course[] = []
  for (const key of courseKeys) {
    const dataStr = await get<string>(key as string)
    if (dataStr) {
      try {
        const data = JSON.parse(dataStr) as CourseData
        if (data?.course) {
          courses.push(data.course)
        }
      } catch {
        // skip
      }
    }
  }
  return courses
}

export async function saveVersion(snapshot: VersionSnapshot): Promise<void> {
  const existing = await loadVersions(snapshot.courseId)
  const updated = [...existing, snapshot].slice(-30)
  await set(`versions:${snapshot.courseId}`, updated)
}

export async function loadVersions(
  courseId: string
): Promise<VersionSnapshot[]> {
  const data = await get<VersionSnapshot[]>(`versions:${courseId}`)
  return data ?? []
}
