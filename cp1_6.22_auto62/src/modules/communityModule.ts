export interface OnlinePet {
  id: string;
  name: string;
  type: 'cat' | 'dog' | 'dragon';
  ownerId: string;
  ownerName: string;
  mood: string;
  x: number;
  y: number;
}

export interface GiftResult {
  success: boolean;
  message: string;
}

const API_BASE = '/api';

export async function getOnlinePets(): Promise<OnlinePet[]> {
  const res = await fetch(`${API_BASE}/community/online-pets`);
  return res.json();
}

export async function sendGift(
  fromPetId: string,
  toPetId: string,
  giftType: string
): Promise<GiftResult> {
  const res = await fetch(`${API_BASE}/community/gift`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromPetId, toPetId, giftType }),
  });
  return res.json();
}
