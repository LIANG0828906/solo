import { useState, useEffect, useMemo, useRef } from 'react';
import { FiSave } from 'react-icons/fi';
import type { BrewRecord, RoastLevel } from '../types';

interface Props {
  initialData?: BrewRecord;
  onSubmit: (data: Omit<BrewRecord, 'id' | 'createdAt'>) => Promise<void>;
  onCancelEdit?: () => void;
  isEditing?: boolean;
}

const ROAST_OPTIONS: RoastLevel[] = ['浅', '中浅', '中', '中深', '深'];
const inputBase = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #E8D6C3',
  backgroundColor: '#FAF5EF',
  fontSize: 14,
  color: '#4A3525',
  transition: 'border-color 0.2s ease-out, box-shadow 0.2s ease-out',
};

export default function BrewForm({ initialData, onSubmit, onCancelEdit, isEditing }: Props) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [bean, setBean] = useState('');
  const [roast, setRoast] = useState<RoastLevel>('中');
  const [grind, setGrind] = useState(40);
  const [temp, setTemp] = useState(92);
  const [method, setMethod] = useState('');
  const [duration, setDuration] = useState('');
  const [coffeeWeight, setCoffeeWeight] = useState<number | ''>(15);
  const [waterWeight, setWaterWeight] = useState<number | ''>(250);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [pressedStar, setPressedStar] = useState<number | null>(null);
  const [durationError, setDurationError] = useState('');
  const durationTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date);
      setBean(initialData.bean);
      setRoast(initialData.roast);
      setGrind(initialData.grind);
      setTemp(initialData.temp);
      setMethod(initialData.method);
      setDuration(initialData.duration);
      setCoffeeWeight(initialData.coffeeWeight);
      setWaterWeight(initialData.waterWeight);
      setRating(initialData.rating);
    }
  }, [initialData]);

  const ratio = useMemo(() => {
    const cw = Number(coffeeWeight);
    const ww = Number(waterWeight);
    if (!cw || !ww || cw <= 0) return '1:--';
    return `1:${(ww / cw).toFixed(1)}`;
  }, [coffeeWeight, waterWeight]);

  const validateDuration = (val: string): boolean => {
    const parts = val.split(':');
    if (parts.length !== 2) return false;
    const [m, s] = parts;
    if (!/^\d+$/.test(m) || !/^\d+$/.test(s)) return false;
    const mins = parseInt(m, 10);
    const secs = parseInt(s, 10);
    if (mins < 0 || mins > 99) return false;
    if (secs < 0 || secs > 59) return false;
    return true;
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDuration(val);
    if (durationTimeoutRef.current) clearTimeout(durationTimeoutRef.current);
    durationTimeoutRef.current = window.setTimeout(() => {
      if (val && !validateDuration(val)) {
        setDurationError('请输入分:秒格式，如 2:30');
      } else {
        setDurationError('');
      }
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bean.trim()) {
      alert('请输入咖啡豆名称');
      return;
    }
    if (duration && !validateDuration(duration)) {
      alert('请输入正确的时间格式（分:秒）');
      return;
    }
    if (rating === 0) {
      alert('请进行评分');
      return;
    }
    await onSubmit({
      date,
      bean: bean.trim(),
      roast,
      grind,
      temp,
      method: method.trim(),
      duration: duration || '0:00',
      coffeeWeight: Number(coffeeWeight) || 0,
      waterWeight: Number(waterWeight) || 0,
      rating,
    });
    if (!isEditing) {
      setDate(new Date().toISOString().slice(0, 10));
      setBean('');
      setRoast('中');
      setGrind(40);
      setTemp(92);
      setMethod('');
      setDuration('');
      setCoffeeWeight(15);
      setWaterWeight(250);
      setRating(0);
      setDurationError('');
    }
  };

  const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = '#D4A373';
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212, 163, 115, 0.2)';
  };
  const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = '#E8D6C3';
    e.currentTarget.style.boxShadow = 'none';
  };

  const displayRating = hoverRating || rating;

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        backgroundColor: '#FAF5EF',
        padding: 20,
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(74, 53, 37, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <h2 style={{ fontSize: 18, color: '#4A3525', fontWeight: 600 }}>
        {isEditing ? '编辑冲泡记录' : '新增冲泡记录'}
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
          <span style={{ color: '#6F4E37', fontWeight: 500 }}>日期</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={inputBase}
            onFocus={focusStyle}
            onBlur={blurStyle}
            required
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
          <span style={{ color: '#6F4E37', fontWeight: 500 }}>咖啡豆名称</span>
          <input
            type="text"
            value={bean}
            onChange={(e) => setBean(e.target.value)}
            placeholder="如：埃塞俄比亚 耶加雪菲"
            style={inputBase}
            onFocus={focusStyle}
            onBlur={blurStyle}
            required
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
          <span style={{ color: '#6F4E37', fontWeight: 500 }}>烘焙度</span>
          <select
            value={roast}
            onChange={(e) => setRoast(e.target.value as RoastLevel)}
            style={inputBase}
            onFocus={focusStyle}
            onBlur={blurStyle}
          >
            {ROAST_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}烘焙</option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
          <span style={{ color: '#6F4E37', fontWeight: 500 }}>水温 (°C)</span>
          <input
            type="number"
            min={70}
            max={100}
            value={temp}
            onChange={(e) => setTemp(Number(e.target.value))}
            style={inputBase}
            onFocus={focusStyle}
            onBlur={blurStyle}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, gridColumn: '1 / -1' }}>
          <span style={{ color: '#6F4E37', fontWeight: 500 }}>研磨度：{grind} 格</span>
          <input
            type="range"
            min={10}
            max={80}
            step={5}
            value={grind}
            onChange={(e) => setGrind(Number(e.target.value))}
            style={{
              width: '100%',
              accentColor: '#6F4E37',
              height: 6,
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#A67B5B' }}>
            <span>10 细</span>
            <span>45</span>
            <span>80 粗</span>
          </div>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
          <span style={{ color: '#6F4E37', fontWeight: 500 }}>注水方式</span>
          <input
            type="text"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            placeholder="如：三段式"
            style={inputBase}
            onFocus={focusStyle}
            onBlur={blurStyle}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
          <span style={{ color: '#6F4E37', fontWeight: 500 }}>总时长 (分:秒)</span>
          <input
            type="text"
            value={duration}
            onChange={handleDurationChange}
            placeholder="如 2:30"
            style={{
              ...inputBase,
              borderColor: durationError ? '#C0392B' : '#E8D6C3',
            }}
            onFocus={focusStyle}
            onBlur={blurStyle}
          />
          {durationError && (
            <span style={{ color: '#C0392B', fontSize: 11 }}>{durationError}</span>
          )}
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
          <span style={{ color: '#6F4E37', fontWeight: 500 }}>粉重 (g)</span>
          <input
            type="number"
            min={0}
            step={0.1}
            value={coffeeWeight}
            onChange={(e) => setCoffeeWeight(e.target.value === '' ? '' : Number(e.target.value))}
            style={inputBase}
            onFocus={focusStyle}
            onBlur={blurStyle}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
          <span style={{ color: '#6F4E37', fontWeight: 500 }}>水量 (g)</span>
          <input
            type="number"
            min={0}
            step={1}
            value={waterWeight}
            onChange={(e) => setWaterWeight(e.target.value === '' ? '' : Number(e.target.value))}
            style={inputBase}
            onFocus={focusStyle}
            onBlur={blurStyle}
          />
        </label>

        <div style={{
          gridColumn: '1 / -1',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 12px',
          backgroundColor: '#F5F0EB',
          borderRadius: 8,
        }}>
          <span style={{ color: '#6F4E37', fontWeight: 500, fontSize: 13 }}>粉水比：</span>
          <span style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#6F4E37',
            fontFamily: 'Georgia, serif',
            letterSpacing: 1,
          }}>
            {ratio}
          </span>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, gridColumn: '1 / -1' }}>
          <span style={{ color: '#6F4E37', fontWeight: 500 }}>评分</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3, 4, 5].map((n) => {
              const isActive = n <= displayRating;
              const isPressed = pressedStar === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  onMouseDown={() => setPressedStar(n)}
                  onMouseUp={() => setPressedStar(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 4,
                    fontSize: 32,
                    cursor: 'pointer',
                    color: isActive ? '#D4A373' : '#C8BFB5',
                    transform: isPressed ? 'scale(1.15)' : 'scale(1)',
                    transition: 'transform 0.15s ease-out, color 0.2s ease-out',
                    textShadow: isActive ? '0 0 4px rgba(212, 163, 115, 0.4)' : 'none',
                    lineHeight: 1,
                  }}
                >
                  ★
                </button>
              );
            })}
          </div>
        </label>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          type="submit"
          style={{
            width: 160,
            height: 48,
            backgroundColor: '#6F4E37',
            color: '#FAF5EF',
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'background-color 0.2s ease-out, transform 0.1s ease-out',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#5A3E2B')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#6F4E37')}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <FiSave size={18} />
          {isEditing ? '保存修改' : '保存'}
        </button>
        {isEditing && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            style={{
              height: 48,
              padding: '0 20px',
              backgroundColor: 'transparent',
              color: '#6F4E37',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              border: '1px solid #A67B5B',
              transition: 'all 0.2s ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#E8D6C3';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            取消
          </button>
        )}
      </div>
    </form>
  );
}
