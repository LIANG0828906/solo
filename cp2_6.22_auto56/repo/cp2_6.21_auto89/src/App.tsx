import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import * as api from './services/api';
import { MemberData, EventData, RelationData, StatsData } from './services/api';
import {
  transformMembersToGraphNodes,
  transformRelationsToEdges,
  transformEventsToTimeline,
  getGenderColor,
  getNameAbbreviation,
} from './utils/dataTransform';
import RelationGraph from './components/RelationGraph';
import TimelineMap from './components/TimelineMap';
import StatsCharts from './components/StatsCharts';

type ModalType =
  | null
  | 'addMember'
  | 'addEvent'
  | 'selectRelation'
  | 'editRelation'
  | 'statsDetail'
  | 'eventDetail'
  | 'import';

interface ContextMenu {
  visible: boolean;
  x: number;
  y: number;
  relationId: string | null;
}

interface AlertState {
  visible: boolean;
  message: string;
  type: 'error' | 'success';
}

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [members, setMembers] = useState<MemberData[]>([]);
  const [events, setEvents] = useState<EventData[]>([]);
  const [relations, setRelations] = useState<RelationData[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const [modalType, setModalType] = useState<ModalType>(null);
  const [relationFromId, setRelationFromId] = useState<string | null>(null);
  const [relationToId, setRelationToId] = useState<string | null>(null);
  const [editingRelationId, setEditingRelationId] = useState<string | null>(null);

  const [contextMenu, setContextMenu] = useState<ContextMenu>({ visible: false, x: 0, y: 0, relationId: null });
  const [alert, setAlert] = useState<AlertState>({ visible: false, message: '', type: 'error' });

  const [newMember, setNewMember] = useState({
    name: '',
    birth_year: 1980,
    death_year: '' as string | number,
    gender: '男',
    role: '',
  });

  const [newEvent, setNewEvent] = useState({
    name: '',
    year: 2000,
    event_type: '工作',
    description: '',
  });

  const [customRelationName, setCustomRelationName] = useState('');
  const [customRelationTriggered, setCustomRelationTriggered] = useState(false);
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [yearScale, setYearScale] = useState(80);

  const relationGraphRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [graphSize, setGraphSize] = useState({ width: 600, height: 400 });
  const [timelineSize, setTimelineSize] = useState({ width: 600, height: 300 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadStats, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (events.length > 0 || members.length > 0) {
      loadStats();
    }
  }, [members.length, events.length, relations.length]);

  useEffect(() => {
    const handleResize = () => {
      if (relationGraphRef.current) {
        setGraphSize({
          width: relationGraphRef.current.clientWidth,
          height: relationGraphRef.current.clientHeight,
        });
      }
      if (timelineRef.current) {
        setTimelineSize({
          width: timelineRef.current.clientWidth,
          height: timelineRef.current.clientHeight,
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (relationGraphRef.current) {
        setGraphSize({
          width: relationGraphRef.current.clientWidth,
          height: relationGraphRef.current.clientHeight,
        });
      }
      if (timelineRef.current) {
        setTimelineSize({
          width: timelineRef.current.clientWidth,
          height: timelineRef.current.clientHeight,
        });
      }
    });
    if (relationGraphRef.current) observer.observe(relationGraphRef.current);
    if (timelineRef.current) observer.observe(timelineRef.current);
    return () => observer.disconnect();
  }, []);

  const showAlert = useCallback((message: string, type: 'error' | 'success' = 'error') => {
    setAlert({ visible: true, message, type });
    setTimeout(() => setAlert((a) => ({ ...a, visible: false })), 5000);
  }, []);

  const loadData = async () => {
    try {
      const [membersRes, eventsRes] = await Promise.all([
        api.getMembers(),
        api.getEvents(),
      ]);
      setMembers(membersRes.members);
      setRelations(membersRes.relations);
      setEvents(eventsRes.events);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const loadStats = async () => {
    try {
      const statsRes = await api.getStats();
      setStats(statsRes);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleStatClick = useCallback(() => {
    setModalType('statsDetail');
  }, []);

  const handleAddMember = async () => {
    if (!newMember.name.trim()) {
      showAlert('请输入成员姓名');
      return;
    }
    if (newMember.birth_year < 1900 || newMember.birth_year > 2023) {
      showAlert('出生年份必须在1900-2023之间');
      return;
    }
    const id = `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    try {
      const member: MemberData = {
        id,
        name: newMember.name.trim(),
        birth_year: Number(newMember.birth_year),
        death_year: newMember.death_year ? Number(newMember.death_year) : null,
        gender: newMember.gender || null,
        role: newMember.role.trim() || null,
        x: 0,
        y: 0,
      };
      await api.addMember(member);
      setMembers((prev) => [...prev, member]);
      setModalType(null);
      setNewMember({ name: '', birth_year: 1980, death_year: '', gender: '男', role: '' });
      showAlert('成员添加成功', 'success');
    } catch (err) {
      showAlert('添加成员失败');
    }
  };

  const handleAddEvent = async () => {
    if (!selectedMemberId) return;
    if (!newEvent.name.trim()) {
      showAlert('请输入事件名称');
      return;
    }
    if (newEvent.year < 1900 || newEvent.year > 2030) {
      showAlert('事件年份必须在1900-2030之间');
      return;
    }
    try {
      const result = await api.addEvent({
        member_id: selectedMemberId,
        name: newEvent.name.trim(),
        year: Number(newEvent.year),
        event_type: newEvent.event_type,
        description: newEvent.description.trim() || undefined,
      });
      setEvents((prev) => [...prev, result]);
      setModalType(null);
      setNewEvent({ name: '', year: 2000, event_type: '工作', description: '' });
      showAlert('事件添加成功', 'success');
    } catch (err) {
      showAlert('添加事件失败');
    }
  };

  const handleNodeDragEnd = async (memberId: string, x: number, y: number) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, x, y } : m))
    );
    try {
      await api.updateMemberPosition(memberId, x, y);
    } catch (err) {
      console.error('Failed to update position:', err);
    }
  };

  const handleCreateRelation = (fromId: string, toId: string) => {
    setRelationFromId(fromId);
    setRelationToId(toId);
    setCustomRelationName('');
    setCustomRelationTriggered(false);
    setModalType('selectRelation');
  };

  const handleConfirmRelation = async (type: string) => {
    if (!relationFromId || !relationToId) return;
    if (type === '自定义') {
      setCustomRelationTriggered(true);
      return;
    }
    try {
      const result = await api.addRelation({
        from_member_id: relationFromId,
        to_member_id: relationToId,
        relation_type: type,
      });
      setRelations((prev) => [...prev, result]);
      setModalType(null);
      setRelationFromId(null);
      setRelationToId(null);
      setCustomRelationTriggered(false);
      showAlert('关系已创建', 'success');
    } catch (err) {
      showAlert('创建关系失败：可能已存在');
    }
  };

  const handleConfirmCustomRelation = async () => {
    if (!relationFromId || !relationToId) return;
    const relType = customRelationName.trim();
    if (!relType) {
      showAlert('请输入自定义关系名称');
      return;
    }
    try {
      const result = await api.addRelation({
        from_member_id: relationFromId,
        to_member_id: relationToId,
        relation_type: relType,
      });
      setRelations((prev) => [...prev, result]);
      setModalType(null);
      setRelationFromId(null);
      setRelationToId(null);
      setCustomRelationName('');
      setCustomRelationTriggered(false);
      showAlert('关系已创建', 'success');
    } catch (err) {
      showAlert('创建关系失败：可能已存在');
    }
  };

  const handleUpdateRelationControl = async (relationId: string, cx: number, cy: number) => {
    setRelations((prev) =>
      prev.map((r) => (r.id === relationId ? { ...r, control_x: cx, control_y: cy } : r))
    );
    try {
      await api.updateRelation(relationId, { control_x: cx, control_y: cy });
    } catch (err) {
      console.error('Failed to update relation control:', err);
    }
  };

  const handleContextMenuRelation = (relationId: string, x: number, y: number) => {
    setContextMenu({ visible: true, x, y, relationId });
  };

  const handleEditRelation = () => {
    if (!contextMenu.relationId) return;
    setEditingRelationId(contextMenu.relationId);
    const rel = relations.find((r) => r.id === contextMenu.relationId);
    setCustomRelationName(rel?.relation_type || '');
    setContextMenu({ visible: false, x: 0, y: 0, relationId: null });
    setModalType('editRelation');
  };

  const handleSaveEditRelation = async () => {
    if (!editingRelationId) return;
    if (!customRelationName.trim()) {
      showAlert('请输入关系名称');
      return;
    }
    try {
      await api.updateRelation(editingRelationId, { relation_type: customRelationName.trim() });
      setRelations((prev) =>
        prev.map((r) => (r.id === editingRelationId ? { ...r, relation_type: customRelationName.trim() } : r))
      );
      setModalType(null);
      setEditingRelationId(null);
      showAlert('关系已更新', 'success');
    } catch (err) {
      showAlert('更新关系失败');
    }
  };

  const handleDeleteRelation = async () => {
    if (!contextMenu.relationId) return;
    try {
      await api.deleteRelation(contextMenu.relationId);
      setRelations((prev) => prev.filter((r) => r.id !== contextMenu.relationId));
      setContextMenu({ visible: false, x: 0, y: 0, relationId: null });
      showAlert('关系已删除', 'success');
    } catch (err) {
      showAlert('删除关系失败');
    }
  };

  const handleExport = async () => {
    try {
      const data = await api.exportData();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `family-history-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showAlert('数据导出成功', 'success');
    } catch (err) {
      showAlert('导出失败');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const validateImportData = (data: any): { valid: boolean; error?: string } => {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: '数据格式错误：不是有效的JSON对象' };
    }
    if (!data.version) {
      return { valid: false, error: '数据结构不合法：缺少 version 字段' };
    }
    if (!data.members || !Array.isArray(data.members)) {
      return { valid: false, error: '数据结构不合法：缺少或无效的 members 字段' };
    }
    if (!data.events || !Array.isArray(data.events)) {
      return { valid: false, error: '数据结构不合法：缺少或无效的 events 字段' };
    }

    for (let i = 0; i < data.members.length; i++) {
      const m = data.members[i];
      if (!m.id || typeof m.id !== 'string') {
        return { valid: false, error: `数据不合法：第 ${i + 1} 个成员缺少有效 id` };
      }
      if (!m.name || typeof m.name !== 'string') {
        return { valid: false, error: `数据不合法：成员 ${m.id || `#${i + 1}`} 缺少姓名字段` };
      }
      if (m.birth_year === undefined || m.birth_year === null || typeof m.birth_year !== 'number') {
        return { valid: false, error: `数据不合法：成员 ${m.name} 缺少有效出生年份` };
      }
      if (m.birth_year < 1900 || m.birth_year > 2023) {
        return { valid: false, error: `成员 ${m.name} 的出生年份 (${m.birth_year}) 超出合理范围 (1900-2023)` };
      }
      if (m.death_year !== undefined && m.death_year !== null) {
        if (typeof m.death_year !== 'number') {
          return { valid: false, error: `成员 ${m.name} 的死亡年份格式无效` };
        }
        if (m.death_year < 1900 || m.death_year > 2030) {
          return { valid: false, error: `成员 ${m.name} 的死亡年份 (${m.death_year}) 超出合理范围 (1900-2030)` };
        }
        if (m.death_year < m.birth_year) {
          return { valid: false, error: `成员 ${m.name} 的死亡年份早于出生年份` };
        }
      }
    }

    for (let i = 0; i < data.events.length; i++) {
      const ev = data.events[i];
      if (!ev.id || typeof ev.id !== 'string') {
        return { valid: false, error: `数据不合法：第 ${i + 1} 个事件缺少有效 id` };
      }
      if (!ev.member_id || typeof ev.member_id !== 'string') {
        return { valid: false, error: `数据不合法：事件 ${ev.id || `#${i + 1}`} 缺少关联成员 ID` };
      }
      const memberExists = data.members.some((m: MemberData) => m.id === ev.member_id);
      if (!memberExists) {
        return { valid: false, error: `事件 ${ev.name || ev.id} 引用了不存在的成员 ID: ${ev.member_id}` };
      }
      if (!ev.name || typeof ev.name !== 'string') {
        return { valid: false, error: `数据不合法：事件 ${ev.id || `#${i + 1}`} 缺少名称字段` };
      }
      if (ev.year === undefined || ev.year === null || typeof ev.year !== 'number') {
        return { valid: false, error: `数据不合法：事件 ${ev.name} 缺少有效年份` };
      }
      if (ev.year < 1900 || ev.year > 2030) {
        return { valid: false, error: `事件 ${ev.name} 的年份 (${ev.year}) 超出合理范围 (1900-2030)` };
      }
    }

    if (data.relations && !Array.isArray(data.relations)) {
      return { valid: false, error: '数据结构不合法：relations 字段不是数组' };
    }

    return { valid: true };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      showAlert('请选择 .json 格式的文件');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const content = evt.target?.result as string;
        let parsed;
        try {
          parsed = JSON.parse(content);
        } catch (parseErr) {
          showAlert('解析 JSON 文件失败：文件格式不正确');
          return;
        }

        const validation = validateImportData(parsed);
        if (!validation.valid) {
          showAlert(validation.error || '数据校验失败');
          return;
        }

        const result = await api.importData(parsed);
        await loadData();
        showAlert(`导入成功：${result.members_count} 个成员，${result.events_count} 条事件`, 'success');
      } catch (err) {
        showAlert('导入数据时发生未知错误');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const selectedMember = members.find((m) => m.id === selectedMemberId) || null;
  const selectedEvents = events.filter((e) => e.member_id === selectedMemberId);
  const selectedEvent = events.find((e) => e.id === selectedEventId) || null;

  const minYear = events.length > 0
    ? Math.min(...events.map((e) => e.year), ...members.map((m) => m.birth_year))
    : 1900;
  const maxYear = events.length > 0
    ? Math.max(
        ...events.map((e) => e.year),
        ...members.map((m) => m.death_year || 2024)
      )
    : 2030;

  const graphNodes = transformMembersToGraphNodes(members, events, graphSize.width, graphSize.height);
  const graphEdges = transformRelationsToEdges(relations, graphNodes);
  const timelineNodes = transformEventsToTimeline(
    events,
    members,
    minYear,
    maxYear,
    timelineSize.width,
    timelineSize.height,
    yearScale
  );

  const relationTypes = ['父子', '夫妻', '兄弟姐妹', '其他亲戚', '自定义'];

  const getEventClass = (type: string) => {
    const map: Record<string, string> = {
      出生: 'birth',
      入学: 'education',
      工作: 'work',
      结婚: 'marriage',
      获奖: 'award',
    };
    return map[type] || 'other';
  };

  const LeftPanel: React.FC = () => (
    <div className={`left-panel ${leftDrawerOpen ? 'open' : ''}`}>
      <div className="left-panel-header">
        <h3>👨‍👩‍👧‍👦 家族成员</h3>
        <button
          className="btn btn-primary"
          style={{ padding: '4px 10px', fontSize: 12 }}
          onClick={() => setModalType('addMember')}
        >
          + 添加
        </button>
      </div>
      <div className="member-list">
        {members.length === 0 && (
          <div className="empty-hint">暂无成员，点击右上角添加</div>
        )}
        {members.map((member) => {
          const yearStr = member.death_year
            ? `${member.birth_year} - ${member.death_year}`
            : `${member.birth_year} - 至今`;
          return (
            <Link
              key={member.id}
              to={`/member/${member.id}`}
              style={{ textDecoration: 'none' }}
              onClick={() => {
                setSelectedMemberId(member.id);
                setLeftDrawerOpen(false);
              }}
            >
              <div className={`member-item ${selectedMemberId === member.id ? 'selected' : ''}`}>
                <div
                  className="member-avatar"
                  style={{ backgroundColor: getGenderColor(member.gender) }}
                >
                  {getNameAbbreviation(member.name)}
                </div>
                <div className="member-info">
                  <div className="member-name">{member.name}</div>
                  <div className="member-years">
                    {member.role ? `${member.role} · ` : ''}{yearStr}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );

  const CenterArea: React.FC = () => (
    <div className="center-area">
      <Link to="/graph" style={{ textDecoration: 'none' }}>
        <div className="relation-graph-container" ref={relationGraphRef}>
          <RelationGraph
            nodes={graphNodes}
            edges={graphEdges}
            selectedMemberId={selectedMemberId}
            onSelectMember={(id) => {
              setSelectedMemberId(id);
              if (id) navigate(`/member/${id}`);
            }}
            onNodeDragEnd={handleNodeDragEnd}
            onCreateRelation={handleCreateRelation}
            onUpdateRelationControl={handleUpdateRelationControl}
            onContextMenuRelation={handleContextMenuRelation}
            width={graphSize.width}
            height={graphSize.height}
          />
        </div>
      </Link>
      <Link to="/timeline" style={{ textDecoration: 'none' }}>
        <div className="timeline-container" ref={timelineRef}>
          <TimelineMap
            nodes={timelineNodes}
            rawEvents={events}
            rawMembers={members}
            minYear={minYear}
            maxYear={maxYear}
            width={timelineSize.width}
            height={timelineSize.height}
            onSelectEvent={(e) => {
              if (e) {
                setSelectedEventId(e.id);
                setSelectedMemberId(e.member_id);
                setModalType('eventDetail');
                navigate(`/member/${e.member_id}`);
              }
            }}
          />
        </div>
      </Link>
    </div>
  );

  const RightPanel: React.FC = () => (
    <div className="right-panel">
      {selectedMember ? (
        <>
          <div className="right-panel-header">
            <h3>{selectedMember.name}</h3>
            <div className="member-detail">
              {selectedMember.role && `${selectedMember.role} · `}
              {selectedMember.gender && `${selectedMember.gender} · `}
              {selectedMember.birth_year}
              {selectedMember.death_year ? ` - ${selectedMember.death_year}` : ' - 至今'}
            </div>
          </div>
          <div className="add-event-section">
            <button className="add-event-btn" onClick={() => setModalType('addEvent')}>
              + 添加生平事件
            </button>
          </div>
          <div className="events-list">
            {selectedEvents.length === 0 && (
              <div className="empty-hint">暂无事件记录</div>
            )}
            {selectedEvents
              .sort((a, b) => a.year - b.year)
              .map((event) => (
                <div
                  key={event.id}
                  className={`event-item ${getEventClass(event.event_type)}`}
                  onClick={() => {
                    setSelectedEventId(event.id);
                    setModalType('eventDetail');
                  }}
                >
                  <div className="event-title">{event.name}</div>
                  <div className="event-year">
                    {event.year}年 · {event.event_type}
                  </div>
                  {event.description && (
                    <div className="event-desc">{event.description}</div>
                  )}
                </div>
              ))}
          </div>
        </>
      ) : (
        <div className="empty-member-detail">
          选择一位成员查看详情和事件
        </div>
      )}
    </div>
  );

  const StatsBar: React.FC = () => (
    stats && (
      <div className="stats-bar">
        <div className="stat-item" onClick={handleStatClick}>
          <span className="stat-value">{stats.total_members}</span>
          <span className="stat-label">总成员数</span>
        </div>
        <div className="stat-item" onClick={handleStatClick}>
          <span className="stat-value">{stats.max_age_diff}</span>
          <span className="stat-label">最大年龄差(年)</span>
        </div>
        <div className="stat-item" onClick={handleStatClick}>
          <span className="stat-value">{stats.avg_lifespan}</span>
          <span className="stat-label">平均寿命(年)</span>
        </div>
        <div className="stat-item" onClick={handleStatClick}>
          <span className="stat-value">{stats.total_events}</span>
          <span className="stat-label">事件总数</span>
        </div>
        <div className="stat-item" onClick={handleStatClick}>
          <span className="stat-value">{stats.avg_generation_gap || '-'}</span>
          <span className="stat-label">平均世代间隔</span>
        </div>
      </div>
    )
  );

  const MainLayout: React.FC = () => (
    <div
      className="app-container"
      onClick={() => setContextMenu({ visible: false, x: 0, y: 0, relationId: null })}
    >
      {alert.visible && (
        <div
          className="alert-banner"
          style={{ backgroundColor: alert.type === 'error' ? '#E74C3C' : '#27AE60' }}
        >
          <span>{alert.type === 'error' ? '❌ ' : '✅ '}{alert.message}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setAlert((a) => ({ ...a, visible: false }));
            }}
            style={{
              marginLeft: 16,
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: 18,
              fontWeight: 'bold',
              verticalAlign: 'middle',
            }}
          >
            ×
          </button>
        </div>
      )}

      <div className="top-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            className="mobile-drawer-toggle"
            onClick={() => setLeftDrawerOpen(!leftDrawerOpen)}
          >
            ☰
          </button>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <span className="toolbar-title">📜 家族历史可视化</span>
          </Link>
        </div>
        <div className="toolbar-buttons">
          <Link to="/members" style={{ textDecoration: 'none' }}>
            <button className="btn" style={{ backgroundColor: '#34495E' }}>
              👥 成员
            </button>
          </Link>
          <Link to="/graph" style={{ textDecoration: 'none' }}>
            <button className="btn" style={{ backgroundColor: '#34495E' }}>
              🌳 图谱
            </button>
          </Link>
          <Link to="/timeline" style={{ textDecoration: 'none' }}>
            <button className="btn" style={{ backgroundColor: '#34495E' }}>
              ⏱️ 时间轴
            </button>
          </Link>
          <button className="btn btn-success" onClick={handleImportClick}>
            📥 导入
          </button>
          <button className="btn btn-warning" onClick={handleExport}>
            📤 导出
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </div>

      <div className="main-content">
        <Routes>
          <Route path="/" element={
            <>
              <LeftPanel />
              <CenterArea />
              <RightPanel />
            </>
          } />
          <Route path="/members" element={
            <>
              <LeftPanel />
              <div className="center-area">
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#95A5A6', fontSize: 16 }}>
                  在左侧选择或添加家族成员
                </div>
              </div>
              <RightPanel />
            </>
          } />
          <Route path="/member/:memberId" element={
            <>
              <LeftPanel />
              <CenterArea />
              <RightPanel />
            </>
          } />
          <Route path="/graph" element={
            <>
              <LeftPanel />
              <div className="center-area">
                <div className="relation-graph-container" ref={relationGraphRef} style={{ flex: 1 }}>
                  <RelationGraph
                    nodes={graphNodes}
                    edges={graphEdges}
                    selectedMemberId={selectedMemberId}
                    onSelectMember={(id) => {
                      setSelectedMemberId(id);
                      if (id) navigate(`/member/${id}`);
                    }}
                    onNodeDragEnd={handleNodeDragEnd}
                    onCreateRelation={handleCreateRelation}
                    onUpdateRelationControl={handleUpdateRelationControl}
                    onContextMenuRelation={handleContextMenuRelation}
                    width={graphSize.width}
                    height={graphSize.height || 600}
                  />
                </div>
              </div>
              <RightPanel />
            </>
          } />
          <Route path="/timeline" element={
            <>
              <LeftPanel />
              <div className="center-area">
                <div className="timeline-container" ref={timelineRef} style={{ flex: 1 }}>
                  <TimelineMap
                    nodes={timelineNodes}
                    rawEvents={events}
                    rawMembers={members}
                    minYear={minYear}
                    maxYear={maxYear}
                    width={timelineSize.width}
                    height={timelineSize.height || 500}
                    onSelectEvent={(e) => {
                      if (e) {
                        setSelectedEventId(e.id);
                        setSelectedMemberId(e.member_id);
                        setModalType('eventDetail');
                      }
                    }}
                  />
                </div>
              </div>
              <RightPanel />
            </>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <StatsBar />

      {contextMenu.visible && (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="context-menu-item" onClick={handleEditRelation}>
            ✏️ 修改关系类型
          </div>
          <div className="context-menu-item danger" onClick={handleDeleteRelation}>
            🗑️ 删除关系
          </div>
        </div>
      )}

      {modalType === 'addMember' && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalType(null)}>
              ×
            </button>
            <h2 className="modal-title">添加家族成员</h2>
            <div className="form-group">
              <label>姓名 *</label>
              <input
                type="text"
                value={newMember.name}
                onChange={(e) => setNewMember((n) => ({ ...n, name: e.target.value }))}
                placeholder="请输入姓名"
                maxLength={20}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>出生年份 * (1900-2023)</label>
              <input
                type="number"
                min={1900}
                max={2023}
                value={newMember.birth_year}
                onChange={(e) =>
                  setNewMember((n) => ({ ...n, birth_year: Number(e.target.value) }))
                }
              />
            </div>
            <div className="form-group">
              <label>死亡年份 (可选)</label>
              <input
                type="number"
                min={1900}
                max={2030}
                value={newMember.death_year}
                onChange={(e) =>
                  setNewMember((n) => ({
                    ...n,
                    death_year: e.target.value ? Number(e.target.value) : '',
                  }))
                }
                placeholder="在世可留空"
              />
            </div>
            <div className="form-group">
              <label>性别</label>
              <select
                value={newMember.gender}
                onChange={(e) => setNewMember((n) => ({ ...n, gender: e.target.value }))}
              >
                <option value="男">男</option>
                <option value="女">女</option>
                <option value="">未指定</option>
              </select>
            </div>
            <div className="form-group">
              <label>身份描述 (不超过20字)</label>
              <input
                type="text"
                value={newMember.role}
                onChange={(e) => setNewMember((n) => ({ ...n, role: e.target.value }))}
                placeholder="如：祖父、外祖母等"
                maxLength={20}
              />
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" onClick={handleAddMember}>
                确认添加
              </button>
              <button
                className="btn"
                style={{ backgroundColor: '#7F8C8D' }}
                onClick={() => setModalType(null)}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {modalType === 'addEvent' && selectedMember && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalType(null)}>
              ×
            </button>
            <h2 className="modal-title">为 {selectedMember.name} 添加事件</h2>
            <div className="form-group">
              <label>事件名称 *</label>
              <input
                type="text"
                value={newEvent.name}
                onChange={(e) => setNewEvent((n) => ({ ...n, name: e.target.value }))}
                placeholder="如：考入清华大学"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>事件年份 * (1900-2030)</label>
              <input
                type="number"
                min={1900}
                max={2030}
                value={newEvent.year}
                onChange={(e) => setNewEvent((n) => ({ ...n, year: Number(e.target.value) }))}
              />
            </div>
            <div className="form-group">
              <label>事件类型</label>
              <select
                value={newEvent.event_type}
                onChange={(e) => setNewEvent((n) => ({ ...n, event_type: e.target.value }))}
              >
                <option value="出生">出生</option>
                <option value="入学">入学</option>
                <option value="工作">工作</option>
                <option value="结婚">结婚</option>
                <option value="生育">生育</option>
                <option value="获奖">获奖</option>
                <option value="逝世">逝世</option>
                <option value="其他">其他</option>
              </select>
            </div>
            <div className="form-group">
              <label>事件描述 (不超过100字)</label>
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent((n) => ({ ...n, description: e.target.value }))}
                placeholder="详细描述这个事件"
                maxLength={100}
              />
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" onClick={handleAddEvent}>
                确认添加
              </button>
              <button
                className="btn"
                style={{ backgroundColor: '#7F8C8D' }}
                onClick={() => setModalType(null)}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {modalType === 'selectRelation' && relationFromId && relationToId && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalType(null)}>
              ×
            </button>
            <h2 className="modal-title">选择关系类型</h2>
            <p style={{ marginBottom: 16, color: '#BDC3C7' }}>
              {members.find((m) => m.id === relationFromId)?.name} —{' '}
              {members.find((m) => m.id === relationToId)?.name}
            </p>
            {relationTypes.map((type) => (
              <div
                key={type}
                className="relation-select-option"
                onClick={() => handleConfirmRelation(type)}
              >
                {type}
              </div>
            ))}
            {customRelationTriggered && (
              <div className="form-group" style={{ marginTop: 12 }}>
                <label>输入自定义关系名</label>
                <input
                  type="text"
                  value={customRelationName}
                  onChange={(e) => setCustomRelationName(e.target.value)}
                  placeholder="如：表兄弟、婆媳等"
                  autoFocus
                />
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: 10 }}
                  onClick={handleConfirmCustomRelation}
                >
                  确认
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {modalType === 'editRelation' && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalType(null)}>
              ×
            </button>
            <h2 className="modal-title">修改关系类型</h2>
            <div className="form-group">
              <label>关系名称</label>
              <input
                type="text"
                value={customRelationName}
                onChange={(e) => setCustomRelationName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" onClick={handleSaveEditRelation}>
                保存
              </button>
              <button
                className="btn"
                style={{ backgroundColor: '#7F8C8D' }}
                onClick={() => setModalType(null)}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {modalType === 'eventDetail' && selectedEvent && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalType(null)}>
              ×
            </button>
            <h2 className="modal-title">{selectedEvent.name}</h2>
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: '#1ABC9C', marginBottom: 8 }}>
                📅 {selectedEvent.year}年 · {selectedEvent.event_type}
              </p>
              <p style={{ color: '#BDC3C7', marginBottom: 8 }}>
                👤 关联人物: {members.find((m) => m.id === selectedEvent.member_id)?.name || '未知'}
              </p>
              {selectedEvent.description && (
                <p
                  style={{
                    color: '#ECF0F1',
                    marginTop: 16,
                    padding: 12,
                    backgroundColor: '#2C3E50',
                    borderRadius: 6,
                  }}
                >
                  {selectedEvent.description}
                </p>
              )}
            </div>
            <div className="form-actions">
              <button
                className="btn btn-danger"
                onClick={async () => {
                  try {
                    await api.deleteEvent(selectedEvent.id);
                    setEvents((prev) => prev.filter((e) => e.id !== selectedEvent.id));
                    setModalType(null);
                    showAlert('事件已删除', 'success');
                  } catch (err) {
                    showAlert('删除失败');
                  }
                }}
              >
                删除此事件
              </button>
              <button
                className="btn"
                style={{ backgroundColor: '#7F8C8D' }}
                onClick={() => setModalType(null)}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {modalType === 'statsDetail' && stats && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div
            className="modal-content"
            style={{ minWidth: 700, maxWidth: '95vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={() => setModalType(null)}>
              ×
            </button>
            <h2 className="modal-title">📊 家族数据统计详情</h2>
            {stats.birth_year_lcm !== undefined && (
              <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#2C3E50', borderRadius: 6 }}>
                <span style={{ color: '#F1C40F' }}>📐 出生年份最小公倍数 (LCM): </span>
                <span style={{ color: '#ECF0F1', fontWeight: 'bold' }}>{stats.birth_year_lcm}</span>
              </div>
            )}
            <StatsCharts stats={stats} />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Routes>
      <Route path="/*" element={<MainLayout />} />
    </Routes>
  );
};

export default App;
