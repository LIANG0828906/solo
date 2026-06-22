import { db, Notification } from '../db'
import { v4 as uuidv4 } from 'uuid'

interface CreateNotificationInput {
  userId: string
  type: Notification['type']
  title: string
  content: string
  relatedId: string
}

export const createNotification = async (
  input: CreateNotificationInput
): Promise<Notification> => {
  await db.read()
  const notification: Notification = {
    id: uuidv4(),
    userId: input.userId,
    type: input.type,
    title: input.title,
    content: input.content,
    relatedId: input.relatedId,
    read: false,
    createdAt: new Date().toISOString(),
  }
  db.data!.notifications.push(notification)
  await db.write()
  return notification
}

export const getNotificationsByUser = async (
  userId: string,
  limit: number = 20
): Promise<Notification[]> => {
  await db.read()
  const notifications = db.data!.notifications.filter(
    (n) => n.userId === userId
  )
  notifications.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  return notifications.slice(0, limit)
}

export const getUnreadCount = async (userId: string): Promise<number> => {
  await db.read()
  return db.data!.notifications.filter(
    (n) => n.userId === userId && !n.read
  ).length
}

export const markAsRead = async (notificationId: string): Promise<boolean> => {
  await db.read()
  const index = db.data!.notifications.findIndex((n) => n.id === notificationId)
  if (index === -1) return false
  db.data!.notifications[index].read = true
  await db.write()
  return true
}

export const markAllAsRead = async (userId: string): Promise<number> => {
  await db.read()
  let count = 0
  db.data!.notifications.forEach((n, index) => {
    if (n.userId === userId && !n.read) {
      db.data!.notifications[index].read = true
      count++
    }
  })
  await db.write()
  return count
}
