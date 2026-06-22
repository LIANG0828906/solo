import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ImageCarousel from '@/components/ImageCarousel';
import Modal from '@/components/Modal';
import MaterialCard from '@/components/MaterialCard';
import { Course, Material } from '@/types';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';

interface ScheduleItem {
  date: string;
  time: string;
  topic: string;
}

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { request } = useApi();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await request<{ course: Course; materials: Material[] }>(
        `/api/courses/${id}`,
        { requireAuth: false }
      );
      setCourse(data.course);
      setMaterials(data.materials);
    } catch (err: any) {
      setError(err.message || '加载课程失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setEnrolling(true);
    try {
      await request(`/api/courses/${id}/enroll`, {
        method: 'POST',
      });
      setTimeout(() => {
        setEnrolling(false);
        setShowEnrollModal(false);
        navigate('/dashboard');
      }, 1000);
    } catch (err: any) {
      setEnrolling(false);
      alert(err.message || '报名失败');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '48px', fontSize: '18px', color: '#8B5E3C' }}>加载中...</div>;
  }

  if (error || !course) {
    return <div style={{ textAlign: 'center', padding: '48px', fontSize: '18px', color: '#E74C3C' }}>{error || '课程不存在'}</div>;
  }

  const images: string[] = JSON.parse(course.images || '[]');
  const schedule: ScheduleItem[] = JSON.parse(course.schedule || '[]');
  const remaining = course.capacity - course.enrolled_count;
  const isFull = remaining <= 0;

  const defaultSchedule: ScheduleItem[] = schedule.length > 0 ? schedule : [
    { date: '每周六', time: '14:00-16:00', topic: '课程内容第1节' },
    { date: '每周日', time: '14:00-16:00', topic: '课程内容第2节' },
  ];

  return (
    <div>
      <ImageCarousel images={images} />

      <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}
        className="detail-grid">
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginBottom: '12px' }}>
            {course.title}
          </h1>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <span style={{
              padding: '6px 14px',
              borderRadius: '20px',
              background: course.difficulty === '初级' ? '#27AE60' : course.difficulty === '中级' ? '#F39C12' : '#E74C3C',
              color: '#fff',
              fontSize: '13px',
              fontWeight: '600',
            }}>
              {course.difficulty}
            </span>
            <span style={{
              padding: '6px 14px',
              borderRadius: '20px',
              background: '#8B5E3C',
              color: '#fff',
              fontSize: '13px',
              fontWeight: '600',
            }}>
              {course.category}
            </span>
            <span style={{ padding: '6px 14px', borderRadius: '20px', background: '#F0EDE8', color: '#666', fontSize: '13px' }}>
              {course.sessions} 节课程
            </span>
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '2px solid #E8DCC8', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#E67E22', marginBottom: '16px' }}>课程介绍</h3>
            <p style={{ fontSize: '15px', color: '#555', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
              {course.description}
            </p>
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '2px solid #E8DCC8', marginBottom: '24px', overflow: 'auto' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#E67E22', marginBottom: '16px' }}>上课时间表</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ background: '#2C3E50', color: '#fff', padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>日期</th>
                  <th style={{ background: '#2C3E50', color: '#fff', padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>时间</th>
                  <th style={{ background: '#2C3E50', color: '#fff', padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>课程主题</th>
                </tr>
              </thead>
              <tbody>
                {defaultSchedule.map((item, index) => (
                  <tr key={index} style={{ background: index % 2 === 0 ? '#FAF8F5' : '#fff' }}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #E8DCC8', fontSize: '14px', color: '#555' }}>{item.date}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #E8DCC8', fontSize: '14px', color: '#555' }}>{item.time}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #E8DCC8', fontSize: '14px', color: '#555' }}>{item.topic}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '2px solid #E8DCC8', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#E67E22', marginBottom: '16px' }}>讲师简介</h3>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, #E67E22, #8B5E3C)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '20px',
                fontWeight: 'bold',
                flexShrink: 0,
              }}>
                {course.instructor_name.charAt(0)}
              </div>
              <div>
                <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>{course.instructor_name}</h4>
                <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.7' }}>
                  {course.instructor_bio || '资深手工艺人，拥有多年教学经验，热爱分享手作的乐趣与技巧。'}
                </p>
              </div>
            </div>
          </div>

          {materials.length > 0 && (
            <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '2px solid #E8DCC8' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#E67E22', marginBottom: '16px' }}>材料包众筹</h3>
              {materials.map((material) => (
                <MaterialCard key={material.id} material={material} onSupported={loadData} />
              ))}
            </div>
          )}
        </div>

        <div>
          <div style={{
            position: 'sticky',
            top: '100px',
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            border: '2px solid #E8DCC8',
          }}>
            <div style={{ borderBottom: '2px solid #E8DCC8', paddingBottom: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>课程费用</div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#E67E22' }}>
                ¥{course.price}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                <span style={{ color: '#666' }}>已报名</span>
                <span style={{ color: '#27AE60', fontWeight: '600' }}>{course.enrolled_count} 人</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                <span style={{ color: '#666' }}>剩余名额</span>
                <span style={{ color: remaining <= 3 ? '#E74C3C' : '#333', fontWeight: '600' }}>{remaining} 个</span>
              </div>
              <div style={{
                height: '8px',
                background: '#F0EDE8',
                borderRadius: '4px',
                overflow: 'hidden',
                marginTop: '12px',
              }}>
                <div style={{
                  height: '100%',
                  background: '#E67E22',
                  borderRadius: '4px',
                  width: `${(course.enrolled_count / course.capacity) * 100}%`,
                }} />
              </div>
            </div>

            <button
              onClick={() => setShowEnrollModal(true)}
              disabled={isFull}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '10px',
                background: isFull ? '#ccc' : '#E67E22',
                color: '#fff',
                fontSize: '18px',
                fontWeight: '600',
              }}
            >
              {isFull ? '课程已满' : '立即报名'}
            </button>

            {course.enrolled_count >= course.capacity * 0.8 && (
              <p style={{ marginTop: '12px', fontSize: '13px', color: '#E67E22', textAlign: 'center' }}>
                🔥 报名火爆！名额即将满员
              </p>
            )}
          </div>
        </div>
      </div>

      <Modal open={showEnrollModal} onClose={() => !enrolling && setShowEnrollModal(false)} title="确认报名">
        <div style={{ marginBottom: '24px' }}>
          <div style={{ marginBottom: '16px', fontSize: '15px', color: '#555' }}>
            <p style={{ marginBottom: '8px' }}><strong>课程名称：</strong>{course.title}</p>
            <p><strong>费用：</strong><span style={{ fontSize: '22px', color: '#E67E22', fontWeight: 'bold' }}>¥{course.price}</span></p>
          </div>
          <p style={{ fontSize: '13px', color: '#999' }}>确认报名后请及时完成支付，名额有限先到先得。</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setShowEnrollModal(false)}
            disabled={enrolling}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              background: '#F0EDE8',
              color: '#666',
              fontSize: '15px',
            }}
          >
            取消
          </button>
          <button
            onClick={handleEnroll}
            disabled={enrolling}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              background: enrolling ? '#F5B77A' : '#E67E22',
              color: '#fff',
              fontSize: '15px',
              fontWeight: '600',
            }}
          >
            {enrolling ? '提交中...' : '确认报名'}
          </button>
        </div>
      </Modal>

      <style>{`
        @media (max-width: 767px) {
          .detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CourseDetail;
