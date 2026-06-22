import { useState, useCallback, CSSProperties } from 'react';
import { FLAVOR_KEYS, FLAVOR_LABELS, type FlavorRatings } from './types';

interface FormPanelProps {
  onSubmit: (data: {
    beanName: string;
    grindSize: string;
    waterTemp: number;
    brewTime: number;
    ratio: string;
    ratings: FlavorRatings;
  }) => void;
  onRatingChange: (key: string, value: number) => void;
  initialRatings: FlavorRatings;
}

const containerStyle: CSSProperties = {
  backgroundColor: '#1E293B',
  borderRadius: '12px',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const formGroupStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const labelStyle: CSSProperties = {
  color: '#94A3B8',
  fontSize: '14px',
  fontWeight: 500,
};

const inputStyle: CSSProperties = {
  backgroundColor: '#0F172A',
  border: '1px solid #334155',
  borderRadius: '8px',
  padding: '10px 12px',
  color: '#E2E8F0',
  fontSize: '14px',
  transition: 'background-color 0.2s ease, border-color 0.2s ease',
  outline: 'none',
};

const getInputStyle = (isHovered: boolean): CSSProperties => ({
  ...inputStyle,
  backgroundColor: isHovered ? '#374151' : '#0F172A',
});

const sliderContainerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const sliderRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const sliderLabelStyle: CSSProperties = {
  color: '#94A3B8',
  fontSize: '14px',
  width: '60px',
  flexShrink: 0,
};

const sliderValueStyle: CSSProperties = {
  color: '#E2E8F0',
  fontSize: '14px',
  fontWeight: 600,
  width: '40px',
  textAlign: 'right',
  flexShrink: 0,
};

const sliderStyle: CSSProperties = {
  flex: 1,
  height: '6px',
  borderRadius: '3px',
  background: '#334155',
  outline: 'none',
  WebkitAppearance: 'none',
  appearance: 'none',
  cursor: 'pointer',
};

const submitButtonStyle: CSSProperties = {
  backgroundColor: '#F59E0B',
  color: '#1E293B',
  border: 'none',
  borderRadius: '8px',
  padding: '12px 24px',
  fontSize: '16px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease, transform 0.1s ease',
  marginTop: '8px',
};

const errorStyle: CSSProperties = {
  color: '#EF4444',
  fontSize: '12px',
  marginTop: '4px',
};

const sectionTitleStyle: CSSProperties = {
  color: '#E2E8F0',
  fontSize: '16px',
  fontWeight: 600,
  margin: '8px 0 4px 0',
};

const inputWrapperStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
};

const unitStyle: CSSProperties = {
  position: 'absolute',
  right: '12px',
  color: '#94A3B8',
  fontSize: '14px',
  pointerEvents: 'none',
};

export default function FormPanel({ onSubmit, onRatingChange, initialRatings }: FormPanelProps) {
  const [beanName, setBeanName] = useState('');
  const [grindSize, setGrindSize] = useState('');
  const [waterTemp, setWaterTemp] = useState('90');
  const [brewTime, setBrewTime] = useState('120');
  const [ratio, setRatio] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [inputHover, setInputHover] = useState<Record<string, boolean>>({});
  const [buttonPressed, setButtonPressed] = useState(false);

  const handleInputChange = useCallback((field: string, value: string) => {
    switch (field) {
      case 'beanName':
        setBeanName(value);
        break;
      case 'grindSize':
        setGrindSize(value);
        break;
      case 'waterTemp':
        setWaterTemp(value);
        break;
      case 'brewTime':
        setBrewTime(value);
        break;
      case 'ratio':
        setRatio(value);
        break;
    }
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const handleSliderChange = useCallback((key: string, value: number) => {
    onRatingChange(key, value);
  }, [onRatingChange]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!beanName.trim()) {
      newErrors.beanName = '豆子名称不能为空';
    }

    const temp = parseFloat(waterTemp);
    if (isNaN(temp) || temp <= 0) {
      newErrors.waterTemp = '请输入有效的水温';
    }

    const time = parseInt(brewTime, 10);
    if (isNaN(time) || time <= 0) {
      newErrors.brewTime = '请输入有效的注水时间';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [beanName, waterTemp, brewTime]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit({
      beanName: beanName.trim(),
      grindSize: grindSize.trim(),
      waterTemp: parseFloat(waterTemp),
      brewTime: parseInt(brewTime, 10),
      ratio: ratio.trim(),
      ratings: initialRatings,
    });

    setBeanName('');
    setGrindSize('');
    setWaterTemp('90');
    setBrewTime('120');
    setRatio('');
    setErrors({});
  }, [validateForm, onSubmit, beanName, grindSize, waterTemp, brewTime, ratio, initialRatings]);

  const handleButtonMouseDown = useCallback(() => {
    setButtonPressed(true);
    setTimeout(() => setButtonPressed(false), 100);
  }, []);

  return (
    <form style={containerStyle} onSubmit={handleSubmit}>
      <div style={sectionTitleStyle}>冲煮参数</div>

      <div style={formGroupStyle}>
        <label style={labelStyle} htmlFor="beanName">
          豆子名称 <span style={{ color: '#EF4444' }}>*</span>
        </label>
        <div style={inputWrapperStyle}>
          <input
            id="beanName"
            type="text"
            value={beanName}
            onChange={(e) => handleInputChange('beanName', e.target.value)}
            style={getInputStyle(inputHover.beanName || false)}
            onMouseEnter={() => setInputHover(prev => ({ ...prev, beanName: true }))}
            onMouseLeave={() => setInputHover(prev => ({ ...prev, beanName: false }))}
            placeholder="请输入豆子名称"
          />
        </div>
        {errors.beanName && <span style={errorStyle}>{errors.beanName}</span>}
      </div>

      <div style={formGroupStyle}>
        <label style={labelStyle} htmlFor="grindSize">研磨度</label>
        <div style={inputWrapperStyle}>
          <input
            id="grindSize"
            type="text"
            value={grindSize}
            onChange={(e) => handleInputChange('grindSize', e.target.value)}
            style={getInputStyle(inputHover.grindSize || false)}
            onMouseEnter={() => setInputHover(prev => ({ ...prev, grindSize: true }))}
            onMouseLeave={() => setInputHover(prev => ({ ...prev, grindSize: false }))}
            placeholder="如：中粗、细"
          />
        </div>
      </div>

      <div style={formGroupStyle}>
        <label style={labelStyle} htmlFor="waterTemp">水温</label>
        <div style={inputWrapperStyle}>
          <input
            id="waterTemp"
            type="number"
            value={waterTemp}
            onChange={(e) => handleInputChange('waterTemp', e.target.value)}
            style={{ ...getInputStyle(inputHover.waterTemp || false), paddingRight: '36px' }}
            onMouseEnter={() => setInputHover(prev => ({ ...prev, waterTemp: true }))}
            onMouseLeave={() => setInputHover(prev => ({ ...prev, waterTemp: false }))}
            placeholder="90"
            step="0.5"
          />
          <span style={unitStyle}>°C</span>
        </div>
        {errors.waterTemp && <span style={errorStyle}>{errors.waterTemp}</span>}
      </div>

      <div style={formGroupStyle}>
        <label style={labelStyle} htmlFor="brewTime">注水时间</label>
        <div style={inputWrapperStyle}>
          <input
            id="brewTime"
            type="number"
            value={brewTime}
            onChange={(e) => handleInputChange('brewTime', e.target.value)}
            style={{ ...getInputStyle(inputHover.brewTime || false), paddingRight: '36px' }}
            onMouseEnter={() => setInputHover(prev => ({ ...prev, brewTime: true }))}
            onMouseLeave={() => setInputHover(prev => ({ ...prev, brewTime: false }))}
            placeholder="120"
            step="1"
          />
          <span style={unitStyle}>秒</span>
        </div>
        {errors.brewTime && <span style={errorStyle}>{errors.brewTime}</span>}
      </div>

      <div style={formGroupStyle}>
        <label style={labelStyle} htmlFor="ratio">粉水比</label>
        <div style={inputWrapperStyle}>
          <input
            id="ratio"
            type="text"
            value={ratio}
            onChange={(e) => handleInputChange('ratio', e.target.value)}
            style={getInputStyle(inputHover.ratio || false)}
            onMouseEnter={() => setInputHover(prev => ({ ...prev, ratio: true }))}
            onMouseLeave={() => setInputHover(prev => ({ ...prev, ratio: false }))}
            placeholder="如：1:15"
          />
        </div>
      </div>

      <div style={sectionTitleStyle}>风味评分</div>

      {FLAVOR_KEYS.map((key) => (
        <div key={key} style={sliderContainerStyle}>
          <div style={sliderRowStyle}>
            <span style={sliderLabelStyle}>{FLAVOR_LABELS[key]}</span>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={initialRatings[key]}
              onChange={(e) => handleSliderChange(key, parseFloat(e.target.value))}
              style={{
                ...sliderStyle,
                background: `linear-gradient(to right, #F59E0B 0%, #F59E0B ${(initialRatings[key] / 10) * 100}%, #334155 ${(initialRatings[key] / 10) * 100}%, #334155 100%)`,
              }}
              className="flavor-slider"
            />
            <span style={sliderValueStyle}>{initialRatings[key].toFixed(1)}</span>
          </div>
        </div>
      ))}

      <style>{`
        .flavor-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #F59E0B;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        .flavor-slider::-webkit-slider-thumb:hover {
          background: #FCD34D;
        }
        .flavor-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #F59E0B;
          cursor: pointer;
          border: none;
          transition: background-color 0.2s ease;
        }
        .flavor-slider::-moz-range-thumb:hover {
          background: #FCD34D;
        }
        .flavor-slider::-moz-range-track {
          height: 6px;
          border-radius: 3px;
          background: transparent;
        }
      `}</style>

      <button
        type="submit"
        style={{
          ...submitButtonStyle,
          transform: buttonPressed ? 'scale(0.95)' : 'scale(1)',
        }}
        onMouseDown={handleButtonMouseDown}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#FCD34D';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#F59E0B';
        }}
      >
        提交记录
      </button>
    </form>
  );
}
