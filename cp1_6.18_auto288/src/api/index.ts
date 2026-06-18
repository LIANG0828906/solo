const BASE_URL = '/api'

export interface Item {
  id: string
  name: string
  description: string
  status: 'available' | 'borrowed'
  createdAt: string
}

export interface BorrowRecord {
  id: string
  itemId: string
  itemName: string
  borrowerName: string
  days: number
  remark?: string
  status: 'active' | 'returned'
  borrowTime: string
}

export interface BorrowRequest {
  borrowerName: string
  days: number
  remark?: string
}

export const fetchItems = async (name?: string): Promise<Item[]> => {
  const url = name ? `${BASE_URL}/items?name=${encodeURIComponent(name)}` : `${BASE_URL}/items`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('获取物品列表失败')
  }
  return response.json()
}

export const borrowItem = async (id: string, data: BorrowRequest): Promise<BorrowRecord> => {
  const response = await fetch(`${BASE_URL}/items/${id}/borrow`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('借用物品失败')
  }
  return response.json()
}

export const fetchBorrows = async (): Promise<BorrowRecord[]> => {
  const response = await fetch(`${BASE_URL}/borrows`)
  if (!response.ok) {
    throw new Error('获取借用记录失败')
  }
  return response.json()
}
