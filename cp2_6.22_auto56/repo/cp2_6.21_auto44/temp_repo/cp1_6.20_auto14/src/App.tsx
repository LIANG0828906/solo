import { useState, useEffect } from 'react';
import Planner from './components/Planner';
import Timer from './components/Timer';
import Logger from './components/Logger';
import { Task, StudyLog, ExamInfo, Subject, ViewType } from './types';
import { generateStudyPlan, calculateProgress } from './utils/planner';
import { loadTasks, saveTasks, loadLogs, saveLogs, loadExamInfo, saveExamInfo } from './utils/storage';
import { v4 as uuidv4 } from 'uuid';

const sidebarStyle: React.CSSProperties = {
  width: 'var(--sidebar-width)',
  backgroundColor: '#F0F4F8',
  height: '100vh',
  position: 'fixed',
  left: 0,
  top: 0,
  padding: '24px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
  borderRight: '1px solid #E0E8F0',
  zIndex: 100,
};

const logoStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#4A90D9',
  textAlign: 'center',
  paddingBottom: '16px',
  borderBottom: '1px solid #E0E8F0',
};

const navItemStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '14px',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const progressContainerStyle: React.CSSProperties = {
  marginTop: 'auto',
  padding: '20px',
  backgroundColor: '#fff',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(74, 144, 217, 0.1)',
};

const mainContentStyle: React.CSSProperties = {
  marginLeft: 'var(--sidebar-width)',
  minHeight: '100vh',
  backgroundColor: '#fff',
  padding: '24px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #D0D8E0',
  borderRadius: '6px',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s',
};

const buttonStyle: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: '#4A90D9',
  color: '#fff',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 500,
  transition: 'all 0.2s ease',
  position: 'relative',
  overflow: 'hidden',
};

const sectionStyle: React.CSSProperties = {
  backgroundColor: '#F0F4F8',
  padding: '24px',
  borderRadius: '12px',
  marginBottom: '20px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 500,
  color: '#555',
  marginBottom: '8px',
  display: 'block',
};

const subjectRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  marginBottom: '10px',
  alignItems: 'center',
};

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('planner');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [examInfo, setExamInfo] = useState<ExamInfo | null>(null);
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: uuidv4(), name: '数学', weight: 3 },
    { id: uuidv4(), name: '英语', weight: 2 },
  ]);

  useEffect(() => {
    const savedTasks = loadTasks();
    const savedLogs = loadLogs();
    const savedExam = loadExamInfo();

    if (savedExam) {
      setExamInfo(savedExam);
      setExamName(savedExam.name);
      setExamDate(savedExam.date);
      setSubjects(savedExam.subjects);
    }

    if (savedTasks.length > 0) {
      setTasks(savedTasks);
    }

    if (savedLogs.length > 0) {
      setLogs(savedLogs);
    }

    if (!savedExam && savedTasks.length === 0) {
      const defaultSubjects: Subject[] = [
        { id: uuidv4(), name: '数学', weight: 3 },
        { id: uuidv4(), name: '英语', weight: 2 },
        { id: uuidv4(), name: '物理', weight: 2 },
        { id: uuidv4(), name: '化学', weight: 1 },
      ];
      setSubjects(defaultSubjects);
      setExamName('期末考试');
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      const dateStr = defaultDate.toISOString().split('T')[0];
      setExamDate(dateStr);

      const defaultExam: ExamInfo = {
        name: '期末考试',
        date: dateStr,
        subjects: defaultSubjects,
      };
      const defaultTasks = generateStudyPlan(defaultExam);
      setExamInfo(defaultExam);
      setTasks(defaultTasks);

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const dayBefore = new Date(today);
      dayBefore.setDate(dayBefore.getDate() - 2);

      const defaultLogs: StudyLog[] = [
        {
          id: uuidv4(),
          date: today.toISOString().split('T')[0],
          duration: 25,
          subject: '数学',
          startTime: '09:00:00',
          endTime: '09:25:00',
        },
        {
          id: uuidv4(),
          date: today.toISOString().split('T')[0],
          duration: 25,
          subject: '英语',
          startTime: '10:00:00',
          endTime: '10:25:00',
        },
        {
          id: uuidv4(),
          date: yesterday.toISOString().split('T')[0],
          duration: 25,
          subject: '物理',
          startTime: '14:00:00',
          endTime: '14:25:00',
        },
        {
          id: uuidv4(),
          date: yesterday.toISOString().split('T')[0],
          duration: 25,
          subject: '数学',
          startTime: '15:00:00',
          endTime: '15:25:00',
        },
        {
          id: uuidv4(),
          date: dayBefore.toISOString().split('T')[0],
          duration: 25,
          subject: '化学',
          startTime: '08:30:00',
          endTime: '08:55:00',
        },
      ];
      setLogs(defaultLogs);
    }
  }, []);

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    saveLogs(logs);
  }, [logs]);

  useEffect(() => {
    saveExamInfo(examInfo);
  }, [examInfo]);

  const progress = calculateProgress(tasks);

  const handleGeneratePlan = () => {
    if (!examName.trim() || !examDate || subjects.length === 0) {
      alert('请填写考试名称、考试日期并至少添加一个科目');
      return;
    }

    const exam: ExamInfo = {
      name: examName,
      date: examDate,
      subjects,
    };

    setExamInfo(exam);
    const newTasks = generateStudyPlan(exam);
    setTasks(newTasks);
  };

  const handleTaskStatusChange = (taskId: string, status: Task['status']) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t))
    );
  };

  const handleTaskReorder = (date: string, startIndex: number, endIndex: number) => {
    setTasks((prev) => {
      const dayTasks = prev.filter((t) => t.date === date);
      const otherTasks = prev.filter((t) => t.date !== date);

      const [removed] = dayTasks.splice(startIndex, 1);
      dayTasks.splice(endIndex, 0, removed);

      return [...otherTasks, ...dayTasks];
    });
  };

  const handleAddStudyLog = (log: StudyLog) => {
    setLogs((prev) => [log, ...prev]);
  };

  const handleAddSubject = () => {
    setSubjects((prev) => [...prev, { id: uuidv4(), name: '', weight: 1 }]);
  };

  const handleRemoveSubject = (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubjectChange = (id: string, field: 'name' | 'weight', value: string | number) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const renderProgressRing = () => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
      <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto' }}>
        <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#E0E8F0"
            strokeWidth="8"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#4A90D9"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#4A90D9',
          }}
        >
          {progress}%
        </div>
      </div>
    );
  };

  const navItems = [
    { key: 'planner' as ViewType, label: '学习计划', icon: '📅' },
    { key: 'timer' as ViewType, label: '番茄钟', icon: '⏱️' },
    { key: 'logger' as ViewType, label: '学习日志', icon: '📝' },
  ];

  return (
    <div>
      <aside className="app-sidebar">
        <div style={logoStyle}>📚 学习助手</div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => (
            <div
              key={item.key}
              onClick={() => setCurrentView(item.key)}
              style={{
                ...navItemStyle,
                backgroundColor: currentView === item.key ? '#4A90D9' : 'transparent',
                color: currentView === item.key ? '#fff' : '#555',
              }}
              onMouseEnter={(e) => {
                if (currentView !== item.key) {
                  e.currentTarget.style.backgroundColor = '#E0E8F0';
                }
              }}
              onMouseLeave={(e) => {
                if (currentView !== item.key) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        <div style={progressContainerStyle}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px', textAlign: 'center' }}>
            总体完成进度
          </div>
          {renderProgressRing()}
          <div style={{ fontSize: '12px', color: '#999', marginTop: '12px', textAlign: 'center' }}>
            共 {tasks.length} 个任务
          </div>
        </div>
      </aside>

      <main className="app-main">
        {currentView === 'planner' && (
          <div>
            <div style={sectionStyle}>
              <h2 style={{ fontSize: '18px', marginBottom: '20px', color: '#333' }}>
                设置考试信息
              </h2>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>考试名称</label>
                  <input
                    type="text"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    placeholder="例如：期末考试"
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>考试日期</label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>科目列表（权重越高，分配时间越多）</label>
                {subjects.map((subject) => (
                  <div key={subject.id} style={subjectRowStyle}>
                    <input
                      type="text"
                      value={subject.name}
                      onChange={(e) => handleSubjectChange(subject.id, 'name', e.target.value)}
                      placeholder="科目名称"
                      style={{ ...inputStyle, flex: 2 }}
                    />
                    <input
                      type="number"
                      value={subject.weight}
                      onChange={(e) =>
                        handleSubjectChange(subject.id, 'weight', parseInt(e.target.value) || 1)
                      }
                      min="1"
                      max="10"
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <button
                      onClick={() => handleRemoveSubject(subject.id)}
                      style={{
                        padding: '10px 12px',
                        backgroundColor: '#FF6B6B',
                        color: '#fff',
                        borderRadius: '6px',
                        fontSize: '14px',
                      }}
                    >
                      删除
                    </button>
                  </div>
                ))}
                <button
                  onClick={handleAddSubject}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px dashed #4A90D9',
                    backgroundColor: 'transparent',
                    color: '#4A90D9',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                >
                  + 添加科目
                </button>
              </div>

              <button
                onClick={handleGeneratePlan}
                className="ripple-button"
                style={{
                  ...buttonStyle,
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#3A7BC8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#4A90D9';
                }}
              >
                生成学习计划
              </button>
            </div>

            {tasks.length > 0 && (
              <Planner
                tasks={tasks}
                onTaskStatusChange={handleTaskStatusChange}
                onTaskReorder={handleTaskReorder}
              />
            )}
          </div>
        )}

        {currentView === 'timer' && (
          <Timer onComplete={handleAddStudyLog} subjects={subjects} />
        )}

        {currentView === 'logger' && <Logger logs={logs} />}
      </main>
    </div>
  );
}

export default App;
