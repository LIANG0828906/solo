import { useState, useEffect } from 'react';
import {
  UserProgress,
  CourseProgress,
  QuizAttempt,
  UnitProgress,
  UnitNote,
} from '../types';

const STORAGE_KEY = 'training_progress';

function asyncStorage<T>(operation: () => T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(operation());
    }, 50);
  });
}

export async function getProgress(): Promise<UserProgress> {
  return asyncStorage(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return { courses: {} };
      }
    }
    return { courses: {} };
  });
}

export async function saveProgress(progress: UserProgress): Promise<void> {
  return asyncStorage(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  });
}

export async function getCourseProgress(
  courseId: string
): Promise<CourseProgress | null> {
  const progress = await getProgress();
  return progress.courses[courseId] || null;
}

export async function updateUnitProgress(
  courseId: string,
  unitId: string,
  completed: boolean
): Promise<void> {
  const progress = await getProgress();
  if (!progress.courses[courseId]) {
    progress.courses[courseId] = {
      courseId,
      units: [],
      quizAttempts: [],
      notes: [],
    };
  }

  const courseProgress = progress.courses[courseId];
  const existingUnit = courseProgress.units.find((u) => u.unitId === unitId);

  if (existingUnit) {
    existingUnit.completed = completed;
    if (completed) {
      existingUnit.completedAt = new Date().toISOString();
    }
  } else {
    const unitProgress: UnitProgress = {
      unitId,
      completed,
      completedAt: completed ? new Date().toISOString() : undefined,
    };
    courseProgress.units.push(unitProgress);
  }

  courseProgress.lastStudiedAt = new Date().toISOString();
  await saveProgress(progress);
}

export async function saveQuizAttempt(
  courseId: string,
  attempt: QuizAttempt
): Promise<void> {
  const progress = await getProgress();
  if (!progress.courses[courseId]) {
    progress.courses[courseId] = {
      courseId,
      units: [],
      quizAttempts: [],
      notes: [],
    };
  }

  progress.courses[courseId].quizAttempts.push(attempt);
  progress.courses[courseId].lastStudiedAt = new Date().toISOString();
  await saveProgress(progress);
}

export async function saveUnitNote(
  courseId: string,
  unitId: string,
  content: string
): Promise<void> {
  const progress = await getProgress();
  if (!progress.courses[courseId]) {
    progress.courses[courseId] = {
      courseId,
      units: [],
      quizAttempts: [],
      notes: [],
    };
  }

  const courseProgress = progress.courses[courseId];
  const existingNote = courseProgress.notes.find((n) => n.unitId === unitId);

  if (existingNote) {
    existingNote.content = content;
    existingNote.updatedAt = new Date().toISOString();
  } else {
    const note: UnitNote = {
      unitId,
      content,
      updatedAt: new Date().toISOString(),
    };
    courseProgress.notes.push(note);
  }

  courseProgress.lastStudiedAt = new Date().toISOString();
  await saveProgress(progress);
}

export async function getUnitNote(
  courseId: string,
  unitId: string
): Promise<UnitNote | null> {
  const courseProgress = await getCourseProgress(courseId);
  if (!courseProgress) return null;
  return courseProgress.notes.find((n) => n.unitId === unitId) || null;
}

export async function deleteUnitNote(
  courseId: string,
  unitId: string
): Promise<void> {
  const progress = await getProgress();
  const courseProgress = progress.courses[courseId];
  if (!courseProgress) return;

  courseProgress.notes = courseProgress.notes.filter((n) => n.unitId !== unitId);
  courseProgress.lastStudiedAt = new Date().toISOString();
  await saveProgress(progress);
}

export function hasUnitNotes(courseId: string): boolean {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return false;
  try {
    const progress: UserProgress = JSON.parse(stored);
    const courseProgress = progress.courses[courseId];
    return courseProgress?.notes && courseProgress.notes.length > 0;
  } catch {
    return false;
  }
}

export function getUnitNoteSync(
  courseId: string,
  unitId: string,
  progress: UserProgress
): UnitNote | null {
  const courseProgress = progress.courses[courseId];
  if (!courseProgress) return null;
  return courseProgress.notes.find((n) => n.unitId === unitId) || null;
}

export function hasUnitNoteSync(
  courseId: string,
  unitId: string,
  progress: UserProgress
): boolean {
  return getUnitNoteSync(courseId, unitId, progress) !== null;
}

export async function getQuizScore(
  courseId: string
): Promise<QuizAttempt | null> {
  const courseProgress = await getCourseProgress(courseId);
  if (!courseProgress || courseProgress.quizAttempts.length === 0) {
    return null;
  }
  return courseProgress.quizAttempts[courseProgress.quizAttempts.length - 1];
}

export function useProgress() {
  const [progress, setProgress] = useState<UserProgress>({ courses: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    setLoading(true);
    const data = await getProgress();
    setProgress(data);
    setLoading(false);
  };

  const updateProgress = async (
    courseId: string,
    unitId: string,
    completed: boolean
  ) => {
    await updateUnitProgress(courseId, unitId, completed);
    await loadProgress();
  };

  const recordQuizAttempt = async (
    courseId: string,
    attempt: QuizAttempt
  ) => {
    await saveQuizAttempt(courseId, attempt);
    await loadProgress();
  };

  const getCourseProgressSync = (courseId: string): CourseProgress | null => {
    return progress.courses[courseId] || null;
  };

  const getUnitProgressSync = (
    courseId: string,
    unitId: string
  ): UnitProgress | null => {
    const courseProg = progress.courses[courseId];
    if (!courseProg) return null;
    return courseProg.units.find((u) => u.unitId === unitId) || null;
  };

  const getLatestQuizAttemptSync = (
    courseId: string
  ): QuizAttempt | null => {
    const courseProg = progress.courses[courseId];
    if (!courseProg || courseProg.quizAttempts.length === 0) return null;
    return courseProg.quizAttempts[courseProg.quizAttempts.length - 1];
  };

  const getCompletedCoursesCount = (): number => {
    return Object.values(progress.courses).filter((cp) => {
      return cp.quizAttempts.some((qa) => qa.score === qa.totalQuestions);
    }).length;
  };

  const getPassedQuizzesCount = (): number => {
    return Object.values(progress.courses).filter((cp) => {
      return cp.quizAttempts.length > 0;
    }).length;
  };

  const getOverallCompletionRate = (totalUnits: number): number => {
    if (totalUnits === 0) return 0;
    let completedUnits = 0;
    Object.values(progress.courses).forEach((cp) => {
      completedUnits += cp.units.filter((u) => u.completed).length;
    });
    return Math.round((completedUnits / totalUnits) * 100);
  };

  const getLastStudyTime = (): string | null => {
    let lastTime: string | null = null;
    Object.values(progress.courses).forEach((cp) => {
      if (cp.lastStudiedAt && (!lastTime || cp.lastStudiedAt > lastTime)) {
        lastTime = cp.lastStudiedAt;
      }
    });
    return lastTime;
  };

  const saveNote = async (courseId: string, unitId: string, content: string) => {
    await saveUnitNote(courseId, unitId, content);
    await loadProgress();
  };

  const deleteNote = async (courseId: string, unitId: string) => {
    await deleteUnitNote(courseId, unitId);
    await loadProgress();
  };

  const getNoteSync = (courseId: string, unitId: string): UnitNote | null => {
    return getUnitNoteSync(courseId, unitId, progress);
  };

  const hasNoteSync = (courseId: string, unitId: string): boolean => {
    return hasUnitNoteSync(courseId, unitId, progress);
  };

  const hasAnyNoteSync = (courseId: string): boolean => {
    const courseProgress = progress.courses[courseId];
    return courseProgress?.notes && courseProgress.notes.length > 0;
  };

  return {
    progress,
    loading,
    updateProgress,
    recordQuizAttempt,
    getCourseProgressSync,
    getUnitProgressSync,
    getLatestQuizAttemptSync,
    getCompletedCoursesCount,
    getPassedQuizzesCount,
    getOverallCompletionRate,
    getLastStudyTime,
    saveNote,
    deleteNote,
    getNoteSync,
    hasNoteSync,
    hasAnyNoteSync,
    refreshProgress: loadProgress,
  };
}
