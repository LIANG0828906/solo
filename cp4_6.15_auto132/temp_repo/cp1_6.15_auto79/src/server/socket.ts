import type { Server, Socket } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { RoomMember, Note } from './types/index.js';
import { getProjectDetail, saveProjectDetail } from './utils/fileStore.js';

interface NoteChangePayload {
  projectId: string;
  note: Note;
  userId: string;
}

interface JoinRoomPayload {
  projectId: string;
  userId: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  avatar: string;
}

const roomMembers: Map<string, RoomMember[]> = new Map();

export function initSocketIO(httpServer: HTTPServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('join-room', (payload: JoinRoomPayload) => {
      const { projectId, userId, name, role, avatar } = payload;

      socket.join(projectId);
      console.log(`Socket ${socket.id} joined room ${projectId}`);

      const member: RoomMember = {
        socketId: socket.id,
        userId,
        name,
        role,
        avatar,
      };

      if (!roomMembers.has(projectId)) {
        roomMembers.set(projectId, []);
      }
      const members = roomMembers.get(projectId)!;
      const existingIndex = members.findIndex(m => m.userId === userId);
      if (existingIndex >= 0) {
        members[existingIndex] = member;
      } else {
        members.push(member);
      }

      io.to(projectId).emit('member-join', {
        member: {
          id: userId,
          name,
          role,
          avatar,
          online: true,
        },
        members: members.map(m => ({
          id: m.userId,
          name: m.name,
          role: m.role,
          avatar: m.avatar,
          online: true,
        })),
      });
    });

    socket.on('leave-room', (projectId: string) => {
      socket.leave(projectId);
      handleMemberLeave(socket, projectId);
    });

    socket.on('note-change', (payload: NoteChangePayload) => {
      const { projectId, note, userId } = payload;

      const projectDetail = getProjectDetail<any>(projectId);
      if (projectDetail) {
        const noteIndex = projectDetail.notes.findIndex((n: Note) => n.id === note.id);
        if (noteIndex >= 0) {
          projectDetail.notes[noteIndex] = note;
        } else {
          projectDetail.notes.push(note);
        }
        saveProjectDetail(projectId, projectDetail);
      }

      socket.to(projectId).emit('note-change-broadcast', {
        note,
        userId,
      });
    });

    socket.on('note-delete', (payload: { projectId: string; noteId: string; userId: string }) => {
      const { projectId, noteId, userId } = payload;

      const projectDetail = getProjectDetail<any>(projectId);
      if (projectDetail) {
        projectDetail.notes = projectDetail.notes.filter((n: Note) => n.id !== noteId);
        saveProjectDetail(projectId, projectDetail);
      }

      socket.to(projectId).emit('note-delete-broadcast', {
        noteId,
        userId,
      });
    });

    socket.on('version-create', (payload: { projectId: string; version: any }) => {
      const { projectId, version } = payload;
      socket.to(projectId).emit('version-create-broadcast', version);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      for (const [projectId, members] of roomMembers.entries()) {
        const index = members.findIndex(m => m.socketId === socket.id);
        if (index >= 0) {
          const leftMember = members[index];
          members.splice(index, 1);
          io.to(projectId).emit('member-leave', {
            userId: leftMember.userId,
            members: members.map(m => ({
              id: m.userId,
              name: m.name,
              role: m.role,
              avatar: m.avatar,
              online: true,
            })),
          });
          if (members.length === 0) {
            roomMembers.delete(projectId);
          }
        }
      }
    });
  });

  return io;
}

function handleMemberLeave(socket: Socket, projectId: string) {
  const members = roomMembers.get(projectId);
  if (!members) return;

  const index = members.findIndex(m => m.socketId === socket.id);
  if (index >= 0) {
    const leftMember = members[index];
    members.splice(index, 1);
    socket.to(projectId).emit('member-leave', {
      userId: leftMember.userId,
      members: members.map(m => ({
        id: m.userId,
        name: m.name,
        role: m.role,
        avatar: m.avatar,
        online: true,
      })),
    });
    if (members.length === 0) {
      roomMembers.delete(projectId);
    }
  }
}
