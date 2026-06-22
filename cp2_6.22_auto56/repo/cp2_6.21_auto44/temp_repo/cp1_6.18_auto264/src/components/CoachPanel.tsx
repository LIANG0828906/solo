import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Exercise, TrainingPlan, StudentStats } from '../types';
import StatsChart from './StatsChart';

const CoachPanel = () => {
  const navigate = useNavigate();
  const [planName, setPlanName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [presetExercises, setPresetExercises] = useState<Exercise[]>([]);
  const [selectedPresetIds, setSelectedPresetIds] = useState<string[]>([]);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [customName, setCustomName] = useState('');
  const [customSets, setCustomSets] = useState<number>(3);
  const [customReps, setCustomReps] = useState<number>(12);
  const [customRest, setCustomRest] = useState<number>(60);
  const [createdPlan, setCreatedPlan] = useState<TrainingPlan | null>(null);
  const [statsCode, setStatsCode] = useState('');
  const [stats, setStats] = useState<StudentStats[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/exercises/preset')
      .then((r) => r.json())
      .then((data) => setPresetExercises(data));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const togglePreset = (id: string) => {
    setSelectedPresetIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const addCustomExercise = () => {
    if (!customName.trim()) return;
    setCustomExercises((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        name: customName.trim(),
        sets: customSets,
        reps: customReps,
        restSeconds: customRest,
        isCustom: true
      }
    ]);
    setCustomName('');
    setCustomSets(3);
    setCustomReps(12);
    setCustomRest(60);
  };

  const removeCustomExercise = (id: string) => {
    setCustomExercises((prev) => prev.filter((e) => e.id !== id));
  };

  const handleCreatePlan = async () => {
    const selectedPreset = presetExercises.filter((e) => selectedPresetIds.includes(e.id));
    const allExercises = [...selectedPreset, ...customExercises];
    if (!planName.trim() || allExercises.length === 0) {
      alert('请填写计划名称并选择至少一个动作');
      return;
    }

    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: planName.trim(),
          studentName: studentName.trim() || undefined,
          exercises: allExercises
        })
      });
      const data = await res.json();
      if (res.ok) {
        setCreatedPlan(data);
      } else {
        alert(data.error || '创建失败');
      }
    } catch {
      alert('创建计划失败，请稍后重试');
    }
  };

  const handleFetchStats = async () => {
    if (!statsCode.trim()) return;
    try {
      const res = await fetch(`/api/plans/${statsCode.trim().toUpperCase()}/stats`);
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      } else {
        alert(data.error || '获取统计数据失败');
        setStats([]);
      }
    } catch {
      alert('获取统计数据失败');
    }
  };

  const handleCopyCode = () => {
    if (createdPlan) {
      navigator.clipboard.writeText(createdPlan.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const selectedPreset = presetExercises.filter((e) => selectedPresetIds.includes(e.id));
  const allSelectedExercises = [...selectedPreset, ...customExercises];

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 700,
    color: '#E0E0E0'
  };

  const backBtnStyle: React.CSSProperties = {
    padding: '8px 20px',
    backgroundColor: '#2A2A2A',
    color: '#E0E0E0',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'filter 0.2s'
  };

  const sectionStyle: React.CSSProperties = {
    backgroundColor: '#1E1E1E',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(255,255,255,0.04)'
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 600,
    color: '#E0E0E0',
    marginBottom: '20px'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    color: '#B0B0B0',
    marginBottom: '8px',
    marginTop: '16px'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    backgroundColor: '#F5F5F5',
    color: '#121212',
    border: '2px solid #E0E0E0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s'
  };

  const buttonStyle: React.CSSProperties = {
    padding: '12px 28px',
    backgroundColor: '#7C4DFF',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'filter 0.2s',
    marginTop: '24px'
  };

  const dropdownContainerStyle: React.CSSProperties = {
    position: 'relative',
    marginTop: '8px'
  };

  const dropdownTriggerStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    backgroundColor: '#F5F5F5',
    color: '#121212',
    border: '2px solid #E0E0E0',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '14px'
  };

  const dropdownMenuStyle: React.CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    backgroundColor: '#2A2A2A',
    borderRadius: '8px',
    border: '1px solid #3A3A3A',
    maxHeight: '240px',
    overflowY: 'auto',
    zIndex: 10
  };

  const dropdownItemStyle: React.CSSProperties = {
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    color: '#E0E0E0',
    fontSize: '14px'
  };

  const exerciseItemStyle: React.CSSProperties = {
    padding: '12px 16px',
    backgroundColor: '#2A2A2A',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  };

  const inviteCodeBoxStyle: React.CSSProperties = {
    padding: '24px',
    backgroundColor: '#1A1A2E',
    borderRadius: '12px',
    textAlign: 'center',
    border: '2px dashed #7C4DFF'
  };

  const inviteCodeStyle: React.CSSProperties = {
    fontSize: '42px',
    fontWeight: 700,
    color: '#7C4DFF',
    letterSpacing: '8px',
    margin: '16px 0'
  };

  const copyBtnStyle: React.CSSProperties = {
    padding: '8px 24px',
    backgroundColor: copied ? '#4CAF50' : '#7C4DFF',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s'
  };

  const statRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#2A2A2A',
    borderRadius: '8px',
    marginBottom: '8px'
  };

  const statNameStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#E0E0E0',
    fontSize: '14px'
  };

  const colorDotStyle = (color: string): React.CSSProperties => ({
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: color
  });

  const progressBarBg: React.CSSProperties = {
    width: '120px',
    height: '8px',
    backgroundColor: '#3A3A3A',
    borderRadius: '4px',
    overflow: 'hidden',
    marginRight: '12px'
  };

  const progressBarFill = (rate: number): React.CSSProperties => ({
    width: `${Math.min(100, rate)}%`,
    height: '100%',
    backgroundColor: rate >= 80 ? '#4CAF50' : rate >= 50 ? '#FFD54F' : '#FF5252',
    borderRadius: '4px',
    transition: 'width 0.3s'
  });

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>💪 教练控制台</h1>
        <button
          style={backBtnStyle}
          onClick={() => navigate('/')}
          onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.2)')}
          onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
        >
          ← 返回
        </button>
      </div>

      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>📋 创建训练计划</h2>

        <label style={labelStyle}>计划名称</label>
        <input
          style={inputStyle}
          type="text"
          placeholder="例如：增肌训练第一周"
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#7C4DFF')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E0E0')}
        />

        <label style={labelStyle}>学员姓名（可选）</label>
        <input
          style={inputStyle}
          type="text"
          placeholder="例如：张三"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#7C4DFF')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E0E0')}
        />

        <label style={labelStyle}>选择预设动作（可多选）</label>
        <div ref={dropdownRef} style={dropdownContainerStyle}>
          <button
            style={dropdownTriggerStyle}
            onClick={() => setShowDropdown(!showDropdown)}
            type="button"
          >
            {selectedPresetIds.length > 0
              ? `已选择 ${selectedPresetIds.length} 个动作`
              : '点击选择动作...'}
          </button>
          {showDropdown && (
            <div style={dropdownMenuStyle}>
              {presetExercises.map((ex) => (
                <div
                  key={ex.id}
                  style={dropdownItemStyle}
                  onClick={() => togglePreset(ex.id)}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#3A3A3A')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <input
                    type="checkbox"
                    checked={selectedPresetIds.includes(ex.id)}
                    onChange={() => togglePreset(ex.id)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>{ex.name}</span>
                  <span style={{ color: '#808080', marginLeft: 'auto', fontSize: '12px' }}>
                    {ex.sets}组 × {ex.reps}次 · 休息{ex.restSeconds}s
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <label style={labelStyle}>添加自定义动作</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            style={{ ...inputStyle, width: 'auto', flex: '2 1 120px', marginTop: 0 }}
            type="text"
            placeholder="动作名称"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#7C4DFF')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E0E0')}
          />
          <input
            style={{ ...inputStyle, width: 'auto', flex: '1 1 80px', marginTop: 0 }}
            type="number"
            min={1}
            placeholder="组数"
            value={customSets}
            onChange={(e) => setCustomSets(parseInt(e.target.value) || 1)}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#7C4DFF')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E0E0')}
          />
          <input
            style={{ ...inputStyle, width: 'auto', flex: '1 1 80px', marginTop: 0 }}
            type="number"
            min={1}
            placeholder="次数"
            value={customReps}
            onChange={(e) => setCustomReps(parseInt(e.target.value) || 1)}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#7C4DFF')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E0E0')}
          />
          <input
            style={{ ...inputStyle, width: 'auto', flex: '1 1 80px', marginTop: 0 }}
            type="number"
            min={1}
            placeholder="休息(s)"
            value={customRest}
            onChange={(e) => setCustomRest(parseInt(e.target.value) || 30)}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#7C4DFF')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E0E0')}
          />
          <button
            style={{ ...buttonStyle, marginTop: 0, padding: '10px 20px' }}
            onClick={addCustomExercise}
            onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
            type="button"
          >
            + 添加
          </button>
        </div>

        {allSelectedExercises.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <label style={{ ...labelStyle, marginTop: 0 }}>已选动作列表</label>
            {allSelectedExercises.map((ex) => (
              <div key={ex.id} style={exerciseItemStyle}>
                <div>
                  <span style={{ color: '#E0E0E0', fontWeight: 500 }}>{ex.name}</span>
                  {ex.isCustom && (
                    <span style={{ fontSize: '12px', color: '#7C4DFF', marginLeft: '8px' }}>
                      自定义
                    </span>
                  )}
                  <span style={{ color: '#808080', fontSize: '13px', marginLeft: '12px' }}>
                    {ex.sets}组 × {ex.reps}次 · 休息{ex.restSeconds}s
                  </span>
                </div>
                {ex.isCustom && (
                  <button
                    style={{
                      padding: '4px 12px',
                      backgroundColor: '#FF5252',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                    onClick={() => removeCustomExercise(ex.id)}
                    type="button"
                  >
                    删除
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          style={buttonStyle}
          onClick={handleCreatePlan}
          onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.2)')}
          onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
          disabled={!planName.trim() || allSelectedExercises.length === 0}
        >
          🚀 创建计划
        </button>

        {createdPlan && (
          <div style={{ marginTop: '24px' }}>
            <div style={inviteCodeBoxStyle}>
              <div style={{ color: '#B0B0B0', fontSize: '14px' }}>计划创建成功！请将邀请码分享给学员</div>
              <div style={inviteCodeStyle}>{createdPlan.inviteCode}</div>
              <div style={{ color: '#808080', fontSize: '12px', marginBottom: '16px' }}>
                有效期至：{new Date(createdPlan.inviteExpiresAt).toLocaleDateString()}（7天有效）
              </div>
              <button
                style={copyBtnStyle}
                onClick={handleCopyCode}
                onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
              >
                {copied ? '✓ 已复制' : '📋 复制邀请码'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>📊 学员训练统计</h2>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <input
            style={{ ...inputStyle, flex: 1, marginTop: 0 }}
            type="text"
            placeholder="输入邀请码查看学员统计"
            value={statsCode}
            onChange={(e) => setStatsCode(e.target.value)}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#7C4DFF')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E0E0')}
          />
          <button
            style={{ ...buttonStyle, marginTop: 0 }}
            onClick={handleFetchStats}
            onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
            disabled={!statsCode.trim()}
          >
            查看统计
          </button>
        </div>

        {stats.length > 0 && (
          <>
            <StatsChart stats={stats} />
            <h3 style={{ fontSize: '16px', color: '#E0E0E0', margin: '24px 0 16px' }}>今日完成率</h3>
            {stats.map((s) => (
              <div key={s.studentName} style={statRowStyle}>
                <div style={statNameStyle}>
                  <span style={colorDotStyle(s.color)} />
                  <span>{s.studentName}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={progressBarBg}>
                    <div style={progressBarFill(s.todayCompletion)} />
                  </div>
                  <span style={{ color: '#E0E0E0', fontSize: '14px', fontWeight: 600, minWidth: '45px', textAlign: 'right' }}>
                    {s.todayCompletion}%
                  </span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default CoachPanel;
