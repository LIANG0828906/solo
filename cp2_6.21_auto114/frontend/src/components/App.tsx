import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { CanvasEngine } from '../moduleA/CanvasEngine';
import type { LayoutNode, LayoutRelation, MarkingRect } from '../types';
import { CollabClient } from '../services/collab';
import {
  createTree,
  generateShare,
  downloadExport,
  importFromFile,
  type ExportData,
} from '../services/api';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CanvasEngine | null>(null);
  const collabRef = useRef<CollabClient | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const connectFromRef = useRef<string | null>(null);
  const pendingMarkPhotoUrl = useRef<string | null>(null);

  const store = useStore();
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [pendingConnect, setPendingConnect] = useState<{
    fromId: string;
    toId: string;
  } | null>(null);
  const [connectType, setConnectType] = useState<'blood' | 'marriage'>('blood');
  const [connectLabel, setConnectLabel] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomeName, setWelcomeName] = useState('');

  const relayout = useCallback(() => {
    const { nodes, relations } = store.graph.layout();
    engineRef.current?.setLayout(nodes as LayoutNode[], relations as LayoutRelation[]);
  }, [store.graph]);

  const handleGraphChange = useCallback(() => {
    relayout();
    store.refreshState();
  }, [relayout, store]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new CanvasEngine(canvasRef.current, {
      readonly: store.isReadonly,
      onNodeClick: (id) => {
        store.selectNode(id);
      },
      onNodeDoubleClick: (id) => {
        store.toggleCollapse(id);
        handleGraphChange();
      },
      onCollapsedBoxClick: (id) => {
        store.toggleCollapse(id);
        handleGraphChange();
      },
      onConnectStart: (fromId) => {
        connectFromRef.current = fromId;
        engine.setConnecting(fromId);
      },
      onConnectEnd: (toId) => {
        engine.setConnecting(null);
        if (connectFromRef.current && toId) {
          setPendingConnect({
            fromId: connectFromRef.current,
            toId,
          });
          setConnectLabel('');
          setConnectType('blood');
          setShowConnectModal(true);
        }
        connectFromRef.current = null;
      },
      onMarkRect: (rect: MarkingRect) => {
        if (pendingMarkPhotoUrl.current) {
          const name = prompt('请输入该成员的姓名：', '新成员');
          if (name) {
            const node = store.addNode({
              name,
              photoUrl: pendingMarkPhotoUrl.current,
            });
            store.updateNode(node.id, {
              avatarCrop: {
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                w: Math.round(rect.w),
                h: Math.round(rect.h),
              },
            });
            engineRef.current?.invalidateImageCache(node.id);
            handleGraphChange();
          }
          store.setToolMode('select');
          engine.setMode('select');
          pendingMarkPhotoUrl.current = null;
        }
      },
      onCanvasMouseMove: (wx, wy) => {
        if (collabRef.current) {
          collabRef.current.sendCursor(wx, wy);
        }
      },
      onBackgroundClick: () => {
        store.selectNode(null);
      },
    });

    engineRef.current = engine;
    relayout();
    setTimeout(() => engine.centerOnContent(), 50);

    unsubscribeRef.current = store.graph.subscribe(() => {
      relayout();
      store.refreshState();
    });

    return () => {
      engine.destroy();
      unsubscribeRef.current?.();
      collabRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setMode(store.toolMode);
  }, [store.toolMode]);

  useEffect(() => {
    engineRef.current?.setSelectedNode(store.selectedNodeId);
  }, [store.selectedNodeId]);

  useEffect(() => {
    engineRef.current?.setCollaborators(store.collaborators);
  }, [store.collaborators]);

  useEffect(() => {
    engineRef.current?.setOptions({ readonly: store.isReadonly });
  }, [store.isReadonly]);

  useEffect(() => {
    relayout();
  }, [relayout]);

  const initCollab = useCallback(async () => {
    let treeId = store.treeId;
    if (!treeId) {
      const data = store.graph.serialize();
      const res = await createTree({
        name: store.treeName,
        nodes: data.nodes,
        relations: data.relations,
      });
      store.setTreeId(res.id);
      treeId = res.id;
    }
    if (collabRef.current) collabRef.current.disconnect();
    const uid = 'u-' + Math.random().toString(36).slice(2, 10);
    const client = new CollabClient(
      treeId,
      uid,
      store.currentUsername,
      store.currentUserColor,
      {
        onUserJoined: (userId, username, color) => {
          store.addCollaborator({
            id: userId,
            username,
            color,
            cursorX: 0,
            cursorY: 0,
          });
        },
        onUserLeft: (userId) => store.removeCollaborator(userId),
        onCursorUpdate: (userId, x, y) =>
          store.updateCollaboratorCursor(userId, x, y),
        onUsersList: (users) => {
          store.setCollaborators(
            users.map((u) => ({
              id: u.id,
              username: u.username,
              color: u.color,
              cursorX: 0,
              cursorY: 0,
            })),
          );
        },
        onNodeAdded: (node) => {
          store.graph['nodes'].set(node.id, { ...node });
          handleGraphChange();
        },
        onNodeUpdated: (id, changes) => {
          const n = store.graph.getNode(id);
          if (n) Object.assign(n, changes);
          handleGraphChange();
        },
        onNodeDeleted: (id) => {
          store.graph['nodes'].delete(id);
          const rels = store.graph.getRelations().filter(
            (r) => r.fromNodeId === id || r.toNodeId === id,
          );
          rels.forEach((r) => store.graph['relations'].delete(r.id));
          handleGraphChange();
        },
        onRelationAdded: (rel) => {
          store.graph['relations'].set(rel.id, { ...rel });
          handleGraphChange();
        },
        onRelationDeleted: (id) => {
          store.graph['relations'].delete(id);
          handleGraphChange();
        },
      },
    );
    client.connect();
    collabRef.current = client;
  }, [
    store,
    handleGraphChange,
  ]);

  useEffect(() => {
    if (!store.isReadonly && store.collaborators.length === 0) {
      // auto-init after short delay
      const t = setTimeout(() => initCollab(), 200);
      return () => clearTimeout(t);
    }
  }, [store.isReadonly, initCollab, store.collaborators.length]);

  const handleAddMember = () => {
    const name = newMemberName.trim();
    if (!name) return;
    const node = store.addNode({ name });
    setNewMemberName('');
    setShowAddMemberModal(false);
    handleGraphChange();
    collabRef.current?.sendNodeAdded({ ...node });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      pendingMarkPhotoUrl.current = url;
      store.setToolMode('mark');
      alert('请在画布上拖拽矩形框，标记该成员的头像位置');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleConfirmConnect = () => {
    if (!pendingConnect) return;
    const rel = store.addRelation({
      fromNodeId: pendingConnect.fromId,
      toNodeId: pendingConnect.toId,
      type: connectType,
      label: connectLabel.trim() || undefined,
    });
    setShowConnectModal(false);
    setPendingConnect(null);
    store.setToolMode('select');
    handleGraphChange();
    if (rel) collabRef.current?.sendRelationAdded({ ...rel });
  };

  const handleExport = () => {
    const data = store.graph.serialize();
    const exp: ExportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      name: store.treeName,
      nodes: data.nodes,
      relations: data.relations,
      stats: store.stats,
    };
    downloadExport(exp, `${store.treeName || 'family-tree'}.json`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await importFromFile(file);
      store.loadData(res.nodes, res.relations);
      if (res.name) store.setTreeName(res.name);
      handleGraphChange();
      setTimeout(() => engineRef.current?.centerOnContent(), 50);
    } catch (err) {
      store.setError('导入失败：文件格式不正确');
      setTimeout(() => store.setError(null), 3000);
    }
    e.target.value = '';
  };

  const handleShare = async () => {
    let treeId = store.treeId;
    if (!treeId) {
      const data = store.graph.serialize();
      const res = await createTree({
        name: store.treeName,
        nodes: data.nodes,
        relations: data.relations,
      });
      store.setTreeId(res.id);
      treeId = res.id;
    }
    const info = await generateShare(treeId);
    if (info) {
      const mergedInfo = {
        ...info,
        stats: store.stats,
      };
      store.setShareInfo(mergedInfo);
      store.setShowShareModal(true);
    }
  };

  const handleDeleteSelected = () => {
    const id = store.selectedNodeId;
    if (!id) return;
    if (!confirm('确认删除该成员及其关联的连线吗？')) return;
    store.removeNode(id);
    handleGraphChange();
    collabRef.current?.sendNodeDeleted(id);
  };

  const handleCenter = () => {
    engineRef.current?.centerOnContent();
  };

  const handleUndo = () => {
    store.undo();
    handleGraphChange();
  };

  const handleRedo = () => {
    store.redo();
    handleGraphChange();
  };

  const selectedNode = store.selectedNodeId
    ? store.graph.getNode(store.selectedNodeId)
    : null;

  const handleWelcomeConfirm = () => {
    const name = welcomeName.trim();
    if (name) {
      store.setUsername(name);
    }
    setShowWelcome(false);
  };

  return (
    <div className={`app-root ${store.isReadonly ? 'readonly-mode' : ''}`}>
      <div className="toolbar">
        <div className="toolbar-title">🌳 {store.treeName}</div>

        {!store.isReadonly && (
          <>
            <button
              className="toolbar-btn"
              onClick={() => setShowAddMemberModal(true)}
            >
              <span>➕</span>
              <span className="btn-text">添加成员</span>
            </button>
            <button
              className={`toolbar-btn ${store.toolMode === 'connect' ? 'active' : ''}`}
              onClick={() =>
                store.setToolMode(store.toolMode === 'connect' ? 'select' : 'connect')
              }
            >
              <span>🔗</span>
              <span className="btn-text">连线模式</span>
            </button>
            <button
              className="toolbar-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <span>📷</span>
              <span className="btn-text">标记照片</span>
            </button>
            <button
              className="toolbar-btn"
              onClick={() => importInputRef.current?.click()}
            >
              <span>📂</span>
              <span className="btn-text">导入JSON</span>
            </button>
            <div className="toolbar-separator" />
            <button
              className="toolbar-btn"
              onClick={handleUndo}
              disabled={!store.canUndo}
            >
              <span>↩️</span>
              <span className="btn-text">撤销</span>
            </button>
            <button
              className="toolbar-btn"
              onClick={handleRedo}
              disabled={!store.canRedo}
            >
              <span>↪️</span>
              <span className="btn-text">重做</span>
            </button>
            <div className="toolbar-separator" />
          </>
        )}

        <button className="toolbar-btn" onClick={handleCenter}>
          <span>🎯</span>
          <span className="btn-text">居中</span>
        </button>

        <button className="toolbar-btn export-btn" onClick={handleExport}>
          <span>💾</span>
          <span className="btn-text">导出JSON</span>
        </button>
        <button className="toolbar-btn" onClick={handleShare}>
          <span>🔗</span>
          <span className="btn-text">分享</span>
        </button>

        <div className="toolbar-spacer" />

        <div className="stats-badge">
          👥 <strong>{store.stats.totalMembers}</strong> 成员
        </div>
        <div className="stats-badge">
          📜 <strong>{store.stats.generations}</strong> 代
        </div>

        {!store.isReadonly && store.collaborators.length > 0 && (
          <div className="user-list">
            {store.collaborators.slice(0, 4).map((c) => (
              <div className="user-chip" key={c.id} title={c.username}>
                <span className="user-dot" style={{ background: c.color }} />
                <span>{c.username.slice(0, 6)}</span>
              </div>
            ))}
            {store.collaborators.length > 4 && (
              <div className="user-chip">
                <span className="user-dot" style={{ background: '#888' }} />
                <span>+{store.collaborators.length - 4}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="canvas-container">
        <canvas ref={canvasRef} className="family-canvas" />
        {store.isReadonly && (
          <div className="read-only-watermark">只读预览 · READ ONLY</div>
        )}
        {store.error && (
          <div
            style={{
              position: 'absolute',
              top: 80,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '12px 24px',
              background: '#fff5f5',
              border: '1.5px solid #c0392b',
              borderRadius: 8,
              color: '#c0392b',
              zIndex: 100,
              boxShadow: '0 4px 16px rgba(192,57,43,0.15)',
            }}
          >
            ⚠️ {store.error}
          </div>
        )}
      </div>

      {!store.isReadonly && (
        <div className="properties-panel">
          <div className="panel-header">
            <div className="panel-title">属性面板</div>
          </div>
          <div className="panel-body">
            {selectedNode ? (
              <>
                <div className="panel-section">
                  <div className="panel-section-title">成员信息</div>
                  <div className="form-group">
                    <label className="form-label">姓名</label>
                    <input
                      className="form-input"
                      type="text"
                      value={selectedNode.name}
                      onChange={(e) => {
                        const changes = { name: e.target.value };
                        store.updateNode(selectedNode.id, changes);
                        engineRef.current?.invalidateImageCache(selectedNode.id);
                        collabRef.current?.sendNodeUpdated(selectedNode.id, changes);
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">世代</label>
                    <input
                      className="form-input"
                      type="number"
                      min={0}
                      value={selectedNode.generation}
                      onChange={(e) => {
                        const changes = {
                          generation: parseInt(e.target.value) || 0,
                        };
                        store.updateNode(selectedNode.id, changes);
                        collabRef.current?.sendNodeUpdated(selectedNode.id, changes);
                        handleGraphChange();
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">照片</label>
                    <div
                      className={`upload-area ${selectedNode.photoUrl ? 'has-image' : ''}`}
                      onClick={() => {
                        const inp = document.createElement('input');
                        inp.type = 'file';
                        inp.accept = 'image/*';
                        inp.onchange = (ev: any) => {
                          const f = ev.target.files?.[0];
                          if (!f) return;
                          const r = new FileReader();
                          r.onload = () => {
                            const url = r.result as string;
                            const changes = { photoUrl: url };
                            store.updateNode(selectedNode.id, changes);
                            engineRef.current?.invalidateImageCache(selectedNode.id);
                            collabRef.current?.sendNodeUpdated(selectedNode.id, changes);
                          };
                          r.readAsDataURL(f);
                        };
                        inp.click();
                      }}
                    >
                      {selectedNode.photoUrl ? (
                        <img
                          src={selectedNode.photoUrl}
                          alt="成员照片"
                          className="upload-preview"
                        />
                      ) : (
                        <>
                          <div style={{ fontSize: 32 }}>🖼️</div>
                          <div className="upload-hint">点击上传照片</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="panel-section">
                  <div className="panel-section-title">显示设置</div>
                  <div className="form-group">
                    <label className="form-label">
                      <input
                        type="checkbox"
                        checked={selectedNode.isCollapsed}
                        style={{ marginRight: 8 }}
                        onChange={(e) => {
                          store.toggleCollapse(selectedNode.id);
                          handleGraphChange();
                        }}
                      />
                      折叠其后代分支
                    </label>
                  </div>
                </div>

                <div className="panel-section">
                  <div className="panel-section-title">关联关系</div>
                  <div style={{ fontSize: 13, color: '#7a6a5c', lineHeight: 1.8 }}>
                    <div>
                      🧑‍👦 子女：
                      <strong style={{ color: '#4a3728' }}>
                        {selectedNode.childrenIds.length} 人
                      </strong>
                    </div>
                    <div>
                      👨‍👩‍👧 父母：
                      <strong style={{ color: '#4a3728' }}>
                        {selectedNode.parentIds.length} 人
                      </strong>
                    </div>
                  </div>
                </div>

                <button
                  className="toolbar-btn delete-btn"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={handleDeleteSelected}
                >
                  🗑️ 删除该成员
                </button>
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">👆</div>
                <div className="empty-state-text">
                  点击画布中的某个成员节点
                  <br />
                  即可在此编辑其信息
                  <br />
                  <br />
                  <strong>使用提示：</strong>
                  <br />
                  • 双击节点可折叠/展开分支
                  <br />
                  • 滚轮缩放 · 拖拽平移画布
                  <br />
                  • 连线模式下从父节点拖到子节点
                  <br />
                  • 标记照片可上传合照并框选头像
                </div>
              </div>
            )}

            {store.collaborators.length > 0 && (
              <div className="panel-section" style={{ marginTop: 24 }}>
                <div className="panel-section-title">协同用户</div>
                <div className="user-list" style={{ gap: 6 }}>
                  {store.collaborators.map((c) => (
                    <div className="user-chip" key={c.id}>
                      <span className="user-dot" style={{ background: c.color }} />
                      <span>{c.username}</span>
                    </div>
                  ))}
                  <div className="user-chip">
                    <span
                      className="user-dot"
                      style={{ background: store.currentUserColor }}
                    />
                    <span>我（{store.currentUsername}）</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handlePhotoUpload}
      />
      <input
        ref={importInputRef}
        type="file"
        accept="application/json"
        style={{ display: 'none' }}
        onChange={handleImport}
      />

      {showAddMemberModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowAddMemberModal(false)}
        >
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">➕ 添加新成员</div>
            <div className="form-group">
              <label className="form-label">姓名</label>
              <input
                className="form-input"
                type="text"
                placeholder="请输入成员姓名"
                autoFocus
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
              />
            </div>
            <div className="modal-actions">
              <button
                className="toolbar-btn"
                onClick={() => setShowAddMemberModal(false)}
              >
                取消
              </button>
              <button
                className="toolbar-btn active"
                onClick={handleAddMember}
                disabled={!newMemberName.trim()}
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}

      {showConnectModal && pendingConnect && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowConnectModal(false);
            setPendingConnect(null);
          }}
        >
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">🔗 建立关系</div>
            <div style={{ marginBottom: 16, fontSize: 14, color: '#7a6a5c' }}>
              从{' '}
              <strong style={{ color: '#4a3728' }}>
                {store.graph.getNode(pendingConnect.fromId)?.name}
              </strong>{' '}
              →{' '}
              <strong style={{ color: '#4a3728' }}>
                {store.graph.getNode(pendingConnect.toId)?.name}
              </strong>
            </div>
            <div className="form-group">
              <label className="form-label">关系类型</label>
              <select
                className="form-select"
                value={connectType}
                onChange={(e) => setConnectType(e.target.value as any)}
              >
                <option value="blood">🩸 血亲（父母→子女）</option>
                <option value="marriage">💍 姻亲（配偶）</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">文字说明（可选）</label>
              <input
                className="form-input"
                type="text"
                placeholder="如：长子、次子、配偶..."
                value={connectLabel}
                onChange={(e) => setConnectLabel(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button
                className="toolbar-btn"
                onClick={() => {
                  setShowConnectModal(false);
                  setPendingConnect(null);
                }}
              >
                取消
              </button>
              <button className="toolbar-btn active" onClick={handleConfirmConnect}>
                确认连线
              </button>
            </div>
          </div>
        </div>
      )}

      {store.showShareModal && store.shareInfo && (
        <div
          className="modal-overlay"
          onClick={() => store.setShowShareModal(false)}
        >
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">🔗 分享家谱</div>
            <div style={{ marginBottom: 20 }}>
              <div className="stats-badge" style={{ marginBottom: 8, display: 'inline-flex' }}>
                👥 <strong>{store.shareInfo.stats.totalMembers}</strong> 位成员
              </div>
              <div
                className="stats-badge"
                style={{ marginBottom: 8, display: 'inline-flex', marginLeft: 8 }}
              >
                📜 <strong>{store.shareInfo.stats.generations}</strong> 代人
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">只读分享链接</label>
              <div className="share-url-box">
                <input
                  className="form-input"
                  type="text"
                  readOnly
                  value={store.shareInfo.shareUrl}
                />
                <button
                  className="toolbar-btn copy-btn"
                  onClick={() => {
                    navigator.clipboard
                      ?.writeText(store.shareInfo!.shareUrl)
                      .then(() => alert('链接已复制到剪贴板！'));
                  }}
                >
                  📋 复制
                </button>
              </div>
              <div className="upload-hint">
                将此链接发送给他人，对方可在只读模式下查看家谱
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="toolbar-btn active"
                onClick={() => store.setShowShareModal(false)}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {showWelcome && !store.isReadonly && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-title">🌳 欢迎使用家谱图谱</div>
            <div className="empty-state-text" style={{ textAlign: 'left', marginBottom: 20 }}>
              创建您的家族数字家谱，记录代代相传的亲情脉络。
              <br />
              <br />
              <strong>💡 核心功能：</strong>
              <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
                <li>📷 上传合照，框选头像批量标记成员</li>
                <li>🔗 拖拽连线建立亲子/姻亲关系</li>
                <li>🎯 滚轮缩放、拖拽平移，轻松浏览大家庭</li>
                <li>💾 导出JSON · 🔗 分享只读链接给亲友</li>
                <li>👥 最多5人同时协同编辑</li>
              </ul>
            </div>
            <div className="form-group">
              <label className="form-label">请输入您的昵称（用于协同编辑）</label>
              <input
                className="form-input"
                type="text"
                placeholder="如：张伟、小明..."
                value={welcomeName}
                onChange={(e) => setWelcomeName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleWelcomeConfirm()}
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button className="toolbar-btn active" onClick={handleWelcomeConfirm}>
                开始创建家谱 →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
