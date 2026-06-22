import { db, User } from '../db'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'

interface CreateUserInput {
  email: string
  password: string
  nickname: string
  city: string
}

export const createUser = async (input: CreateUserInput): Promise<User> => {
  await db.read()
  const hashedPassword = await bcrypt.hash(input.password, 10)
  const user: User = {
    id: uuidv4(),
    email: input.email.toLowerCase(),
    password: hashedPassword,
    nickname: input.nickname,
    city: input.city,
    creditScore: 100,
    createdAt: new Date().toISOString(),
  }
  db.data!.users.push(user)
  await db.write()
  return user
}

export const getUserByEmail = async (email: string): Promise<User | null> => {
  await db.read()
  return db.data!.users.find((user) => user.email === email.toLowerCase()) || null
}

export const getUserById = async (id: string): Promise<User | null> => {
  await db.read()
  return db.data!.users.find((user) => user.id === id) || null
}

export const verifyPassword = async (
  user: User,
  password: string
): Promise<boolean> => {
  return bcrypt.compare(password, user.password)
}

export const updateUser = async (
  id: string,
  updates: Partial<User>
): Promise<User | null> => {
  await db.read()
  const index = db.data!.users.findIndex((user) => user.id === id)
  if (index === -1) return null
  db.data!.users[index] = { ...db.data!.users[index], ...updates }
  await db.write()
  return db.data!.users[index]
}

export const updateCreditScore = async (
  userId: string,
  delta: number
): Promise<User | null> => {
  const user = await getUserById(userId)
  if (!user) return null
  const newScore = Math.max(0, Math.min(100, user.creditScore + delta))
  return updateUser(userId, { creditScore: newScore })
}

export const getPublicUser = (user: User): Omit<User, 'password'> => {
  const { password, ...publicUser } = user
  return publicUser
}
