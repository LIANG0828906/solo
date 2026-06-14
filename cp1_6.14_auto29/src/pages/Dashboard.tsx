// 数据流向：store → Dashboard 页面 → 子组件（UserCard, PointChart, Virtuoso列表）
// 调用链：useEffect → fetchPointsData → API GET /api/points → store更新 → 页面重渲染
// 依赖：@/store/useStore, @/components/PointChart, @/components/UserCard, react-virtuoso, react-router-dom

import { useEffect, useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import { Virtuoso } from 'react-virtuoso'
import { useStore } from '@/store/useStore'
import UserCard from '@/components/UserCard'
import PointChart from '@/components/PointChart'
import type { PointRecord, ExchangeRecord } from '@/types'

export default function Dashboard() {
  const { user, weekPoints, monthPoints, history, fetchPointsData } = useStore()

  useEffect(() => {
    fetchPointsData()
  }, [fetchPointsData])

  const monthChartData: PointRecord[] = useMemo(() => {
    if (!monthPoints) return []
    return monthPoints.dates.map((date, index) => ({
      id: `month-${index}`,
      date,
      points: monthPoints.points[index] || 0,
      description: '',
    }))
  }, [monthPoints