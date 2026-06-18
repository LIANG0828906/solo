import { Server, Socket } from 'socket.io';
import { VoteData, VoteRecord, CreateVotePayload, SubmitVotePayload, JoinVotePayload } from './types';

const MAX_ROOMS = 50;
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;
const MIN_DURATION = 10;
const MAX_DURATION = 300;

export const voteRooms = new Map<string, VoteData>();
const voteRecords = new Map<string, Set<string>>();

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function findWinnerIndex(options: VoteData['options']): number | null {
  if (options.length === 0) return null;
  let maxVotes = -1;
  let winnerIndex = 0;
  let hasTie = false;
  for (let i = 0; i < options.length; i++) {
    if (options[i].votes > maxVotes) {
      maxVotes = options[i].votes;
      winnerIndex = i;
      hasTie = false;
    } else if (options[i].votes === maxVotes && maxVotes > 0) {
      hasTie = true;
    }
  }
  return hasTie ? null : winnerIndex;
}

function sendToast(socket: Socket, message: string, type: 'success' | 'error' | 'info' = 'info'): void {
  socket.emit('toast', { message, type });
}

export function handleSocketConnection(io: Server, socket: Socket): void {
  console.log(`Client connected: ${socket.id}`);

  socket.on('create_vote', (payload: CreateVotePayload) => {
    try {
      const { title, options, duration } = payload;

      if (!title || title.trim().length === 0) {
        sendToast(socket, '请输入投票标题', 'error');
        socket.emit('error', { message: '请输入投票标题' });
        return;
      }

      if (!options || options.length < MIN_OPTIONS) {
        sendToast(socket, `选项至少需要${MIN_OPTIONS}个`, 'error');
        socket.emit('error', { message: `选项至少需要${MIN_OPTIONS}个` });
        return;
      }

      if (options.length > MAX_OPTIONS) {
        sendToast(socket, `选项最多${MAX_OPTIONS}个`, 'error');
        socket.emit('error', { message: `选项最多${MAX_OPTIONS}个` });
        return;
      }

      const validOptions = options.filter((opt) => opt && opt.trim().length > 0);
      if (validOptions.length < MIN_OPTIONS) {
        sendToast(socket, `有效选项至少需要${MIN_OPTIONS}个`, 'error');
        socket.emit('error', { message: `有效选项至少需要${MIN_OPTIONS}个` });
        return;
      }

      if (typeof duration !== 'number' || duration < MIN_DURATION || duration > MAX_DURATION) {
        sendToast(socket, `投票时长需在${MIN_DURATION}-${MAX_DURATION}秒之间`, 'error');
        socket.emit('error', { message: `投票时长需在${MIN_DURATION}-${MAX_DURATION}秒之间` });
        return;
      }

      if (voteRooms.size >= MAX_ROOMS) {
        sendToast(socket, '服务器房间数已达上限，请稍后再试', 'error');
        socket.emit('error', { message: '服务器房间数已达上限' });
        return;
      }

      let roomId = generateRoomId();
      while (voteRooms.has(roomId)) {
        roomId = generateRoomId();
      }

      const voteData: VoteData = {
        roomId,
        title: title.trim(),
        options: validOptions.map((text, index) => ({
          index,
          text: text.trim(),
          votes: 0,
        })),
        duration,
        remainingTime: duration,
        totalVotes: 0,
        status: 'active',
        createdAt: Date.now(),
        winnerIndex: null,
      };

      voteRooms.set(roomId, voteData);
      voteRecords.set(roomId, new Set());

      socket.join(roomId);

      socket.emit('vote_created', { roomId, vote: voteData });
      sendToast(socket, `投票创建成功！房间ID: ${roomId}`, 'success');
      io.emit('vote_list', { votes: getVoteList() });
    } catch (error) {
      console.error('create_vote error:', error);
      sendToast(socket, '创建投票失败', 'error');
      socket.emit('error', { message: '创建投票失败' });
    }
  });

  socket.on('join_vote', (payload: JoinVotePayload) => {
    try {
      const { roomId } = payload;

      if (!roomId || roomId.trim().length === 0) {
        sendToast(socket, '请输入房间ID', 'error');
        socket.emit('error', { message: '请输入房间ID' });
        return;
      }

      const vote = voteRooms.get(roomId.toUpperCase());
      if (!vote) {
        sendToast(socket, '房间不存在', 'error');
        socket.emit('error', { message: '房间不存在' });
        return;
      }

      const clientId = getClientId(socket);
      const voted = voteRecords.get(roomId.toUpperCase())?.has(clientId) ?? false;

      socket.join(roomId.toUpperCase());
      socket.emit('vote_joined', { vote, voted });
    } catch (error) {
      console.error('join_vote error:', error);
      sendToast(socket, '加入房间失败', 'error');
      socket.emit('error', { message: '加入房间失败' });
    }
  });

  socket.on('submit_vote', (payload: SubmitVotePayload) => {
    try {
      const { roomId, optionIndex } = payload;
      const normalizedRoomId = roomId.toUpperCase();
      const vote = voteRooms.get(normalizedRoomId);

      if (!vote) {
        sendToast(socket, '房间不存在', 'error');
        socket.emit('error', { message: '房间不存在' });
        return;
      }

      if (vote.status === 'ended') {
        sendToast(socket, '投票已结束', 'error');
        socket.emit('error', { message: '投票已结束' });
        return;
      }

      const clientId = getClientId(socket);
      const records = voteRecords.get(normalizedRoomId);

      if (!records) {
        sendToast(socket, '投票数据异常', 'error');
        return;
      }

      if (records.has(clientId)) {
        sendToast(socket, '您已经投过票了', 'error');
        socket.emit('error', { message: '您已经投过票了' });
        return;
      }

      if (optionIndex < 0 || optionIndex >= vote.options.length) {
        sendToast(socket, '无效的选项', 'error');
        socket.emit('error', { message: '无效的选项' });
        return;
      }

      vote.options[optionIndex].votes += 1;
      vote.totalVotes += 1;
      records.add(clientId);

      sendToast(socket, '投票成功！', 'success');
      io.to(normalizedRoomId).emit('vote_update', { vote });
    } catch (error) {
      console.error('submit_vote error:', error);
      sendToast(socket, '提交投票失败', 'error');
      socket.emit('error', { message: '提交投票失败' });
    }
  });

  socket.on('end_vote', (payload: { roomId: string }) => {
    try {
      const normalizedRoomId = payload.roomId.toUpperCase();
      const vote = voteRooms.get(normalizedRoomId);

      if (!vote) {
        sendToast(socket, '房间不存在', 'error');
        socket.emit('error', { message: '房间不存在' });
        return;
      }

      if (vote.status === 'ended') {
        sendToast(socket, '投票已结束', 'error');
        return;
      }

      vote.status = 'ended';
      vote.remainingTime = 0;
      vote.winnerIndex = findWinnerIndex(vote.options);

      sendToast(socket, '投票已结束', 'success');
      io.to(normalizedRoomId).emit('vote_ended', { vote });
      io.emit('vote_list', { votes: getVoteList() });
    } catch (error) {
      console.error('end_vote error:', error);
      sendToast(socket, '结束投票失败', 'error');
      socket.emit('error', { message: '结束投票失败' });
    }
  });

  socket.on('get_vote_list', () => {
    socket.emit('vote_list', { votes: getVoteList() });
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
}

function getClientId(socket: Socket): string {
  const forwardedFor = socket.handshake.headers['x-forwarded-for'];
  const ip = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : typeof forwardedFor === 'string'
    ? forwardedFor.split(',')[0]
    : socket.handshake.address;
  return `${ip || socket.id}`;
}

export function getVoteList(): VoteData[] {
  return Array.from(voteRooms.values()).sort((a, b) => b.createdAt - a.createdAt);
}

export function tickCountdown(io: Server): void {
  voteRooms.forEach((vote, roomId) => {
    if (vote.status === 'active' && vote.remainingTime > 0) {
      vote.remainingTime -= 1;
      io.to(roomId).emit('vote_update', { vote });

      if (vote.remainingTime <= 0) {
        vote.status = 'ended';
        vote.remainingTime = 0;
        vote.winnerIndex = findWinnerIndex(vote.options);
        io.to(roomId).emit('vote_ended', { vote });
        io.emit('vote_list', { votes: getVoteList() });
      }
    }
  });
}
