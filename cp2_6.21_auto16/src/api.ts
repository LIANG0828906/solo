import axios from 'axios';

export type User = { id: number; username: string; avatar: string; wallet: number } | null;

export type Artwork = {
  id: number;
  title: string;
  creator: string;
  description: string;
  category: string;
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
  (response) => response.data,
  (error) => Promise.reject(error)
);

const convertArtwork = (data: any): Artwork => ({
  id: data.id,
  title: data.title,
  creator: data.creator,
  description: data.description,
  category: data.category,
  imageUrl: data.image_url,
  startPrice: data.start_price,
  currentPrice: data.current_price,
  minIncrement: data.min_increment,
  highestBidder: data.highest_bidder,
  endTime: data.end_time,
  createdAt: data.created_at,
});

const convertBid = (data: any): Bid => ({
  id: data.id,
  artworkId: data.artwork_id,
  userId: data.user_id,
  username: data.username,
  avatar: data.avatar,
  amount: data.amount,
  createdAt: data.created_at,
});

export const getArtworks = (): Promise<Artwork[]> => {
  return api.get('/artworks').then((res) => res.map(convertArtwork));
};

export const getArtworkById = (id: number): Promise<Artwork> => {
  return api.get(`/artworks/${id}`).then(convertArtwork);
};

export const getBids = (artworkId: number): Promise<Bid[]> => {
  return api.get(`/artworks/${artworkId}/bids`).then((res) => res.map(convertBid));
};

export const login = (username: string): Promise<User> => {
  return api.post('/auth/login', { username });
};

export const submitBid = (payload: {
  artworkId: number;
  userId: number;
  amount: number;
}): Promise<Bid> => {
  return api.post('/bids', {
    artwork_id: payload.artworkId,
    user_id: payload.userId,
    amount: payload.amount,
  }).then(convertBid);
};

export const pollArtwork = (
  id: number
): Promise<{ artwork: Artwork; bids: Bid[] }> => {
  return api.get(`/artworks/${id}/poll`).then((res) => ({
    artwork: convertArtwork(res.artwork),
    bids: res.bids.map(convertBid),
  }));
};
