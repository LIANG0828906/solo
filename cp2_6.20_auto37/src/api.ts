import axios, { AxiosInstance, AxiosResponse } from 'axios';
import type {
  Promotion,
  ABTest,
  CreatePromotionDto,
  UpdatePromotionDto,
  CreateABTestDto,
  RealtimeStats,
  HistoryData,
  UserGroup,
} from './types';

const request: AxiosInstance = axios.create({
  baseURL: '',
  timeout: 10000,
});

export const getPromotions = (): Promise<AxiosResponse<Promotion[]>> => {
  return request.get<Promotion[]>('/api/promotions');
};

export const createPromotion = (
  data: CreatePromotionDto
): Promise<AxiosResponse<Promotion>> => {
  return request.post<Promotion>('/api/promotions', data);
};

export const updatePromotion = (
  id: string,
  data: UpdatePromotionDto
): Promise<AxiosResponse<Promotion>> => {
  return request.put<Promotion>(`/api/promotions/${id}`, data);
};

export const deletePromotion = (
  id: string
): Promise<AxiosResponse<void>> => {
  return request.delete<void>(`/api/promotions/${id}`);
};

export const togglePromotion = (
  id: string
): Promise<AxiosResponse<Promotion>> => {
  return request.patch<Promotion>(`/api/promotions/${id}/toggle`);
};

export const getABTests = (): Promise<AxiosResponse<ABTest[]>> => {
  return request.get<ABTest[]>('/api/abtests');
};

export const createABTest = (
  data: CreateABTestDto
): Promise<AxiosResponse<ABTest>> => {
  return request.post<ABTest>('/api/abtests', data);
};

export const getRealtimeStats = (
  testId: string
): Promise<AxiosResponse<RealtimeStats>> => {
  return request.get<RealtimeStats>(`/api/abtests/${testId}/realtime`);
};

export const getHistoryData = (
  testId: string
): Promise<AxiosResponse<HistoryData[]>> => {
  return request.get<HistoryData[]>(`/api/abtests/${testId}/history`);
};

export const exportStats = async (
  testId: string
): Promise<void> => {
  const response = await request.get(`/api/abtests/${testId}/export`, {
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  const contentDisposition = response.headers['content-disposition'];
  const fileName = contentDisposition
    ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') || `stats-${testId}.csv`
    : `stats-${testId}.csv`;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const getUserGroups = (): Promise<AxiosResponse<UserGroup[]>> => {
  return request.get<UserGroup[]>('/api/user-groups');
};

export const mockPromotions = async (): Promise<Promotion[]> => {
  const promotionTypes: Promotion['type'][] = ['DISCOUNT', 'FULL_REDUCTION', 'GIFT'];
  const statuses: Promotion['status'][] = ['DRAFT', 'ACTIVE', 'INACTIVE', 'EXPIRED'];
  const promotionNames = [
    '夏季清仓大促', '新品首发优惠', '会员专享折扣', '满减狂欢节', '限时秒杀',
    '买一送一', '周末特惠', '节日狂欢', '品牌日', '新人专享',
    '双11预热', '618大促', '年终盛典', '周年庆', '开学季',
    '情人节特惠', '母亲节感恩', '父亲节特惠', '儿童节欢乐购', '国庆大放价'
  ];

  const now = new Date();
  const promotions: Promotion[] = [];

  for (let i = 0; i < 500; i++) {
    const promoType = promotionTypes[Math.floor(Math.random() * promotionTypes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const name = promotionNames[Math.floor(Math.random() * promotionNames.length)] + ` #${i + 1}`;

    let config: Promotion['config'];
    if (promoType === 'DISCOUNT') {
      config = {
        discountRate: Math.floor(Math.random() * 50 + 50) / 100,
        minAmount: Math.random() > 0.5 ? Math.floor(Math.random() * 200 + 50) : undefined,
      };
    } else if (promoType === 'FULL_REDUCTION') {
      config = {
        fullAmount: [100, 200, 300, 500, 1000][Math.floor(Math.random() * 5)],
        reductionAmount: [10, 20, 30, 50, 100][Math.floor(Math.random() * 5)],
      };
    } else {
      const gifts = ['精美礼品', '品牌周边', '优惠券礼包', '小样套装', '免邮券'];
      config = {
        giftName: gifts[Math.floor(Math.random() * gifts.length)],
        minAmount: Math.random() > 0.5 ? Math.floor(Math.random() * 200 + 50) : undefined,
      };
    }

    const startOffset = Math.floor(Math.random() * 60 - 30);
    const endOffset = startOffset + Math.floor(Math.random() * 54 + 7);

    const startTime = new Date(now.getTime() + startOffset * 24 * 60 * 60 * 1000);
    const endTime = new Date(now.getTime() + endOffset * 24 * 60 * 60 * 1000);
    const createdAt = new Date(now.getTime() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000);

    promotions.push({
      id: `promo-${i}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      type: promoType,
      config,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      status,
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
    });
  }

  return promotions;
};

export default request;
