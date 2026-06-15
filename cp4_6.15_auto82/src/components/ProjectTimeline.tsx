import { useReducer, useRef, useCallback, useEffect, useState } from 'react';
import { useAppStore } from '@/store';
import type { ProjectFormState } from '@/types';

type FormState = ProjectFormState;

type Action =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'SET_FIELD'; field: keyof FormState['form']; value: string | number }
  | { type: 'SELECT_MATERIAL'; materialId: string; selected: boolean }
  | { type: 'SET_MATERIAL_QTY'; materialId: string; quantity: number }
  | { type: 'START_UPLOAD' }
  | { type: 'SET_PROGRESS'; progress: number }
  | { type: 'FINISH_UPLOAD'; base64: string }
  | { type: 'SUBMIT' };

const initialState: FormState = {
  isOpen: false,
  uploading: false,
  uploadProgress: 0,
  form: {
    name: '',
    estimatedHours: 0,
    description: '',
    coverImage: '',
    selectedMaterials: [],
  },
};

function formReducer(state: FormState, action: Action): FormState {
  switch (action.type) {
    case 'OPEN':
      return { ...initialState, isOpen: true };
    case 'CLOSE':
      return { ...state, isOpen: false };
    case 'SET_FIELD':
      return { ...state, form: { ...state.form, [action.field]: action.value } };
    case 'SELECT_MATERIAL': {
      const exists = state.form.selectedMaterials.find(m => m.materialId === action.materialId);
      if (action.selected && !exists) {
        return {
          ...state,
          form: {
            ...state.form,
            selectedMaterials: [...state.form.selectedMaterials, { materialId: action.materialId, usedQuantity: 1 }],
          },
        };
      }
      if (!action.selected && exists) {
        return {
          ...state,
          form: {
            ...state.form,
            selectedMaterials: state.form.selectedMaterials.filter(m => m.materialId !== action.materialId),
          },
        };
      }
      return state;
    }
    case 'SET_MATERIAL_QTY':
      return {
        ...state,
        form: {
          ...state.form,
          selectedMaterials: state.form.selectedMaterials.map(m =>
            m.materialId === action.materialId ? { ...m, usedQuantity: Math.max(0, action.quantity) } : m
          ),
        },
      };
    case 'START_UPLOAD':
      return { ...state, uploading: true, uploadProgress: 0 };
    case 'SET_PROGRESS':
      return { ...state, uploadProgress: action.progress };
    case 'FINISH_UPLOAD':
      return { ...state, uploading: false, uploadProgress: 100, form: { ...state.form, coverImage: action.base64 } };
    case 'SUBMIT':
      return { ...initialState };
    default:
      return state;
  }
}

function getProgressColor(progress: number): string {
  if (progress >= 100) return '#7AB87A';
  if (progress >= 60) return '#5A7AA8';
  if (progress > 0) return '#B8A9C9';
  return '#E8E4DE';
}

interface ProgressSliderProps {
  value: number;
  onChange: (v: number) => void;
}

function ProgressSlider({ value, onChange }: ProgressSliderProps) {
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const getValueFromPosition = useCallback((clientX: number) => {
    if (!trackRef.current) return value;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    return Math.max(0, Math.min(100, Math.round(pct)));
  }, [value]);

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: PointerEvent) => {
      const newVal = getValueFromPosition(e.clientX);
      onChange(newVal);
    };
    const handleUp = () => {
      setDragging(false);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [dragging, getValueFromPosition, onChange]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setDragging(true);
    const newVal = getValueFromPosition(e.clientX);
    onChange(newVal);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  return (
    <div style={{ position: 'relative', paddingTop: 22, paddingBottom: 4 }}>
      {dragging && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: `calc(${value}% - 18px)`,
            background: '#B8A9C9',
            color: 'white',
            fontWeight: 600,
            fontSize: 12,
            padding: '4px 10px',
            borderRadius: 12,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 10,
            transition: 'left 0.05s linear',
          }}
        >
          {value}%
        </div>
      )}
      <div
        ref={trackRef}
        style={{
          position: 'relative',
          height: 10,
          borderRadius: 5,
          background: '#EFE9E0',
          cursor: 'pointer',
          userSelect: 'none',
          touchAction: 'none',
        }}
        onPointerDown={handlePointerDown}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: `${value}%`,
            borderRadius: 5,
            background: getProgressColor(value),
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            left: `calc(${value}% - 9px)`,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: 'white',
            border: '2px solid #B8A9C9',
            boxShadow: dragging ? '0 4px 12px rgba(74,66,56,0.25)' : '0 2px 6px rgba(74,66,56,0.15)',
            transition: dragging ? 'none' : 'left 0.15s ease, box-shadow 0.2s ease',
            cursor: 'grab',
          }}
        />
      </div>
    </div>
  );
}

export default function ProjectTimeline() {
  const { projects, materials, addProject, updateProjectProgress, deleteProject } = useAppStore();
  const [state, dispatch] = useReducer(formReducer, initialState);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpen = () => dispatch({ type: 'OPEN' });
  const handleClose = () => dispatch({ type: 'CLOSE' });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    dispatch({ type: 'START_UPLOAD' });
    const reader = new FileReader();
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 8;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      dispatch({ type: 'SET_PROGRESS', progress });
    }, 120);
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      const finishInterval = setInterval(() => {
        if (progress >= 100) {
          clearInterval(finishInterval);
          dispatch({ type: 'FINISH_UPLOAD', base64 });
        }
      }, 50);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = () => {
    if (!state.form.name.trim()) return;
    addProject({
      name: state.form.name,
      estimatedHours: state.form.estimatedHours,
      description: state.form.description,
      coverImage: state.form.coverImage || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
      materials: [...state.form.selectedMaterials],
    });
    dispatch({ type: 'SUBMIT' });
  };

  const isMaterialSelected = (id: string) => state.form.selectedMaterials.some(m => m.materialId === id);
  const getMaterialQty = (id: string) => state.form.selectedMaterials.find(m => m.materialId === id)?.usedQuantity ?? 0;

  const getStatusTagClass = (status: string) => {
    if (status === 'pending') return 'tag-pending';
    if (status === 'in-progress') return 'tag-progress';
    return 'tag-completed';
  };

  const getStatusText = (status: string) => {
    if (status === 'pending') return '待开始';
    if (status === 'in-progress') return '进行中';
    return '已完成';
  };

  return (
    <div className="page-fade-enter">
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text)' }}>
          项目时间线
        </h2>
        <button className="btn btn-primary" onClick={handleOpen}>
          <i className="fa-solid fa-plus" style={{ fontSize: 13 }}></i>
          创建项目
        </button>
      </div>

      <div style={{ position: 'relative', paddingLeft: 32 }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 23,
            width: 2,
            background: '#E8DFD2',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {projects.map((project, idx) => (
            <div
              key={project.id}
              className="card-enter"
              style={{
                position: 'relative',
                display: 'flex',
                gap: 16,
                animationDelay: `${idx * 60}ms`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: -31,
                  top: 6,
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundImage: `url(${project.coverImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '3px solid white',
                  boxShadow: '0 2px 8px rgba(74,66,56,0.15)',
                  flexShrink: 0,
                  zIndex: 1,
                }}
              />

              <div style={{ flex: 1, marginLeft: 24 }}>
                <div
                  style={{
                    position: 'relative',
                    background: 'white',
                    borderRadius: 14,
                    padding: 18,
                    boxShadow: 'var(--shadow-md)',
                  }}
                >
                  <button
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      padding: 6,
                      borderRadius: 8,
                      opacity: 0.5,
                      color: '#E06B5A',
                      fontSize: 14,
                      transition: 'opacity 0.2s, background 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = '#fef2f2'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.background = 'transparent'; }}
                    onClick={() => deleteProject(project.id)}
                    title="删除项目"
                  >
                    <i className="fa-solid fa-trash-can" style={{ fontSize: 13 }}></i>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8, paddingRight: 32 }}>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--color-text)' }}>
                      {project.name}
                    </h3>
                    <span className={`tag ${getStatusTagClass(project.status)}`}>
                      {getStatusText(project.status)}
                    </span>
                  </div>

                  <div style={{ marginBottom: 12, color: 'var(--color-text-muted)', fontSize: 13 }}>
                    预估 <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{project.estimatedHours}</span> 小时
                  </div>

                  <ProgressSlider
                    value={project.progress}
                    onChange={(v) => updateProjectProgress(project.id, v)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {projects.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '64px 0',
              marginLeft: 24,
              borderRadius: 16,
              background: 'var(--color-bg-alt)',
              color: 'var(--color-text-muted)',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎨</div>
            <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--color-text)' }}>还没有项目</div>
            <div style={{ fontSize: 14 }}>点击上方"创建项目"开始你的第一个手工项目吧</div>
          </div>
        )}
      </div>

      {state.isOpen && (
        <div className="modal-overlay" onClick={handleClose}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 560, width: '100%' }}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>创建新项目</h3>
              <button
                style={{ padding: 8, borderRadius: 8, color: 'var(--color-text-muted)', transition: 'color 0.2s' }}
                onClick={handleClose}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
              >
                <i className="fa-solid fa-xmark" style={{ fontSize: 16 }}></i>
              </button>
            </div>

            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="form-group">
                <label className="form-label">项目名称</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="给你的项目起个名字"
                  value={state.form.name}
                  onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'name', value: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">预估小时数</label>
                <input
                  type="number"
                  min={0}
                  className="form-input"
                  placeholder="预计需要多少小时完成"
                  value={state.form.estimatedHours || ''}
                  onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'estimatedHours', value: Number(e.target.value) || 0 })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">项目描述</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="简单描述一下这个项目..."
                  value={state.form.description}
                  onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'description', value: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">封面图片</label>
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      width: '100%',
                      height: 200,
                      borderRadius: 12,
                      overflow: 'hidden',
                      cursor: state.uploading ? 'wait' : 'pointer',
                      position: 'relative',
                      background: state.form.coverImage
                        ? `url(${state.form.coverImage}) center/cover no-repeat`
                        : 'var(--color-bg-alt)',
                      border: '2px dashed var(--color-border)',
                    }}
                    onClick={() => !state.uploading && fileInputRef.current?.click()}
                  >
                    {!state.form.coverImage && !state.uploading && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                        color: 'var(--color-text-muted)',
                      }}>
                        <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: 36, marginBottom: 4 }}></i>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>点击上传封面</div>
                        <div style={{ fontSize: 12 }}>支持 JPG、PNG 格式</div>
                      </div>
                    )}

                    {state.uploading && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
                        background: 'rgba(74,66,56,0.5)',
                      }}>
                        <div style={{
                          width: 56, height: 56, borderRadius: '50%',
                          border: '3px solid rgba(255,255,255,0.3)',
                          borderTop: '3px solid var(--color-primary)',
                          animation: 'spin 0.8s linear infinite',
                        }} />
                        <div style={{ color: 'white', fontWeight: 600, fontSize: 18 }}>{state.uploadProgress}%</div>
                      </div>
                    )}

                    {state.form.coverImage && !state.uploading && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: 0, transition: 'opacity 0.2s',
                        background: 'rgba(74,66,56,0.5)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                      >
                        <div style={{ color: 'white', fontWeight: 600 }}>点击更换封面</div>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">关联材料</label>
                <div
                  style={{
                    display: 'flex', flexDirection: 'column', gap: 8,
                    maxHeight: 220, overflowY: 'auto',
                    borderRadius: 12, padding: 12,
                    background: 'var(--color-bg-alt)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {materials.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 14, color: 'var(--color-text-muted)' }}>
                      暂无可用材料
                    </div>
                  ) : (
                    materials.map((material) => {
                      const selected = isMaterialSelected(material.id);
                      return (
                        <div
                          key={material.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: 12, borderRadius: 10,
                            background: selected ? 'white' : 'transparent',
                            boxShadow: selected ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onClick={() => dispatch({ type: 'SELECT_MATERIAL', materialId: material.id, selected: !selected })}
                        >
                          <div style={{
                            width: 20, height: 20, borderRadius: 4,
                            border: `2px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                            background: selected ? 'var(--color-primary)' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'all 0.15s',
                          }}>
                            {selected && <i className="fa-solid fa-check" style={{ fontSize: 10, color: 'white' }}></i>}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {material.name}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                              库存: {material.quantity} {material.unit}
                            </div>
                          </div>
                          {selected && (
                            <input
                              type="number"
                              min={0}
                              max={material.quantity}
                              className="form-input"
                              style={{ width: 72, textAlign: 'center', padding: '6px 8px', fontSize: 13 }}
                              value={getMaterialQty(material.id) || ''}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => dispatch({
                                type: 'SET_MATERIAL_QTY',
                                materialId: material.id,
                                quantity: Math.min(material.quantity, Number(e.target.value) || 0),
                              })}
                            />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={handleClose}>
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                style={{ opacity: state.uploading || !state.form.name.trim() ? 0.6 : 1 }}
              >
                创建项目
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
