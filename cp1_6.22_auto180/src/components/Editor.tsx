import React from 'react';
import SlideCanvas from './SlideCanvas';
import { useEditorStore } from '../store';
import { collaborationService } from '../services/CollaborationService';
import type { AnimationType, AnimationPhase, ElementType, ShapeType } from '../types';

interface EditorProps {
  isConnected: boolean;
}

const ANIMATION_OPTIONS: { value: AnimationType; label: string }[] = [
  { value: 'fadeIn', label: '淡入' },
  { value: 'fadeOut', label: '淡出' },
  { value: 'flip', label: '翻转' },
  { value: 'zoom', label: '缩放' },
  { value: 'slideInLeft', label: '从左滑入' },
  { value: 'slideInRight', label: '从右滑入' },
  { value: 'slideInUp', label: '从下滑入' },
  { value: 'slideInDown', label: '从上滑入' },
];

const Editor: React.FC<EditorProps> = ({ isConnected }) => {
  const presentation = useEditorStore((s) => s.presentation);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const setCurrentSlide = useEditorStore((s) => s.setCurrentSlide);
  const addSlide = useEditorStore((s) => s.addSlide);
  const addElement = useEditorStore((s) => s.addElement);
  const deleteElement = useEditorStore((s) => s.deleteElement);
  const toggleAnimationPanel = useEditorStore((s) => s.toggleAnimationPanel);
  const animationPanelOpen = useEditorStore((s) => s.animationPanelOpen);
  const collaborators = useEditorStore((s) => s.collaborators);
  const localCollaboratorId = useEditorStore((s) => s.localCollaboratorId);
  const addAnimation = useEditorStore((s) => s.addAnimation);
  const updateAnimation = useEditorStore((s) => s.updateAnimation);
  const deleteAnimation = useEditorStore((s) => s.deleteAnimation);
  const setPreviewingAnimation = useEditorStore((s) => s.setPreviewingAnimation);

  const currentSlide = presentation.slides.find((s) => s.id === presentation.currentSlideId);
  const selectedElement = currentSlide?.elements.find((e) => e.id === selectedElementId);

  const handleAddSlide = () => {
    addSlide();
    const slide = presentation.slides[presentation.slides.length - 1];
    if (slide) {
      collaborationService.broadcastAddSlide(slide);
    }
  };

  const handleSwitchSlide = (slideId: string) => {
    setCurrentSlide(slideId);
  };

  const handleAddElement = (type: ElementType, shapeType?: ShapeType) => {
    if (!currentSlide) return;
    addElement(currentSlide.id, type, shapeType);
    const newEl = currentSlide.elements[currentSlide.elements.length - 1];
    if (newEl) {
      collaborationService.broadcastAddElement(currentSlide.id, newEl);
    }
  };

  const handleDeleteElement = () => {
    if (!currentSlide || !selectedElementId) return;
    deleteElement(currentSlide.id, selectedElementId);
    collaborationService.broadcastDeleteElement(currentSlide.id, selectedElementId);
  };

  const handleAddAnimation = (phase: AnimationPhase) => {
    if (!currentSlide || !selectedElementId) return;
    const defaultType: AnimationType = phase === 'entrance' ? 'fadeIn' : 'fadeOut';
    addAnimation(currentSlide.id, selectedElementId, {
      type: defaultType,
      phase,
      duration: 500,
      delay: 0,
    });
  };

  const handlePreviewAnimation = () => {
    if (!selectedElementId) return;
    setPreviewingAnimation(selectedElementId, true);
  };

  const otherCollaborators = collaborators.filter((c) => c.id !== localCollaboratorId);

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <div style={styles.logoArea}>
          <span style={styles.logoIcon}>📊</span>
          <span style={styles.logoText}>协作演示编辑器</span>
        </div>

        <div style={styles.toolBar}>
          <button style={styles.toolBtn} onClick={() => handleAddElement('text')} title="添加文字">
            <span style={styles.toolIcon}>T</span>
            <span style={styles.toolLabel}>文字</span>
          </button>
          <button style={styles.toolBtn} onClick={() => handleAddElement('image')} title="添加图片">
            <span style={styles.toolIcon}>🖼️</span>
            <span style={styles.toolLabel}>图片</span>
          </button>
          <button
            style={styles.toolBtn}
            onClick={() => handleAddElement('shape', 'rectangle')}
            title="添加矩形"
          >
            <span style={styles.toolIcon}>▭</span>
            <span style={styles.toolLabel}>矩形</span>
          </button>
          <button
            style={styles.toolBtn}
            onClick={() => handleAddElement('shape', 'circle')}
            title="添加圆形"
          >
            <span style={styles.toolIcon}>○</span>
            <span style={styles.toolLabel}>圆形</span>
          </button>
          <button
            style={styles.toolBtn}
            onClick={() => handleAddElement('shape', 'triangle')}
            title="添加三角形"
          >
            <span style={styles.toolIcon}>△</span>
            <span style={styles.toolLabel}>三角</span>
          </button>
          <div style={styles.toolDivider} />
          <button
            style={{ ...styles.toolBtn, ...(selectedElementId ? {} : styles.toolBtnDisabled) }}
            onClick={handleDeleteElement}
            disabled={!selectedElementId}
            title="删除元素"
          >
            <span style={styles.toolIcon}>🗑️</span>
            <span style={styles.toolLabel}>删除</span>
          </button>
          <button
            style={{
              ...styles.toolBtn,
              ...(animationPanelOpen ? styles.toolBtnActive : {}),
            }}
            onClick={toggleAnimationPanel}
            title="动画配置"
          >
            <span style={styles.toolIcon}>✨</span>
            <span style={styles.toolLabel}>动画</span>
          </button>
        </div>

        <div style={styles.statusArea}>
          <div style={styles.connectionIndicator}>
            <div
              style={{
                ...styles.statusDot,
                backgroundColor: isConnected ? '#22C55E' : '#EF4444',
              }}
            />
            <span style={styles.statusText}>
              {isConnected ? '已连接' : '未连接'}
            </span>
          </div>
          {otherCollaborators.length > 0 && (
            <div style={styles.collaboratorsList}>
              {otherCollaborators.map((c) => (
                <div
                  key={c.id}
                  title={c.name}
                  style={{
                    ...styles.collaboratorAvatar,
                    backgroundColor: c.color,
                  }}
                >
                  {c.name.slice(-2)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={styles.mainArea}>
        <div style={styles.thumbnailPanel}>
          <div style={styles.thumbnailHeader}>
            <span style={styles.thumbnailTitle}>幻灯片</span>
            <button style={styles.addSlideBtn} onClick={handleAddSlide} title="添加幻灯片">
              +
            </button>
          </div>
          <div style={styles.thumbnailList}>
            {presentation.slides.map((slide, index) => (
              <div
                key={slide.id}
                onClick={() => handleSwitchSlide(slide.id)}
                style={{
                  ...styles.thumbnailCard,
                  ...(slide.id === presentation.currentSlideId
                    ? styles.thumbnailCardActive
                    : {}),
                }}
              >
                <div style={styles.thumbnailNumber}>{index + 1}</div>
                <div style={styles.thumbnailPreview}>
                  {slide.elements.length === 0 ? (
                    <div style={styles.thumbnailEmpty}>空</div>
                  ) : (
                    slide.elements.slice(0, 4).map((el) => (
                      <div
                        key={el.id}
                        style={{
                          position: 'absolute',
                          left: `${(el.x / 1280) * 100}%`,
                          top: `${(el.y / 720) * 100}%`,
                          width: `${(el.width / 1280) * 100}%`,
                          height: `${(el.height / 720) * 100}%`,
                          backgroundColor:
                            el.type === 'shape'
                              ? el.shapeType === 'rectangle'
                                ? '#3B82F6'
                                : el.shapeType === 'circle'
                                ? '#22C55E'
                                : '#EAB308'
                              : el.type === 'image'
                              ? '#9CA3AF'
                              : '#E5E7EB',
                          borderRadius: el.shapeType === 'circle' ? '50%' : 1,
                          overflow: 'hidden',
                        }}
                      >
                        {el.type === 'text' && (
                          <div
                            style={{
                              fontSize: 3,
                              color: '#1F2937',
                              padding: 1,
                              overflow: 'hidden',
                            }}
                          >
                            {el.content?.slice(0, 10)}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.canvasArea}>
          {currentSlide && (
            <SlideCanvas slide={currentSlide} collaborators={collaborators} />
          )}
        </div>

        <div
          style={{
            ...styles.animationPanel,
            ...(animationPanelOpen ? styles.animationPanelOpen : {}),
          }}
        >
          <div style={styles.animationPanelHeader}>
            <span style={styles.animationPanelTitle}>动画配置</span>
            <button style={styles.closeBtn} onClick={toggleAnimationPanel}>
              ×
            </button>
          </div>

          {!selectedElement ? (
            <div style={styles.noSelectionHint}>
              <div style={styles.noSelectionIcon}>👈</div>
              <p style={styles.noSelectionText}>请先在画布上选择一个元素</p>
            </div>
          ) : (
            <div style={styles.animationContent}>
              <div style={styles.selectedElementInfo}>
                <span style={styles.selectedElementLabel}>当前选中:</span>
                <span style={styles.selectedElementName}>
                  {selectedElement.type === 'text'
                    ? '文字'
                    : selectedElement.type === 'image'
                    ? '图片'
                    : selectedElement.shapeType === 'rectangle'
                    ? '矩形'
                    : selectedElement.shapeType === 'circle'
                    ? '圆形'
                    : '三角形'}
                </span>
              </div>

              <button style={styles.previewBtn} onClick={handlePreviewAnimation}>
                ▶ 预览动画
              </button>

              <div style={styles.animationSection}>
                <div style={styles.animationSectionHeader}>
                  <span style={styles.animationSectionTitle}>入场动画</span>
                  <button
                    style={styles.addAnimationBtn}
                    onClick={() => handleAddAnimation('entrance')}
                  >
                    + 添加
                  </button>
                </div>
                {selectedElement.animations
                  .filter((a) => a.phase === 'entrance')
                  .map((anim) => (
                    <div key={anim.id} style={styles.animationItem}>
                      <select
                        style={styles.animationSelect}
                        value={anim.type}
                        onChange={(e) =>
                          updateAnimation(currentSlide!.id, selectedElement.id, anim.id, {
                            type: e.target.value as AnimationType,
                          })
                        }
                      >
                        {ANIMATION_OPTIONS.filter((o) => !o.value.includes('Out')).map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <div style={styles.animationInputs}>
                        <label style={styles.inputLabel}>
                          <span style={styles.inputLabelText}>时长</span>
                          <input
                            type="number"
                            style={styles.numInput}
                            value={anim.duration}
                            min={100}
                            step={100}
                            onChange={(e) =>
                              updateAnimation(currentSlide!.id, selectedElement.id, anim.id, {
                                duration: Number(e.target.value),
                              })
                            }
                          />
                          <span style={styles.inputUnit}>ms</span>
                        </label>
                        <label style={styles.inputLabel}>
                          <span style={styles.inputLabelText}>延迟</span>
                          <input
                            type="number"
                            style={styles.numInput}
                            value={anim.delay}
                            min={0}
                            step={100}
                            onChange={(e) =>
                              updateAnimation(currentSlide!.id, selectedElement.id, anim.id, {
                                delay: Number(e.target.value),
                              })
                            }
                          />
                          <span style={styles.inputUnit}>ms</span>
                        </label>
                      </div>
                      <button
                        style={styles.deleteAnimBtn}
                        onClick={() =>
                          deleteAnimation(currentSlide!.id, selectedElement.id, anim.id)
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                {selectedElement.animations.filter((a) => a.phase === 'entrance').length === 0 && (
                  <div style={styles.noAnimationHint}>暂无入场动画</div>
                )}
              </div>

              <div style={styles.animationSection}>
                <div style={styles.animationSectionHeader}>
                  <span style={styles.animationSectionTitle}>退场动画</span>
                  <button
                    style={styles.addAnimationBtn}
                    onClick={() => handleAddAnimation('exit')}
                  >
                    + 添加
                  </button>
                </div>
                {selectedElement.animations
                  .filter((a) => a.phase === 'exit')
                  .map((anim) => (
                    <div key={anim.id} style={styles.animationItem}>
                      <select
                        style={styles.animationSelect}
                        value={anim.type}
                        onChange={(e) =>
                          updateAnimation(currentSlide!.id, selectedElement.id, anim.id, {
                            type: e.target.value as AnimationType,
                          })
                        }
                      >
                        {ANIMATION_OPTIONS.filter((o) => o.value.includes('Out') || o.value === 'fadeOut').map(
                          (opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          )
                        )}
                        {ANIMATION_OPTIONS.filter((o) => !o.value.includes('Out') && o.value !== 'fadeIn').map(
                          (opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          )
                        )}
                      </select>
                      <div style={styles.animationInputs}>
                        <label style={styles.inputLabel}>
                          <span style={styles.inputLabelText}>时长</span>
                          <input
                            type="number"
                            style={styles.numInput}
                            value={anim.duration}
                            min={100}
                            step={100}
                            onChange={(e) =>
                              updateAnimation(currentSlide!.id, selectedElement.id, anim.id, {
                                duration: Number(e.target.value),
                              })
                            }
                          />
                          <span style={styles.inputUnit}>ms</span>
                        </label>
                        <label style={styles.inputLabel}>
                          <span style={styles.inputLabelText}>延迟</span>
                          <input
                            type="number"
                            style={styles.numInput}
                            value={anim.delay}
                            min={0}
                            step={100}
                            onChange={(e) =>
                              updateAnimation(currentSlide!.id, selectedElement.id, anim.id, {
                                delay: Number(e.target.value),
                              })
                            }
                          />
                          <span style={styles.inputUnit}>ms</span>
                        </label>
                      </div>
                      <button
                        style={styles.deleteAnimBtn}
                        onClick={() =>
                          deleteAnimation(currentSlide!.id, selectedElement.id, anim.id)
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                {selectedElement.animations.filter((a) => a.phase === 'exit').length === 0 && (
                  <div style={styles.noAnimationHint}>暂无退场动画</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#FAFAFA',
  },
  topBar: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E5E7EB',
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    gap: 24,
    flexShrink: 0,
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    fontSize: 24,
  },
  logoText: {
    fontSize: 16,
    fontWeight: 600,
    color: '#1F2937',
  },
  toolBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  toolBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 12px',
    borderRadius: 8,
    backgroundColor: 'transparent',
    transition: 'all 0.2s ease-out',
    minWidth: 52,
    gap: 2,
  },
  toolBtnActive: {
    backgroundColor: '#EFF6FF',
    color: '#3B82F6',
  },
  toolBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  toolIcon: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: 600,
  },
  toolLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  toolDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E5E7EB',
    margin: '0 8px',
  },
  statusArea: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  connectionIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
  },
  collaboratorsList: {
    display: 'flex',
    gap: -4,
  },
  collaboratorAvatar: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 600,
    color: '#FFFFFF',
    border: '2px solid white',
    marginLeft: -6,
  },
  mainArea: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnailPanel: {
    width: 240,
    backgroundColor: '#F9FAFB',
    borderRight: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  thumbnailHeader: {
    padding: '16px 16px 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #E5E7EB',
  },
  thumbnailTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1F2937',
  },
  addSlideBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    fontSize: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease-out',
  },
  thumbnailList: {
    flex: 1,
    overflowY: 'auto',
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  thumbnailCard: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    border: '2px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  thumbnailCardActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  thumbnailNumber: {
    fontSize: 12,
    fontWeight: 600,
    color: '#6B7280',
    marginBottom: 6,
  },
  thumbnailPreview: {
    width: '100%',
    aspectRatio: '16 / 9',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    border: '1px solid #E5E7EB',
    position: 'relative',
    overflow: 'hidden',
  },
  thumbnailEmpty: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    color: '#9CA3AF',
  },
  canvasArea: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    overflow: 'auto',
    position: 'relative',
  },
  animationPanel: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 320,
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderLeft: '1px solid #E5E7EB',
    transform: 'translateX(100%)',
    transition: 'transform 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
    boxShadow: '-4px 0 20px rgba(0,0,0,0.06)',
  },
  animationPanelOpen: {
    transform: 'translateX(0)',
  },
  animationPanelHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #E5E7EB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  animationPanelTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#1F2937',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    color: '#6B7280',
    backgroundColor: 'transparent',
    transition: 'all 0.2s ease-out',
  },
  animationContent: {
    flex: 1,
    overflowY: 'auto',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  selectedElementInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 12px',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  selectedElementLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  selectedElementName: {
    fontSize: 13,
    fontWeight: 600,
    color: '#1F2937',
  },
  previewBtn: {
    padding: '10px 16px',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.2s ease-out',
  },
  animationSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  animationSectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  animationSectionTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
  },
  addAnimationBtn: {
    padding: '4px 10px',
    fontSize: 12,
    color: '#3B82F6',
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    transition: 'all 0.2s ease-out',
  },
  animationItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    border: '1px solid #E5E7EB',
  },
  animationSelect: {
    padding: '8px 10px',
    fontSize: 13,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    border: '1px solid #D1D5DB',
    borderRadius: 6,
    cursor: 'pointer',
  },
  animationInputs: {
    display: 'flex',
    gap: 8,
  },
  inputLabel: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  inputLabelText: {
    fontSize: 11,
    color: '#6B7280',
    whiteSpace: 'nowrap',
  },
  numInput: {
    flex: 1,
    padding: '6px 8px',
    fontSize: 12,
    border: '1px solid #D1D5DB',
    borderRadius: 4,
    width: 0,
    minWidth: 0,
  },
  inputUnit: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  deleteAnimBtn: {
    alignSelf: 'flex-end',
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#FEE2E2',
    color: '#EF4444',
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noAnimationHint: {
    padding: '12px',
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    border: '1px dashed #E5E7EB',
  },
  noSelectionHint: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  noSelectionIcon: {
    fontSize: 40,
  },
  noSelectionText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 1.5,
  },
};

export default Editor;
