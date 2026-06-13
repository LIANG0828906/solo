export type ReadingStatus = 'unread' | 'reading' | 'finished20' | 'finished50';

export interface CheckIn {
  id: string;
  memberId: string;
  date: string;
  pagesRead: number;
  status: ReadingStatus;
  note?: string;
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  avatar?: string;
  joinedAt: string;
}

export interface Activity {
  id: string;
  title: string;
  bookTitle: string;
  bookAuthor: string;
  coverImage: string;
  startDate: string;
  endDate: string;
  description: string;
  inviteCode: string;
  organizerId: string;
  ended: boolean;
  members: Member[];
  checkIns: CheckIn[];
  createdAt: string;
}

export interface ReportData {
  totalDays: number;
  totalPages: number;
  longestStreak: number;
  memberCompletionRates: Array<{
    memberId: string;
    memberName: string;
    completionRate: number;
    totalPages: number;
  }>;
}

export function getDatesInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const current = new Date(start);
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export function isDateInRange(date: string, startDate: string, endDate: string): boolean {
  const d = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);
  return d >= start && d <= end;
}

export function calculateReadingProgress(activity: Activity, memberId: string): number {
  const memberCheckIns = activity.checkIns.filter((c) => c.memberId === memberId);
  const totalDays = getDatesInRange(activity.startDate, activity.endDate).length;
  if (totalDays === 0) return 0;
  return Math.round((memberCheckIns.length / totalDays) * 100);
}

export function calculateLongestStreak(checkIns: CheckIn[], memberId: string): number {
  const memberCheckIns = checkIns
    .filter((c) => c.memberId === memberId)
    .map((c) => c.date)
    .sort();
  if (memberCheckIns.length === 0) return 0;
  let longest = 1;
  let current = 1;
  for (let i = 1; i < memberCheckIns.length; i++) {
    const prev = new Date(memberCheckIns[i - 1]);
    const curr = new Date(memberCheckIns[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      current++;
      longest = Math.max(longest, current);
    } else if (diff > 1) {
      current = 1;
    }
  }
  return longest;
}

export function generateReportData(activity: Activity): ReportData {
  const totalDays = getDatesInRange(activity.startDate, activity.endDate).length;
  const totalPages = activity.checkIns.reduce((sum, c) => sum + c.pagesRead, 0);
  let longestStreak = 0;
  activity.members.forEach((member) => {
    const streak = calculateLongestStreak(activity.checkIns, member.id);
    longestStreak = Math.max(longestStreak, streak);
  });
  const memberCompletionRates = activity.members.map((member) => {
    const memberCheckIns = activity.checkIns.filter((c) => c.memberId === member.id);
    const memberTotalPages = memberCheckIns.reduce((sum, c) => sum + c.pagesRead, 0);
    const completionRate = calculateReadingProgress(activity, member.id);
    return {
      memberId: member.id,
      memberName: member.name,
      completionRate,
      totalPages: memberTotalPages,
    };
  });
  return {
    totalDays,
    totalPages,
    longestStreak,
    memberCompletionRates,
  };
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
