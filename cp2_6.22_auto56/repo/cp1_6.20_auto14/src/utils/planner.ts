import { format, addDays, differenceInDays, startOfDay } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { ExamInfo, Task, Subject } from '../types';

export function generateStudyPlan(examInfo: ExamInfo): Task[] {
  const tasks: Task[] = [];
  const today = startOfDay(new Date());
  const examDate = startOfDay(new Date(examInfo.date));
  const totalDays = differenceInDays(examDate, today);

  if (totalDays <= 0) return tasks;

  const totalWeight = examInfo.subjects.reduce((sum, s) => sum + s.weight, 0);

  for (let i = 0; i < totalDays; i++) {
    const currentDate = addDays(today, i);
    const dateStr = format(currentDate, 'yyyy-MM-dd');

    examInfo.subjects.forEach((subject) => {
      const dailyRatio = subject.weight / totalWeight;
      const tasksPerDay = Math.max(1, Math.round(dailyRatio * 4));

      for (let j = 0; j < tasksPerDay; j++) {
        tasks.push({
          id: uuidv4(),
          subjectId: subject.id,
          subjectName: subject.name,
          date: dateStr,
          title: `${subject.name} - 第${j + 1}节`,
          status: 'todo',
          duration: Math.round(25 * (subject.weight / totalWeight) * 2),
        });
      }
    });
  }

  return tasks;
}

export function getSubjectColor(subjectId: string): string {
  const colors = [
    '#4A90D9',
    '#7B68EE',
    '#20B2AA',
    '#FF6B6B',
    '#FFA07A',
    '#9370DB',
    '#3CB371',
    '#4682B4',
    '#DB7093',
    '#6B8E23',
  ];
  let hash = 0;
  for (let i = 0; i < subjectId.length; i++) {
    hash = subjectId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function formatTime(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) {
    return `${hrs}小时${mins}分钟`;
  }
  return `${mins}分钟`;
}

export function calculateProgress(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  return Math.round((completed / tasks.length) * 100);
}
