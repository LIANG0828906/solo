import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Users, Trophy, Clock, Target, X } from 'lucide-react';
import { eventManager } from './EventManager';
import { socketService } from './SocketService';
import type { Event } from './types';

const AVATAR_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

const getAvatarColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const getInitials = (name: string): string => {
  return name.charAt(0).toUpperCase();
};

interface ManagerPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const ManagerPanel: React.FC<ManagerPanelProps> = ({ isOpen = true, onClose }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [connected, setConnected] = useState(false);

  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectMaxParticipants, setProjectMaxParticipants] = useState(20);
  const [projectType, setProjectType] = useState<'timed' | 'scored'>('scored');
  const [participantName, setParticipantName] = useState('');
  const [participantUnit, setParticipantUnit] = useState('');
  const [scoreParticipantId, setScoreParticipantId] = useState('');
  const [scoreValue, setScoreValue] = useState('');

  const refreshEvents = useCallback(() => {
    setEvents(eventManager.getEvents());
  }, []);

  useEffect(() => {
    refreshEvents();

    const unsubscribe1 = socketService.on('event:sync', refreshEvents);
    const unsubscribe2 = socketService.on('connect', () => setConnected(true));
    const unsubscribe3 = socketService.on('disconnect', () => setConnected(false));

    if (socketService.isConnected()) {
      setConnected(true);
    }

    return () => {
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
    };
  }, [refreshEvents]);

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const selectedProject = selectedEvent?.projects.find((p) => p.id === selectedProjectId);
  const participants = selectedProject ? eventManager.getParticipants(selectedEventId, selectedProjectId) : [];

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim() || !eventDate) return;

    const newEvent = eventManager.createEvent(eventName.trim(), eventDate);
    setSelectedEventId(newEvent.id);
    setEventName('');
    setEventDate('');
    refreshEvents();
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !projectName.trim()) return;

    eventManager.addProject(selectedEventId, projectName.trim(), projectMaxParticipants, projectType);
    setProjectName('');
    setProjectMaxParticipants(20);
    refreshEvents();
  };

  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !selectedProjectId || !participantName.trim() || !participantUnit.trim()) return;

    eventManager.addParticipant(selectedEventId, selectedProjectId, participantName.trim(), participantUnit.trim());
    setParticipantName('');
    setParticipantUnit('');
    refreshEvents();
  };

  const handleRecordScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !selectedProjectId || !scoreParticipantId || !scoreValue) return;

    const score = parseFloat(scoreValue);
    if (isNaN(score)) return;

    eventManager.recordScore(selectedEventId, selectedProjectId, scoreParticipantId, score);
    setScoreValue('');
    refreshEvents();
  };

  return (
    <div className={`manager-panel ${isOpen ? 'open' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 className="section-title" style={{ marginBottom: 0 }}>
          <Trophy size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
          赛事管理
        </h2>
        {onClose && (
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
          <span className="connection-dot"></span>
          {connected ? '实时连接中' : '连接断开'}
        </div>
      </div>

      <div className="divider"></div>

      <form onSubmit={handleCreateEvent}>
        <h3 className="section-title" style={{ fontSize: '16px', marginBottom: '16px' }}>
          <Plus size={18} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          创建运动会
        </h3>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">运动会名称</label>
            <input
              type="text"
              className="form-input"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="如：2024春季趣味运动会"
            />
          </div>
          <div className="form-group">
            <label className="form-label">日期</label>
            <input
              type="date"
              className="form-input"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
          创建运动会
        </button>
      </form>

      {events.length > 0 && (
        <>
          <div className="divider"></div>

          <div className="form-group">
            <label className="form-label">选择运动会</label>
            <select
              className="form-input form-select"
              value={selectedEventId}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                setSelectedProjectId('');
              }}
            >
              <option value="">-- 请选择运动会 --</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name} ({event.date})
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {selectedEvent && (
        <>
          <div className="divider"></div>

          <form onSubmit={handleAddProject}>
            <h3 className="section-title" style={{ fontSize: '16px', marginBottom: '16px' }}>
              <Target size={18} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
              添加比赛项目
            </h3>
            <div className="form-group">
              <label className="form-label">项目名称</label>
              <input
                type="text"
                className="form-input"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="如：拔河、袋鼠跳、接力跑"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">项目类型</label>
                <select
                  className="form-input form-select"
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value as 'timed' | 'scored')}
                >
                  <option value="scored">分数类</option>
                  <option value="timed">计时类</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">满报人数</label>
                <input
                  type="number"
                  className="form-input"
                  value={projectMaxParticipants}
                  onChange={(e) => setProjectMaxParticipants(parseInt(e.target.value) || 20)}
                  min="2"
                  max="100"
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              添加项目
            </button>
          </form>

          {selectedEvent.projects.length > 0 && (
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label">选择项目</label>
              <select
                className="form-input form-select"
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  setScoreParticipantId('');
                }}
              >
                <option value="">-- 请选择项目 --</option>
                {selectedEvent.projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} ({project.type === 'timed' ? '计时' : '分数'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </>
      )}

      {selectedProject && (
        <>
          <div className="divider"></div>

          <form onSubmit={handleAddParticipant}>
            <h3 className="section-title" style={{ fontSize: '16px', marginBottom: '16px' }}>
              <Users size={18} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
              添加参赛者
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginLeft: '8px' }}>
                ({participants.length}/{selectedProject.maxParticipants})
              </span>
            </h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">姓名</label>
                <input
                  type="text"
                  className="form-input"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  placeholder="参赛者姓名"
                />
              </div>
              <div className="form-group">
                <label className="form-label">所属单元</label>
                <input
                  type="text"
                  className="form-input"
                  value={participantUnit}
                  onChange={(e) => setParticipantUnit(e.target.value)}
                  placeholder="如：1号楼3单元"
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={participants.length >= selectedProject.maxParticipants}
            >
              {participants.length >= selectedProject.maxParticipants ? '已满员' : '添加参赛者'}
            </button>
          </form>

          {participants.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                已报名参赛者 ({participants.length})
              </h4>
              <div className="participant-list">
                {participants.map((participant) => (
                  <div key={participant.id} className="participant-row">
                    <div
                      className="participant-avatar"
                      style={{ backgroundColor: getAvatarColor(participant.name) }}
                    >
                      {getInitials(participant.name)}
                    </div>
                    <div className="participant-info">
                      <div className="participant-name">{participant.name}</div>
                      <div className="participant-unit">{participant.unit}</div>
                    </div>
                    <div className="participant-number">{participant.number}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="divider"></div>

          <form onSubmit={handleRecordScore}>
            <h3 className="section-title" style={{ fontSize: '16px', marginBottom: '16px' }}>
              <Clock size={18} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
              录入成绩
            </h3>
            <div className="form-group">
              <label className="form-label">选择参赛者</label>
              <select
                className="form-input form-select"
                value={scoreParticipantId}
                onChange={(e) => setScoreParticipantId(e.target.value)}
              >
                <option value="">-- 请选择参赛者 --</option>
                {participants.map((participant) => (
                  <option key={participant.id} value={participant.id}>
                    {participant.name} ({participant.number})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">
                成绩 ({selectedProject.type === 'timed' ? '毫秒' : '分数'})
              </label>
              <input
                type="number"
                className="form-input"
                value={scoreValue}
                onChange={(e) => setScoreValue(e.target.value)}
                placeholder={selectedProject.type === 'timed' ? '如：12500（表示12.5秒）' : '如：95'}
                step={selectedProject.type === 'timed' ? '1' : '0.1'}
                min="0"
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              提交成绩
            </button>
          </form>
        </>
      )}
    </div>
  );
};
