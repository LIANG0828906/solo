import { useState, useEffect } from 'react';

// 教练类型
interface Coach {
  id: string;
  name: string;
  specialty: string;
}

// 课程类型
interface Course {
  id: string;
  name: string;
  coachName: string;
  coachId: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  currentBookings: number;
}

// 教练排班管理组件
// 数据流向：fetch获取教练和课程列表 -> 添加教练/排课 -> 后端校验时间冲突 -> 返回结果
// 调用关系：Schedule -> fetch(/api/coaches, /api/courses/admin, /api/courses) -> 后端routes/courses.ts
interface ScheduleProps {
  token: string;
}

export default function Schedule({ token }: ScheduleProps) {
  const [activeTab, setActiveTab] = useState<'coaches' | 'courses'>('courses');
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // 教练表单
  const [coachName, setCoachName] = useState('');
  const [coachSpecialty, setCoachSpecialty] = useState('');

  // 课程表单
  const [courseName, setCourseName] = useState('');
  const [courseCoachId, setCourseCoachId] = useState('');
  const [courseDate, setCourseDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('20');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 加载数据
  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    try {
      const [coachesRes, coursesRes] = await Promise.all([
        fetch('/api/coaches', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/courses/admin', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (coachesRes.ok) {
        const data = await coachesRes.json();
        setCoaches(data.coaches || []);
      }

      if (coursesRes.ok) {
        const data = await coursesRes.json();
        setCourses(data.courses || []);
      }
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 添加教练
  const handleAddCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/coaches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: coachName, specialty: coachSpecialty }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || '添加教练失败');
      }

      setMessage({ type: 'success', text: '教练添加成功！' });
      setCoachName('');
      setCoachSpecialty('');
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '添加失败' });
    } finally {
      setSubmitting(false);
    }
  };

  // 添加课程
  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);

    try {
      const startDateTime = new Date(`${courseDate}T${startTime}`);
      const endDateTime = new Date(`${courseDate}T${endTime}`);

      if (endDateTime <= startDateTime) {
        throw new Error('结束时间必须晚于开始时间');
      }

      const capacity = parseInt(maxCapacity);
      if (isNaN(capacity) || capacity <= 0 || capacity > 20) {
        throw new Error('容量必须在1-20之间');
      }

      // 调用后端排课API，后端会自动校验教练时间冲突
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: courseName,
          coachId: courseCoachId,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          maxCapacity: capacity,
          description: `${courseName}课程`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || '添加课程失败');
      }

      setMessage({ type: 'success', text: '课程添加成功！' });
      setCourseName('');
      setCourseCoachId('');
      setCourseDate('');
      setStartTime('');
      setEndTime('');
      setMaxCapacity('20');
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '添加失败' });
    } finally {
      setSubmitting(false);
    }
  };

  // 删除课程
  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('确定要删除此课程吗？')) return;

    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setMessage({ type: 'success', text: '课程已删除' });
        loadData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: '删除失败' });
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="schedule-page">
      <div className="page-header">
        <h1>排班管理</h1>
        <p>管理教练信息和课程排班</p>
      </div>

      {/* Tab切换 */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          📅 课程管理
        </button>
        <button
          className={`tab-btn ${activeTab === 'coaches' ? 'active' : ''}`}
          onClick={() => setActiveTab('coaches')}
        >
          👨‍🏫 教练管理
        </button>
      </div>

      {message && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      {activeTab === 'coaches' && (
        <div className="admin-section">
          {/* 添加教练表单 */}
          <div className="form-card glass-card">
            <h3>添加教练</h3>
            <form onSubmit={handleAddCoach} className="admin-form">
              <div className="form-row">
                <div className="form-group">
                  <label>教练姓名</label>
                  <input
                    type="text"
                    value={coachName}
                    onChange={(e) => setCoachName(e.target.value)}
                    placeholder="请输入教练姓名"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>专长</label>
                  <input
                    type="text"
                    value={coachSpecialty}
                    onChange={(e) => setCoachSpecialty(e.target.value)}
                    placeholder="例如：瑜伽、动感单车"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? '添加中...' : '添加教练'}
              </button>
            </form>
          </div>

          {/* 教练列表 */}
          <div className="list-card glass-card">
            <h3>教练列表 ({coaches.length})</h3>
            {coaches.length === 0 ? (
              <p className="empty">暂无教练，请先添加</p>
            ) : (
              <div className="coach-list">
                {coaches.map((coach) => (
                  <div key={coach.id} className="coach-item">
                    <div className="coach-avatar">👨‍🏫</div>
                    <div className="coach-info">
                      <p className="coach-name">{coach.name}</p>
                      <p className="coach-specialty">专长：{coach.specialty}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="admin-section">
          {/* 添加课程表单 */}
          <div className="form-card glass-card">
            <h3>排课</h3>
            <form onSubmit={handleAddCourse} className="admin-form">
              <div className="form-row">
                <div className="form-group">
                  <label>课程名称</label>
                  <input
                    type="text"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="例如：动感单车"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>授课教练</label>
                  <select
                    value={courseCoachId}
                    onChange={(e) => setCourseCoachId(e.target.value)}
                    required
                  >
                    <option value="">请选择教练</option>
                    {coaches.map((coach) => (
                      <option key={coach.id} value={coach.id}>
                        {coach.name} ({coach.specialty})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>课程日期</label>
                  <input
                    type="date"
                    value={courseDate}
                    onChange={(e) => setCourseDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>开始时间</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>结束时间</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>最大容量 (1-20)</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(e.target.value)}
                    required
                  />
                </div>
              </div>
              <p className="form-tip">
                💡 系统会自动检查教练时间冲突，同一教练不能在同一时间排两门课
              </p>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? '添加中...' : '添加课程'}
              </button>
            </form>
          </div>

          {/* 课程列表 */}
          <div className="list-card glass-card">
            <h3>课程列表 ({courses.length})</h3>
            {courses.length === 0 ? (
              <p className="empty">暂无课程，请先排课</p>
            ) : (
              <div className="admin-course-list">
                {courses.map((course) => {
                  const start = new Date(course.startTime);
                  const end = new Date(course.endTime);
                  return (
                    <div key={course.id} className="admin-course-item">
                      <div className="course-info-main">
                        <h4>{course.name}</h4>
                        <p>
                          教练：{course.coachName} | 时间：
                          {start.toLocaleDateString('zh-CN')}{' '}
                          {start.toLocaleTimeString('zh-CN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          -{' '}
                          {end.toLocaleTimeString('zh-CN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <p>
                          预约人数：{course.currentBookings}/{course.maxCapacity}
                        </p>
                      </div>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteCourse(course.id)}
                      >
                        删除
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
