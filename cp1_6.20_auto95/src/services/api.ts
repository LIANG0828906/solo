import axios from 'axios';
import type { BoxSeries, User, Auction, Artwork, Transaction, Notification } from '../../shared/types';

const api = axios.create({ baseURL: '/api' });

export const DEFAULT_USER_ID = 'user-default';

export interface BuyBoxResult {
  artwork: Artwork;
  newBalance: number;
}

export const apiService = {
  getSeries: (): Promise<BoxSeries[]> => api.get('/series').then(r => r.data),
  getSeriesById: (id: string): Promise<BoxSeries> => api.get(`/series/${id}`).then(r => r.data),
  getArtworks: (): Promise<(Artwork & { seriesName: string })[]> => api.get('/artworks').then(r => r.data),
  getArtworkById: (id: string): Promise<Artwork & { seriesName: string }> => api.get(`/artworks/${id}`).then(r => r.data),
  buyBox: (seriesId: string, userId: string = DEFAULT_USER_ID): Promise<BuyBoxResult> =>
    api.post('/boxes/buy', { seriesId, userId }).then(r => r.data),

  getUser: (id: string = DEFAULT_USER_ID): Promise<User> => api.get(`/users/${id}`).then(r => r.data),
  updateUser: (user: Partial<User>, id: string = DEFAULT_USER_ID): Promise<User> =>
    api.put(`/users/${id}`, user).then(r => r.data),
  getTransactions: (userId: string = DEFAULT_USER_ID): Promise<Transaction[]> =>
    api.get(`/users/${userId}/transactions`).then(r => r.data),
  getNotifications: (userId: string = DEFAULT_USER_ID): Promise<Notification[]> =>
    api.get(`/users/${userId}/notifications`).then(r => r.data),
  markNotificationRead: (id: string): Promise<void> => api.post(`/notifications/${id}/read`),

  getAuctions: (): Promise<Auction[]> => api.get('/auctions').then(r => r.data),
  getAuction: (id: string): Promise<Auction> => api.get(`/auctions/${id}`).then(r => r.data),
  createAuction: (
    artworkId: string,
    startingPrice: number,
    duration: 24 | 48 | 72,
    sellerId: string = DEFAULT_USER_ID
  ): Promise<Auction> =>
    api.post('/auctions', { artworkId, sellerId, startingPrice, duration }).then(r => r.data),
  placeBid: (auctionId: string, amount: number, userId: string = DEFAULT_USER_ID): Promise<Auction> =>
    api.post(`/auctions/${auctionId}/bid`, { userId, amount }).then(r => r.data)
};
