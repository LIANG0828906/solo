import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

export interface User {
  id: string
  username: string
  passwordHash: string
}

export interface RegisterResult {
  success: boolean
  userId?: string
  username?: string
  error?: string
}

export interface LoginResult {
  success: boolean
  userId?: string
  username?: string
  error?: string
}

const users = new Map<string, User>()

export async function registerUser(username: string, password: string): Promise<RegisterResult> {
  try {
    if (!username || !password) {
      return { success: false, error: '用户名和密码不能为空' }
    }

    if (username.length < 3) {
      return { success: false, error: '用户名至少3个字符' }
    }

    if (password.length < 6) {
      return { success: false, error: '密码至少6个字符' }
    }

    const exists = Array.from(users.values()).find(u => u.username === username)
    if (exists) {
      return { success: false, error: '用户名已存在' }
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const id = uuidv4()
    const user: User = { id, username, passwordHash }
    users.set(id, user)

    return { success: true, userId: id, username }
  } catch (error) {
    return { success: false, error: '注册失败' }
  }
}

export async function loginUser(username: string, password: string): Promise<LoginResult> {
  try {
    if (!username || !password) {
      return { success: false, error: '用户名和密码不能为空' }
    }

    const user = Array.from(users.values()).find(u => u.username === username)
    if (!user) {
      return { success: false, error: '用户名或密码错误' }
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return { success: false, error: '用户名或密码错误' }
    }

    return { success: true, userId: user.id, username: user.username }
  } catch (error) {
    return { success: false, error: '登录失败' }
  }
}

export function getUserById(userId: string): User | undefined {
  return users.get(userId)
}
