import { v4 as uuidv4 } from 'uuid'
import type { Auction, Bid } from './types'

const auctions = new Map<string, Auction>()
const auctionTimers = new Map<string, NodeJS.Timeout>()

const TIME_EXTEND_SECONDS = 30

function createAuction(data: {
  title: string
  description: string
  startPrice: number
  startTime: 'now' | number
  duration: number
  creator: string
}): Auction {
  const id = uuidv4()
  const now = Date.now()
  
  let actualStartTime: number
  if (data.startTime === 'now') {
    actualStartTime = now
  } else {
    actualStartTime = data.startTime
  }
  
  const endTime = actualStartTime + data.duration * 60 * 1000
  
  let status: Auction['status'] = 'upcoming'
  if (data.startTime === 'now') {
    status = 'ongoing'
  } else if (actualStartTime <= now) {
    status = 'ongoing'
  }
  
  const auction: Auction = {
    id,
    title: data.title,
    description: data.description,
    startPrice: data.startPrice,
    currentPrice: data.startPrice,
    startTime: actualStartTime,
    duration: data.duration * 60 * 1000,
    endTime,
    status,
    bids: [],
    creator: data.creator
  }
  
  auctions.set(id, auction)
  
  if (status === 'ongoing') {
    scheduleAuctionEnd(id)
  } else if (status === 'upcoming') {
    const delay = actualStartTime - now
    setTimeout(() => {
      const auc = auctions.get(id)
      if (auc && auc.status === 'upcoming') {
        auc.status = 'ongoing'
        scheduleAuctionEnd(id)
      }
    }, delay)
  }
  
  return auction
}

function scheduleAuctionEnd(auctionId: string) {
  const auction = auctions.get(auctionId)
  if (!auction) return
  
  const existingTimer = auctionTimers.get(auctionId)
  if (existingTimer) {
    clearTimeout(existingTimer)
  }
  
  const delay = auction.endTime - Date.now()
  if (delay <= 0) {
    endAuction(auctionId)
    return
  }
  
  const timer = setTimeout(() => {
    endAuction(auctionId)
  }, delay)
  
  auctionTimers.set(auctionId, timer)
}

function placeBid(auctionId: string, bidder: string, amount: number): { success: boolean; bid?: Bid; message?: string } {
  const auction = auctions.get(auctionId)
  
  if (!auction) {
    return { success: false, message: '拍卖不存在' }
  }
  
  if (auction.status !== 'ongoing') {
    return { success: false, message: '拍卖未在进行中' }
  }
  
  if (amount < auction.currentPrice + 1) {
    return { success: false, message: `出价必须至少为 ${auction.currentPrice + 1} 元` }
  }
  
  if (!Number.isInteger(amount)) {
    return { success: false, message: '出价必须为整数' }
  }
  
  const bid: Bid = {
    id: uuidv4(),
    bidder,
    amount,
    timestamp: Date.now()
  }
  
  auction.bids.unshift(bid)
  auction.currentPrice = amount
  
  const timeExtendMs = TIME_EXTEND_SECONDS * 1000
  const remaining = auction.endTime - Date.now()
  if (remaining < timeExtendMs) {
    auction.endTime = Date.now() + timeExtendMs
  }
  
  scheduleAuctionEnd(auctionId)
  
  return { success: true, bid }
}

function endAuction(auctionId: string) {
  const auction = auctions.get(auctionId)
  if (!auction || auction.status === 'ended') return
  
  auction.status = 'ended'
  
  if (auction.bids.length > 0) {
    auction.result = 'sold'
    auction.winner = auction.bids[0].bidder
  } else {
    auction.result = 'unsold'
  }
  
  const timer = auctionTimers.get(auctionId)
  if (timer) {
    clearTimeout(timer)
    auctionTimers.delete(auctionId)
  }
}

function getAuction(id: string): Auction | undefined {
  return auctions.get(id)
}

function getAuctions(
  page: number,
  pageSize: number,
  status?: string,
  keyword?: string
): { auctions: Auction[]; total: number } {
  let list = Array.from(auctions.values())
  
  updateAuctionStatuses(list)
  
  if (status && status !== 'all') {
    list = list.filter(a => a.status === status)
  }
  
  if (keyword) {
    const kw = keyword.toLowerCase()
    list = list.filter(a => a.title.toLowerCase().includes(kw))
  }
  
  list.sort((a, b) => {
    const statusOrder = { ongoing: 0, upcoming: 1, ended: 2 }
    const statusDiff = statusOrder[a.status] - statusOrder[b.status]
    if (statusDiff !== 0) return statusDiff
    
    if (a.status === 'ongoing') {
      return a.endTime - b.endTime
    }
    if (a.status === 'upcoming') {
      return a.startTime - b.startTime
    }
    return b.endTime - a.endTime
  })
  
  const total = list.length
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paginated = list.slice(start, end)
  
  return { auctions: paginated, total }
}

function updateAuctionStatuses(auctionList: Auction[]) {
  const now = Date.now()
  for (const auction of auctionList) {
    if (auction.status === 'upcoming' && auction.startTime <= now) {
      auction.status = 'ongoing'
      scheduleAuctionEnd(auction.id)
    }
    if (auction.status === 'ongoing' && auction.endTime <= now) {
      endAuction(auction.id)
    }
  }
}

function getBids(auctionId: string): Bid[] {
  const auction = auctions.get(auctionId)
  return auction ? auction.bids : []
}

function getAuctionEndTime(auctionId: string): number | null {
  const auction = auctions.get(auctionId)
  return auction ? auction.endTime : null
}

export {
  createAuction,
  placeBid,
  endAuction,
  getAuction,
  getAuctions,
  getBids,
  getAuctionEndTime,
  TIME_EXTEND_SECONDS
}
