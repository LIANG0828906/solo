import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTravelStore } from './store';
import { format, differenceInDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Trip } from './types';

const cardBaseStyle: React.CSSProperties = {
  backgroundColor: '#2d2d44',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
  transition: 'all 0.3s ease'
};

const cardHoverStyle: React.CSSProperties = {
  ...cardBaseStyle,
  transform: 'translateY(-3px)',
  boxShadow: '0 10px 40px rgba(108, 92, 231, 0.2)',
  cursor: 'pointer'
};

const buttonStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '8px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'filter 0.2s ease',
  fontSize: '14px'
};

const buttonHover: React.CSSProperties = {
  ...buttonStyle,
  filter: 'brightness(1.15)'
};

function TripCard({ trip, onEdit, onDelete }: { trip: Trip; onEdit: (t: Trip) => void; onDelete: (id: string) => void }) {
  const [hovered, setHovered] = useState(false);
  const photos = useTravelStore((s) => s.photos).filter((p) => p.tripId === trip.id);
  const days = differenceInDays(new Date(trip.endDate), new Date(trip.startDate)) + 1;

  return (
    <div
      style={hovered ? cardHoverStyle : cardBaseStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link to={`/trip/${trip.id}`} style={{ textDecoration: 'none', color: '#e0e0ff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px', color: '#e0e0ff' }}>{trip.name}</h3>
            <p style={{ color: '#a29bfe', fontSize: '14px' }}>📍 {trip.destinationCity}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={(e) => {
                e.preventDefault();
                onEdit(trip);
              }}
              style={{
                background: 'transparent',
                border: '1px solid #3d3d5c',
                color: '#e0e0ff',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#6c5ce7';
                e.currentTarget.style.color = '#a29bfe';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#3d3d5c';
                e.currentTarget.style.color = '#e0e0ff';
              }}
            >
              ✏️ 编辑
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                if (window.confirm('确定要删除这个行程吗？所有照片也将被删除。')) {
                  onDelete(trip.id);
                }
              }}
              style={{
                background: 'transparent',
                border: '1px solid #3d3d5c',
                color: '#ff6b81',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#ff6b81';
                e.currentTarget.style.backgroundColor = 'rgba(255, 107, 129, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#3d3d5c';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              🗑️ 删除
            </button>
          </div>
        </div>
      </Link>

      <div style={{ display: 'flex', gap: '24px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #3d3d5c' }}>
        <div>
          <p style={{ fontSize: '12px', color: '#8080a0', marginBottom: '4px' }}>出行时间</p>
          <p style={{ fontSize: '14px', color: '#e0e0ff' }}>
            {format(new Date(trip.startDate), 'yyyy年M月d日', { locale: zhCN })} — {format(new Date(trip.endDate), 'M月d日', { locale: zhCN })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <div>
            <p style={{ fontSize: '12px', color: '#8080a0', marginBottom: '4px' }}>天数</p>
            <p style={{ fontSize: '18px', fontWeight: 700, color: '#a29bfe' }}>{days}天</p>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#8080a0', marginBottom: '4px' }}>照片</p>
            <p style={{ fontSize: '18px', fontWeight: 700, color: '#a29bfe' }}>{photos.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TripForm({
  initial,
  onSubmit,
  onCancel
}: {
  initial?: Trip | null;
  onSubmit: (data: Omit<Trip, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name || '');
  const [destinationCity, setDestinationCity] = useState(initial?.destinationCity || '');
  const [startDate, setStartDate] = useState(initial?.startDate || format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(initial?.endDate || format(new Date(), 'yyyy-MM-dd'));
  const [btnHover, setBtnHover] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !destinationCity || !startDate || !endDate) {
      alert('请填写所有字段');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      alert('结束日期不能早于开始日期');
      return;
    }
    onSubmit({ name, destinationCity, startDate, endDate });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    backgroundColor: '#1e1e2e',
    border: '1px solid #3d3d5c',
    borderRadius: '8px',
    color: '#e0e0ff',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box'
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px'
      }}
      onClick={onCancel}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#2d2d44',
          borderRadius: '16px',
          padding: '32px',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          animation: 'slideUp 0.3s ease-out'
        }}
      >
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', color: '#e0e0ff' }}>
          {initial ? '编辑行程' : '创建新行程'}
        </h2>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#a0a0c0', marginBottom: '6px', fontWeight: 500 }}>
            行程名称
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="如：东京5日游"
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#6c5ce7')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#3d3d5c')}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#a0a0c0', marginBottom: '6px', fontWeight: 500 }}>
            目的地城市
          </label>
          <input
            type="text"
            value={destinationCity}
            onChange={(e) => setDestinationCity(e.target.value)}
            placeholder="如：日本东京"
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#6c5ce7')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#3d3d5c')}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#a0a0c0', marginBottom: '6px', fontWeight: 500 }}>
              起始日期
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#6c5ce7')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#3d3d5c')}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#a0a0c0', marginBottom: '6px', fontWeight: 500 }}>
              结束日期
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#6c5ce7')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#3d3d5c')}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              border: '1px solid #3d3d5c',
              color: '#e0e0ff',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#3d3d5c')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            取消
          </button>
          <button
            type="submit"
            style={btnHover ? buttonHover : buttonStyle}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
          >
            {initial ? '保存修改' : '创建行程'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function TripManager() {
  const trips = useTravelStore((s) => s.trips);
  const createTrip = useTravelStore((s) => s.createTrip);
  const updateTrip = useTravelStore((s) => s.updateTrip);
  const deleteTrip = useTravelStore((s) => s.deleteTrip);
  const hydrating = useTravelStore((s) => s.hydrating);
  const hydrationError = useTravelStore((s) => s.hydrationError);
  const retryCount = useTravelStore((s) => s.retryCount);
  const initFromIDB = useTravelStore((s) => s.initFromIDB);
  const retryHydration = useTravelStore((s) => s.retryHydration);
  const [btnHover, setBtnHover] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  useEffect(() => {
    void initFromIDB();
  }, [initFromIDB]);

  const sortedTrips = [...trips].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (hydrating) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '16px' }}>
        <div className="spinner" />
        <div style={{ color: '#a0a0c0', fontSize: '14px' }}>
          {retryCount > 0
            ? `正在恢复数据... (第 ${retryCount + 1} 次尝试)`
            : '正在加载数据...'}
        </div>
      </div>
    );
  }

  if (hydrationError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '24px', padding: '24px' }}>
        <div style={{ fontSize: '64px' }}>⚠️</div>
        <div
          style={{
            maxWidth: '480px',
            padding: '28px',
            backgroundColor: '#2d2d44',
            borderRadius: '16px',
            textAlign: 'center',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)'
          }}
        >
          <h2 style={{ fontSize: '20px', color: '#e0e0ff', marginBottom: '12px' }}>
            数据加载失败
          </h2>
          <p style={{ fontSize: '14px', color: '#a0a0c0', marginBottom: '8px', lineHeight: 1.6 }}>
            {hydrationError}
          </p>
          <p style={{ fontSize: '12px', color: '#8080a0', marginBottom: '24px' }}>
            已重试 {retryCount} 次
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                backgroundColor: 'transparent',
                border: '1px solid #3d3d5c',
                color: '#e0e0ff',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#3d3d5c')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              🔄 刷新页面
            </button>
            <button
              onClick={() => void retryHydration()}
              style={btnHover ? buttonHover : buttonStyle}
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
            >
              重新加载
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
      <header style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#e0e0ff', marginBottom: '8px' }}>
              ✈️ 旅行轨迹记录器
            </h1>
            <p style={{ color: '#8080a0', fontSize: '15px' }}>记录每一次旅程的美好瞬间</p>
          </div>
          <button
            onClick={() => {
              setEditingTrip(null);
              setShowForm(true);
            }}
            style={btnHover ? buttonHover : buttonStyle}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
          >
            + 创建新行程
          </button>
        </div>
      </header>

      {sortedTrips.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '80px 24px',
            backgroundColor: '#2d2d44',
            borderRadius: '16px'
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🗺️</div>
          <h2 style={{ fontSize: '24px', color: '#e0e0ff', marginBottom: '8px' }}>还没有行程</h2>
          <p style={{ color: '#8080a0', marginBottom: '24px' }}>创建你的第一个旅行行程，开始记录美好回忆吧！</p>
          <button
            onClick={() => setShowForm(true)}
            style={btnHover ? buttonHover : buttonStyle}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
          >
            + 创建新行程
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
          {sortedTrips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onEdit={(t) => {
                setEditingTrip(t);
                setShowForm(true);
              }}
              onDelete={deleteTrip}
            />
          ))}
        </div>
      )}

      {showForm && (
        <TripForm
          initial={editingTrip}
          onSubmit={(data) => {
            if (editingTrip) {
              updateTrip(editingTrip.id, data);
            } else {
              createTrip(data);
            }
            setShowForm(false);
            setEditingTrip(null);
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingTrip(null);
          }}
        />
      )}
    </div>
  );
}
