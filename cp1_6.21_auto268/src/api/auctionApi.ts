import axios from 'axios'
import type { Auction, Bid } from '../types'

const api = axios.create({
  baseURL: '/api',
  timeout: 5000
})

export async function getAuctions(
  page: number = 1,
  pageSize: number = 10,
  status?: string,
  keyword?: string
): Promise<{ auctions: Auction[]; total: number }> {
  const params: Record<string, any> = { page, pageSize }
  if (status && status !== 'all') params.status = status
  if (keyword) params.keyword = keyword
  
  const res = await api.get('/auctions', { params })
  return res.data
}

export async function getAuctionById(id: string): Promise<Auction> {
  const res = await api.get(`/auctions/${id}`)
  return res.data
}

export async function createAuction(data: {
  title: string
  description: string
  startPrice: number
  startTime: 'now' | number
  duration: number
  creator: string
}): Promise<Auction> {
  const res = await api.post('/auctions', data)
  return res.data
}

export async function getBids(auctionId: string): Promise<Bid[]> {
  const res = await api.get(`/auctions/${auctionId}/bids`)
  return res.data
}
