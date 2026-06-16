import React, { useEffect, useMemo } from 'react';
import { Clock, CheckCircle, Users, TrendingUp, Music, ChevronRight } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Card } from '@/components/Card';
import { LineChart } from '@/components/LineChart';
import { formatDate, formatTime, getStartOfWeek, getEndOfWeek, getPastDays, isSameDay, formatDuration } from '@/utils/dateUtils';

const Dashboard: React.FC = () => {
  const { courses, assignments, students, practiceRecords, currentUser } = useStore();

  useEffect(() => {
    performance.mark('dashboard-render-start');
    return () => {
      performance.mark('dashboard-render-end');
      performance.measure('dashboard-render', 'dashboard-render-start', 'dashboard-render-end');
      const measure = performance.getEntriesByName('dashboard-render')[0];
      if (measure) {
        console.log(`Dashboard render time: ${measure.duration.toFixed(2)}ms`);
      }
    };
  }, []);

  const stats = useMemo(() => {
    const startOfWeek = getStartOfWeek();
    const endOfWeek = getEndOfWeek();

    const weekCourses = courses.filter((c) => {
      const courseDate = new Date(c.startTime);
      return courseDate >= startOfWeek && courseDate <= endOfWeek;
    });

    const totalDuration = weekCourses.reduce((sum, c) => sum + c.duration, 0);

    const approvedCount = assignments.filter((a) => a.status === 'approved').length;
    const reviewedCount = assignments.filter(
      (a) => a.status === 'approved' || a.status === 'rejected'
    ).length;
    const passRate =
      reviewedCount > 0 ? Math.round((approvedCount / reviewedCount) * 100) : 0;

    const activeStudents = new Set(
      practiceRecords
        .filter((r) => {
          const recordDate = new Date(r.date);
          return recordDate >= startOfWeek && recordDate <= endOfWeek;
        })
        .map((r) => r.studentId)
    ).size;

    return {
      weekCourses,
      totalDuration,
      passRate,
      activeStudents,
    };
  }, [courses, assignments, practiceRecords]);

  const chartData = useMemo(() => {
    const pastDays = getPastDays(30);
    return pastDays.map((day) => {
      const dayRecords = practiceRecords.filter((r) => isSameDay(r.date, day));
      const totalDuration = dayRecords.reduce((sum, r) => sum + r.duration, 0);
      return {
        date: formatDate(day, 'MM/DD'),
        value: totalDuration,
        label: `${day.getMonth() + 1}/${day.getDate()}`,
      };
    });
  }, [practiceRecords]);

  const sortedWeekCourses = useMemo(() => {
    return [...stats.weekCourses].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }, [stats.weekCourses]);

  const pendingAssignments = assignments.filter((a) => a.status === 'submitted').length;

  const statCards = [
    {
      label: '本周上课总时长',
      value: formatDuration(stats.totalDuration),
      icon: Clock,
      color: 'from-orange-400 to-orange-500',
    },
    {
      label: '作业通过率',
      value: `${stats.passRate}%`,
      icon: CheckCircle,
      color: 'from-green-400 to-green-500',
    },
    {
      label: '活跃学生数',
      value: `${stats.activeStudents}人`,
      icon: Users,
      color: 'from-blue-400 to-blue-500',
    },
  ];

  const getStudentById = (id: string) => students.find((s) => s.id === id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            欢迎回来，{currentUser?.name}
          </h1>
          <p className="text-text-secondary mt-1">
            {formatDate(new Date(), 'YYYY年MM月DD日')} · 今天也加油练习吧 🎵
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-6 animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-muted text-sm mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                </div>
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}
                >
                  <Icon size={26} className="text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-success">
                <TrendingUp size={16} className="mr-1" />
                <span>较上周增长 12%</span>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                练习时长趋势
              </h3>
              <p className="text-sm text-text-muted">过去30天累计练习时长</p>
            </div>
            <button className="text-sm text-accent hover:text-accent-hover transition-colors duration-fast flex items-center gap-1">
              查看详情
              <ChevronRight size={16} />
            </button>
          </div>
          <LineChart data={chartData} height={280} />
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                待批改作业
              </h3>
              <p className="text-sm text-text-muted">
                共 {pendingAssignments} 份等待批改
              </p>
            </div>
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center">
                <Music size={20} className="text-accent" />
              </div>
              {pendingAssignments > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-xs font-medium rounded-full flex items-center justify-center pulse-dot">
                  {pendingAssignments}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {assignments
              .filter((a) => a.status === 'submitted')
              .slice(0, 4)
              .map((assignment) => {
                const student = getStudentById(assignment.studentId);
                return (
                  <div
                    key={assignment.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-bg-hover transition-all duration-fast cursor-pointer"
                  >
                    <img
                      src={student?.avatar}
                      alt={student?.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {assignment.title}
                      </p>
                      <p className="text-xs text-text-muted">{student?.name}</p>
                    </div>
                    <span className="text-xs text-warning bg-warning/10 px-2 py-1 rounded-full">
                      待审核
                    </span>
                  </div>
                );
              })}
            {pendingAssignments === 0 && (
              <div className="text-center py-8 text-text-muted">
                <CheckCircle size={48} className="mx-auto mb-2 opacity-50" />
                <p>暂无待批改作业</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">本周课程</h3>
            <p className="text-sm text-text-muted">
              共 {stats.weekCourses.length} 节课
            </p>
          </div>
          <button className="text-sm text-accent hover:text-accent-hover transition-colors duration-fast flex items-center gap-1">
            查看全部
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedWeekCourses.slice(0, 6).map((course, index) => {
            const student = getStudentById(course.studentId);
            const courseDate = new Date(course.startTime);
            const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

            return (
              <div
                key={course.id}
                className="p-4 rounded-xl border border-border-color hover:border-accent/50 hover:shadow-md transition-all duration-fast cursor-pointer animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-3">
                  <img
                    src={student?.avatar}
                    alt={student?.name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-text-primary truncate">
                      {student?.name}
                    </h4>
                    <p className="text-sm text-text-muted">{student?.instrument}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      course.status === 'completed'
                        ? 'bg-success/10 text-success'
                        : course.status === 'scheduled'
                        ? 'bg-accent-light text-accent'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {course.status === 'completed'
                      ? '已完成'
                      : course.status === 'scheduled'
                      ? '待上课'
                      : '已取消'}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-text-secondary">
                    {dayNames[courseDate.getDay()]} {formatTime(course.startTime)}
                  </span>
                  <span className="text-text-muted">
                    {course.duration}分钟
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
