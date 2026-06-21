import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchClasses, createClass } from '../services/api';

interface ClassInfo {
  id: string;
  name: string;
  students: string[];
}

const styles = {
  container: {
    maxWidth: 900,
    margin: '0 auto',
    padding: '40px 20px',
    fontFamily: "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  },
  title: {
    color: '#1B3A5C',
    fontSize: 32,
    fontWeight: 700 as const,
    marginBottom: 32,
    textAlign: 'center' as const,
  },
  form: {
    background: '#fff',
    borderRadius: 12,
    padding: 24,
    boxShadow: '0 2px 12px rgba(27,58,92,0.08)',
    marginBottom: 32,
  },
  formRow: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap' as const,
  },
  input: {
    flex: 1,
    minWidth: 200,
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: 8,
    fontSize: 15,
    outline: 'none',
  },
  textarea: {
    flex: 2,
    minWidth: 200,
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: 8,
    fontSize: 15,
    minHeight: 80,
    resize: 'vertical' as const,
    outline: 'none',
    fontFamily: "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  },
  button: {
    padding: '10px 28px',
    background: '#1B3A5C',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600 as const,
    cursor: 'pointer',
    alignSelf: 'flex-start' as const,
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 20,
  },
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: 24,
    boxShadow: '0 2px 12px rgba(27,58,92,0.08)',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
  },
  cardName: {
    fontSize: 18,
    fontWeight: 600 as const,
    color: '#1B3A5C',
    marginBottom: 8,
  },
  cardCount: {
    fontSize: 14,
    color: '#666',
  },
};

export default function ClassList() {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [name, setName] = useState('');
  const [students, setStudents] = useState('');

  useEffect(() => {
    fetchClasses().then((res) => setClasses(res.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !students.trim()) return;
    try {
      const res = await createClass({ name: name.trim(), students: students.trim() });
      setClasses((prev) => [...prev, res.data]);
      setName('');
      setStudents('');
    } catch {}
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>班级分组管理</h1>
      <form style={styles.form} onSubmit={handleSubmit}>
        <div style={styles.formRow}>
          <input
            style={styles.input}
            placeholder="班级名称"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <textarea
            style={styles.textarea}
            placeholder="学生名单（用逗号或换行分隔）"
            value={students}
            onChange={(e) => setStudents(e.target.value)}
          />
          <button style={styles.button} type="submit">
            创建班级
          </button>
        </div>
      </form>
      <div style={styles.cardGrid}>
        {classes.map((cls) => (
          <Link
            key={cls.id}
            to={`/class/${cls.id}`}
            style={styles.card}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.transform =
                'translateY(-3px)';
              (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                '0 6px 20px rgba(27,58,92,0.15)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.transform = 'none';
              (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                '0 2px 12px rgba(27,58,92,0.08)';
            }}
          >
            <div style={styles.cardName}>{cls.name}</div>
            <div style={styles.cardCount}>
              {cls.students?.length ?? 0} 名学生
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
