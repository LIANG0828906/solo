import React, { useState, useRef, useMemo, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Project, Stage, PROJECT_TYPE_COLORS, STATUS_COLORS, STAGE_NAMES, Attachment } from '../types';
import { useAppStore } from '../store';

interface Props {
  project: Project;
  onClose: () => void;
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
const MAX_SIZE = 10 * 1024 * 1024;
const MAX_ATTACHMENTS = 5;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const ProjectDetail: React.FC<Props> = ({ project, onClose }) => {
  const { updateStageNotes, addAttachment, removeAttachment, confirmStage } = useAppStore();
  const [openStages, setOpenStages] = useState<Record<string, boolean>>(() => {
    const firstActive = project.stages.find((s) => s.status === 'active');
    return { [firstActive?.id ?? project.stages[0].id]: true };
  });
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const typeColor = PROJECT_TYPE_COLORS[project.projectType];
  const statusColor = STATUS_COLORS[project.status];

  const toggleStage = (id: string) => {
    setOpenStages((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleNotesChange = (stageId: string, value: string) => {
    const limited = value.slice(0, 200);
    updateStageNotes(project.id, stageId, limited);
  };

  const handleFileSelect = useCallback(async (stage: Stage, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    for (const file of arr) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert(`文件 "${file.name}" 格式不支持，仅支持 png/jpg/pdf`);
        continue;
      }
      if (file.size > MAX_SIZE) {
        alert(`文件 "${file.name}" 超过 10MB 上限`);
        continue;
      }
      if (stage.attachments.length >= MAX_ATTACHMENTS) {
        alert(`最多上传 ${MAX_ATTACHMENTS} 个附件`);
        break;
      }
      try {
        const dataUrl = await readFileAsDataUrl(file);
        const attach: Attachment = {
          id: uuidv4(),
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl,
        };
        addAttachment(project.id, stage.id, attach);
        stage = { ...stage, attachments: [...stage.attachments, attach] };
      } catch {
        alert(`读取文件 "${file.name}" 失败`);
      }
    }
    // reset input
    const input = fileInputRefs.current[stage.id];
    if (input) input.value = '';
  }, [project.id, addAttachment]);

  const handleConfirm = (stage: Stage) => {
    if (stage.confirmed) return;
    if (!window.confirm(`确认 "${stage.name}" 阶段已完成并通知客户吗？`)) return;
    confirmStage(project.id, stage.id);
  };

  const allDone = useMemo(() => project.stages.every((s) => s.confirmed), [project.stages]);

  const handleDownload = () => {
    const text = [
      `项目名称：${project.name}`,
      `项目类型：${project.projectType}`,
      `客户邮箱：${project.clientEmail}`,
      `预算：¥${project.budget}`,
      `截止日期：${project.deadline}`,
      '',
      '阶段确认状态：',
      ...project.stages.map((s, i) => `${i + 1}. ${s.name}：${s.confirmed ? '已确认' : '未确认'}`),
      '',
      '备注：',
      ...project.stages.flatMap((s) => (s.notes ? [`[${s.name}] ${s.notes}`] : [])),
    ].join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}-交付清单.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className={`overlay visible`} onClick={onClose} />
      <aside className="drawer open" role="dialog" aria-modal="true">
        <header className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="status-tag" style={{ background: statusColor }}>{project.status}</span>
            <h3>{project.name}</h3>
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="关闭">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="drawer-body">
          <div className="detail-meta">
            <div className="meta-item">
              <div className="k">项目类型</div>
              <div className="v" style={{ color: typeColor, fontWeight: 600 }}>{project.projectType}</div>
            </div>
            <div className="meta-item">
              <div className="k">预算</div>
              <div className="v">¥{project.budget.toLocaleString()}</div>
            </div>
            <div className="meta-item">
              <div className="k">客户邮箱</div>
              <div className="v">{project.clientEmail}</div>
            </div>
            <div className="meta-item">
              <div className="k">截止日期</div>
              <div className="v">{project.deadline}</div>
            </div>
          </div>

          <div className="progress-detail-wrap">
            <div className="bar">
              {project.stages.map((stage) => {
                let bg = 'var(--pending)';
                if (stage.confirmed) bg = typeColor;
                else if (stage.status === 'active') {
                  bg = `linear-gradient(90deg, ${typeColor} 0%, ${typeColor} 70%, ${typeColor}55 70%, var(--pending) 70%)`;
                }
                return (
                  <div
                    key={stage.id}
                    className="progress-segment"
                    style={{
                      background: bg,
                      borderRadius: 'var(--radius-progress)',
                    }}
                  />
                );
              })}
            </div>
            <div className="labels">
              {STAGE_NAMES.map((n) => <span key={n}>{n}</span>)}
            </div>
          </div>

          <div className="stages">
            {project.stages.map((stage) => {
              const isOpen = !!openStages[stage.id];
              const dotCls = stage.confirmed ? 'completed' : stage.status === 'active' ? 'active' : '';
              const blockCls = `${stage.status === 'active' ? 'active' : ''} ${isOpen ? 'open' : ''}`;
              return (
                <div key={stage.id} className={`stage-block ${blockCls}`}>
                  <div className="stage-head" onClick={() => toggleStage(stage.id)} role="button">
                    <div className={`stage-dot ${dotCls}`}>
                      {stage.confirmed ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <span>{stage.index + 1}</span>
                      )}
                    </div>
                    <div className="stage-title">{stage.name}</div>
                    <svg className="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>

                  <div className="stage-body">
                    <div className="stage-body-inner">
                      <div>
                        <div className="field-label">
                          <span>阶段备注</span>
                          <span className="counter">{stage.notes.length}/200</span>
                        </div>
                        <textarea
                          className="textarea"
                          value={stage.notes}
                          placeholder="记录本阶段的沟通要点、修改要求或创作思路…"
                          onChange={(e) => handleNotesChange(stage.id, e.target.value)}
                          disabled={stage.confirmed}
                        />
                      </div>

                      <div className="attachments-wrap">
                        <div className="field-label">
                          <span>附件（{stage.attachments.length}/{MAX_ATTACHMENTS}）</span>
                        </div>
                        <div className="attachments-grid">
                          {stage.attachments.map((att) => {
                            const isImg = att.type.startsWith('image/');
                            return (
                              <div
                                key={att.id}
                                className="attach-card"
                                onClick={() => {
                                  const w = window.open('', '_blank');
                                  if (w) {
                                    if (isImg) {
                                      w.document.write(`<img src="${att.dataUrl}" style="max-width:100%" />`);
                                    } else {
                                      w.document.write(`<iframe src="${att.dataUrl}" style="width:100%;height:100vh;border:0"></iframe>`);
                                    }
                                  }
                                }}
                                title={att.name}
                              >
                                {isImg ? (
                                  <img src={att.dataUrl} alt={att.name} />
                                ) : (
                                  <div className="icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                      <polyline points="14 2 14 8 20 8" />
                                    </svg>
                                  </div>
                                )}
                                <div className="name">{att.name}</div>
                                <button
                                  className="attach-remove"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeAttachment(project.id, stage.id, att.id);
                                  }}
                                  aria-label="删除附件"
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6 6 18M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            );
                          })}

                          {stage.attachments.length < MAX_ATTACHMENTS && !stage.confirmed && (
                            <label className="upload-btn">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" x2="12" y1="3" y2="15" />
                              </svg>
                              <span>上传</span>
                              <input
                                ref={(el) => { fileInputRefs.current[stage.id] = el; }}
                                type="file"
                                accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf"
                                multiple
                                onChange={(e) => handleFileSelect(stage, e.target.files)}
                              />
                            </label>
                          )}
                        </div>
                        <div className="upload-hint">支持 png/jpg/pdf，单个文件 ≤ 10MB，最多 {MAX_ATTACHMENTS} 个</div>
                      </div>

                      <div className="stage-actions">
                        <button
                          className="confirm-btn"
                          onClick={() => handleConfirm(stage)}
                          disabled={stage.confirmed || stage.status === 'pending'}
                          title={stage.status === 'pending' ? '请先完成上一阶段' : ''}
                        >
                          {stage.confirmed ? (
                            <>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              已确认
                            </>
                          ) : (
                            <>确认完成</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {allDone && (
            <div className="delivery-card">
              <h4>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  <path d="M8 10h.01M12 10h.01M16 10h.01" />
                </svg>
                终稿交付卡
              </h4>
              <ul className="delivery-list">
                {project.stages.map((s) => (
                  <li key={s.id}>
                    <span>{s.name}</span>
                    <span className="ok">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      已确认
                    </span>
                  </li>
                ))}
              </ul>
              <button className="download-btn" onClick={handleDownload}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" x2="12" y1="15" y2="3" />
                </svg>
                下载交付清单
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default ProjectDetail;
