import { v4 as uuidv4 } from 'uuid';
import type { ExchangeRequest, ExchangeStatus } from '../../types';
import {
  getAllExchangeRequests,
  saveExchangeRequests,
} from '../../utils/storage';
import { SkillModule } from '../skill/SkillModule';
import { UserModule } from '../user/UserModule';
import { MessageModule } from '../message/MessageModule';

export const ExchangeModule = {
  async createExchangeRequest(data: {
    requesterId: string;
    recipientId: string;
    targetSkillId: string;
    offeredSkillId: string;
    message: string;
  }): Promise<ExchangeRequest | null> {
    const requester = await UserModule.getUserById(data.requesterId);
    const recipient = await UserModule.getUserById(data.recipientId);
    const targetSkill = await SkillModule.getSkillById(data.targetSkillId);
    const offeredSkill = await SkillModule.getSkillById(data.offeredSkillId);

    if (!requester || !recipient || !targetSkill || !offeredSkill) {
      return null;
    }

    if (targetSkill.userId !== data.recipientId) {
      return null;
    }
    if (offeredSkill.userId !== data.requesterId) {
      return null;
    }

    const requests = await getAllExchangeRequests();
    const now = Date.now();
    const newRequest: ExchangeRequest = {
      id: uuidv4(),
      requesterId: data.requesterId,
      recipientId: data.recipientId,
      targetSkillId: data.targetSkillId,
      offeredSkillId: data.offeredSkillId,
      message: data.message,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    requests.push(newRequest);
    await saveExchangeRequests(requests);

    MessageModule.broadcast('request_status_change', {
      request: newRequest,
    });

    return newRequest;
  },

  async getRequestById(requestId: string): Promise<ExchangeRequest | null> {
    const requests = await getAllExchangeRequests();
    return requests.find((r) => r.id === requestId) || null;
  },

  async getUserExchangeRequests(
    userId: string
  ): Promise<ExchangeRequest[]> {
    const requests = await getAllExchangeRequests();
    return requests
      .filter(
        (r) => r.requesterId === userId || r.recipientId === userId
      )
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },

  async getPendingRequests(userId: string): Promise<ExchangeRequest[]> {
    const requests = await getAllExchangeRequests();
    return requests
      .filter(
        (r) => r.recipientId === userId && r.status === 'pending'
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  async acceptRequest(requestId: string): Promise<ExchangeRequest | null> {
    const requests = await getAllExchangeRequests();
    const index = requests.findIndex((r) => r.id === requestId);
    if (index === -1) return null;

    if (requests[index].status !== 'pending') {
      return null;
    }

    requests[index].status = 'accepted';
    requests[index].updatedAt = Date.now();
    await saveExchangeRequests(requests);

    MessageModule.broadcast('request_status_change', {
      request: requests[index],
    });

    return requests[index];
  },

  async rejectRequest(requestId: string): Promise<ExchangeRequest | null> {
    const requests = await getAllExchangeRequests();
    const index = requests.findIndex((r) => r.id === requestId);
    if (index === -1) return null;

    if (requests[index].status !== 'pending') {
      return null;
    }

    requests[index].status = 'rejected';
    requests[index].updatedAt = Date.now();
    await saveExchangeRequests(requests);

    MessageModule.broadcast('request_status_change', {
      request: requests[index],
    });

    return requests[index];
  },

  async completeExchange(requestId: string): Promise<ExchangeRequest | null> {
    const requests = await getAllExchangeRequests();
    const index = requests.findIndex((r) => r.id === requestId);
    if (index === -1) return null;

    if (requests[index].status !== 'accepted') {
      return null;
    }

    requests[index].status = 'completed';
    requests[index].updatedAt = Date.now();
    await saveExchangeRequests(requests);

    MessageModule.broadcast('request_status_change', {
      request: requests[index],
    });

    return requests[index];
  },

  async canReview(
    requestId: string,
    userId: string
  ): Promise<boolean> {
    const request = await this.getRequestById(requestId);
    if (!request) return false;
    if (request.status !== 'completed') return false;
    return (
      request.requesterId === userId || request.recipientId === userId
    );
  },
};
