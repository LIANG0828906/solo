const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const adapter = new FileSync(path.join(__dirname, 'db.json'));
const db = low(adapter);

db.defaults({ groups: [] }).write();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const GROUP_COLORS = ['red', 'blue', 'green', 'orange', 'purple'];
const MEMBERS_PER_GROUP = 5;
const ROLL_CALL_DURATION_MS = 10 * 1000;
const ONLINE_TIMEOUT_MS = 30 * 1000;
const HISTORY_MAX_ENTRIES = 30;
const HISTORY_WINDOW_MS = 5 * 60 * 1000;

const socketMemberMap = new Map();
const groupRollCallTimers = new Map();

function generateJoinCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateUniqueJoinCode() {
  const existingCodes = new Set();
  const groups = db.get('groups').value();
  groups.forEach((group) => {
    group.members.forEach((member) => {
      existingCodes.add(member.joinCode);
    });
  });

  let code;
  do {
    code = generateJoinCode();
  } while (existingCodes.has(code));

  return code;
}

function findGroupByJoinCode(joinCode) {
  const groups = db.get('groups').value();
  for (const group of groups) {
    const member = group.members.find((m) => m.joinCode === joinCode);
    if (member) {
      return { group, member };
    }
  }
  return null;
}

function getGroupById(groupId) {
  return db.get('groups').find({ id: groupId }).value();
}

function updateMemberInDb(groupId, memberId, updates) {
  const group = db.get('groups').find({ id: groupId }).value();
  if (!group) return null;

  const memberIndex = group.members.findIndex((m) => m.id === memberId);
  if (memberIndex === -1) return null;

  const updated = { ...group.members[memberIndex], ...updates };
  db.get('groups')
    .find({ id: groupId })
    .get('members')
    .find({ id: memberId })
    .assign(updates)
    .write();

  return updated;
}

function broadcastMemberUpdate(groupId, member) {
  io.to(`group:${groupId}`).emit('memberUpdate', member);
}

function broadcastOnlineMembers(groupId) {
  const group = getGroupById(groupId);
  if (!group) return;

  const now = Date.now();
  const onlineMemberIds = group.members
    .filter((m) => now - m.lastUpdate < ONLINE_TIMEOUT_MS)
    .map((m) => m.id);

  io.to(`group:${groupId}`).emit('onlineMembersUpdate', onlineMemberIds);
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/groups/:groupId', (req, res) => {
  const group = getGroupById(req.params.groupId);
  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }
  res.json(group);
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('createGroup', (data, callback) => {
    try {
      const { name, date, memberCount } = data;

      if (!name || !date) {
        return callback({ success: false, error: '团名和日期不能为空' });
      }

      const count = parseInt(memberCount);
      if (isNaN(count) || count < 5 || count > 30) {
        return callback({ success: false, error: '人数必须在5-30人之间' });
      }

      const groupId = uuidv4();
      const members = [];

      for (let i = 0; i < count; i++) {
        const groupIndex = Math.floor(i / MEMBERS_PER_GROUP) % GROUP_COLORS.length;
        members.push({
          id: uuidv4(),
          name: `成员${i + 1}`,
          joinCode: generateUniqueJoinCode(),
          groupIndex,
          isOnline: false,
          lastUpdate: Date.now(),
          lat: 39.9042 + (Math.random() - 0.5) * 0.05,
          lng: 116.4074 + (Math.random() - 0.5) * 0.05,
          history: [],
        });
      }

      const group = {
        id: groupId,
        name,
        date,
        memberCount: count,
        members,
        createdAt: Date.now(),
      };

      db.get('groups').push(group).write();

      socket.join(`group:${groupId}`);
      socketMemberMap.set(socket.id, { groupId, memberId: null, isLeader: true });

      callback({ success: true, group });
    } catch (err) {
      console.error('createGroup error:', err);
      callback({ success: false, error: '创建失败' });
    }
  });

  socket.on('joinGroup', (data, callback) => {
    try {
      const { joinCode, memberName } = data;

      if (!joinCode || !memberName) {
        return callback({ success: false, error: '加入码和姓名不能为空' });
      }

      const result = findGroupByJoinCode(joinCode.toUpperCase());
      if (!result) {
        return callback({ success: false, error: '加入码无效' });
      }

      const { group, member: existingMember } = result;

      const updatedMember = updateMemberInDb(group.id, existingMember.id, {
        name: memberName,
        isOnline: true,
        lastUpdate: Date.now(),
      });

      socket.join(`group:${group.id}`);
      socketMemberMap.set(socket.id, {
        groupId: group.id,
        memberId: existingMember.id,
        isLeader: false,
      });

      broadcastMemberUpdate(group.id, updatedMember);
      broadcastOnlineMembers(group.id);

      const refreshedGroup = getGroupById(group.id);

      callback({ success: true, group: refreshedGroup, member: updatedMember });
    } catch (err) {
      console.error('joinGroup error:', err);
      callback({ success: false, error: '加入失败' });
    }
  });

  socket.on('getGroup', (groupId, callback) => {
    try {
      const group = getGroupById(groupId);
      callback({ success: true, group: group || null });
    } catch (err) {
      callback({ success: false, error: '获取失败' });
    }
  });

  socket.on('updatePosition', (data) => {
    try {
      const { memberId, lat, lng } = data;
      const info = socketMemberMap.get(socket.id);
      if (!info || !info.groupId) return;

      const group = getGroupById(info.groupId);
      if (!group) return;

      const member = group.members.find((m) => m.id === memberId);
      if (!member) return;

      const now = Date.now();
      const history = [...(member.history || [])];

      history.push({ lat, lng, time: now });

      const cutoffTime = now - HISTORY_WINDOW_MS;
      const filteredHistory = history.filter((h) => h.time >= cutoffTime);

      const trimmedHistory = filteredHistory.slice(-HISTORY_MAX_ENTRIES);

      const updated = updateMemberInDb(info.groupId, memberId, {
        lat,
        lng,
        lastUpdate: now,
        isOnline: true,
        history: trimmedHistory,
      });

      if (updated) {
        broadcastMemberUpdate(info.groupId, updated);
      }
    } catch (err) {
      console.error('updatePosition error:', err);
    }
  });

  socket.on('startRollCall', (data) => {
    try {
      const { groupId } = data;
      const info = socketMemberMap.get(socket.id);

      if (!info || !info.isLeader) return;

      const group = getGroupById(groupId);
      if (!group) return;

      if (groupRollCallTimers.has(groupId)) {
        clearTimeout(groupRollCallTimers.get(groupId));
      }

      const endTime = Date.now() + ROLL_CALL_DURATION_MS;

      io.to(`group:${groupId}`).emit('rollCallStarted', endTime);

      const timer = setTimeout(() => {
        const refreshedGroup = getGroupById(groupId);
        if (!refreshedGroup) return;

        const now = Date.now();
        const onlineMembers = refreshedGroup.members.filter(
          (m) => now - m.lastUpdate < ONLINE_TIMEOUT_MS
        );

        const missingMemberIds = onlineMembers
          .filter((m) => {
            const lastPulse = m.lastRollCallResponse || 0;
            return now - lastPulse > ROLL_CALL_DURATION_MS;
          })
          .map((m) => m.id);

        io.to(`group:${groupId}`).emit('rollCallEnded', missingMemberIds);
        groupRollCallTimers.delete(groupId);
      }, ROLL_CALL_DURATION_MS);

      groupRollCallTimers.set(groupId, timer);
    } catch (err) {
      console.error('startRollCall error:', err);
    }
  });

  socket.on('respondRollCall', (data) => {
    try {
      const { memberId, groupId } = data;

      const group = getGroupById(groupId);
      if (!group) return;

      const updated = updateMemberInDb(groupId, memberId, {
        lastRollCallResponse: Date.now(),
      });

      if (updated) {
        io.to(`group:${groupId}`).emit('rollCallResponse', memberId);
      }
    } catch (err) {
      console.error('respondRollCall error:', err);
    }
  });

  socket.on('clearMissingWarnings', (data) => {
    try {
      const { groupId } = data;
      const info = socketMemberMap.get(socket.id);

      if (!info || !info.isLeader) return;

      io.to(`group:${groupId}`).emit('missingWarningsCleared');
    } catch (err) {
      console.error('clearMissingWarnings error:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    const info = socketMemberMap.get(socket.id);

    if (info && info.groupId && info.memberId) {
      updateMemberInDb(info.groupId, info.memberId, {
        isOnline: false,
        lastUpdate: Date.now(),
      });

      setTimeout(() => {
        broadcastOnlineMembers(info.groupId);
      }, 1000);
    }

    socketMemberMap.delete(socket.id);
  });
});

setInterval(() => {
  const groups = db.get('groups').value();
  groups.forEach((group) => {
    broadcastOnlineMembers(group.id);
  });
}, 5000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.io ready`);
});
