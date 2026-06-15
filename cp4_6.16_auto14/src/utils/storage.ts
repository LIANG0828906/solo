import { get, set, del, keys } from "idb-keyval";
import type { StateStorage } from "zustand/middleware";
import type { Course, Page, AnyBlock, VersionSnapshot } from "@/types";

const DEBOUNCE_MS = 150;

function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: A) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, ms);
  };
}

export const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await get<string>(name);
    return value ?? null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    debouncedSet(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

const debouncedSet = debounce(async (name: string, value: string) => {
  await set(name, value);
}, DEBOUNCE_MS);

type CourseData = { course: Course; pages: Page[]; blocks: AnyBlock[] };

export async function saveCourse(
  course: Course,
  pages: Page[],
  blocks: AnyBlock[]
): Promise<void> {
  await set(`course:${course.id}`, { course, pages, blocks });
}

export async function loadCourse(
  courseId: string
): Promise<CourseData | null> {
  const data = await get<CourseData>(`course:${courseId}`);
  return data ?? null;
}

export async function deleteCourse(courseId: string): Promise<void> {
  await del(`course:${courseId}`);
}

export async function listCourses(): Promise<Course[]> {
  const allKeys = await keys();
  const courseKeys = allKeys.filter(
    (k) => typeof k === "string" && k.startsWith("course:")
  );
  const courses: Course[] = [];
  for (const key of courseKeys) {
    const data = await get<CourseData>(key as string);
    if (data?.course) {
      courses.push(data.course);
    }
  }
  return courses;
}

export async function saveVersion(snapshot: VersionSnapshot): Promise<void> {
  const existing = await loadVersions(snapshot.courseId);
  existing.push(snapshot);
  await set(`versions:${snapshot.courseId}`, existing);
}

export async function loadVersions(
  courseId: string
): Promise<VersionSnapshot[]> {
  const data = await get<VersionSnapshot[]>(`versions:${courseId}`);
  return data ?? [];
}

export async function saveToIDB<T>(key: string, value: T): Promise<void> {
  await set(key, value);
}

export async function loadFromIDB<T>(key: string): Promise<T | undefined> {
  return get<T>(key);
}

export const idbKeyvalStorage: StateStorage = idbStorage;
