import type { Point, ElementType, ScoreResponse } from '../shared/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export interface ScoringOptions {
  timeout?: number
  baseUrl?: string
}

export class SpellScoring {
  private baseUrl: string
  private timeout: number
  private pendingRequest: AbortController | null = null

  constructor(options: ScoringOptions = {}) {
    this.baseUrl = options.baseUrl || API_BASE_URL
    this.timeout = options.timeout || 500
  }

  public cancelPending(): void {
    if (this.pendingRequest) {
      this.pendingRequest.abort()
      this.pendingRequest = null
    }
  }

  public async requestScore(
    trajectory: Point[],
    element: ElementType,
  ): Promise<ScoreResponse> {
    this.cancelPending()

    const controller = new AbortController()
    this.pendingRequest = controller

    const timeoutId = setTimeout(() => {
      controller.abort()
    }, this.timeout)

    try {
      const normalizedTrajectory = this.normalizeTrajectory(trajectory)

      const response = await fetch(`${this.baseUrl}/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trajectory: normalizedTrajectory,
          element,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`评分请求失败: ${response.status}`)
      }

      const data = (await response.json()) as ScoreResponse
      return data
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof DOMException && error.name === 'AbortError') {
        return {
          score: 0,
          element,
          matchQuality: 'fail',
          message: '评分超时，请重试',
        }
      }

      console.error('评分请求错误:', error)
      return this.fallbackScore(trajectory, element)
    } finally {
      this.pendingRequest = null
    }
  }

  private normalizeTrajectory(trajectory: Point[]): Point[] {
    if (trajectory.length <= 50) {
      return trajectory
    }

    const step = Math.ceil(trajectory.length / 50)
    const normalized: Point[] = []

    for (let i = 0; i < trajectory.length; i += step) {
      normalized.push(trajectory[i])
    }

    if (normalized[normalized.length - 1] !== trajectory[trajectory.length - 1]) {
      normalized.push(trajectory[trajectory.length - 1])
    }

    return normalized
  }

  private fallbackScore(trajectory: Point[], element: ElementType): ScoreResponse {
    const pointCount = trajectory.length

    if (pointCount < 3) {
      return {
        score: 0,
        element,
        matchQuality: 'fail',
        message: '轨迹太短，无法识别',
      }
    }

    const score = Math.min(100, Math.floor(Math.random() * 40 + 40))
    const matchQuality = score >= 80 ? 'perfect' : score >= 60 ? 'normal' : 'fail'

    const messages = {
      perfect: '完美释放！魔力共鸣强烈！',
      normal: '不错，符咒基本成型！',
      fail: '符咒绘制失败，请重试',
    }

    return {
      score,
      element,
      matchQuality,
      message: messages[matchQuality],
    }
  }

  public async submitLeaderboard(
    nickname: string,
    score: number,
    element: ElementType,
  ): Promise<{ success: boolean; rank: number; isTopTen: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/leaderboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname,
          score,
          element,
        }),
      })

      if (!response.ok) {
        throw new Error(`提交排行榜失败: ${response.status}`)
      }

      return (await response.json()) as { success: boolean; rank: number; isTopTen: boolean }
    } catch (error) {
      console.error('提交排行榜错误:', error)
      return {
        success: false,
        rank: -1,
        isTopTen: false,
      }
    }
  }

  public async fetchLeaderboard(): Promise<Array<{ rank: number; nickname: string; score: number; isNewRecord?: boolean }>> {
    try {
      const response = await fetch(`${this.baseUrl}/leaderboard`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`获取排行榜失败: ${response.status}`)
      }

      const data = (await response.json()) as { rankings: Array<{ rank: number; nickname: string; score: number; isNewRecord?: boolean }> }
      return data.rankings
    } catch (error) {
      console.error('获取排行榜错误:', error)
      return []
    }
  }
}
