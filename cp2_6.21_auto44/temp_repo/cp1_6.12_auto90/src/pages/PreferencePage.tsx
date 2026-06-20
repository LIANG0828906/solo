import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import PreferenceForm from '@/components/PreferenceForm';
import { Map } from 'lucide-react';

export default function PreferencePage() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <div className="container page-wrapper">
        <h1 className="page-title">📝 填写你的办公偏好</h1>
        <p className="page-desc">
          调整下方 8 项偏好，告诉队友们你的舒适办公习惯。所有修改将自动保存（300ms 防抖）。
        </p>

        <PreferenceForm />

        <div className="form-actions">
          <button
            className="btn-secondary"
            onClick={() => navigate('/office-map')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <Map size={18} />
            查看办公室地图
          </button>
        </div>
      </div>
    </>
  );
}
