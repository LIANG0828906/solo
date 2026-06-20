import { Router, Request, Response } from 'express';

const router = Router();

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDayName(dateStr: string): string {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const date = new Date(dateStr);
  return days[date.getDay()];
}

const defaultGoals = { dailyMinutes: 30, dailyPages: 20 };
const emptyDb = { books: [], readingRecords: [], goals: defaultGoals };

router.get('/weekly', async (req: Request, res: Response) => {
  try {
    const { db } = req;
    await db.read();
    const data = db.data || emptyDb;

    const now = new Date();
    const startOfWeek = getStartOfWeek(now);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weekRecords = data.readingRecords.filter((r) => {
      const recordDate = new Date(r.date);
      return recordDate >= startOfWeek && recordDate <= endOfWeek;
    });

    const totalDays = new Set(weekRecords.map((r) => r.date.split('T')[0])).size;
    const totalDuration = weekRecords.reduce((sum, r) => sum + (r.duration || 0), 0);
    const totalPages = weekRecords.reduce((sum, r) => {
      return sum + Math.max(0, (r.endPage || 0) - (r.startPage || 0));
    }, 0);
    const averagePagesPerDay = totalDays > 0 ? Math.round(totalPages / totalDays) : 0;

    const tagStats: Record<string, number> = {};
    weekRecords.forEach((r) => {
      (r.tags || []).forEach((tag) => {
        tagStats[tag] = (tagStats[tag] || 0) + 1;
      });
    });

    const dailyTrend: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      const dateStr = formatDate(d);
      dailyTrend[dateStr] = 0;
    }

    weekRecords.forEach((r) => {
      const dateStr = r.date.split('T')[0];
      if (dailyTrend[dateStr] !== undefined) {
        dailyTrend[dateStr] += r.duration || 0;
      }
    });

    const dailyTrendArray = Object.entries(dailyTrend).map(([date, minutes]) => ({
      date,
      dayName: getDayName(date),
      minutes
    }));

    res.json({
      success: true,
      data: {
        period: {
          start: formatDate(startOfWeek),
          end: formatDate(endOfWeek)
        },
        totalDays,
        totalDuration,
        averagePagesPerDay,
        totalPages,
        tagStats,
        dailyTrend: dailyTrendArray
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取周分析数据失败',
      error: (error as Error).message
    });
  }
});

router.get('/monthly', async (req: Request, res: Response) => {
  try {
    const { db } = req;
    await db.read();
    const data = db.data || emptyDb;

    const now = new Date();
    const startOfMonth = getStartOfMonth(now);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthRecords = data.readingRecords.filter((r) => {
      const recordDate = new Date(r.date);
      return recordDate >= startOfMonth && recordDate <= endOfMonth;
    });

    const totalDays = new Set(monthRecords.map((r) => r.date.split('T')[0])).size;
    const totalDuration = monthRecords.reduce((sum, r) => sum + (r.duration || 0), 0);
    const totalPages = monthRecords.reduce((sum, r) => {
      return sum + Math.max(0, (r.endPage || 0) - (r.startPage || 0));
    }, 0);
    const averagePagesPerDay = totalDays > 0 ? Math.round(totalPages / totalDays) : 0;
    const averageDurationPerDay = totalDays > 0 ? Math.round(totalDuration / totalDays) : 0;

    const tagStats: Record<string, number> = {};
    monthRecords.forEach((r) => {
      (r.tags || []).forEach((tag) => {
        tagStats[tag] = (tagStats[tag] || 0) + 1;
      });
    });

    const bookStats: Record<string, { bookId: string; title: string; pages: number; duration: number }> = {};
    monthRecords.forEach((r) => {
      const book = data.books.find((b) => b.id === r.bookId);
      if (!bookStats[r.bookId]) {
        bookStats[r.bookId] = {
          bookId: r.bookId,
          title: book?.title || '未知图书',
          pages: 0,
          duration: 0
        };
      }
      bookStats[r.bookId].pages += Math.max(0, (r.endPage || 0) - (r.startPage || 0));
      bookStats[r.bookId].duration += r.duration || 0;
    });

    const weeklyTrend: { week: number; minutes: number; pages: number }[] = [];
    const daysInMonth = endOfMonth.getDate();
    let currentWeekStart = 1;
    let weekNumber = 1;

    while (currentWeekStart <= daysInMonth) {
      const weekEnd = Math.min(currentWeekStart + 6, daysInMonth);
      let weekMinutes = 0;
      let weekPages = 0;

      monthRecords.forEach((r) => {
        const recordDate = new Date(r.date).getDate();
        if (recordDate >= currentWeekStart && recordDate <= weekEnd) {
          weekMinutes += r.duration || 0;
          weekPages += Math.max(0, (r.endPage || 0) - (r.startPage || 0));
        }
      });

      weeklyTrend.push({
        week: weekNumber,
        minutes: weekMinutes,
        pages: weekPages
      });

      currentWeekStart = weekEnd + 1;
      weekNumber++;
    }

    res.json({
      success: true,
      data: {
        period: {
          start: formatDate(startOfMonth),
          end: formatDate(endOfMonth),
          year: now.getFullYear(),
          month: now.getMonth() + 1
        },
        totalDays,
        totalDuration,
        totalPages,
        averagePagesPerDay,
        averageDurationPerDay,
        tagStats,
        bookStats: Object.values(bookStats).sort((a, b) => b.pages - a.pages),
        weeklyTrend
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取月分析数据失败',
      error: (error as Error).message
    });
  }
});

export default router;
