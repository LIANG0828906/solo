import axios from 'axios';

export type User = { id: number; username: string; avatar: string; wallet: number } | null;

export type Artwork = {
  id: number;
  title: string;
  creator: string;
  description: string;
  imageUrl: string;
  startPrice: number;
  currentPrice: number;
  minIncrement: number;
  highestBidder: string | null;
  endTime: string;
  createdAt: string;
};

export type Bid = {
  id: number;
  artworkId: number;
  userId: number;
  username: string;
  avatar: string;
  amount: number;
  createdAt: string;
};

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => {
    return response.data.data !== undefined ? response.data.data : response.data;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const getArtworks = (): Promise<Artwork[]> => {
  return api.get('/artworks').then((res) => res.data);
};

export const getArtworkById = (id: number): Promise<Artwork> => {
  return api.get(`/artworks/${id}`).then((res) => res.data);
};

export const getBids = (artworkId: number): Promise<Bid[]> => {
  return api.get(`/artworks/${artworkId}/bids`).then((res) => res.data);
};

export const login = (username: string): Promise<User> => {
  return api.post('/auth/login', { username }).then((res) => res.data);
};

export const submitBid = (payload: {
  artworkId: number;
  userId: number;
  amount: number;
}): Promise<Bid> => {
  return api.post('/bids', payload).then((res) => res.data);
};

export const pollArtwork = (
  id: number
): Promise<{ artwork: Artwork; bids: Bid[] }> => {
  return api.get(`/artworks/${id}/poll`).then((res) => res.data);
};
