import express from 'express';
import cors from 'cors';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';
import type { Team, TeamMember, Meeting } from './types';
import {
  ALL_TIMEZONES,
  buildHourlyAvailabilityMatrix,
  getTopRecommendations,
} from './timezoneProcessor';
import { initWebSocketServer, initMailer, notifyMeetingCreated } from './notification';
import { startScheduler } from './scheduler';

const AVATAR_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E',
  '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E',
];

const app = express();
app.use(cors());
app.use(express.json());

const teams: Map<string, Team> = new Map();
const meetings: Map<string, Meeting> = new Map();

function pickAvatarColor(seed?: string): string {
  const idx = seed
    ? seed.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % AVATAR_COLORS.length
    : Math.floor(Math.random() * AVATAR_COLORS.length);
  return AVATAR_COLORS[idx];
}

function defaultAvailability(): { [day: number]: number[] } {
  const avail: { [day: number]: number[] } = {};
  for (let d = 1; d <= 5; d++) {
    avail[d] = [9, 10, 11, 12, 13, 14, 15, 16, 17];
  }
  return avail;
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/timezones', (_req, res) => {
  res.json({ timezones: ALL_TIMEZONES });
});

app.post('/api/teams', (req, res) => {
  const { name, description } = req.body as { name?: string; description?: string };
  if (!name || !name.trim()) {
    return res.status(400).json({ error: '团队名称不能为空' });
  }
  const team: Team = {
    id: uuidv4(),
    name: name.trim(),
    description: (description || '').trim(),
    members: [],
    createdAt: Date.now(),
  };
  teams.set(team.id, team);
  res.json({ team });
});

app.get('/api/teams', (_req, res) => {
  res.json({ teams: Array.from(teams.values()) });
});

app.get('/api/teams/:id', (req, res) => {
  const team = teams.get(req.params.id);
  if (!team) return res.status(404).json({ error: '团队不存在' });
  res.json({ team });
});

app.delete('/api/teams/:id', (req, res) => {
  const deleted = teams.delete(req.params.id);
  if (!deleted) return res.status(404).json({ error: '团队不存在' });
  for (const [mid, meeting] of meetings) {
    if (meeting.teamId === req.params.id) meetings.delete(mid);
  }
  res.json({ success: true });
});

app.post('/api/teams/:teamId/members', (req, res) => {
  const team = teams.get(req.params.teamId);
  if (!team) return res.status(404).json({ error: '团队不存在' });

  const { name, timezone, email, availability } = req.body as {
    name?: string;
    timezone?: string;
    email?: string;
    availability?: { [day: number]: number[] };
  };

  if (!name || !name.trim()) return res.status(400).json({ error: '成员姓名不能为空' });
  if (!timezone || !ALL_TIMEZONES.includes(timezone)) {
    return res.status(400).json({ error: '无效的时区' });
  }

  const member: TeamMember = {
    id: uuidv4(),
    name: name.trim(),
    timezone,
    email: email?.trim() || undefined,
    availability: availability || defaultAvailability(),
    avatarColor: pickAvatarColor(name),
  };
  team.members.push(member);
  res.json({ member });
});

app.put('/api/teams/:teamId/members/:memberId', (req, res) => {
  const team = teams.get(req.params.teamId);
  if (!team) return res.status(404).json({ error: '团队不存在' });
  const idx = team.members.findIndex(m => m.id === req.params.memberId);
  if (idx === -1) return res.status(404).json({ error: '成员不存在' });

  const updates = req.body as Partial<TeamMember>;
  if (updates.timezone && !ALL_TIMEZONES.includes(updates.timezone)) {
    return res.status(400).json({ error: '无效的时区' });
  }
  if (updates.name !== undefined) {
    updates.name = updates.name.trim();
    if (!updates.name) return res.status(400).json({ error: '成员姓名不能为空' });
  }

  team.members[idx] = { ...team.members[idx], ...updates };
  if (updates.name) {
    team.members[idx].avatarColor = pickAvatarColor(updates.name);
  }
  res.json({ member: team.members[idx] });
});

app.delete('/api/teams/:teamId/members/:memberId', (req, res) => {
  const team = teams.get(req.params.teamId);
  if (!team) return res.status(404).json({ error: '团队不存在' });
  const lenBefore = team.members.length;
  team.members = team.members.filter(m => m.id !== req.params.memberId);
  if (team.members.length === lenBefore) {
    return res.status(404).json({ error: '成员不存在' });
  }
  res.json({ success: true });
});

app.post('/api/teams/:teamId/availability-matrix', (req, res) => {
  const team = teams.get(req.params.teamId);
  if (!team) return res.status(404).json({ error: '团队不存在' });
  const { date } = req.body as { date?: string };
  if (!date) return res.status(400).json({ error: '日期不能为空' });

  const matrix = buildHourlyAvailabilityMatrix(team.members, date);
  const memberMap: { [id: string]: TeamMember } = {};
  team.members.forEach(m => { memberMap[m.id] = m; });

  res.json({
    matrix,
    members: team.members,
    totalMembers: team.members.length,
  });
});

app.post('/api/teams/:teamId/recommendations', (req, res) => {
  const team = teams.get(req.params.teamId);
  if (!team) return res.status(404).json({ error: '团队不存在' });
  const { date } = req.body as { date?: string };
  if (!date) return res.status(400).json({ error: '日期不能为空' });
  if (team.members.length === 0) {
    return res.json({ recommendations: [] });
  }

  const recommendations = getTopRecommendations(team.members, date, 5);
  const memberMap: { [id: string]: TeamMember } = {};
  team.members.forEach(m => { memberMap[m.id] = m; });

  const enriched = recommendations.map(r => ({
    ...r,
    availableMembers: r.availableMemberIds.map(id => memberMap[id]).filter(Boolean),
  }));

  res.json({ recommendations: enriched });
});

app.post('/api/meetings', (req, res) => {
  const body = req.body as {
    teamId: string;
    title: string;
    date: string;
    startTimeUTC: string;
    endTimeUTC: string;
    durationMinutes: number;
    notes?: string;
    participantIds: string[];
  };

  if (!body.teamId || !teams.has(body.teamId)) {
    return res.status(404).json({ error: '团队不存在' });
  }
  if (!body.title || !body.title.trim()) {
    return res.status(400).json({ error: '会议标题不能为空' });
  }
  if (!body.date || !body.startTimeUTC || !body.endTimeUTC) {
    return res.status(400).json({ error: '会议时间不完整' });
  }
  if (![15, 30, 45, 60].includes(body.durationMinutes)) {
    return res.status(400).json({ error: '会议时长必须为15/30/45/60分钟' });
  }

  const meeting: Meeting = {
    id: uuidv4(),
    teamId: body.teamId,
    title: body.title.trim(),
    date: body.date,
    startTimeUTC: body.startTimeUTC,
    endTimeUTC: body.endTimeUTC,
    durationMinutes: body.durationMinutes,
    notes: body.notes?.trim() || undefined,
    participantIds: body.participantIds || [],
    notified15: false,
    notified5: false,
    createdAt: Date.now(),
  };
  meetings.set(meeting.id, meeting);

  const team = teams.get(body.teamId);
  if (team) notifyMeetingCreated(meeting, team);

  res.status(201).json({ meeting });
});

app.get('/api/meetings', (req, res) => {
  const teamId = req.query.teamId as string | undefined;
  let list = Array.from(meetings.values());
  if (teamId) list = list.filter(m => m.teamId === teamId);

  list.sort((a, b) => {
    const ta = new Date(`${a.date}T${a.startTimeUTC}Z`).getTime();
    const tb = new Date(`${b.date}T${b.startTimeUTC}Z`).getTime();
    return ta - tb;
  });

  res.json({ meetings: list });
});

app.get('/api/meetings/upcoming', (_req, res) => {
  const now = Date.now();
  const list = Array.from(meetings.values())
    .filter(m => {
      const endTime = new Date(`${m.date}T${m.endTimeUTC}Z`).getTime();
      return endTime > now;
    })
    .sort((a, b) => {
      const ta = new Date(`${a.date}T${a.startTimeUTC}Z`).getTime();
      const tb = new Date(`${b.date}T${b.startTimeUTC}Z`).getTime();
      return ta - tb;
    });
  res.json({ meetings: list });
});

app.get('/api/meetings/:id', (req, res) => {
  const meeting = meetings.get(req.params.id);
  if (!meeting) return res.status(404).json({ error: '会议不存在' });
  res.json({ meeting });
});

app.delete('/api/meetings/:id', (req, res) => {
  const deleted = meetings.delete(req.params.id);
  if (!deleted) return res.status(404).json({ error: '会议不存在' });
  res.json({ success: true });
});

function updateMeeting(id: string, updates: Partial<Meeting>) {
  const meeting = meetings.get(id);
  if (!meeting) return;
  meetings.set(id, { ...meeting, ...updates });
}

const PORT = 3001;
const server = http.createServer(app);

initWebSocketServer(server);
initMailer();

server.listen(PORT, () => {
  console.log(`[Server] API服务运行在 http://localhost:${PORT}`);
  startScheduler({
    getTeams: () => Array.from(teams.values()),
    getMeetings: () => Array.from(meetings.values()),
    updateMeeting,
  });
});

process.on('SIGINT', () => {
  console.log('[Server] 正在关闭...');
  server.close();
  process.exit(0);
});
