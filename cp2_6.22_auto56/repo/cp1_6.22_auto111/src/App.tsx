import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import DoctorPanel from './components/DoctorPanel';
import PatientView from './components/PatientView';
import PharmacyView from './components/PharmacyView';

type Role = 'doctor' | 'patient' | 'pharmacy';

const RoleSelector = ({ onSelect }: { onSelect: (role: Role) => void }) => {
  const roles: { id: Role; title: string; icon: string; desc: string }[] = [
    { id: 'doctor', title: '医生端', icon: '👨‍⚕️', desc: '开具电子处方，管理患者用药' },
    { id: 'patient', title: '患者端', icon: '👤', desc: '查看处方，设置用药提醒' },
    { id: 'pharmacy', title: '药师端', icon: '💊', desc: '接收处方，标记配药状态' },
  ];

  return (
    <div className="page-transition" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '1200px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '3rem', color: '#1F2937' }}>
          电子处方流转与用药提醒服务
        </h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', flexWrap: 'wrap' }}>
          {roles.map((role, index) => (
            <div
              key={role.id}
              className="card"
              onClick={() => onSelect(role.id)}
              style={{
                padding: '2rem',
                textAlign: 'center',
                cursor: 'pointer',
                animation: `fadeIn 0.3s ease ${index * 0.1}s both`,
                minWidth: '280px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 20px -3px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{role.icon}</div>
              <h2 style={{ marginBottom: '0.5rem', color: '#3B82F6' }}>{role.title}</h2>
              <p style={{ color: '#6B7280' }}>{role.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Header = ({ currentRole, onBack }: { currentRole: string; onBack: () => void }) => {
  const roleNames: Record<string, string> = {
    doctor: '医生端',
    patient: '患者端',
    pharmacy: '药师端',
  };

  return (
    <div style={{
      background: '#FFFFFF',
      padding: '1rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    }}>
      <button className="btn btn-secondary" onClick={onBack}>
        ← 返回首页
      </button>
      <h2 style={{ color: '#3B82F6', margin: 0 }}>{roleNames[currentRole] || '电子处方系统'}</h2>
      <div style={{ width: '100px' }}></div>
    </div>
  );
};

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showContent, setShowContent] = useState(true);

  useEffect(() => {
    setShowContent(false);
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const handleRoleSelect = (role: Role) => {
    navigate(`/${role}`);
  };

  const handleBack = () => {
    navigate('/');
  };

  const getCurrentRole = (): string => {
    if (location.pathname.includes('doctor')) return 'doctor';
    if (location.pathname.includes('patient')) return 'patient';
    if (location.pathname.includes('pharmacy')) return 'pharmacy';
    return '';
  };

  const currentRole = getCurrentRole();

  return (
    <div style={{ minHeight: '100vh' }}>
      {currentRole && <Header currentRole={currentRole} onBack={handleBack} />}
      <div className={showContent ? 'page-transition' : ''} style={{ opacity: showContent ? 1 : 0, transition: 'opacity 0.2s ease' }}>
        <Routes>
          <Route path="/" element={<RoleSelector onSelect={handleRoleSelect} />} />
          <Route path="/doctor" element={<DoctorPanel />} />
          <Route path="/patient" element={<PatientView />} />
          <Route path="/pharmacy" element={<PharmacyView />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
