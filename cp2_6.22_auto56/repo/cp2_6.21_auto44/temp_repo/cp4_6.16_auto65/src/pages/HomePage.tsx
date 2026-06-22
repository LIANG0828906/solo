import { useEffect, useMemo, useState } from 'react';
import { useExerciseStore } from '../modules/exercise/store';
import type { Exercise, ExerciseCategory, ExerciseType, LogFormExercise, TemplateExercise } from '../modules/exercise/types';

const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  chest: '胸',
  back: '背',
  legs: '腿',
  shoulders: '肩',
  arms: '臂',
  core: '核心',
};

const TYPE_LABELS: Record<ExerciseType, string> = {
  free: '自由重量',
  machine: '器械',
  bodyweight: '自重',
};

const CATEGORY_FILTERS: Array<{ value: ExerciseCategory | 'all'; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'chest', label: '胸' },
  { value: 'back', label: '背' },
  { value: 'legs', label: '腿' },
  { value: 'shoulders', label: '肩' },
  { value: 'arms', label: '臂' },
  { value: 'core', label: '核心' },
];

const HomePage = () => {
  const loading = useExerciseStore((state) => state.loading);
  const searchQuery = useExerciseStore((state) => state.searchQuery);
  const filterCategory = useExerciseStore((state) => state.filterCategory);
  const trainingRecords = useExerciseStore((state) => state.trainingRecords);
  const deletingRecordId = useExerciseStore((state) => state.deletingRecordId);
  const templates = useExerciseStore((state) => state.templates);
  const logForm = useExerciseStore((state) => state.logForm);
  const addExercise = useExerciseStore((state) => state.addExercise);
  const deleteExercise = useExerciseStore((state) => state.deleteExercise);
  const addTrainingRecord = useExerciseStore((state) => state.addTrainingRecord);
  const deleteTrainingRecord = useExerciseStore((state) => state.deleteTrainingRecord);
  const addTemplate = useExerciseStore((state) => state.addTemplate);
  const deleteTemplate = useExerciseStore((state) => state.deleteTemplate);
  const applyTemplate = useExerciseStore((state) => state.applyTemplate);
  const setSearchQuery = useExerciseStore((state) => state.setSearchQuery);
  const setDebouncedSearchQuery = useExerciseStore((state) => state.setDebouncedSearchQuery);
  const setFilterCategory = useExerciseStore((state) => state.setFilterCategory);
  const filterExercises = useExerciseStore((state) => state.filterExercises);
  const setLogFormDate = useExerciseStore((state) => state.setLogFormDate);
  const setLogFormTime = useExerciseStore((state) => state.setLogFormTime);
  const addLogFormExercise = useExerciseStore((state) => state.addLogFormExercise);
  const updateLogFormExercise = useExerciseStore((state) => state.updateLogFormExercise);
  const removeLogFormExercise = useExerciseStore((state) => state.removeLogFormExercise);
  const resetLogForm = useExerciseStore((state) => state.resetLogForm);

  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExercise, setNewExercise] = useState({
    name: '',
    category: 'chest' as ExerciseCategory,
    type: 'free' as ExerciseType,
    description: '',
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [searchKey, setSearchKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setSearchKey((k) => k + 1);
    }, 80);
    return () => clearTimeout(timer);
  }, [searchQuery, setDebouncedSearchQuery]);

  const filteredExercises = useMemo(() => {
    return filterExercises();
  }, [filterExercises, searchKey]);

  const sortedRecords = useMemo(() => {
    return [...trainingRecords].sort((a, b) => b.createdAt - a.createdAt);
  }, [trainingRecords]);

  const handleAddExercise = () => {
    if (!newExercise.name.trim()) return;
    addExercise(newExercise);
    setNewExercise({ name: '', category: 'chest', type: 'free', description: '' });
    setShowAddExercise(false);
  };

  const handleAddExerciseToForm = (exercise: Exercise) => {
    const exists = logForm.exercises.some((e) => e.exerciseId === exercise.id);
    if (exists) return;
    const newItem: LogFormExercise = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      category: exercise.category,
      sets: 3,
      reps: 10,
      weight: 0,
    };
    addLogFormExercise(newItem);
  };

  const handleSubmitLog = () => {
    if (logForm.exercises.length === 0) {
      alert('请至少添加一个训练动作');
      return;
    }

    logForm.exercises.forEach((item) => {
      if (item.sets <= 0 || item.reps <= 0) return;
      const totalWeight = item.sets * item.reps * item.weight;
      addTrainingRecord({
        exerciseId: item.exerciseId,
        exerciseName: item.exerciseName,
        category: item.category,
        sets: item.sets,
        reps: item.reps,
        weight: item.weight,
        totalWeight,
        date: logForm.date,
        time: logForm.time,
      });
    });

    resetLogForm();
    alert('训练记录已保存！');
  };

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim() || logForm.exercises.length === 0) {
      alert('请输入模板名称并添加至少一个训练动作');
      return;
    }

    const templateExercises: TemplateExercise[] = logForm.exercises.map((item) => ({
      exerciseId: item.exerciseId,
      exerciseName: item.exerciseName,
      category: item.category,
      defaultSets: item.sets,
      defaultReps: item.reps,
      defaultWeight: item.weight,
    }));

    addTemplate({
      name: newTemplateName,
      exercises: templateExercises,
    });

    setNewTemplateName('');
    setShowSaveTemplate(false);
    alert('模板已保存！');
  };

  const handleApplyTemplate = () => {
    if (!selectedTemplateId) {
      alert('请选择一个模板');
      return;
    }
    applyTemplate(selectedTemplateId);
    setSelectedTemplateId('');
  };

  return (
    <div className="container home-container">
      <div className="home-layout">
        <div className="home-left">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 style={{ fontSize: '20px', fontWeight: 700 }}>动作库</h2>
              <button className="btn btn-primary" onClick={() => setShowAddExercise(true)}>
                + 添加动作
              </button>
            </div>

            {showAddExercise && (
              <div className="card mb-4" style={{ padding: '16px', background: 'rgba(15, 52, 96, 0.5)' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>新增动作</h3>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="动作名称"
                    value={newExercise.name}
                    onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <select
                      value={newExercise.category}
                      onChange={(e) => setNewExercise({ ...newExercise, category: e.target.value as ExerciseCategory })}
                      style={{ flex: 1 }}
                    >
                      {CATEGORY_FILTERS.filter((c) => c.value !== 'all').map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <select
                      value={newExercise.type}
                      onChange={(e) => setNewExercise({ ...newExercise, type: e.target.value as ExerciseType })}
                      style={{ flex: 1 }}
                    >
                      <option value="free">自由重量</option>
                      <option value="machine">器械</option>
                      <option value="bodyweight">自重</option>
                    </select>
                  </div>
                  <textarea
                    placeholder="动作说明（可选）"
                    value={newExercise.description}
                    onChange={(e) => setNewExercise({ ...newExercise, description: e.target.value })}
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button className="btn btn-primary" onClick={handleAddExercise}>确认添加</button>
                    <button className="btn" onClick={() => setShowAddExercise(false)}>取消</button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 mb-4">
              <input
                type="text"
                placeholder="搜索动作名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="filter-tabs">
                {CATEGORY_FILTERS.map((cat) => (
                  <button
                    key={cat.value}
                    className={`filter-tab ${filterCategory === cat.value ? 'active' : ''}`}
                    onClick={() => setFilterCategory(cat.value)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="loading" style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>
            ) : filteredExercises.length === 0 ? (
              <div className="text-secondary" style={{ textAlign: 'center', padding: '40px' }}>
                暂无动作，点击上方按钮添加
              </div>
            ) : (
              <div className="exercise-grid">
                {filteredExercises.map((exercise, index) => (
                  <div
                    key={exercise.id}
                    className={`card exercise-card fade-in stagger-item`}
                    style={{ animationDelay: `${Math.min(index, 10) * 0.05}s` }}
                    onClick={() => handleAddExerciseToForm(exercise)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 style={{ fontSize: '15px', fontWeight: 600 }}>{exercise.name}</h4>
                      <button
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('确定删除此动作？')) deleteExercise(exercise.id);
                        }}
                        title="删除动作"
                      >
                        ×
                      </button>
                    </div>
                    <span className={`category-tag category-${exercise.category}`}>
                      {CATEGORY_LABELS[exercise.category]}
                    </span>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                      {TYPE_LABELS[exercise.type]}
                    </div>
                    {exercise.description && (
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
                        {exercise.description}
                      </p>
                    )}
                    <div style={{ fontSize: '11px', color: 'var(--accent)', marginTop: '8px', fontWeight: 500 }}>
                      点击添加到训练
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="home-right">
          <div className="card mb-4">
            <div className="flex justify-between items-center mb-4">
              <h2 style={{ fontSize: '20px', fontWeight: 700 }}>记录训练</h2>
            </div>

            <div className="flex gap-2 mb-4">
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="">选择训练模板...</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <button className="btn" onClick={handleApplyTemplate}>加载模板</button>
              <button className="btn" onClick={() => setShowSaveTemplate(!showSaveTemplate)}>
                {showSaveTemplate ? '取消' : '保存为模板'}
              </button>
            </div>

            {showSaveTemplate && (
              <div className="card mb-4" style={{ padding: '12px', background: 'rgba(15, 52, 96, 0.5)' }}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="输入模板名称，如：腿推拉"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button className="btn btn-primary" onClick={handleSaveTemplate}>确认保存</button>
                </div>
                {templates.length > 0 && (
                  <div className="mt-2" style={{ fontSize: '12px' }}>
                    <div className="text-secondary mb-2">已有模板：</div>
                    <div className="flex flex-col gap-1">
                      {templates.map((t) => (
                        <div key={t.id} className="flex justify-between items-center" style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                          <span>{t.name} ({t.exercises.length}个动作)</span>
                          <button
                            className="delete-btn"
                            onClick={() => {
                              if (confirm('确定删除此模板？')) deleteTemplate(t.id);
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 mb-4">
              <input
                type="date"
                value={logForm.date}
                onChange={(e) => setLogFormDate(e.target.value)}
                style={{ flex: 1 }}
              />
              <input
                type="time"
                value={logForm.time}
                onChange={(e) => setLogFormTime(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>

            {logForm.exercises.length === 0 ? (
              <div className="text-secondary" style={{ textAlign: 'center', padding: '30px', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                点击左侧动作卡片添加到训练计划
              </div>
            ) : (
              <div className="flex flex-col gap-3 mb-4">
                {logForm.exercises.map((item, index) => (
                  <div key={`${item.exerciseId}-${index}`} className="card" style={{ padding: '14px' }}>
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <span style={{ fontWeight: 600 }}>{item.exerciseName}</span>
                        <span className={`category-tag category-${item.category}`} style={{ marginLeft: '8px' }}>
                          {CATEGORY_LABELS[item.category]}
                        </span>
                      </div>
                      <button
                        className="delete-btn"
                        onClick={() => removeLogFormExercise(index)}
                      >
                        ×
                      </button>
                    </div>
                    <div className="form-row-3">
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>组数</label>
                        <input
                          type="number"
                          min="1"
                          value={item.sets}
                          onChange={(e) => updateLogFormExercise(index, 'sets', parseInt(e.target.value) || 0)}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>次数/组</label>
                        <input
                          type="number"
                          min="1"
                          value={item.reps}
                          onChange={(e) => updateLogFormExercise(index, 'reps', parseInt(e.target.value) || 0)}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>重量(kg)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={item.weight}
                          onChange={(e) => updateLogFormExercise(index, 'weight', parseFloat(e.target.value) || 0)}
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', marginTop: '10px', color: 'var(--accent)', fontWeight: 500 }}>
                      总重量: {item.sets * item.reps * item.weight} kg
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button className="btn btn-primary w-full" onClick={handleSubmitLog} style={{ flex: 1 }}>
                提交训练记录
              </button>
              <button className="btn" onClick={resetLogForm}>
                清空
              </button>
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>训练日志</h2>
            {sortedRecords.length === 0 ? (
              <div className="text-secondary" style={{ textAlign: 'center', padding: '40px' }}>
                暂无训练记录
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {sortedRecords.map((record) => (
                  <div
                    key={record.id}
                    className={`card record-card ${deletingRecordId === record.id ? 'slide-out' : ''}`}
                    style={{ padding: '16px' }}
                  >
                    <div className="flex justify-between items-start">
                      <div style={{ flex: 1 }}>
                        <div className="flex items-center gap-2 mb-2">
                          <span style={{ fontWeight: 600, fontSize: '15px' }}>{record.exerciseName}</span>
                          <span className={`category-tag category-${record.category}`}>
                            {CATEGORY_LABELS[record.category]}
                          </span>
                        </div>
                        <div className="record-meta">
                          <span>{record.date} {record.time}</span>
                        </div>
                        <div className="record-stats">
                          <div className="record-stat">
                            <span className="stat-label">组数</span>
                            <span className="stat-value">{record.sets}</span>
                          </div>
                          <div className="record-stat">
                            <span className="stat-label">次数</span>
                            <span className="stat-value">{record.reps}</span>
                          </div>
                          <div className="record-stat">
                            <span className="stat-label">单重</span>
                            <span className="stat-value">{record.weight}kg</span>
                          </div>
                          <div className="record-stat highlight">
                            <span className="stat-label">总重量</span>
                            <span className="stat-value">{record.totalWeight}kg</span>
                          </div>
                        </div>
                      </div>
                      <button
                        className="delete-btn"
                        style={{ fontSize: '20px', padding: '4px 10px' }}
                        onClick={() => {
                          if (confirm('确定删除此记录？')) deleteTrainingRecord(record.id);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
