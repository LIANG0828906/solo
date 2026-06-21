import { Server as SocketIOServer, Socket } from 'socket.io';

export interface VoteOption {
  id: string;
  text: string;
  count: number;
}

export interface Poll {
  id: string;
  question: string;
  type: 'single' | 'multiple';
  options: VoteOption[];
  status: 'pending' | 'active' | 'ended';
  totalVoters: number;
  createdAt: number;
  endedAt?: number;
}

export interface VoteSubmission {
  pollId: string;
  optionIds: string[];
  voterId?: string;
}

export interface VoteUpdatePayload {
  pollId: string;
  options: VoteOption[];
  totalVoters: number;
}

export class SocketManager {
  private io: SocketIOServer;
  private polls: Map<string, Poll>;
  private voterRecords: Map<string, Set<string>>;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.polls = new Map();
    this.voterRecords = new Map();
    this.initialize();
  }

  setPollsStore(polls: Map<string, Poll>, voterRecords: Map<string, Set<string>>) {
    (this.polls as any) = polls;
    (this.voterRecords as any) = voterRecords;
  }

  updatePollData(polls: Map<string, Poll>, voterRecords: Map<string, Set<string>>) {
    (this.polls as any) = polls;
    (this.voterRecords as any) = voterRecords;
  }

  private initialize() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`[Socket] 客户端连接: ${socket.id}`);

      socket.on('joinPoll', ({ pollId, role }: { pollId: string; role: 'host' | 'voter' }) => {
        socket.join(pollId);
        console.log(`[Socket] ${socket.id} 加入房间 ${pollId} 作为 ${role}`);
      });

      socket.on('submitVote', (data: VoteSubmission) => {
        this.handleSubmitVote(socket, data);
      });

      socket.on('startVote', (pollId: string) => {
        this.handleStartVote(socket, pollId);
      });

      socket.on('endVote', (pollId: string) => {
        this.handleEndVote(socket, pollId);
      });

      socket.on('disconnect', () => {
        console.log(`[Socket] 客户端断开: ${socket.id}`);
      });
    });
  }

  private handleSubmitVote(socket: Socket, data: VoteSubmission) {
    const { pollId, optionIds, voterId } = data;
    const poll = this.polls.get(pollId);

    if (!poll) {
      socket.emit('voteError', { message: '投票不存在' });
      return;
    }

    if (poll.status !== 'active') {
      socket.emit('voteError', { message: '投票未在进行中' });
      return;
    }

    const vid = voterId || socket.id;
    const records = this.voterRecords.get(pollId);
    if (records && records.has(vid)) {
      socket.emit('voteError', { message: '您已投过票了' });
      return;
    }

    if (optionIds.length === 0) {
      socket.emit('voteError', { message: '请至少选择一个选项' });
      return;
    }

    if (poll.type === 'single' && optionIds.length > 1) {
      socket.emit('voteError', { message: '单选投票只能选一个选项' });
      return;
    }

    const validOptionIds = poll.options.map(o => o.id);
    const allValid = optionIds.every(id => validOptionIds.includes(id));
    if (!allValid) {
      socket.emit('voteError', { message: '包含无效选项' });
      return;
    }

    poll.options = poll.options.map(opt => ({
      ...opt,
      count: optionIds.includes(opt.id) ? opt.count + 1 : opt.count,
    }));
    poll.totalVoters += 1;

    if (!records) {
      this.voterRecords.set(pollId, new Set([vid]));
    } else {
      records.add(vid);
    }

    this.polls.set(pollId, poll);

    const payload: VoteUpdatePayload = {
      pollId,
      options: poll.options,
      totalVoters: poll.totalVoters,
    };

    this.io.to(pollId).emit('voteUpdate', payload);
    socket.emit('voteSubmitted', { success: true, pollId });
  }

  private handleStartVote(socket: Socket, pollId: string) {
    const poll = this.polls.get(pollId);
    if (!poll) {
      socket.emit('voteError', { message: '投票不存在' });
      return;
    }

    if (poll.status !== 'pending') {
      socket.emit('voteError', { message: '投票状态不允许发起' });
      return;
    }

    poll.status = 'active';
    this.polls.set(pollId, poll);

    this.io.to(pollId).emit('voteStarted', poll);
    this.io.emit('voteStartedGlobal', { pollId, status: 'active' });
  }

  private handleEndVote(socket: Socket, pollId: string) {
    const poll = this.polls.get(pollId);
    if (!poll) {
      socket.emit('voteError', { message: '投票不存在' });
      return;
    }

    if (poll.status !== 'active') {
      socket.emit('voteError', { message: '投票未在进行中' });
      return;
    }

    poll.status = 'ended';
    poll.endedAt = Date.now();
    this.polls.set(pollId, poll);

    const payload = { pollId, endedAt: poll.endedAt };
    this.io.to(pollId).emit('voteEnded', payload);
    this.io.emit('voteEndedGlobal', payload);
  }

  emitVoteCreated(poll: Poll) {
    this.io.emit('voteCreated', poll);
  }
}
