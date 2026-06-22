import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { plansApi, recordsApi } from './api';
import type { Exercise, TrainingPlan, ExerciseRecord, SetRecord } from './types';

type View = 'list' | 'create' | 'edit' | 'record';

interface NewExercise {
  name: string;
  defaultSets: number;
  minReps: number;
  maxReps: number;
}

export default function TrainingPlan() {
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [view, setView] = useState<View>('list');
  const [currentPlan, setCurrentPlan] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await plansApi.list();
      setPlans(data);
    } finally {
      setLoading(false);
    }
  };

  if (view === 'list') {
    return (
      <PlanList
        plans={plans}
        loading={loading}
        onAdd={() => setView('create')}
        onEdit={(p) => {
          setCurrentPlan(p);
          setView('edit');
        }}
        onRecord={(p) => {
          setCurrentPlan(p);
          setView('record');
        }}
        onDelete={async (id) => {
          await plansApi.delete(id);
          loadPlans();
        }}
      />
    );
  }

  if (view === 'create' || view === 'edit') {
    return (
      <PlanEditor
        plan={view === 'edit' ? currentPlan : null}
        onCancel={() => {
          setView('list');
          setCurrentPlan(null);
        }}
        onSave={async (name, exercises) => {
          if (view === 'create') {
            await plansApi.create({ name, exercises });
          } else if (currentPlan) {
            await plansApi.update(currentPlan.id, { name, exercises });
          }
          setView('list');
          setCurrentPlan(null);
          loadPlans();
        }}
      />
    );
  }

  if (view === 'record' && currentPlan) {
    return (
      <RecordSession
        plan={currentPlan}
        onBack={() => {
          setView('list');
          setCurrentPlan(null);
        }}
        onFinish={async (exerciseRecords) => {
          const today = new Date().toISOString().split('T')[0];
          await recordsApi.create({
            planId: currentPlan.id,
            date: today,
            exerciseRecords,
          });
          setView('list');
          setCurrentPlan(null);
        }}
      />
    );
  }

  return null;
}

/* ---------- 计划列表 ---------- */
function PlanList({
  plans,
  loading,
  onAdd,
  onEdit,
  onRecord,
  onDelete,
}: {
  plans: TrainingPlan[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (p: TrainingPlan) => void;
  onRecord: (p: TrainingPlan) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#F1F5F9' }}>我的训练计划</h2>
          <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '4px' }}>共 {plans.length} 个计划</p>
        </div>
        <button
          onClick={onAdd}
          style={{
            padding: '10px 20px',
            background: '#6366F1',
            color: 'white',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          + 新建计划
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94A3B8' }}>加载中...</div>
      ) : plans.length === 0 ? (
        <div
          style={{
            background: '#1E293B',
            borderRadius: '16px',
            padding: '60px 24px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <p style={{ color: '#94A3B8', marginBottom: '20px' }}>还没有训练计划，创建一个开始吧！</p>
          <button
            onClick={onAdd}
            style={{
              padding: '10px 20px',
              background: '#6366F1',
              color: 'white',
              borderRadius: '8px',
              fontWeight: 600,
            }}
          >
            + 新建计划
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          }}
        >
          {plans.map((plan) => (
            <div
              key={plan.id}
              style={{
                background: '#1E293B',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#F1F5F9' }}>{plan.name}</h3>
                <p style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                  {plan.exercises.length} 个动作
                </p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '64px' }}>
                {plan.exercises.slice(0, 6).map((ex) => (
                  <span
                    key={ex.id}
                    style={{
                      fontSize: '11px',
                      padding: '4px 8px',
                      background: '#334155',
                      borderRadius: '6px',
                      color: '#CBD5E1',
                    }}
                  >
                    {ex.name}
                  </span>
                ))}
                {plan.exercises.length > 6 && (
                  <span style={{ fontSize: '11px', color: '#64748B', padding: '4px' }}>
                    +{plan.exercises.length - 6}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '8px' }}>
                <button
                  onClick={() => onRecord(plan)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: '#6366F1',
                    color: 'white',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 500,
                  }}
                >
                  开始训练
                </button>
                <button
                  onClick={() => onEdit(plan)}
                  style={{
                    padding: '8px 14px',
                    background: '#334155',
                    color: '#CBD5E1',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                >
                  编辑
                </button>
                <button
                  onClick={() => {
                    if (confirm('确定删除此计划？相关记录也会被删除')) onDelete(plan.id);
                  }}
                  style={{
                    padding: '8px 14px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#F87171',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- 计划编辑器 ---------- */
function PlanEditor({
  plan,
  onCancel,
  onSave,
}: {
  plan: TrainingPlan | null;
  onCancel: () => void;
  onSave: (name: string, exercises: Exercise[]) => Promise<void>;
}) {
  const [name, setName] = useState(plan?.name || '');
  const [exercises, setExercises] = useState<Exercise[]>(
    plan?.exercises || [
      { id: uuidv4(), name: '', defaultSets: 4, minReps: 8, maxReps: 12, order: 0 },
      { id: uuidv4(), name: '', defaultSets: 4, minReps: 8, maxReps: 12, order: 1 },
      { id: uuidv4(), name: '', defaultSets: 4, minReps: 8, maxReps: 12, order: 2 },
      { id: uuidv4(), name: '', defaultSets: 4, minReps: 8, maxReps: 12, order: 3 },
      { id: uuidv4(), name: '', defaultSets: 4, minReps: 8, maxReps: 12, order: 4 },
    ]
  );
  const [newEx, setNewEx] = useState<NewExercise>({ name: '', defaultSets: 4, minReps: 8, maxReps: 12 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const updateExercise = (id: string, field: keyof Exercise, value: any) => {
    setExercises((prev) => prev.map((ex) => (ex.id === id ? { ...ex, [field]: value } : ex)));
  };

  const removeExercise = (id: string) => {
    if (exercises.length <= 5) return;
    setExercises((prev) => prev.filter((ex) => ex.id !== id).map((ex, i) => ({ ...ex, order: i })));
  };

  const moveExercise = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= exercises.length) return;
    setExercises((prev) => {
      const copy = [...prev];
      [copy[idx], copy[target]] = [copy[target], copy[idx]];
      return copy.map((ex, i) => ({ ...ex, order: i }));
    });
  };

  const addExercise = () => {
    if (exercises.length >= 15) return;
    if (!newEx.name.trim()) return;
    setExercises((prev) => [
      ...prev,
      {
        id: uuidv4(),
        name: newEx.name.trim(),
        defaultSets: Math.max(1, Math.min(8, newEx.defaultSets)),
        minReps: Math.max(1, newEx.minReps),
        maxReps: Math.max(newEx.minReps, newEx.maxReps),
        order: prev.length,
      },
    ]);
    setNewEx({ name: '', defaultSets: 4, minReps: 8, maxReps: 12 });
  };

  const handleSave = async () => {
    setError('');
    if (!name.trim() || name.length > 30) {
      setError('计划名称必须填写且不超过30字符');
      return;
    }
    const valid = exercises.filter((ex) => ex.name.trim());
    if (valid.length < 5 || valid.length > 15) {
      setError(`动作数量需在5-15个之间（当前${valid.length}个有效）`);
      return;
    }
    const final: Exercise[] = valid.map((ex, i) => ({
      ...ex,
      name: ex.name.trim(),
      defaultSets: Math.max(1, Math.min(8, ex.defaultSets)),
      minReps: Math.max(1, ex.minReps),
      maxReps: Math.max(ex.minReps, ex.maxReps),
      order: i,
    }));
    try {
      setSaving(true);
      await onSave(name.trim(), final);
    } catch (err: any) {
      setError(err?.response?.data?.error || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={onCancel}
          style={{
            padding: '8px 14px',
            background: '#334155',
            color: '#CBD5E1',
            borderRadius: '8px',
            fontSize: '13px',
          }}
        >
          ← 返回
        </button>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#F1F5F9' }}>
          {plan ? '编辑计划' : '创建计划'}
        </h2>
      </div>

      <div style={{ background: '#1E293B', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: '#CBD5E1', marginBottom: '6px' }}>
            计划名称 <span style={{ color: '#64748B' }}>(最多30字符)</span>
          </label>
          <input
            type="text"
            value={name}
            maxLength={30}
            onChange={(e) => setName(e.target.value)}
            placeholder="如：上肢推力日A"
            style={{
              width: '100%',
              padding: '10px 12px',
              background: '#334155',
              border: '1px solid transparent',
              borderRadius: '8px',
              color: '#F1F5F9',
              fontSize: '14px',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', color: '#CBD5E1', marginBottom: '10px' }}>
            动作列表 <span style={{ color: '#64748B' }}>({exercises.length}/15，最少5个)</span>
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {exercises.map((ex, i) => (
              <div
                key={ex.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#0F172A',
                  borderRadius: '10px',
                  padding: '10px 12px',
                }}
              >
                <span style={{ width: '24px', textAlign: 'center', color: '#64748B', fontSize: '13px', fontWeight: 600 }}>
                  {i + 1}
                </span>
                <input
                  type="text"
                  value={ex.name}
                  maxLength={30}
                  onChange={(e) => updateExercise(ex.id, 'name', e.target.value)}
                  placeholder="动作名称"
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    background: '#334155',
                    border: '1px solid transparent',
                    borderRadius: '8px',
                    color: '#F1F5F9',
                    fontSize: '13px',
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={ex.defaultSets}
                    onChange={(e) => updateExercise(ex.id, 'defaultSets', Math.max(1, Math.min(8, parseInt(e.target.value) || 1)))}
                    title="组数(1-8)"
                    style={{
                      width: '52px',
                      padding: '8px 6px',
                      background: '#334155',
                      border: '1px solid transparent',
                      borderRadius: '8px',
                      color: '#F1F5F9',
                      fontSize: '12px',
                      textAlign: 'center',
                    }}
                  />
                  <span style={{ color: '#64748B', fontSize: '11px' }}>组</span>
                  <input
                    type="number"
                    min={1}
                    value={ex.minReps}
                    onChange={(e) => updateExercise(ex.id, 'minReps', Math.max(1, parseInt(e.target.value) || 1))}
                    title="最小次数"
                    style={{
                      width: '48px',
                      padding: '8px 6px',
                      background: '#334155',
                      border: '1px solid transparent',
                      borderRadius: '8px',
                      color: '#F1F5F9',
                      fontSize: '12px',
                      textAlign: 'center',
                    }}
                  />
                  <span style={{ color: '#64748B' }}>-</span>
                  <input
                    type="number"
                    min={1}
                    value={ex.maxReps}
                    onChange={(e) => updateExercise(ex.id, 'maxReps', Math.max(ex.minReps, parseInt(e.target.value) || ex.minReps))}
                    title="最大次数"
                    style={{
                      width: '48px',
                      padding: '8px 6px',
                      background: '#334155',
                      border: '1px solid transparent',
                      borderRadius: '8px',
                      color: '#F1F5F9',
                      fontSize: '12px',
                      textAlign: 'center',
                    }}
                  />
                  <span style={{ color: '#64748B', fontSize: '11px' }}>次</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <button
                    onClick={() => moveExercise(i, -1)}
                    disabled={i === 0}
                    style={{
                      width: '22px',
                      height: '18px',
                      background: i === 0 ? '#1E293B' : '#334155',
                      color: i === 0 ? '#475569' : '#CBD5E1',
                      borderRadius: '4px',
                      fontSize: '11px',
                      padding: 0,
                    }}
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveExercise(i, 1)}
                    disabled={i === exercises.length - 1}
                    style={{
                      width: '22px',
                      height: '18px',
                      background: i === exercises.length - 1 ? '#1E293B' : '#334155',
                      color: i === exercises.length - 1 ? '#475569' : '#CBD5E1',
                      borderRadius: '4px',
                      fontSize: '11px',
                      padding: 0,
                    }}
                  >
                    ▼
                  </button>
                </div>
                <button
                  onClick={() => removeExercise(ex.id)}
                  disabled={exercises.length <= 5}
                  style={{
                    width: '28px',
                    height: '28px',
                    background: exercises.length <= 5 ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.2)',
                    color: exercises.length <= 5 ? '#7F1D1D' : '#F87171',
                    borderRadius: '6px',
                    fontSize: '13px',
                    padding: 0,
                  }}
                  title={exercises.length <= 5 ? '最少保留5个动作' : '删除'}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {exercises.length < 15 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#0F172A',
                border: '2px dashed #334155',
                borderRadius: '10px',
                padding: '10px 12px',
              }}
            >
              <span style={{ color: '#64748B' }}>+</span>
              <input
                type="text"
                value={newEx.name}
                maxLength={30}
                onChange={(e) => setNewEx({ ...newEx, name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && addExercise()}
                placeholder="添加新动作..."
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  background: '#334155',
                  border: '1px solid transparent',
                  borderRadius: '8px',
                  color: '#F1F5F9',
                  fontSize: '13px',
                }}
              />
              <input
                type="number"
                min={1}
                max={8}
                value={newEx.defaultSets}
                onChange={(e) => setNewEx({ ...newEx, defaultSets: Math.max(1, Math.min(8, parseInt(e.target.value) || 1)) })}
                style={{
                  width: '52px',
                  padding: '8px 6px',
                  background: '#334155',
                  border: '1px solid transparent',
                  borderRadius: '8px',
                  color: '#F1F5F9',
                  fontSize: '12px',
                  textAlign: 'center',
                }}
              />
              <input
                type="number"
                min={1}
                value={newEx.minReps}
                onChange={(e) => setNewEx({ ...newEx, minReps: Math.max(1, parseInt(e.target.value) || 1) })}
                style={{
                  width: '48px',
                  padding: '8px 6px',
                  background: '#334155',
                  border: '1px solid transparent',
                  borderRadius: '8px',
                  color: '#F1F5F9',
                  fontSize: '12px',
                  textAlign: 'center',
                }}
              />
              <span style={{ color: '#64748B' }}>-</span>
              <input
                type="number"
                min={1}
                value={newEx.maxReps}
                onChange={(e) => setNewEx({ ...newEx, maxReps: Math.max(newEx.minReps, parseInt(e.target.value) || newEx.minReps) })}
                style={{
                  width: '48px',
                  padding: '8px 6px',
                  background: '#334155',
                  border: '1px solid transparent',
                  borderRadius: '8px',
                  color: '#F1F5F9',
                  fontSize: '12px',
                  textAlign: 'center',
                }}
              />
              <button
                onClick={addExercise}
                style={{
                  padding: '8px 16px',
                  background: '#6366F1',
                  color: 'white',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                添加
              </button>
            </div>
          )}
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#F87171',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '13px',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '8px' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              background: '#334155',
              color: '#CBD5E1',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 24px',
              background: '#6366F1',
              color: 'white',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? '保存中...' : '保存计划'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- 训练记录录入 ---------- */
function RecordSession({
  plan,
  onBack,
  onFinish,
}: {
  plan: TrainingPlan;
  onBack: () => void;
  onFinish: (records: ExerciseRecord[]) => Promise<void>;
}) {
  const today = new Date().toISOString().split('T')[0];
  const displayDate = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  const [records, setRecords] = useState<ExerciseRecord[]>(() =>
    plan.exercises.map((ex) => ({
      exerciseId: ex.id,
      exerciseName: ex.name,
      sets: Array.from({ length: ex.defaultSets }, (_, i) => ({
        setNumber: i + 1,
        weight: 0,
        reps: 0,
        rpe: 0,
        note: '',
      })),
    }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const updateSet = (exIdx: number, setIdx: number, field: keyof SetRecord, value: any) => {
    setRecords((prev) => {
      const copy = [...prev];
      copy[exIdx] = {
        ...copy[exIdx],
        sets: copy[exIdx].sets.map((s, i) => (i === setIdx ? { ...s, [field]: value } : s)),
      };
      return copy;
    });
  };

  const totalVolume = records.reduce(
    (sum, er) =>
      sum + er.sets.reduce((s, set) => s + (set.weight > 0 && set.reps > 0 ? set.weight * set.reps : 0), 0),
    0
  );
  const totalSets = records.reduce((sum, er) => sum + er.sets.length, 0);

  const handleFinish = async () => {
    setError('');
    for (let i = 0; i < records.length; i++) {
      for (const set of records[i].sets) {
        if (set.weight <= 0 || set.reps <= 0 || set.rpe < 1 || set.rpe > 10) {
          setError(`请完善 ${records[i].exerciseName} 的所有组数据（重量>0，次数>0，RPE 1-10）`);
          return;
        }
        if (set.note.length > 30) {
          setError(`${records[i].exerciseName} 的备注不能超过30字`);
          return;
        }
      }
    }
    try {
      setSaving(true);
      await onFinish(records);
    } catch (err: any) {
      setError(err?.response?.data?.error || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button
          onClick={onBack}
          style={{ padding: '8px 14px', background: '#334155', color: '#CBD5E1', borderRadius: '8px', fontSize: '13px' }}
        >
          ← 返回
        </button>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#F1F5F9' }}>{plan.name}</h2>
          <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '2px' }}>
            📅 {displayDate} · 共 {totalSets} 组 · 预估容量 {totalVolume.toLocaleString()} kg
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {records.map((er, exIdx) => {
          const exDef = plan.exercises.find((e) => e.id === er.exerciseId);
          const exVolume = er.sets.reduce(
            (s, set) => s + (set.weight > 0 && set.reps > 0 ? set.weight * set.reps : 0),
            0
          );
          return (
            <div key={er.exerciseId} style={{ background: '#1E293B', borderRadius: '16px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#F1F5F9' }}>
                    {exIdx + 1}. {er.exerciseName}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                    目标 {exDef?.defaultSets || er.sets.length} 组 × {exDef?.minReps}-{exDef?.maxReps} 次
                  </p>
                </div>
                <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 500 }}>
                  {exVolume.toLocaleString()} kg
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    padding: '0 40px 0 0',
                    fontSize: '11px',
                    color: '#64748B',
                  }}
                >
                  <span style={{ width: '24px', textAlign: 'center' }}>#</span>
                  <span style={{ width: '80px', textAlign: 'center' }}>重量kg</span>
                  <span style={{ width: '80px', textAlign: 'center' }}>次数</span>
                  <span style={{ width: '80px', textAlign: 'center' }}>RPE</span>
                  <span style={{ flex: 1, paddingLeft: '8px' }}>备注（≤30字）</span>
                </div>

                {er.sets.map((set, setIdx) => (
                  <div
                    key={setIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        width: '24px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#334155',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#CBD5E1',
                      }}
                    >
                      {set.setNumber}
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={set.weight || ''}
                      onChange={(e) => updateSet(exIdx, setIdx, 'weight', Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="kg"
                      style={{
                        width: '80px',
                        padding: '8px',
                        background: '#334155',
                        border: '1px solid transparent',
                        borderRadius: '8px',
                        color: '#F1F5F9',
                        fontSize: '13px',
                        textAlign: 'center',
                      }}
                    />
                    <input
                      type="number"
                      min={0}
                      value={set.reps || ''}
                      onChange={(e) => updateSet(exIdx, setIdx, 'reps', Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="次"
                      style={{
                        width: '80px',
                        padding: '8px',
                        background: '#334155',
                        border: '1px solid transparent',
                        borderRadius: '8px',
                        color: '#F1F5F9',
                        fontSize: '13px',
                        textAlign: 'center',
                      }}
                    />
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={set.rpe || ''}
                      onChange={(e) =>
                        updateSet(
                          exIdx,
                          setIdx,
                          'rpe',
                          Math.max(1, Math.min(10, parseInt(e.target.value) || 0))
                        )
                      }
                      placeholder="RPE"
                      style={{
                        width: '80px',
                        padding: '8px',
                        background: '#334155',
                        border: '1px solid transparent',
                        borderRadius: '8px',
                        color: '#F1F5F9',
                        fontSize: '13px',
                        textAlign: 'center',
                      }}
                    />
                    <input
                      type="text"
                      maxLength={30}
                      value={set.note}
                      onChange={(e) => updateSet(exIdx, setIdx, 'note', e.target.value)}
                      placeholder="备注"
                      style={{
                        flex: 1,
                        minWidth: '160px',
                        padding: '8px 10px',
                        background: '#334155',
                        border: '1px solid transparent',
                        borderRadius: '8px',
                        color: '#F1F5F9',
                        fontSize: '13px',
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#F87171',
            padding: '10px 12px',
            borderRadius: '8px',
            fontSize: '13px',
            marginTop: '16px',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ position: 'sticky', bottom: 0, paddingTop: '24px' }}>
        <button
          onClick={handleFinish}
          disabled={saving}
          style={{
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            color: 'white',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: 700,
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? '保存中...' : '✓ 完成本日训练'}
        </button>
      </div>
    </div>
  );
}
