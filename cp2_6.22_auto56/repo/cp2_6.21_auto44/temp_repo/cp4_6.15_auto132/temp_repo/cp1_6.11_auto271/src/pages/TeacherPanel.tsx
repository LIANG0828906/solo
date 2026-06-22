import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const TeacherPanel: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [newCourse, setNewCourse] = useState({
    name: '',
    category: '琴',
    teacher: '',
    startTime: '',
    description: '',
    maxStudents: 20
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, coursesRes] = await Promise.all([
        fetch('/api/teacher/stats'),
        fetch('/api/courses')
      ]);
      
      const statsData = await statsRes.json();
      const coursesData = await coursesRes.json();
      
      setStats(statsData);
      setCourses(coursesData);
    } catch (error) {
      console.error('获取数据失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = async () => {
    if (!newCourse.name || !newCourse.teacher) {
      alert('请填写课程名称和授课先生');
      return;
    }
    
    try {
      const response = await fetch('/api/teacher/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCourse)
      });
      
      if (response.ok) {
        setShowAddModal(false);
        setNewCourse({
          name: '',
          category: '琴',
          teacher: '',
          startTime: '',
          description: '',
          maxStudents: 20
        });
        fetchData();
      }
    } catch (error) {
      console.error('添加课程失败', error);
    }
  };

  const handleEditCourse = async () => {
    if (!editingCourse) return;
    
    try {
      const response = await fetch(`/api/teacher/courses/${editingCourse.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCourse)
      });
      
      if (response.ok) {
        setEditingCourse(null);
        fetchData();
      }
    } catch (error) {
      console.error('编辑课程失败', error);
    }
  };

  const categoryColors: Record<string, string> = {
    '琴': '#6B8E23',
    '棋': '#3C3C3C',
    '书': '#8B4513',
    '画': '#CC3333'
  };

  const chartColors = ['#6B8E23', '#3C3C3C', '#8B4513', '#CC3333', '#D4AF37'];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="bamboo-loading">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bamboo-slip"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-panel">
      <div className="panel-header">
        <h2 className="page-title">📚 教学管理后台</h2>
        <button className="add-course-btn" onClick={() => setShowAddModal(true)}>
          ➕ 发布新课程
        </button>
      </div>

      <div className="stats-overview">
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #6B8E23, #556B2F)' }}>
          <span className="stat-icon-large">👥</span>
          <div>
            <p className="stat-value">{stats?.totalStudents || 0}</p>
            <p className="stat-label">学生总数</p>
          </div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #3C3C3C, #1C1C1C)' }}>
          <span className="stat-icon-large">📖</span>
          <div>
            <p className="stat-value">{courses.length}</p>
            <p className="stat-label">课程总数</p>
          </div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #CC3333, #A02020)' }}>
          <span className="stat-icon-large">📊</span>
          <div>
            <p className="stat-value">{
              stats?.courseCompletion?.reduce((sum: number, c: any) => sum + c.completionRate, 0) || 0
            }</p>
            <p className="stat-label">完成人次</p>
          </div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <h3>📈 成绩分布柱状图</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats?.scoreDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E0D0" />
                <XAxis dataKey="range" stroke="#4A2C1A" />
                <YAxis stroke="#4A2C1A" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#F5F0E1', 
                    border: '2px solid #D4AF37',
                    borderRadius: '8px',
                    fontFamily: 'KaiTi, STKaiti, serif'
                  }}
                  formatter={(value) => [`${value}人`, '学生人数']}
                />
                <Bar dataKey="count" fill="#8B4513" radius={[6, 6, 0, 0]} name="学生人数" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3>🎯 四艺课程分布</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={[
                    { name: '琴', value: courses.filter(c => c.category === '琴').length },
                    { name: '棋', value: courses.filter(c => c.category === '棋').length },
                    { name: '书', value: courses.filter(c => c.category === '书').length },
                    { name: '画', value: courses.filter(c => c.category === '画').length }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  dataKey="value"
                  label={({ name, value }) => `${name}艺: ${value}门`}
                >
                  {Object.values(categoryColors).map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="courses-management">
        <h3>📚 课程管理</h3>
        <div className="courses-table">
          <table>
            <thead>
              <tr>
                <th>课程名称</th>
                <th>类别</th>
                <th>授课先生</th>
                <th>已预约</th>
                <th>名额</th>
                <th>完成率</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(course => {
                const stat = stats?.courseCompletion?.find((s: any) => s.id === course.id);
                const completionRate = course.enrolledCount > 0 
                  ? Math.round((stat?.completionRate || 0) / course.enrolledCount * 100)
                  : 0;
                
                return (
                  <tr key={course.id}>
                    <td className="course-name-cell">
                      <span 
                        className="category-dot"
                        style={{ backgroundColor: categoryColors[course.category] }}
                      ></span>
                      {course.name}
                    </td>
                    <td>
                      <span 
                        className="category-badge"
                        style={{ 
                          backgroundColor: `${categoryColors[course.category]}20`,
                          color: categoryColors[course.category]
                        }}
                      >
                        {course.category}艺
                      </span>
                    </td>
                    <td>{course.teacher}</td>
                    <td>{course.enrolledCount}</td>
                    <td>{course.maxStudents}</td>
                    <td>
                      <div className="completion-bar">
                        <div 
                          className="completion-fill"
                          style={{ 
                            width: `${completionRate}%`,
                            backgroundColor: categoryColors[course.category]
                          }}
                        />
                        <span className="completion-text">{completionRate}%</span>
                      </div>
                    </td>
                    <td>
                      <button 
                        className="edit-btn"
                        onClick={() => setEditingCourse({ ...course })}
                      >
                        ✏️ 编辑
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>发布新课程</h3>
            
            <div className="form-group">
              <label>课程名称</label>
              <input
                type="text"
                value={newCourse.name}
                onChange={e => setNewCourse({ ...newCourse, name: e.target.value })}
                placeholder="请输入课程名称"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>课程类别</label>
                <select
                  value={newCourse.category}
                  onChange={e => setNewCourse({ ...newCourse, category: e.target.value })}
                >
                  <option value="琴">琴艺</option>
                  <option value="棋">棋艺</option>
                  <option value="书">书艺</option>
                  <option value="画">画艺</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>最大名额</label>
                <input
                  type="number"
                  value={newCourse.maxStudents}
                  onChange={e => setNewCourse({ ...newCourse, maxStudents: parseInt(e.target.value) })}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>授课先生</label>
              <input
                type="text"
                value={newCourse.teacher}
                onChange={e => setNewCourse({ ...newCourse, teacher: e.target.value })}
                placeholder="请输入授课先生姓名"
              />
            </div>
            
            <div className="form-group">
              <label>开课时间</label>
              <input
                type="text"
                value={newCourse.startTime}
                onChange={e => setNewCourse({ ...newCourse, startTime: e.target.value })}
                placeholder="如：每周一 辰时"
              />
            </div>
            
            <div className="form-group">
              <label>课程简介</label>
              <textarea
                value={newCourse.description}
                onChange={e => setNewCourse({ ...newCourse, description: e.target.value })}
                placeholder="请输入课程简介"
                rows={4}
              />
            </div>
            
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowAddModal(false)}>取消</button>
              <button className="confirm-btn" onClick={handleAddCourse}>发布</button>
            </div>
          </div>
        </div>
      )}

      {editingCourse && (
        <div className="modal-overlay" onClick={() => setEditingCourse(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>编辑课程</h3>
            
            <div className="form-group">
              <label>课程名称</label>
              <input
                type="text"
                value={editingCourse.name}
                onChange={e => setEditingCourse({ ...editingCourse, name: e.target.value })}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>课程类别</label>
                <select
                  value={editingCourse.category}
                  onChange={e => setEditingCourse({ ...editingCourse, category: e.target.value })}
                >
                  <option value="琴">琴艺</option>
                  <option value="棋">棋艺</option>
                  <option value="书">书艺</option>
                  <option value="画">画艺</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>最大名额</label>
                <input
                  type="number"
                  value={editingCourse.maxStudents}
                  onChange={e => setEditingCourse({ ...editingCourse, maxStudents: parseInt(e.target.value) })}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>授课先生</label>
              <input
                type="text"
                value={editingCourse.teacher}
                onChange={e => setEditingCourse({ ...editingCourse, teacher: e.target.value })}
              />
            </div>
            
            <div className="form-group">
              <label>开课时间</label>
              <input
                type="text"
                value={editingCourse.startTime}
                onChange={e => setEditingCourse({ ...editingCourse, startTime: e.target.value })}
              />
            </div>
            
            <div className="form-group">
              <label>课程简介</label>
              <textarea
                value={editingCourse.description}
                onChange={e => setEditingCourse({ ...editingCourse, description: e.target.value })}
                rows={4}
              />
            </div>
            
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setEditingCourse(null)}>取消</button>
              <button className="confirm-btn" onClick={handleEditCourse}>保存</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .teacher-panel {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .page-title {
          font-size: 28px;
          color: #4A2C1A;
        }
        
        .add-course-btn {
          padding: 10px 24px;
          background: linear-gradient(135deg, #D4AF37, #B8860B);
          color: white;
          border-radius: 20px;
          font-size: 15px;
          box-shadow: 0 3px 10px rgba(212, 175, 55, 0.4);
        }
        
        .stats-overview {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        
        .stat-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 24px;
          border-radius: 12px;
          color: white;
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }
        
        .stat-icon-large {
          font-size: 40px;
        }
        
        .stat-value {
          font-size: 28px;
          font-weight: bold;
          font-family: 'LiSu', 'STLiti', '隶书', serif;
        }
        
        .stat-label {
          font-size: 14px;
          opacity: 0.9;
        }
        
        .charts-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        
        .chart-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          border: 1px solid #E8E0D0;
        }
        
        .chart-card h3 {
          font-size: 18px;
          color: #4A2C1A;
          margin-bottom: 16px;
        }
        
        .chart-container {
          width: 100%;
        }
        
        .courses-management {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          border: 1px solid #E8E0D0;
        }
        
        .courses-management h3 {
          font-size: 20px;
          color: #4A2C1A;
          margin-bottom: 16px;
        }
        
        .courses-table {
          overflow-x: auto;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
        }
        
        th {
          text-align: left;
          padding: 12px 16px;
          background: #F9F6EE;
          color: #4A2C1A;
          font-weight: bold;
          font-size: 14px;
          border-bottom: 2px solid #E8E0D0;
        }
        
        td {
          padding: 14px 16px;
          border-bottom: 1px solid #F0E8D8;
          font-size: 14px;
          color: #3C3C3C;
        }
        
        tr:hover {
          background: #FDFBF5;
        }
        
        .course-name-cell {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: bold;
        }
        
        .category-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        
        .category-badge {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
        }
        
        .completion-bar {
          position: relative;
          width: 100px;
          height: 20px;
          background: #E8E0D0;
          border-radius: 10px;
          overflow: hidden;
        }
        
        .completion-fill {
          height: 100%;
          border-radius: 10px;
          transition: width 0.3s ease;
        }
        
        .completion-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 11px;
          font-weight: bold;
          color: #3C3C3C;
        }
        
        .edit-btn {
          padding: 6px 14px;
          background: #F5E6D3;
          color: #8B4513;
          border-radius: 6px;
          font-size: 13px;
        }
        
        .edit-btn:hover {
          background: #E8D5C0;
          opacity: 1;
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-content {
          background: white;
          border-radius: 16px;
          padding: 28px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
          border: 2px solid #D4AF37;
        }
        
        .modal-content h3 {
          font-size: 22px;
          color: #4A2C1A;
          margin-bottom: 20px;
          text-align: center;
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        
        .form-group label {
          display: block;
          font-size: 14px;
          color: #4A2C1A;
          margin-bottom: 6px;
          font-weight: bold;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #D4C9A8;
          border-radius: 8px;
          font-size: 14px;
          font-family: 'KaiTi', 'STKaiti', serif;
          outline: none;
          transition: border-color 0.2s ease;
        }
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          border-color: #D4AF37;
        }
        
        .form-group textarea {
          resize: vertical;
        }
        
        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }
        
        .cancel-btn {
          flex: 1;
          padding: 12px;
          background: #F5E6D3;
          color: #8B4513;
          border-radius: 8px;
          font-size: 15px;
        }
        
        .confirm-btn {
          flex: 1;
          padding: 12px;
          background: linear-gradient(135deg, #D4AF37, #B8860B);
          color: white;
          border-radius: 8px;
          font-size: 15px;
        }
        
        @media (max-width: 900px) {
          .stats-overview {
            grid-template-columns: 1fr;
          }
          
          .charts-row {
            grid-template-columns: 1fr;
          }
        }
        
        @media (max-width: 600px) {
          .panel-header {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }
          
          .page-title {
            font-size: 22px;
          }
          
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default TeacherPanel;
