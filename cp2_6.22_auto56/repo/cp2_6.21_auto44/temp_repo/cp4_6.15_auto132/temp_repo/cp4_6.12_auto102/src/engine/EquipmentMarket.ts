import { Equipment, Listing, TradeRecord } from '../types';

let listingIdCounter = 0;

function generateListingId(): string {
  listingIdCounter += 1;
  return `ls_${Date.now()}_${listingIdCounter}`;
}

export interface CreateListingParams {
  equipment: Equipment;
  sellerId: string;
  startPrice: number;
  duration: number;
}

export function createListing(params: CreateListingParams): Listing {
  return {
    id: generateListingId(),
    equipment: params.equipment,
    sellerId: params.sellerId,
    startPrice: params.startPrice,
    currentPrice: params.startPrice,
    highestBidderId: null,
    endTime: Date.now() + params.duration,
    duration: params.duration,
    status: 'active',
  };
}

export interface BidResult {
  success: boolean;
  message: string;
  newPrice: number;
}

export function placeBid(
  listing: Listing,
  bidderId: string,
  amount: number,
  allListings: Listing[]
): BidResult {
  const target = allListings.find(l => l.id === listing.id);
  if (!target) {
    return { success: false, message: '挂单不存在', newPrice: listing.currentPrice };
  }
  if (target.status !== 'active') {
    return { success: false, message: '挂单已结束', newPrice: listing.currentPrice };
  }
  if (Date.now() > target.endTime) {
    return { success: false, message: '竞拍已截止', newPrice: listing.currentPrice };
  }
  if (bidderId === target.sellerId) {
    return { success: false, message: '不能竞拍自己的挂单', newPrice: listing.currentPrice };
  }
  if (bidderId === target.highestBidderId) {
    return { success: false, message: '您已是当前最高出价者', newPrice: listing.currentPrice };
  }
  const minBid = target.currentPrice + Math.max(1, Math.floor(target.currentPrice * 0.05));
  if (amount < minBid) {
    return { success: false, message: `出价不能低于 ${minBid}`, newPrice: listing.currentPrice };
  }
  return { success: true, message: '出价成功', newPrice: amount };
}

export function checkListingCompletion(listing: Listing): Listing {
  if (listing.status === 'active' && Date.now() >= listing.endTime) {
    return { ...listing, status: 'completed' };
  }
  return listing;
}

export function createTradeRecord(listing: Listing): TradeRecord | null {
  if (listing.status !== 'completed') return null;
  return {
    id: `tr_${listing.id}`,
    equipment: listing.equipment,
    finalPrice: listing.currentPrice,
    buyerId: listing.highestBidderId || '',
    sellerId: listing.sellerId,
    completedAt: Date.now(),
  };
}

export function getTimeRemaining(endTime: number): number {
  return Math.max(0, endTime - Date.now());
}

export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return '已结束';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}秒`;
  const minutes = Math.floor(seconds / 60);
  const remainSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}分${remainSeconds}秒`;
  const hours = Math.floor(minutes / 60);
  const remainMinutes = minutes % 60;
  return `${hours}时${remainMinutes}分`;
}

export function getBidStep(currentPrice: number): number {
  return Math.max(1, Math.floor(currentPrice * 0.05));
}
