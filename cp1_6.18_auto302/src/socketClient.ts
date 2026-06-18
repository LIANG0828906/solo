import { io, Socket } from 'socket.io-client';
import { Member, TourGroup } from './types';

class SocketClient {
  private socket: Socket | null = null;

  connect(): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }
    this.socket = io({
      transports: ['websocket', 'polling'],
    });
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  createTourGroup(data: {
    name: string;
    date: string;
    memberCount: number;
  }): Promise<TourGroup> {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error('Not connected'));
      this.socket.emit('createGroup', data, (response: { success: boolean; group?: TourGroup; error?: string }) => {
        if (response.success && response.group) {
          resolve(response.group);
        } else {
          reject(new Error(response.error || 'Failed to create group'));
        }
      });
    });
  }

  joinGroup(data: { joinCode: string; memberName: string }): Promise<{ group: TourGroup; member: Member }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error('Not connected'));
      this.socket.emit('joinGroup', data, (response: { success: boolean; group?: TourGroup; member?: Member; error?: string }) => {
        if (response.success && response.group && response.member) {
          resolve({ group: response.group, member: response.member });
        } else {
          reject(new Error(response.error || 'Failed to join group'));
        }
      });
    });
  }

  getGroup(groupId: string): Promise<TourGroup | null> {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error('Not connected'));
      this.socket.emit('getGroup', groupId, (response: { success: boolean; group?: TourGroup | null; error?: string }) => {
        if (response.success) {
          resolve(response.group || null);
        } else {
          reject(new Error(response.error || 'Failed to get group'));
        }
      });
    });
  }

  updatePosition(data: { memberId: string; lat: number; lng: number }) {
    if (!this.socket) return;
    this.socket.emit('updatePosition', data);
  }

  startRollCall(groupId: string) {
    if (!this.socket) return;
    this.socket.emit('startRollCall', { groupId });
  }

  respondRollCall(memberId: string, groupId: string) {
    if (!this.socket) return;
    this.socket.emit('respondRollCall', { memberId, groupId });
  }

  clearMissingWarnings(groupId: string) {
    if (!this.socket) return;
    this.socket.emit('clearMissingWarnings', { groupId });
  }

  onMemberUpdate(callback: (member: Member) => void) {
    if (!this.socket) return;
    this.socket.on('memberUpdate', callback);
  }

  offMemberUpdate(callback: (member: Member) => void) {
    if (!this.socket) return;
    this.socket.off('memberUpdate', callback);
  }

  onRollCallStarted(callback: (endTime: number) => void) {
    if (!this.socket) return;
    this.socket.on('rollCallStarted', callback);
  }

  offRollCallStarted(callback: (endTime: number) => void) {
    if (!this.socket) return;
    this.socket.off('rollCallStarted', callback);
  }

  onRollCallResponse(callback: (memberId: string) => void) {
    if (!this.socket) return;
    this.socket.on('rollCallResponse', callback);
  }

  offRollCallResponse(callback: (memberId: string) => void) {
    if (!this.socket) return;
    this.socket.off('rollCallResponse', callback);
  }

  onRollCallEnded(callback: (missingMemberIds: string[]) => void) {
    if (!this.socket) return;
    this.socket.on('rollCallEnded', callback);
  }

  offRollCallEnded(callback: (missingMemberIds: string[]) => void) {
    if (!this.socket) return;
    this.socket.off('rollCallEnded', callback);
  }

  onMissingWarningsCleared(callback: () => void) {
    if (!this.socket) return;
    this.socket.on('missingWarningsCleared', callback);
  }

  offMissingWarningsCleared(callback: () => void) {
    if (!this.socket) return;
    this.socket.off('missingWarningsCleared', callback);
  }

  onOnlineMembersUpdate(callback: (onlineMemberIds: string[]) => void) {
    if (!this.socket) return;
    this.socket.on('onlineMembersUpdate', callback);
  }

  offOnlineMembersUpdate(callback: (onlineMemberIds: string[]) => void) {
    if (!this.socket) return;
    this.socket.off('onlineMembersUpdate', callback);
  }
}

export const socketClient = new SocketClient();
