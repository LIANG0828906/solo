import { useState, useEffect } from 'react';
import { learnerApi, courseApi } from '../api';
import { Learner, Course } from '../types';

function LearnerManagement() {
  const [learners, setLearners] = useState<Learner[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [expandedLearnerId, setExpandedLearnerId] = useState<string | null>(null);
  const [enrollmentsMap, setEnrollmentsMap] = useState<Map<string, unknown[]>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([learnerApi.getLearners(), courseApi.getCourses()])
      .then(([learnerList, courseList]) => {
        setLearners(learnerList);
        setCourses(courseList);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleExpand = async (learnerId: string) => {
    if (expandedLearnerId === learnerId) {
      setExpandedLearnerId(null);
      return;
    }

    setExpandedLearnerId(learnerId);

    if (!enrollmentsMap.has(learnerId)) {
      try {
        const progress = await learnerApi.getLearnerProgress(learnerId);
        setEnrollmentsMap(new Map(enrollmentsMap.set(learnerId, progress)));
      } catch (err) {
        console.error('获取学员进度失败', err);
      }
    }
  };

  const getCourse = (courseId: string) => {
    return courses.find((c) => c.id === courseId);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; className: string } } = {
      enrolled: { label: '已报名', className: 'enrolled' },
      in_progress: { label: '学习中', className: 'in_progress' },
      completed: { label: '已完成', className: 'completed' },
      assessed: { label: '已考核', className: 'assessed' },
    };
    const s = statusMap[status] || statusMap.enrolled;
    return <span className={`status-badge ${s.className}`}>{s.label}</span>;
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">学员管理</h1>
          <p className="page-description">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">学员管理</h1>
        <p className="page-description">查看所有学员及其选课情况</p>
      </div>

      <div className="learners-table-container">
        <table className="learners-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th>学员信息</th>
              <th>邮箱</th>
              <th>部门</th>
              <th style={{ width: '100px' }}>选课数</th>
            </tr>
          </thead>
          <tbody>
            {learners.map((learner) => {
              const learnerProgress = enrollmentsMap.get(learner.id) || [];
              const isExpanded = expandedLearnerId === learner.id;
              return (
                <>
                  <tr key={learner.id}>
                    <td>
                      <button
                        className="expand-btn"
                        onClick={() => toggleExpand(learner.id)}
                      >
                        {isExpanded ? '−' : '+'}
                      </button>
                    </td>
                    <td>
                      <div className="learner-info">
                        <div className="learner-avatar">
                          {learner.name.charAt(0)}
                        </div>
                        <div>
                          <div className="learner-name">{learner.name}</div>
                        </div>
                      </div>
                    </td>
                    <td>{learner.email}</td>
                    <td>{learner.department}</td>
                    <td>{learnerProgress.length} 门</td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${learner.id}-detail`}>
                      <td colSpan={5}>
                        <div className="learner-detail-panel">
                          <h4 className="learner-detail-title">选课详情</h4>
                          {learnerProgress.length > 0 ? (
                            (learnerProgress as Array<{
                              course: Course;
                              progress: number;
                              status: string;
                              enrollment: { assessmentScore: number | null };
                            }>).map((item) => (
                              <div key={item.course.id} className="enrolled-course-item">
                                <div>
                                  <div className="enrolled-course-name">
                                    {item.course.title}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: '12px',
                                      color: '#888',
                                      marginTop: '4px',
                                    }}
                                  >
                                    进度：{item.progress}%
                                    {item.enrollment.assessmentScore !== null &&
                                      ` · 得分：${item.enrollment.assessmentScore}分`}
                                  </div>
                                </div>
                                {getStatusBadge(item.status)}
                              </div>
                            ))
                          ) : (
                            <p style={{ color: '#888', fontSize: '14px' }}>
                              暂无选课记录
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LearnerManagement;
