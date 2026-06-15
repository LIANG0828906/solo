import React, { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import Modal from '@/components/Modal';
import { Course, Enrollment, CategoryType, DifficultyType } from '@/types';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { request } = useApi();
  const [activeTab, setActiveTab] = useState<'courses' | 'enrollments'>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showEnrollmentsModal, setShowEnrollmentsModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseEnrollments, setCourseEnrollments] = useState<Enrollment[]>([]);

  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    sessions: 2,
    difficulty: '初级' as DifficultyType,
    category: '编织' as CategoryType,
    price: 99,
    capacity: 20,
    images: ['', '', ''],
  });

  const [newMaterial, setNewMaterial] = useState({
    name: '',
    specs: '',
    target_quantity: 50,
    deadline: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      if (user?.role === 'instructor') {
        const data = await request<{ courses: Course[] }>('/api/instructor/courses');
        setCourses(data.courses);
      } else {
        const data = await request<{ enrollments: any[] }>('/api/my-enrollments');
        setMyEnrollments(data.enrollments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleCreateCourse = async () => {
    if (!newCourse.title || !newCourse.description) {
      alert('请填写课程名称和简介');
      return;
    }
    try {
      const images = newCourse.images.filter((img) => img.trim() !== '');
      await request('/api/courses', {
        method: 'POST',
        body: JSON.stringify({ ...newCourse, images }),
      });
      setShowCreateModal(false);
      setNewCourse({
        title: '',
        description: '',
        sessions: 2,
        difficulty: '初级',
        category: '编织',
        price: 99,
        capacity: 20,
        images: ['', '', ''],
      });
      loadData();
    } catch (err: any) {
      alert(err.message || '创建课程失败');
    }
  };

  const handleViewEnrollments = async (course: Course) => {
    setSelectedCourse(course);
    try {
      const data = await request<{ enrollments: Enrollment[] }>(`/api/courses/${course.id}/enrollments`);
      setCourseEnrollments(data.enrollments);
      setShowEnrollmentsModal(true);
    } catch (err: any) {
      alert(err.message || '加载学员列表失败');
    }
  };

  const exportCSV = () => {
    if (!selectedCourse || courseEnrollments.length === 0) return;
    const headers = ['学员昵称', '报名时间', '支付状态'];
    const rows = courseEnrollments.map((e) => [
      e.user_name,
      new Date(e.created_at).toLocaleString('zh-CN'),
      e.paid ? '已支付' : '未支付',
    ]);
    const csvContent = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedCourse.title}-学员名单.csv`;
    link.click();
  };

  const handleOpenMaterialModal = (course: Course) => {
    setSelectedCourse(course);
    setNewMaterial({ name: '', specs: '', target_quantity: 50, deadline: '' });
    setShowMaterialModal(true);
  };

  const handleCreateMaterial = async () => {
    if (!selectedCourse || !newMaterial.name || !newMaterial.specs || !newMaterial.deadline) {
      alert('请填写所有必填字段');
      return;
    }
    try {
      await request(`/api/courses/${selectedCourse.id}/materials`, {
        method: 'POST',
        body: JSON.stringify(newMaterial),
      });
      setShowMaterialModal(false);
      setNewMaterial({ name: '', specs: '', target_quantity: 50, deadline: '' });
    } catch (err: any) {
      alert(err.message || '发布材料包失败');
    }
  };

  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #E67E22, #8B5E3C)',
        borderRadius: '16px',
        padding: '32px',
        color: '#fff',
        marginBottom: '24px',
      }}>
        <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>
          {user?.role === 'instructor' ? '手工艺人管理中心' : '个人中心'}
        </h2>
        <p style={{ fontSize: '16px', opacity: 0.9 }}>
          你好，{user?.username}！{user?.role === 'instructor' ? '管理你的课程和学员' : '查看你的报名课程'}
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', fontSize: '18px', color: '#8B5E3C' }}>加载中...</div>
      ) : user?.role === 'instructor' ? (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}>
            <h3 style={{ fontSize: '22px', fontWeight: '600', color: '#333' }}>我的课程</h3>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '12px 24px',
                borderRadius: '10px',
                background: '#E67E22',
                color: '#fff',
                fontSize: '15px',
                fontWeight: '600',
              }}
            >
              + 创建新课程
            </button>
          </div>

          {courses.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px',
              background: '#fff',
              borderRadius: '12px',
              border: '2px solid #E8DCC8',
            }}>
              <p style={{ fontSize: '18px', color: '#8B5E3C', marginBottom: '12px' }}>您还没有创建任何课程</p>
              <p style={{ fontSize: '14px', color: '#999' }}>点击上方按钮创建您的第一个手工坊课程吧！</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '20px',
            }}
            className="dashboard-grid">
              {courses.map((course) => (
                <div key={course.id} style={{
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '2px solid #E8DCC8',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#333', margin: 0 }}>{course.title}</h4>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      background: course.difficulty === '初级' ? '#27AE60' : course.difficulty === '中级' ? '#F39C12' : '#E74C3C',
                      color: '#fff',
                    }}>
                      {course.difficulty}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px', height: '40px', overflow: 'hidden' }}>
                    {course.description}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#555', marginBottom: '16px' }}>
                    <span>价格：<strong style={{ color: '#E67E22' }}>¥{course.price}</strong></span>
                    <span>{course.enrolled_count}/{course.capacity} 人报名</span>
                  </div>
                  <div style={{
                    height: '8px',
                    background: '#F0EDE8',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '16px',
                  }}>
                    <div style={{
                      height: '100%',
                      background: '#E67E22',
                      borderRadius: '4px',
                      width: `${(course.enrolled_count / course.capacity) * 100}%`,
                    }} />
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleViewEnrollments(course)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        background: '#8B5E3C',
                        color: '#fff',
                        fontSize: '13px',
                        fontWeight: '500',
                      }}
                    >
                      查看学员
                    </button>
                    <button
                      onClick={() => handleOpenMaterialModal(course)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        background: '#27AE60',
                        color: '#fff',
                        fontSize: '13px',
                        fontWeight: '500',
                      }}
                    >
                      发布材料包
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <h3 style={{ fontSize: '22px', fontWeight: '600', color: '#333', marginBottom: '20px' }}>我的报名</h3>
          {myEnrollments.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px',
              background: '#fff',
              borderRadius: '12px',
              border: '2px solid #E8DCC8',
            }}>
              <p style={{ fontSize: '18px', color: '#8B5E3C', marginBottom: '12px' }}>您还没有报名任何课程</p>
              <p style={{ fontSize: '14px', color: '#999' }}>去课程墙发现感兴趣的课程吧！</p>
            </div>
          ) : (
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              border: '2px solid #E8DCC8',
              overflow: 'auto',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ background: '#2C3E50', color: '#fff', padding: '14px', textAlign: 'left', fontSize: '14px' }}>课程名称</th>
                    <th style={{ background: '#2C3E50', color: '#fff', padding: '14px', textAlign: 'left', fontSize: '14px' }}>讲师</th>
                    <th style={{ background: '#2C3E50', color: '#fff', padding: '14px', textAlign: 'left', fontSize: '14px' }}>费用</th>
                    <th style={{ background: '#2C3E50', color: '#fff', padding: '14px', textAlign: 'left', fontSize: '14px' }}>报名时间</th>
                    <th style={{ background: '#2C3E50', color: '#fff', padding: '14px', textAlign: 'left', fontSize: '14px' }}>支付状态</th>
                  </tr>
                </thead>
                <tbody>
                  {myEnrollments.map((enroll, index) => (
                    <tr key={enroll.id} style={{ background: index % 2 === 0 ? '#FAF8F5' : '#fff' }}>
                      <td style={{ padding: '14px', borderBottom: '1px solid #E8DCC8', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                        {enroll.course_title}
                      </td>
                      <td style={{ padding: '14px', borderBottom: '1px solid #E8DCC8', fontSize: '14px', color: '#555' }}>{enroll.instructor_name}</td>
                      <td style={{ padding: '14px', borderBottom: '1px solid #E8DCC8', fontSize: '14px', color: '#E67E22', fontWeight: '600' }}>¥{enroll.course_price}</td>
                      <td style={{ padding: '14px', borderBottom: '1px solid #E8DCC8', fontSize: '14px', color: '#555' }}>
                        {new Date(enroll.created_at).toLocaleString('zh-CN')}
                      </td>
                      <td style={{ padding: '14px', borderBottom