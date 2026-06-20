import { Task, StudyLog, ExamInfo } from '../types';

const TASKS_KEY = 'study_planner_tasks';
const LOGS_KEY = 'study_planner_logs';
const EXAM_KEY = 'study_planner_exam';

export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function loadTasks(): Task[] {
  const data = localStorage.getItem(TASKS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveLogs(logs: StudyLog[]): void {
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}

export function loadLogs(): StudyLog[] {
  const data = localStorage.getItem(LOGS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveExamInfo(examInfo: ExamInfo | null): void {
  if (examInfo) {
    localStorage.setItem(EXAM_KEY, JSON.stringify(examInfo));
  } else {
    localStorage.removeItem(EXAM_KEY);
  }
}

export function loadExamInfo(): ExamInfo | null {
  const data = localStorage.getItem(EXAM_KEY);
  return data ? JSON.parse(data) : null;
}
