import { useReducer, useRef, useCallback, useEffect, useState } from 'react';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';
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
      return {
        ...state,
        form: { ...state.form, [action.field]: action.value },
      };
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
  const [bubbleVisible, setBubbleVisible] = useState(false);

  const getValueFromPosition = useCallback((clientX: number) => {
    if (!trackRef.current) return value;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    return Math.max(0, Math.min(100, Math.round(pct)));
  }, [value]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setDragging(true);
    setBubbleVisible(true);
    const newVal = getValueFromPosition(e.clientX);
    onChange(newVal);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const newVal = getValueFromPosition(e.clientX);
    onChange(newVal);
  };

  const handlePointerUp = () => {
    setDragging(false);
    setBubbleVisible(false);
  };

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: PointerEvent) => {
      const newVal = getValueFromPosition(e.clientX);
      onChange(newVal);
    };
    const handleUp = () => {
      setDragging(false);
      setBubbleVisible(false);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [dragging, getValueFromPosition, onChange]);

  return (
    <div className="relative pt-4 pb-1">
      {(dragging || bubbleVisible) && (
        <div
          className="absolute -top-1 px-[10px] py-1 rounded-[12px] text-[12px] text-white whitespace-nowrap pointer-events-none z-10"
          style={{
            left: `calc(${value}% - 18px)`,
            background: '#B8A9C9',
            fontWeight: 600,
            transform: 'translateY(-4px)',
          }}
        >
          {value}%
        </div>
      )}
      <div
        ref={trackRef}
        className="relative cursor-pointer select-none touch-none"
        style={{ height: 10, borderRadius: 5, background: '#EFE9E0' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-[5px]"
          style={{ width: `${value}%`, background: getProgressColor(value) }}
        />
        <div
          className={cn('absolute top-1/2 -translate-y-1/2 rounded-full transition-shadow')}
          style={{
            left: `calc(${value}% - 9px)`,
            width: 18,
            height: 18,
            background: 'white',
            border: '2px solid #B8A9C9',
            boxShadow: dragging
              ? '0 4px 12px rgba(74, 66, 56, 0.25)'
              : '0 2px 6px rgba(74, 66, 56, 0.15)',
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

  const isMaterialSelected = (id: string) =>
    state.form.selectedMaterials.some(m => m.materialId === id);

  const getMaterialQty = (id: string) =>
    state.form.selectedMaterials.find(m => m.materialId === id)?.usedQuantity ?? 0;

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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          项目时间线
        </h2>
        <button className="btn btn-primary" onClick={handleOpen}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          创建项目
        </button>
      </div>

      <div className="relative pl-8">
        <div
          className="absolute top-0 bottom-0 left-[23px] w-[2px]"
          style={{ background: '#E8DFD2' }}
        />

        <div className="flex flex-col gap-6">
          {projects.map((project, idx) => (
            <div key={project.id} className="relative flex gap-4 card-enter" style={{ animationDelay: `${idx * 60}ms` }}>
              <div
                className="absolute left-[-31px] top-[6px] rounded-full flex-shrink-0 z-[1]"
                style={{
                  width: 48,
                  height: 48,
                  backgroundImage: `url(${project.coverImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '3px solid white',
                  boxShadow: '0 2px 8px rgba(74, 66, 56, 0.15)',
                }}
              />

              <div className="flex-1 ml-6">
                <div
                  className="relative"
                  style={{
                    background: 'white',
                    borderRadius: 14,
                    padding: 18,
                    boxShadow: 'var(--shadow-md)',
                  }}
                >
                  <button
                    className="absolute top-3 right-3 p-2 rounded-lg opacity-60 hover:opacity-100 hover:bg-red-50 transition-all"
                    onClick={() => deleteProject(project.id)}
                    style={{ color: '#E06B5A', fontSize: 14 }}
                    title="删除项目"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>

                  <div className="flex items-start justify-between gap-3 mb-2 pr-8">
                    <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                      {project.name}
                    </h3>
                    <span className={cn('tag', getStatusTagClass(project.status))}>
                      {getStatusText(project.status)}
                    </span>
                  </div>

                  <div className="mb-3" style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
                    预估 <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{project.estimatedHours}</span> 小时
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
            className="text-center py-16 ml-6 rounded-2xl"
            style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text-muted)' }}
          >
            <div className="text-5xl mb-3">🎨</div>
            <div className="font-semibold mb-1" style={{ color: 'var(--color-text)' }}>还没有项目</div>
            <div className="text-sm">点击上方"创建项目"开始你的第一个手工项目吧</div>
          </div>
        )}
      </div>

      {state.isOpen && (
        <div className="modal-overlay" onClick={handleClose}>
          <div
            className="modal-content w-full"
            style={{ maxWidth: 560 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">创建新项目</h3>
                <button
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={handleClose}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 flex flex-col gap-5">
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
                <div className="relative">
                  <div
                    className="w-full rounded-xl overflow-hidden cursor-pointer relative"
                    style={{
                      height: 200,
                      background: state.form.coverImage
                        ? `url(${state.form.coverImage}) center/cover no-repeat`
                        : 'var(--color-bg-alt)',
                      border: '2px dashed var(--color-border)',
                    }}
                    onClick={() => !state.uploading && fileInputRef.current?.click()}
                  >
                    {!state.form.coverImage && !state.uploading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                        <svg className="w-10 h-10 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                        <div className="font-semibold" style={{ color: 'var(--color-text)' }}>点击上传封面</div>
                        <div className="text-xs">支持 JPG、PNG 格式</div>
                      </div>
                    )}

                    {state.uploading && (
                      <div
                        className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                        style={{ background: 'rgba(74, 66, 56, 0.5)' }}
                      >
                        <div
                          className="rounded-full"
                          style={{
                            width: 56,
                            height: 56,
                            border: '3px solid rgba(255,255,255,0.3)',
                            borderTop: '3px solid var(--color-primary)',
                            animation: 'spin 0.8s linear infinite',
                          }}
                        />
                        <div className="text-white font-semibold text-lg">{state.uploadProgress}%</div>
                      </div>
                    )}

                    {state.form.coverImage && !state.uploading && (
                      <div
                        className="absolute inset-0 items-center justify-center opacity-0 hover:opacity-100 transition-opacity flex"
                        style={{ background: 'rgba(74, 66, 56, 0.5)' }}
                      >
                        <div className="text-white font-semibold">点击更换封面</div>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">关联材料</label>
                <div
                  className="flex flex-col gap-2 max-h-[220px] overflow-y-auto rounded-xl p-3"
                  style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}
                >
                  {materials.length === 0 ? (
                    <div className="text-center py-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      暂无可用材料
                    </div>
                  ) : (
                    materials.map((material) => {
                      const selected = isMaterialSelected(material.id);
                      return (
                        <div
                          key={material.id}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer',
                            selected ? 'bg-white shadow-sm' : 'hover:bg-white/60'
                          )}
                          onClick={() => dispatch({ type: 'SELECT_MATERIAL', materialId: material.id, selected: !selected })}
                        >
                          <div
                            className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all"
                            style={{
                              borderColor: selected ? 'var(--color-primary)' : 'var(--color-border)',
                              background: selected ? 'var(--color-primary)' : 'transparent',
                            }}
                          >
                            {selected && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm truncate" style={{ color: 'var(--color-text)' }}>
                              {material.name}
                            </div>
                            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                              库存: {material.quantity} {material.unit}
                            </div>
                          </div>
                          {selected && (
                            <input
                              type="number"
                              min={0}
                              max={material.quantity}
                              className="form-input w-20 text-center !py-1.5 !px-2 text-sm"
                              style={{ fontSize: 13 }}
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

            <div className="p-6 border-t flex gap-3 justify-end" style={{ borderColor: 'var(--color-border)' }}>
              <button className="btn btn-secondary" onClick={handleClose}>
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={state.uploading || !state.form.name.trim()}
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
