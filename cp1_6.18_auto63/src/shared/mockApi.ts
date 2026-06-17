import { v4 as uuidv4 } from 'uuid';
import { Room, Candidate, VoteRecord, VoteResult, DEFAULT_CANDIDATES } from './types';

const rooms = new Map<string, Room>();
const voteRecords = new Map<string, VoteRecord[]>();

export const mockApi = {
  async createRoom(title?: string): Promise<Room> {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const candidates: Candidate[] = DEFAULT_CANDIDATES.map(c => ({
      ...c,
      id: uuidv4(),
      votes: 0,
    }));

    const room: Room = {
      id: roomId,
      title: title || '幻境投票',
      candidates,
      status: 'voting',
      totalVotes: 0,
    };

    rooms.set(roomId, room);
    voteRecords.set(roomId, []);

    return room;
  },

  async joinRoom(roomId: string): Promise<Room | null> {
    const room = rooms.get(roomId.toUpperCase());
    return room || null;
  },

  async submitVote(roomId: string, candidateId: string): Promise<{ room: Room; color: string } | null> {
    const room = rooms.get(roomId.toUpperCase());
    if (!room || room.status !== 'voting') return null;

    const candidate = room.candidates.find(c => c.id === candidateId);
    if (!candidate) return null;

    candidate.votes += 1;
    room.totalVotes += 1;

    const records = voteRecords.get(roomId.toUpperCase()) || [];
    records.push({ candidateId, timestamp: Date.now() });
    voteRecords.set(roomId.toUpperCase(), records);

    return { room, color: candidate.color };
  },

  async endVoting(roomId: string): Promise<VoteResult[] | null> {
    const room = rooms.get(roomId.toUpperCase());
    if (!room) return null;

    room.status = 'ended';

    return room.candidates.map(c => ({
      candidateId: c.id,
      name: c.name,
      emoji: c.emoji,
      color: c.color,
      votes: c.votes,
      percentage: room.totalVotes > 0 ? (c.votes / room.totalVotes) * 100 : 0,
    }));
  },

  async resetRoom(roomId: string): Promise<Room | null> {
    const room = rooms.get(roomId.toUpperCase());
    if (!room) return null;

    room.status = 'voting';
    room.totalVotes = 0;
    room.candidates.forEach(c => {
      c.votes = 0;
    });
    voteRecords.set(roomId.toUpperCase(), []);

    return room;
  },

  getRoom(roomId: string): Room | null {
    return rooms.get(roomId.toUpperCase()) || null;
  },
};
