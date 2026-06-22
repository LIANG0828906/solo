import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';

vi.mock('axios', () => {
  const mockPost = vi.fn();
  const mockGet = vi.fn();
  return {
    default: {
      create: vi.fn(() => ({
        post: mockPost,
        get: mockGet,
      })),
    },
    __esModule: true,
    mockPost,
    mockGet,
  };
});

import { submitOrderApi, fetchOrderHistoryApi, OrderPayload, OrderResponse } from '../orderApi';
import { mockPost, mockGet } from 'axios';

describe('orderApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('submitOrderApi', () => {
    it('should send POST with correct payload to /orders and return response data', async () => {
      const mockPayload: OrderPayload = {
        chocolates: [
          {
            id: '1',
            flavorId: 'matcha',
            shape: 'circle',
            color: '#5D4037',
            texture: 'glossy',
          },
        ],
        giftBox: {
          boxShape: 'square',
          ribbonColor: '#D4AF37',
          cardText: 'Happy Birthday!',
          cardFont: 'Playfair Display',
          cardColor: '#3E2723',
        },
      };

      const mockResponse: OrderResponse = {
        orderId: 'test-order-123',
        status: 'pending',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      (mockPost as any).mockResolvedValue({
        data: mockResponse,
      });

      const result = await submitOrderApi(mockPayload);

      expect(axios.create).toHaveBeenCalledWith({
        baseURL: '/api',
      });
      expect(mockPost).toHaveBeenCalledWith('/orders', mockPayload);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('fetchOrderHistoryApi', () => {
    it('should send GET to /orders and return array', async () => {
      const mockHistory: OrderResponse[] = [
        {
          orderId: 'order-1',
          status: 'completed',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
        {
          orderId: 'order-2',
          status: 'pending',
          createdAt: '2024-01-02T00:00:00.000Z',
        },
      ];

      (mockGet as any).mockResolvedValue({
        data: mockHistory,
      });

      const result = await fetchOrderHistoryApi();

      expect(mockGet).toHaveBeenCalledWith('/orders');
      expect(result).toEqual(mockHistory);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
    });
  });
});
