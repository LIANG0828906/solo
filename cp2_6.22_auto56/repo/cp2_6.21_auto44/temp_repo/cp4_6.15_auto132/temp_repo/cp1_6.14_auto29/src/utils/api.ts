import axios from 'axios'
import type {
  ExchangeRequest,
  ExchangeResponse,
  PointsDataResponse,
  ProductsResponse,
} from '@/types'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

export const getPoints = async (): Promise<PointsDataResponse> => {
  const response = await request.get<PointsDataResponse>('/points')
  return response.data
}

export const getProducts = async (): Promise<ProductsResponse> => {
  const response = await request.get<ProductsResponse>('/products')
  return response.data
}

export const exchange = async (data: ExchangeRequest): Promise<ExchangeResponse> => {
  const response = await request.post<ExchangeResponse>('/exchange', data)
  return response.data
}
