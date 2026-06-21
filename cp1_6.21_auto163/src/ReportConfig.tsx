import React, { useEffect, useState } from 'react';
import axios from 'axios';
import type { Student, ReportConfig as ReportConfigType } from './types';

interface ReportConfigProps {
  value: ReportConfigType;
  onChange: (config: ReportConfigType) => void;
}

const formatDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getDefaultDates = () => {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);
  return {
    startDate: formatDate(weekAgo),
    endDate: formatDate(today),
  };
};

const ReportConfig: React.FC<ReportConfigProps> = ({ value, onChange }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    axios
      .get<Student[]>('/api/students')
      .then((res) => {
        setStudents(res.data);
        if (res.data.length > 0 && !value.studentId) {
          const defaults = getDefaultDates();
          onChange({
            studentId: res.data[0].id,
            startDate: defaults.startDate,
            endDate: defaults.endDate,
            includeChart: true,
            includeRecommendations: true,
          });
        }
      })
      .catch((err) => console.error('获取学员列表失败:', err));
  }, []);

  const handleFieldChange = <K extends keyof ReportConfigType>(
    key: K,
    val: ReportConfigType[K]
  ) => {
    onChange({ ...value, [key]: val });
  };

  const configContent = (
    <>
      <h2 style={{ color: '#fff', fontSize: '18px', margin: 0, marginBottom: '24px', fontWeight: 600 }}>
        周报配置
      </h2>

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>选择学员</label>
        <select
          value={value.studentId}
          onChange={(e) => handleFieldChange('studentId', e.target.value)}
          style={selectStyle}
        >
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.id} - {s.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>开始日期</label>
        <input
          type="date"
          value={value.startDate}
          onChange={(e) => handleFieldChange('startDate', e.target.value)}
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>结束日期</label>
        <input
          type="date"
          value={value.endDate}
          onChange={(e) => handleFieldChange('endDate', e.target.value)}
          style={inputStyle}
        />
      </div>

      <div style={switchContainer}>
        <label style={labelStyle}>包含成绩趋势图</label>
        <Switch
          checked={value.includeChart}
          onChange={(v) => handleFieldChange('includeChart', v)}
        />
      </div>

      <div style={switchContainer}>
        <label style={labelStyle}>包含推荐学习内容</label>
        <Switch
          checked={value.includeRecommendations}
          onChange={(v) => handleFieldChange('includeRecommendations', v)}
        />
      </div>
    </>
  );

  return (
    <>
      <button
        className="config-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? '收起配置 ▲' : '展开配置 ▼'}
      </button>
      <aside className={`config-panel ${mobileOpen ? 'mobile-open' : ''}`}>
        {configContent}
      </aside>
    </>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: '#CBD5E1',
  fontSize: '14px',
  marginBottom: '8px',
  fontWeight: 500,
};

const baseInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #475569',
  borderRadius: '8px',
  backgroundColor: '#0F172A',
  color: '#F1F5F9',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'background-color 0.2s ease, border-color 0.2s ease',
};

const selectStyle: React.CSSProperties = {
  ...baseInputStyle,
  cursor: 'pointer',
};

const inputStyle: React.CSSProperties = {
  ...baseInputStyle,
};

const switchContainer: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '20px',
};

interface SwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
}

const Switch: React.FC<SwitchProps> = ({ checked, onChange }) => {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: '48px',
        height: '26px',
        borderRadius: '13px',
        backgroundColor: checked ? '#3B82F6' : '#475569',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        padding: 0,
        transition: 'background-color 0.2s ease',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '3px',
          left: checked ? '25px' : '3px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#FFFFFF',
          transition: 'left 0.2s ease',
          display: 'block',
        }}
      />
    </button>
  );
};

export default ReportConfig;
