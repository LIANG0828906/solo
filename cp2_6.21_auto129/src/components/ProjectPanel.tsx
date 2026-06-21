import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Square, Save, Copy, Check } from 'lucide-react';
import { useStore } from '@/store';
import Toast from './Toast';
import './ProjectPanel.css';

export default function ProjectPanel() {
  const navigate = useNavigate();
  const currentProject = useStore((s) => s.currentProject);
  const isPlaying = useStore((s) => s.isPlaying);
  const setIsPlaying = useStore((s) => s.setIsPlaying);
  const addToast = useStore((s) => s.addToast);

  const [copied, setCopied] = useState(false);

  const handleCopyInvite = async () => {
    if (currentProject?.inviteCode) {
      await navigator.clipboard.writeText(currentProject.inviteCode);
      setCopied(true);
      addToast('邀请码已复制');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
    addToast(isPlaying ? '已停止播放' : '开始播放');
  };

  const handleSave = () => {
    addToast('项目已保存');
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="project-panel">
      <Toast />
      <button className="back-btn" onClick={handleBack}>
        <ArrowLeft size={18} />
        <span>返回列表</span>
      </button>

      <div className="panel-section">
        <h3 className="section-title">项目信息</h3>
        <div className="info-row">
          <span className="info-label">项目名</span>
          <span className="info-value">{currentProject?.name || '-'}</span>
        </div>
        <div className="info-row">
          <span className="info-label">创建人</span>
          <span className="info-value">{currentProject?.creator || '-'}</span>
        </div>
        <div className="info-row invite-row">
          <span className="info-label">邀请码</span>
          <div className="invite-box">
            <span className="invite-code">{currentProject?.inviteCode || '-'}</span>
            <button className="copy-btn" onClick={handleCopyInvite}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      </div>

      <div className="panel-section">
        <h3 className="section-title">播放控制</h3>
        <div className="control-buttons">
          <button
            className={`control-btn ${isPlaying ? 'stop-btn' : 'play-btn'}`}
            onClick={handleTogglePlay}
          >
            {isPlaying ? <Square size={20} /> : <Play size={20} />}
            <span>{isPlaying ? '停止' : '播放'}</span>
          </button>
          <button className="control-btn save-btn" onClick={handleSave}>
            <Save size={20} />
            <span>保存</span>
          </button>
        </div>
      </div>
    </div>
  );
}
