import { useState, useEffect, useMemo } from 'react';
import AnimalCard from '../animal/AnimalCard';
import AnimalDetail from '../animal/AnimalDetail';
import { animalApi } from '../api/animalApi';
import { healthApi } from '../api/healthApi';
import type { Animal, AnimalDetail as AnimalDetailType, FeedingRecord, HealthStatus, Employee, ScheduleWeek, DayKey, ShiftType } from '../types';

type TabKey = 'animals' | 'feeding' | 'health' | 'schedules';

interface DashboardProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const NAV_ITEMS: { key: TabKey; icon: string; label: string }[] = [
  { key: 'animals', icon: '🦁', label: '动物档案' },
  { key: 'feeding', icon: '🍖', label: '投喂记录' },
  { key: 'health', icon: '💉', label: '健康检查' },
  { key: 'schedules', icon: '📅', label: '员工排班' }
];

const DAY_LABELS: Record<DayKey, string> = {
  monday: '周一',
  tuesday: '周二',
  wednesday: '周三',
  thursday: '周四',
  friday: '周五',
  saturday: '周六',
  sunday: '周日'
};

const SHIFT_COLORS: Record<ShiftType, { bg: string; text: string; name: string }> = {
  morning: { bg: 'var(--shift-morning)', text: '#01579B', name: '早班' },
  afternoon: { bg: 'var(--shift-afternoon)', text: '#E65100', name: '中班' },
  evening: { bg: 'var(--shift-evening)', text: 'white', name: '晚班' }
};

const SHIFT_CYCLE: (ShiftType | null)[] = ['morning', 'afternoon', 'evening', null];

export default function Dashboard({ mobileMenuOpen, setMobileMenuOpen }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('animals');
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [animalsLoading, setAnimalsLoading] = useState(true);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const [newAnimalIds, setNewAnimalIds] = useState<Set<string>>(new Set());

  const [showAddAnimal, setShowAddAnimal] = useState(false);
  const [addAnimalForm, setAddAnimalForm] = useState({
    name: '',
    species: '',
    age: '',
    gender: '雄性',
    entryDate: new Date().toISOString().split('T')[0],
    photoUrl: ''
  });

  const [todayFeeding, setTodayFeeding] = useState<{
    records: (FeedingRecord & { animalName?: string; species?: string })[];
    unfedAnimals: Animal[];
  }>({ records: [], unfedAnimals: [] });
  const [feedingLoading, setFeedingLoading] = useState(true);
  const [showUnfedOnly, setShowUnfedOnly] = useState(false);
  const [selectedFeedingAnimal, setSelectedFeedingAnimal] = useState<string | null>(null);
  const [feedingForm, setFeedingForm] = useState({ foodType: '', quantity: '', notes: '' });

  const [healthAnimals, setHealthAnimals] = useState<Animal[]>([]);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthCheckAnimal, setHealthCheckAnimal] = useState<string | null>(null);
  const [healthCheckForm, setHealthCheckForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: '常规体检',
    handler: '',
    notes: '',
    status: 'healthy' as HealthStatus
  });

  const [scheduleData, setScheduleData] = useState<ScheduleWeek | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    loadAnimals();
  }, []);

  useEffect(() => {
    if (activeTab === 'feeding') {
      loadTodayFeeding();
    } else if (activeTab === 'health') {
      loadHealthAnimals();
    } else if (activeTab === 'schedules') {
      loadSchedule();
    }
  }, [activeTab]);

  async function loadAnimals() {
    try {
      setAnimalsLoading(true);
      const result = await animalApi.getAnimals(500, 0);
      setAnimals(result.data);
    } catch (err) {
      alert(err instanceof Error ? err.message : '加载动物列表失败');
    } finally {
      setAnimalsLoading(false);
    }
  }

  async function loadTodayFeeding() {
    try {
      setFeedingLoading(true);
      const result = await animalApi.getTodayFeeding();
      const recordsWithInfo = result.records.map(r => {
        const animal = animals.find(a => a.id === r.animalId);
        return { ...r, animalName: animal?.name, species: animal?.species };
      });
      setTodayFeeding({ records: recordsWithInfo, unfedAnimals: result.unfedAnimals });
    } catch (err) {
      alert(err instanceof Error ? err.message : '加载投喂记录失败');
    } finally {
      setFeedingLoading(false);
    }
  }

  async function loadHealthAnimals() {
    try {
      setHealthLoading(true);
      const result = await animalApi.getAnimals(500, 0);
      setHealthAnimals(result.data);
    } catch (err) {
      alert(err instanceof Error ? err.message : '加载失败');
    } finally {
      setHealthLoading(false);
    }
  }

  async function loadSchedule() {
    try {
      setScheduleLoading(true);
      const data = await healthApi.getWeekSchedule();
      setScheduleData(data);
    } catch (err) {
      alert(err instanceof Error ? err.message : '加载排班数据失败');
    } finally {
      setScheduleLoading(false);
    }
  }

  async function handleAddAnimal() {
    if (!addAnimalForm.name.trim() || !addAnimalForm.species.trim() || !addAnimalForm.age) {
      alert('请填写名称、物种和年龄');
      return;
    }
    try {
      const newAnimal = await animalApi.createAnimal({
        name: addAnimalForm.name.trim(),
        species: addAnimalForm.species.trim(),
        age: Number(addAnimalForm.age),
        gender: addAnimalForm.gender,
        entryDate: addAnimalForm.entryDate,
        photoUrl: addAnimalForm.photoUrl.trim() || 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=400&h=400&fit=crop'
      });
      setAnimals([newAnimal, ...animals]);
      setNewAnimalIds(prev => new Set(prev).add(newAnimal.id));
      setTimeout(() => {
        setNewAnimalIds(prev => {
          const next = new Set(prev);
          next.delete(newAnimal.id);
          return next;
        });
      }, 600);
      setShowAddAnimal(false);
      setAddAnimalForm({ name: '', species: '', age: '', gender: '雄性', entryDate: new Date().toISOString().split('T')[0], photoUrl: '' });
    } catch (err) {
      alert(err instanceof Error ? err.message : '添加失败');
    }
  }

  async function handleAddFeeding() {
    if (!selectedFeedingAnimal || !feedingForm.foodType.trim() || !feedingForm.quantity.trim()) {
      alert('请选择动物并填写食物类型和份量');
      return;
    }
    try {
      await animalApi.createFeedingRecord(selectedFeedingAnimal, {
        foodType: feedingForm.foodType.trim(),
        quantity: feedingForm.quantity.trim(),
        notes: feedingForm.notes.trim()
      });
      await loadTodayFeeding();
      setSelectedFeedingAnimal(null);
      setFeedingForm({ foodType: '', quantity: '', notes: '' });
    } catch (err) {
      alert(err instanceof Error ? err.message : '添加失败');
    }
  }

  async function handleHealthCheck() {
    if (!healthCheckAnimal || !healthCheckForm.handler.trim()) {
      alert('请选择动物并填写处理人');
      return;
    }
    try {
      const result = await animalApi.createHealthRecord(healthCheckAnimal, healthCheckForm);
      alert(`📧 Email通知模拟发送:\n\n主题: ${result.notification.subject}\n\n内容: ${result.notification.body}`);
      setHealthCheckAnimal(null);
      setHealthCheckForm({
        date: new Date().toISOString().split('T')[0],
        type: '常规体检',
        handler: '',
        notes: '',
        status: 'healthy'
      });
      await loadHealthAnimals();
      await loadAnimals();
    } catch (err) {
      alert(err instanceof Error ? err.message : '提交失败');
    }
  }

  async function handleShiftClick(employeeId: string, day: DayKey) {
    if (!scheduleData) return;
    const current = scheduleData.schedules[employeeId]?.[day] || null;
    const currentIndex = SHIFT_CYCLE.indexOf(current as ShiftType | null);
    const nextShift = SHIFT_CYCLE[(currentIndex + 1) % SHIFT_CYCLE.length];
    
    const newSchedules = { ...scheduleData.schedules };
    if (!newSchedules[employeeId]) {
      newSchedules[employeeId] = {} as Record<DayKey, ShiftType | undefined>;
    }
    if (nextShift === null) {
      delete newSchedules[employeeId][day];
    } else {
      newSchedules[employeeId][day] = nextShift;
    }
    setScheduleData({ ...scheduleData, schedules: newSchedules });
    
    try {
      await healthApi.updateShift(employeeId, day, nextShift);
    } catch (err) {
      alert(err instanceof Error ? err.message : '更新失败');
      await loadSchedule();
    }
  }

  function handleDragStart(e: React.DragEvent, empId: string) {
    setDraggingId(empId);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e: React.DragEvent, empId: string) {
    e.preventDefault();
    if (empId !== draggingId) {
      setDragOverId(empId);
    }
  }

  function handleDragLeave() {
    setDragOverId(null);
  }

  async function handleDrop(targetEmpId: string) {
    if (!scheduleData || !draggingId || draggingId === targetEmpId) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }

    const employees = [...scheduleData.employees];
    const dragIndex = employees.findIndex(e => e.id === draggingId);
    const targetIndex = employees.findIndex(e => e.id === targetEmpId);
    
    const [removed] = employees.splice(dragIndex, 1);
    employees.splice(targetIndex, 0, removed);
    
    const reordered = employees.map((emp, idx) => ({ employeeId: emp.id, order: idx }));
    setScheduleData({ ...scheduleData, employees });
    setDraggingId(null);
    setDragOverId(null);

    try {
      await healthApi.reorderEmployees(reordered);
    } catch (err) {
      alert(err instanceof Error ? err.message : '排序失败');
      await loadSchedule();
    }
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverId(null);
  }

  const stats = useMemo(() => {
    const healthy = animals.filter(a => a.healthStatus === 'healthy').length;
    const observation = animals.filter(a => a.healthStatus === 'observation').length;
    const treatment = animals.filter(a => a.healthStatus === 'treatment').length;
    return { total: animals.length, healthy, observation, treatment };
  }, [animals]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: '240px',
          backgroundColor: 'var(--sidebar-bg)',
          color: 'var(--text-white)',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 100,
          transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'var(--transition)'
        }}
        className="sidebar"
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '28px' }}>🦒</span>
            动物园管理
          </h1>
        </div>
        <nav style={{ padding: '16px 12px' }}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              onClick={() => {
                setActiveTab(item.key);
                setMobileMenuOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 16px',
                marginBottom: '4px',
                borderRadius: 'var(--radius)',
                backgroundColor: activeTab === item.key ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: 'var(--text-white)',
                fontSize: '15px',
                fontWeight: activeTab === item.key ? 600 : 400,
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== item.key) {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== item.key) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            zIndex: 99
          }}
        />
      )}

      <main
        style={{
          flex: 1,
          marginLeft: '240px',
          backgroundColor: '#f8faf8',
          minHeight: '100vh'
        }}
      >
        <header
          style={{
            position: 'sticky',
            top: 0,
            backgroundColor: 'white',
            padding: '16px 32px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'none',
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--primary-light)',
              fontSize: '20px'
            }}
            className="menu-toggle"
          >
            ☰
          </button>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {NAV_ITEMS.find(n => n.key === activeTab)?.label}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </p>
          </div>
        </header>

        <div style={{ padding: '24px 32px' }}>
          {activeTab === 'animals' && renderAnimalsTab()}
          {activeTab === 'feeding' && renderFeedingTab()}
          {activeTab === 'health' && renderHealthTab()}
          {activeTab === 'schedules' && renderSchedulesTab()}
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .sidebar {
            width: 260px !important;
          }
          main {
            margin-left: 0 !important;
          }
          .menu-toggle {
            display: flex !important;
            align-items: center;
            justify-content: center;
          }
        }
      `}</style>

      {selectedAnimalId && (
        <AnimalDetail
          animalId={selectedAnimalId}
          onClose={() => setSelectedAnimalId(null)}
          onUpdate={() => { loadAnimals(); if (activeTab === 'feeding') loadTodayFeeding(); }}
        />
      )}
    </div>
  );

  function renderAnimalsTab() {
    return (
      <div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}
        >
          {[
            { label: '动物总数', value: stats.total, icon: '🦁', color: 'var(--primary-color)', bg: 'var(--primary-light)' },
            { label: '健康', value: stats.healthy, icon: '🟢', color: '#2E7D32', bg: '#C8E6C9' },
            { label: '需观察', value: stats.observation, icon: '🟡', color: '#F57F17', bg: '#FFF9C4' },
            { label: '需治疗', value: stats.treatment, icon: '🔴', color: '#C62828', bg: '#FFCDD2' }
          ].map((stat, i) => (
            <div
              key={i}
              className="fade-in"
              style={{
                padding: '20px',
                backgroundColor: 'white',
                borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                animationDelay: `${i * 0.05}s`
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: 'var(--radius)',
                  backgroundColor: stat.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px'
                }}
              >
                {stat.icon}
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600 }}>
            🐾 动物列表 <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 400 }}>(共{animals.length}只)</span>
          </h3>
          <button
            onClick={() => setShowAddAnimal(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: 'var(--primary-color)',
              color: 'white',
              borderRadius: 'var(--radius)',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span style={{ fontSize: '18px' }}>+</span> 添加动物
          </button>
        </div>

        {showAddAnimal && (
          <div
            className="fade-in"
            style={{
              padding: '24px',
              backgroundColor: 'white',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow)',
              marginBottom: '24px',
              border: '1px solid var(--primary-light)'
            }}
          >
            <h4 style={{ marginBottom: '16px', fontSize: '16px' }}>📝 添加新动物</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <label>
                <span style={formLabelStyle}>名称 *</span>
                <input
                  type="text"
                  value={addAnimalForm.name}
                  onChange={e => setAddAnimalForm({ ...addAnimalForm, name: e.target.value })}
                  placeholder="如：毛毛"
                  style={formInputStyle}
                />
              </label>
              <label>
                <span style={formLabelStyle}>物种 *</span>
                <input
                  type="text"
                  value={addAnimalForm.species}
                  onChange={e => setAddAnimalForm({ ...addAnimalForm, species: e.target.value })}
                  placeholder="如：大熊猫"
                  style={formInputStyle}
                />
              </label>
              <label>
                <span style={formLabelStyle}>年龄 *</span>
                <input
                  type="number"
                  min="0"
                  value={addAnimalForm.age}
                  onChange={e => setAddAnimalForm({ ...addAnimalForm, age: e.target.value })}
                  placeholder="岁"
                  style={formInputStyle}
                />
              </label>
              <label>
                <span style={formLabelStyle}>性别</span>
                <select
                  value={addAnimalForm.gender}
                  onChange={e => setAddAnimalForm({ ...addAnimalForm, gender: e.target.value })}
                  style={formInputStyle}
                >
                  <option>雄性</option>
                  <option>雌性</option>
                </select>
              </label>
              <label>
                <span style={formLabelStyle}>入园日期</span>
                <input
                  type="date"
                  value={addAnimalForm.entryDate}
                  onChange={e => setAddAnimalForm({ ...addAnimalForm, entryDate: e.target.value })}
                  style={formInputStyle}
                />
              </label>
              <label style={{ gridColumn: '1 / -1' }}>
                <span style={formLabelStyle}>照片URL</span>
                <input
                  type="text"
                  value={addAnimalForm.photoUrl}
                  onChange={e => setAddAnimalForm({ ...addAnimalForm, photoUrl: e.target.value })}
                  placeholder="https://..."
                  style={formInputStyle}
                />
              </label>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => {
                  setShowAddAnimal(false);
                  setAddAnimalForm({ name: '', species: '', age: '', gender: '雄性', entryDate: new Date().toISOString().split('T')[0], photoUrl: '' });
                }}
                style={cancelButtonStyle}
              >
                取消
              </button>
              <button onClick={handleAddAnimal} style={submitButtonStyle}>
                添加
              </button>
            </div>
          </div>
        )}

        {animalsLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
            {Array(8).fill(0).map((_, i) => (
              <div key={i} style={{ borderRadius: 'var(--radius)', overflow: 'hidden', backgroundColor: 'white', boxShadow: 'var(--shadow)' }}>
                <div className="skeleton" style={{ height: '160px', borderRadius: 0 }} />
                <div style={{ padding: '16px' }}>
                  <div className="skeleton" style={{ height: '22px', width: '60%', marginBottom: '10px' }} />
                  <div className="skeleton" style={{ height: '24px', width: '40%', borderRadius: '12px' }} />
                </div>
              </div>
            ))}
          </div>
        ) : animals.length === 0 ? (
          <div style={emptyContainerStyle}>
            <div style={{ fontSize: '80px', marginBottom: '16px' }}>🦒</div>
            <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '8px' }}>还没有任何动物档案</p>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>点击上方"添加动物"按钮创建第一个档案</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '20px'
            }}
          >
            {animals.map((animal, index) => (
              <AnimalCard
                key={animal.id}
                animal={animal}
                onClick={() => setSelectedAnimalId(animal.id)}
                isNew={newAnimalIds.has(animal.id)}
                style={{
                  animationDelay: newAnimalIds.has(animal.id) ? '0s' : `${index * 0.02}s`
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderFeedingTab() {
    const displayRecords = showUnfedOnly
      ? []
      : todayFeeding.records;

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>🍖 今日投喂面板</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              已投喂: <strong style={{ color: 'var(--primary-color)' }}>{todayFeeding.records.length}</strong> 条记录 ·
              待投喂: <strong style={{ color: todayFeeding.unfedAnimals.length > 0 ? '#F44336' : 'var(--text-secondary)' }}>{todayFeeding.unfedAnimals.length}</strong> 只
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showUnfedOnly}
                onChange={e => setShowUnfedOnly(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              只看未投喂
            </label>
            <button
              onClick={() => {
                loadTodayFeeding();
              }}
              style={secondaryButtonStyle}
            >
              🔄 刷新
            </button>
            <button
              onClick={() => setSelectedFeedingAnimal(todayFeeding.unfedAnimals[0]?.id || animals[0]?.id || null)}
              style={submitButtonStyle}
            >
              + 记录投喂
            </button>
          </div>
        </div>

        {selectedFeedingAnimal && (
          <div
            className="fade-in"
            style={{
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow)',
              marginBottom: '20px',
              border: '1px solid #FFE0B2'
            }}
          >
            <h4 style={{ marginBottom: '16px' }}>🍽️ 添加投喂记录</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              <label>
                <span style={formLabelStyle}>选择动物 *</span>
                <select
                  value={selectedFeedingAnimal}
                  onChange={e => setSelectedFeedingAnimal(e.target.value)}
                  style={formInputStyle}
                >
                  {animals.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.species})</option>
                  ))}
                </select>
              </label>
              <label>
                <span style={formLabelStyle}>食物类型 *</span>
                <input
                  type="text"
                  value={feedingForm.foodType}
                  onChange={e => setFeedingForm({ ...feedingForm, foodType: e.target.value })}
                  placeholder="如：竹子、牛肉..."
                  style={formInputStyle}
                />
              </label>
              <label>
                <span style={formLabelStyle}>份量 *</span>
                <input
                  type="text"
                  value={feedingForm.quantity}
                  onChange={e => setFeedingForm({ ...feedingForm, quantity: e.target.value })}
                  placeholder="如：10kg"
                  style={formInputStyle}
                />
              </label>
              <label style={{ gridColumn: '1 / -1' }}>
                <span style={formLabelStyle}>备注</span>
                <input
                  type="text"
                  value={feedingForm.notes}
                  onChange={e => setFeedingForm({ ...feedingForm, notes: e.target.value })}
                  placeholder="可选：进食情况、特殊备注等"
                  style={formInputStyle}
                />
              </label>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                onClick={() => {
                  setSelectedFeedingAnimal(null);
                  setFeedingForm({ foodType: '', quantity: '', notes: '' });
                }}
                style={cancelButtonStyle}
              >
                取消
              </button>
              <button onClick={handleAddFeeding} style={submitButtonStyle}>
                确认记录
              </button>
            </div>
          </div>
        )}

        {todayFeeding.unfedAnimals.length > 0 && (
          <div
            className="fade-in"
            style={{
              padding: '16px 20px',
              backgroundColor: '#FFF5F5',
              border: '1px solid #FFCDD2',
              borderRadius: 'var(--radius)',
              marginBottom: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '20px' }}>⚠️</span>
              <strong style={{ color: '#C62828' }}>以下动物今天还未投喂（红色高亮）</strong>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {todayFeeding.unfedAnimals.map(a => (
                <span
                  key={a.id}
                  onClick={() => setSelectedFeedingAnimal(a.id)}
                  style={{
                    padding: '6px 14px',
                    backgroundColor: '#FFEBEE',
                    border: '1px solid #EF9A9A',
                    color: '#C62828',
                    borderRadius: '16px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'var(--transition)'
                  }}
                >
                  🔴 {a.name} ({a.species})
                </span>
              ))}
            </div>
          </div>
        )}

        {feedingLoading ? (
          <div style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {['时间', '动物', '食物', '份量', '备注'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array(6).fill(0).map((_, i) => (
                  <tr key={i} style={trStyle}>
                    {Array(5).fill(0).map((_, j) => (
                      <td key={j} style={tdStyle}>
                        <div className="skeleton" style={{ height: '20px', width: '80%' }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : showUnfedOnly ? (
          todayFeeding.unfedAnimals.length === 0 ? (
            <div style={emptyContainerStyle}>
              <div style={{ fontSize: '80px', marginBottom: '16px' }}>✅</div>
              <p style={{ fontSize: '18px', color: 'var(--primary-color)', marginBottom: '8px' }}>太棒了！</p>
              <p style={{ color: 'var(--text-secondary)' }}>所有动物今天都已完成投喂</p>
            </div>
          ) : null
        ) : displayRecords.length === 0 ? (
          <div style={emptyContainerStyle}>
            <div style={{ fontSize: '80px', marginBottom: '16px' }}>🥗</div>
            <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '8px' }}>今天还没有投喂记录</p>
            <p style={{ color: 'var(--text-secondary)' }}>点击上方"记录投喂"按钮开始记录</p>
          </div>
        ) : (
          <div style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {['🕐 时间', '🐾 动物', '🥣 食物', '⚖️ 份量', '💬 备注'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayRecords.map((record, index) => {
                  const isUnfed = todayFeeding.unfedAnimals.some(a => a.id === record.animalId);
                  return (
                    <tr
                      key={record.id}
                      className="fade-in"
                      style={{
                        ...trStyle,
                        animationDelay: `${index * 0.03}s`,
                        backgroundColor: isUnfed ? '#FFF5F5' : undefined
                      }}
                    >
                      <td style={tdStyle}>
                        <strong>{record.date}</strong>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{record.time}</div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600 }}>{record.animalName || '未知'}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{record.species || ''}</div>
                      </td>
                      <td style={tdStyle}>{record.foodType}</td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '4px 10px',
                          backgroundColor: '#FFF3E0',
                          color: '#E65100',
                          borderRadius: '10px',
                          fontSize: '13px',
                          fontWeight: 500
                        }}>
                          {record.quantity}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: 'var(--text-secondary)', fontSize: '14px' }}>
                        {record.notes || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  function renderHealthTab() {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>💉 健康检查管理</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              发起健康检查，记录体检结果并同步健康状态
            </p>
          </div>
          <button
            onClick={() => setHealthCheckAnimal(healthAnimals[0]?.id || null)}
            style={submitButtonStyle}
          >
            + 发起健康检查
          </button>
        </div>

        {healthCheckAnimal && (
          <div
            className="fade-in"
            style={{
              padding: '24px',
              backgroundColor: 'white',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow)',
              marginBottom: '20px',
              border: '1px solid #C8E6C9'
            }}
          >
            <h4 style={{ marginBottom: '16px' }}>🩺 记录健康检查</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <label style={{ gridColumn: '1 / -1' }}>
                <span style={formLabelStyle}>选择动物 *</span>
                <select
                  value={healthCheckAnimal}
                  onChange={e => setHealthCheckAnimal(e.target.value)}
                  style={formInputStyle}
                >
                  {healthAnimals.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.species}) - 当前状态: {
                        a.healthStatus === 'healthy' ? '🟢健康' :
                        a.healthStatus === 'observation' ? '🟡需观察' : '🔴需治疗'
                      }
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span style={formLabelStyle}>检查日期 *</span>
                <input
                  type="date"
                  value={healthCheckForm.date}
                  onChange={e => setHealthCheckForm({ ...healthCheckForm, date: e.target.value })}
                  style={formInputStyle}
                />
              </label>
              <label>
                <span style={formLabelStyle}>检查类型 *</span>
                <select
                  value={healthCheckForm.type}
                  onChange={e => setHealthCheckForm({ ...healthCheckForm, type: e.target.value })}
                  style={formInputStyle}
                >
                  <option>常规体检</option>
                  <option>疫苗接种</option>
                  <option>跟进检查</option>
                  <option>治疗</option>
                  <option>其他</option>
                </select>
              </label>
              <label>
                <span style={formLabelStyle}>处理人 *</span>
                <input
                  type="text"
                  value={healthCheckForm.handler}
                  onChange={e => setHealthCheckForm({ ...healthCheckForm, handler: e.target.value })}
                  placeholder="如：王医生"
                  style={formInputStyle}
                />
              </label>
              <label>
                <span style={formLabelStyle}>健康状态 *</span>
                <select
                  value={healthCheckForm.status}
                  onChange={e => setHealthCheckForm({ ...healthCheckForm, status: e.target.value as HealthStatus })}
                  style={formInputStyle}
                >
                  <option value="healthy">🟢 健康</option>
                  <option value="observation">🟡 需观察</option>
                  <option value="treatment">🔴 需治疗</option>
                </select>
              </label>
              <label style={{ gridColumn: '1 / -1' }}>
                <span style={formLabelStyle}>体检结果 / 建议处理措施</span>
                <textarea
                  value={healthCheckForm.notes}
                  onChange={e => setHealthCheckForm({ ...healthCheckForm, notes: e.target.value })}
                  placeholder="请填写详细的体检结果和建议处理措施..."
                  style={{ ...formInputStyle, minHeight: '100px', resize: 'vertical' }}
                />
              </label>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => {
                  setHealthCheckAnimal(null);
                  setHealthCheckForm({
                    date: new Date().toISOString().split('T')[0],
                    type: '常规体检',
                    handler: '',
                    notes: '',
                    status: 'healthy'
                  });
                }}
                style={cancelButtonStyle}
              >
                取消
              </button>
              <button onClick={handleHealthCheck} style={submitButtonStyle}>
                📧 提交并发送通知
              </button>
            </div>
          </div>
        )}

        {healthLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {Array(6).fill(0).map((_, i) => (
              <div key={i} style={{ padding: '20px', backgroundColor: 'white', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <div className="skeleton" style={{ width: '60px', height: '60px', borderRadius: 'var(--radius)' }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: '20px', width: '60%', marginBottom: '8px' }} />
                    <div className="skeleton" style={{ height: '16px', width: '40%' }} />
                  </div>
                </div>
                <div className="skeleton" style={{ height: '40px', width: '100%' }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {healthAnimals.map((animal, index) => {
              const statusConfig = {
                healthy: { color: 'var(--health-healthy)', label: '健康', bg: '#E8F5E9', dot: '🟢' },
                observation: { color: 'var(--health-observation)', label: '需观察', bg: '#FFFDE7', dot: '🟡' },
                treatment: { color: 'var(--health-treatment)', label: '需治疗', bg: '#FFEBEE', dot: '🔴' }
              }[animal.healthStatus];

              return (
                <div
                  key={animal.id}
                  className="fade-in"
                  style={{
                    padding: '20px',
                    backgroundColor: 'white',
                    borderRadius: 'var(--radius)',
                    boxShadow: 'var(--shadow)',
                    animationDelay: `${index * 0.03}s`,
                    transition: 'var(--transition)',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedAnimalId(animal.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'var(--shadow)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '14px' }}>
                    <img
                      src={animal.photoUrl}
                      alt={animal.name}
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: 'var(--radius)',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=100&h=100&fit=crop';
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: 600 }}>{animal.name}</h4>
                        <span>{statusConfig.dot}</span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{animal.species} · {animal.age}岁</p>
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '10px 14px',
                      backgroundColor: statusConfig.bg,
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px'
                    }}
                  >
                    <span style={{ fontSize: '14px', fontWeight: 500, color: statusConfig.color }}>
                      当前状态：{statusConfig.label}
                    </span>
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: statusConfig.color,
                        boxShadow: `0 0 0 3px ${statusConfig.bg}`
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setHealthCheckAnimal(animal.id);
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        backgroundColor: statusConfig.color,
                        color: 'white',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 500
                      }}
                    >
                      🩺 发起检查
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAnimalId(animal.id);
                      }}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#f5f5f5',
                        color: 'var(--text-primary)',
                        borderRadius: '6px',
                        fontSize: '13px'
                      }}
                    >
                      📋 档案
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  function renderSchedulesTab() {
    if (!scheduleData && scheduleLoading) {
      return (
        <div style={{ padding: '40px', backgroundColor: 'white', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '50px', marginBottom: i < 7 ? '12px' : 0 }} />
          ))}
        </div>
      );
    }

    if (!scheduleData) {
      return (
        <div style={emptyContainerStyle}>
          <div style={{ fontSize: '80px', marginBottom: '16px' }}>📅</div>
          <p style={{ color: 'var(--text-secondary)' }}>加载排班数据失败，请刷新重试</p>
        </div>
      );
    }

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>📅 本周排班表</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              起始日期：{scheduleData.weekStart} · 拖拽员工姓名可调整顺序 · 点击格子切换班次
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {Object.entries(SHIFT_COLORS).map(([key, config]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    backgroundColor: config.bg,
                    border: '1px solid rgba(0,0,0,0.1)'
                  }}
                />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{config.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'white',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow)',
            overflow: 'auto'
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--primary-color)' }}>
                <th
                  style={{
                    padding: '14px 20px',
                    textAlign: 'left',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '14px',
                    position: 'sticky',
                    left: 0,
                    backgroundColor: 'var(--primary-color)',
                    zIndex: 2,
                    minWidth: '140px'
                  }}
                >
                  👤 员工
                </th>
                {scheduleData.days.map(day => (
                  <th
                    key={day}
                    style={{
                      padding: '14px 8px',
                      textAlign: 'center',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '14px',
                      minWidth: '90px'
                    }}
                  >
                    {DAY_LABELS[day]}
                    {day === 'saturday' || day === 'sunday' ? (
                      <span style={{ marginLeft: '4px', fontSize: '11px', opacity: 0.8 }}>(休)</span>
                    ) : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scheduleData.employees.map((emp, empIdx) => (
                <tr
                  key={emp.id}
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    transition: 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                    transform: draggingId === emp.id ? 'scale(0.98)' : dragOverId === emp.id ? 'translateY(4px)' : 'none',
                    backgroundColor: dragOverId === emp.id ? '#F1F8E9' : draggingId === emp.id ? '#ECEFF1' : empIdx % 2 === 0 ? 'white' : '#FAFAFA',
                    opacity: draggingId === emp.id ? 0.6 : 1
                  }}
                >
                  <td
                    draggable
                    onDragStart={(e) => handleDragStart(e, emp.id)}
                    onDragOver={(e) => handleDragOver(e, emp.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={() => handleDrop(emp.id)}
                    onDragEnd={handleDragEnd}
                    style={{
                      padding: '12px 20px',
                      fontWeight: 600,
                      cursor: draggingId ? 'grabbing' : 'grab',
                      position: 'sticky',
                      left: 0,
                      backgroundColor: 'inherit',
                      zIndex: 1,
                      userSelect: 'none',
                      borderRight: '2px solid var(--primary-light)',
                      fontSize: '15px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '18px', opacity: 0.4 }}>⋮⋮</span>
                      <span style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-light)',
                        color: 'var(--primary-dark)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '14px'
                      }}>
                        {emp.name.charAt(0)}
                      </span>
                      {emp.name}
                    </div>
                  </td>
                  {scheduleData.days.map(day => {
                    const shift = scheduleData.schedules[emp.id]?.[day];
                    const config = shift ? SHIFT_COLORS[shift] : null;
                    return (
                      <td
                        key={day}
                        onClick={() => handleShiftClick(emp.id, day)}
                        style={{
                          padding: '12px 8px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'var(--transition)'
                        }}
                        onMouseEnter={(e) => {
                          if (!config) {
                            e.currentTarget.style.backgroundColor = '#F1F8E9';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!config) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <div
                          style={{
                            padding: '10px 8px',
                            borderRadius: '6px',
                            backgroundColor: config ? config.bg : '#f9f9f9',
                            color: config ? config.text : '#BDBDBD',
                            fontSize: '13px',
                            fontWeight: config ? 600 : 400,
                            border: config ? `1px solid rgba(0,0,0,0.1)` : '1px dashed #E0E0E0',
                            transition: 'var(--transition)',
                            minHeight: '42px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {config ? config.name : '—'}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          className="fade-in"
          style={{
            marginTop: '20px',
            padding: '16px 20px',
            backgroundColor: '#F1F8E9',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--primary-light)',
            fontSize: '14px',
            color: 'var(--primary-dark)'
          }}
        >
          💡 <strong>操作提示：</strong>
          <ul style={{ margin: '8px 0 0 20px', lineHeight: 1.8 }}>
            <li>点击排班格子可循环切换班次：<span style={{ color: '#01579B', fontWeight: 500 }}>早班</span> → <span style={{ color: '#E65100', fontWeight: 500 }}>中班</span> → <span style={{ color: '#3949AB', fontWeight: 500 }}>晚班</span> → 休息</li>
            <li>拖拽左侧员工姓名可调整员工所在行顺序，带有弹性跟随动画效果</li>
            <li>周六周日标记为"(休)"，可根据需要灵活安排班次</li>
          </ul>
        </div>
      </div>
    );
  }
}

const formLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  color: 'var(--text-secondary)',
  marginBottom: '6px',
  fontWeight: 500
};

const formInputStyle: React.CSSProperties = {
  width: '100%',
  fontSize: '14px',
  padding: '10px 12px'
};

const cancelButtonStyle: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: '#f5f5f5',
  color: 'var(--text-primary)',
  borderRadius: 'var(--radius)',
  fontSize: '14px'
};

const submitButtonStyle: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: 'var(--primary-color)',
  color: 'white',
  borderRadius: 'var(--radius)',
  fontSize: '14px',
  fontWeight: 500
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: '10px 16px',
  backgroundColor: 'white',
  color: 'var(--text-primary)',
  borderRadius: 'var(--radius)',
  fontSize: '14px',
  border: '1px solid var(--border-color)'
};

const emptyContainerStyle: React.CSSProperties = {
  padding: '60px 20px',
  textAlign: 'center',
  backgroundColor: 'white',
  borderRadius: 'var(--radius)',
  boxShadow: 'var(--shadow)'
};

const tableContainerStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: 'var(--radius)',
  boxShadow: 'var(--shadow)',
  overflow: 'auto'
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse'
};

const thStyle: React.CSSProperties = {
  padding: '14px 16px',
  textAlign: 'left',
  backgroundColor: '#F1F8E9',
  color: 'var(--primary-dark)',
  fontWeight: 600,
  fontSize: '14px',
  borderBottom: '2px solid var(--primary-light)',
  whiteSpace: 'nowrap'
};

const trStyle: React.CSSProperties = {
  transition: 'var(--transition)',
  borderBottom: '1px solid #f0f0f0'
};

const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
  fontSize: '14px',
  verticalAlign: 'middle'
};
