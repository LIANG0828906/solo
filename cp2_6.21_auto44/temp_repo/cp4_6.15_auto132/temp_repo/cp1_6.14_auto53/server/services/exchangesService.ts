import { db, Exchange } from '../db'
import { v4 as uuidv4 } from 'uuid'
import { updateCreditScore } from './usersService'
import { updateItem } from './itemsService'
import { createNotification } from './notificationsService'

interface CreateExchangeInput {
  itemId: string
  requesterId: string
  ownerId: string
  message: string
}

export const createExchange = async (
  input: CreateExchangeInput
): Promise<Exchange> => {
  await db.read()
  const exchange: Exchange = {
    id: uuidv4(),
    itemId: input.itemId,
    requesterId: input.requesterId,
    ownerId: input.ownerId,
    message: input.message,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  db.data!.exchanges.push(exchange)
  await db.write()

  await createNotification({
    userId: input.ownerId,
    type: 'new_request',
    title: '新的交换请求',
    content: '有人对你的物品发起了交换请求',
    relatedId: exchange.id,
  })

  return exchange
}

export const getExchangeById = async (id: string): Promise<Exchange | null> => {
  await db.read()
  return db.data!.exchanges.find((e) => e.id === id) || null
}

export const hasExistingExchange = async (
  itemId: string,
  requesterId: string
): Promise<boolean> => {
  await db.read()
  return db.data!.exchanges.some(
    (e) =>
      e.itemId === itemId &&
      e.requesterId === requesterId &&
      (e.status === 'pending' || e.status === 'accepted')
  )
}

export const getExchangesByUser = async (
  userId: string
): Promise<Exchange[]> => {
  await db.read()
  const exchanges = db.data!.exchanges.filter(
    (e) => e.requesterId === userId || e.ownerId === userId
  )
  exchanges.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
  return exchanges
}

export const getPendingExchangesByOwner = async (
  ownerId: string
): Promise<Exchange[]> => {
  await db.read()
  const exchanges = db.data!.exchanges.filter(
    (e) => e.ownerId === ownerId && e.status === 'pending'
  )
  exchanges.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  return exchanges
}

export const acceptExchange = async (exchangeId: string): Promise<Exchange | null> => {
  const exchange = await getExchangeById(exchangeId)
  if (!exchange) return null
  if (exchange.status !== 'pending') return exchange

  await db.read()
  const index = db.data!.exchanges.findIndex((e) => e.id === exchangeId)
  db.data!.exchanges[index].status = 'accepted'
  db.data!.exchanges[index].updatedAt = new Date().toISOString()
  await db.write()

  await updateItem(exchange.itemId, { status: 'exchanging' })

  const otherPending = db.data!.exchanges.filter(
    (e) => e.itemId === exchange.itemId && e.status === 'pending' && e.id !== exchangeId
  )
  for (const pending of otherPending) {
    const idx = db.data!.exchanges.findIndex((e) => e.id === pending.id)
    db.data!.exchanges[idx].status = 'rejected'
    db.data!.exchanges[idx].updatedAt = new Date().toISOString()
  }
  await db.write()

  await createNotification({
    userId: exchange.requesterId,
    type: 'request_accepted',
    title: '交换请求已同意',
    content: '你的交换请求已被同意，快去完成交换吧',
    relatedId: exchangeId,
  })

  return db.data!.exchanges[index]
}

export const rejectExchange = async (exchangeId: string): Promise<Exchange | null> => {
  const exchange = await getExchangeById(exchangeId)
  if (!exchange) return null

  await db.read()
  const index = db.data!.exchanges.findIndex((e) => e.id === exchangeId)
  db.data!.exchanges[index].status = 'rejected'
  db.data!.exchanges[index].updatedAt = new Date().toISOString()
  await db.write()

  await createNotification({
    userId: exchange.requesterId,
    type: 'request_rejected',
    title: '交换请求被拒绝',
    content: '你的交换请求被对方拒绝了',
    relatedId: exchangeId,
  })

  return db.data!.exchanges[index]
}

export const completeExchange = async (
  exchangeId: string,
  raterId: string,
  rating: number,
  comment: string
): Promise<Exchange | null> => {
  const exchange = await getExchangeById(exchangeId)
  if (!exchange) return null
  if (exchange.status !== 'accepted') return exchange

  const isRequester = exchange.requesterId === raterId
  const isOwner = exchange.ownerId === raterId

  await db.read()
  const index = db.data!.exchanges.findIndex((e) => e.id === exchangeId)

  if (isRequester) {
    db.data!.exchanges[index].requesterRating = rating
    db.data!.exchanges[index].requesterComment = comment
  } else if (isOwner) {
    db.data!.exchanges[index].ownerRating = rating
    db.data!.exchanges[index].ownerComment = comment
  }

  const hasBothRatings =
    db.data!.exchanges[index].requesterRating !== undefined &&
    db.data!.exchanges[index].ownerRating !== undefined

  if (hasBothRatings) {
    db.data!.exchanges[index].status = 'completed'
    db.data!.exchanges[index].updatedAt = new Date().toISOString()

    await updateItem(exchange.itemId, { status: 'exchanged' })

    const requesterRating = db.data!.exchanges[index].requesterRating!
    const ownerRating = db.data!.exchanges[index].ownerRating!

    const requesterDelta = requesterRating >= 4 ? 2 : -1
    const ownerDelta = ownerRating >= 4 ? 2 : -1

    await updateCreditScore(exchange.requesterId, requesterDelta)
    await updateCreditScore(exchange.ownerId, ownerDelta)

    await createNotification({
      userId: exchange.requesterId,
      type: 'exchange_completed',
      title: '交换完成',
      content: '交换已完成，感谢你的评价',
      relatedId: exchangeId,
    })

    await createNotification({
      userId: exchange.ownerId,
      type: 'exchange_completed',
      title: '交换完成',
      content: '交换已完成，感谢你的评价',
      relatedId: exchangeId,
    })
  }

  await db.write()
  return db.data!.exchanges[index]
}
