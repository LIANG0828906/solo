import { v4 as uuidv4 } from 'uuid';
import type { DailyAssignment, ChartDataPoint, Member } from '../types';

const MEMBER_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E9',
];

const AVATAR_EMOJIS = [
  '🦊',
  '🐼',
  '🦁',
  '🐨',
  '🐸',
  '🦄',
  '🐙',
  '🦋',
  '🐢',
  '🐝',
];

export function calculateDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}

export function splitPagesToDaily(
  totalPages: number,
  startDate: string,
  endDate: string
): DailyAssignment[] {
  const days = calculateDaysBetween(startDate, endDate);
  if (days <= 0 || totalPages <= 0) return [];

  const pagesPerDay = Math.floor(totalPages / days);
  const remainder = totalPages % days;
  const assignments: DailyAssignment[] = [];

  let currentPage = 1;
  const start = new Date(startDate);

  for (let i = 0; i < days; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + i);
    const dateStr = formatDate(currentDate);

    const extraPages = i < remainder ? 1 : 0;
    const pageCount = pagesPerDay + extraPages;
    const endPage = Math.min(currentPage + pageCount - 1, totalPages);

    assignments.push({
      date: dateStr,
      startPage: currentPage,
      endPage: endPage,
      pageCount: endPage - currentPage + 1,
      isCompleted: false,
      completedBy: [],
    });

    currentPage = endPage + 1;
  }

  return assignments;
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateCompletionRatio(
  dailyAssignments: DailyAssignment[],
  memberProgress: { date: string; pagesRead: number }[]
): number {
  if (dailyAssignments.length === 0) return 0;

  const totalPlannedPages = dailyAssignments.reduce(
    (sum, d) => sum + d.pageCount,
    0
  );
  const totalReadPages = memberProgress.reduce(
    (sum, p) => sum + p.pagesRead,
    0
  );

  if (totalPlannedPages === 0) return 0;
  return Math.min(100, Math.round((totalReadPages / totalPlannedPages) * 100));
}

export function calculateTeamCompletion(members: Member[]): number {
  if (members.length === 0) return 0;

  const totalRatio = members.reduce((sum, member) => {
    const totalRead = member.dailyProgress.reduce(
      (s, p) => s + p.pagesRead,
      0
    );
    return sum + totalRead;
  }, 0);

  const avgRatio = totalRatio / members.length;
  return Math.round(avgRatio);
}

export function generateMemberColor(index: number): string {
  return MEMBER_COLORS[index % MEMBER_COLORS.length];
}

export function generateMemberAvatar(index: number): string {
  return AVATAR_EMOJIS[index % AVATAR_EMOJIS.length];
}

export function getIntensityColor(progress: number): string {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const r = Math.round(235 - clampedProgress * 135);
  const g = Math.round(240 - clampedProgress * 90);
  const b = Math.round(250 - clampedProgress * 110);
  return `rgb(${r}, ${g}, ${b})`;
}

export function generateChartData(
  dailyAssignments: DailyAssignment[],
  memberProgress: { date: string; pagesRead: number }[]
): ChartDataPoint[] {
  let cumulativePlanned = 0;
  let cumulativeActual = 0;

  const progressMap = new Map<string, number>();
  memberProgress.forEach((p) => {
    progressMap.set(p.date, p.pagesRead);
  });

  return dailyAssignments.map((assignment) => {
    cumulativePlanned += assignment.pageCount;
    const actualPages = progressMap.get(assignment.date) || 0;
    cumulativeActual += actualPages;

    return {
      date: assignment.date.slice(5),
      planned: cumulativePlanned,
      actual: cumulativeActual,
    };
  });
}

export function shouldCreateMilestone(
  chapter: number,
  totalChapters: number,
  currentPage: number,
  totalPages: number
): boolean {
  const pagesPerChapter = totalPages / totalChapters;
  const milestonePage = Math.ceil(chapter * pagesPerChapter);
  return currentPage >= milestonePage;
}

export function generateMember(id: string, name: string, index: number): Member {
  return {
    id,
    name,
    avatar: generateMemberAvatar(index),
    color: generateMemberColor(index),
    totalPagesRead: 0,
    dailyProgress: [],
  };
}

export function generateId(): string {
  return uuidv4();
}
