/**
 * ============================================================
 *  ScoreLog - 得分日志组件
 * ============================================================
 *
 *  依赖关系：
 *    - 依赖: src/store.ts (读取得分记录)
 *    - 依赖: src/types.ts (ScoreLog, Team 类型)
 *    - 依赖: date-fns (日期时间格式化)
 *
 *  数据流向：
 *    输入: 从 store 读取 scoreLogs 数组和 teams 数组
 *    输出: 展示格式化后的得分记录表，支持按小组筛选
 *
 *  与其他组件的交互：
 *    - QuizPanel: 间接关联，题目管理不直接影响得分日志
 *    - BuzzerPage:
 *        - BuzzerPage 调用 store.submitAnswer 产生得分记录
 *        - 本组件从 store 读取最新的得分记录并展示
 *    - TeamBoard: 共享相同的 teams 数据，用于筛选和展示小组信息
 *
 *  功能特点：
 *    - 按时间倒序展示得分记录
 *    - 支持按小组筛选查看
 *    - 显示得分变化（+10/-5/0）
 *    - 显示答题结果（正确/错误/超时）
 *    - 格式化时间戳为易读格式
 * ============================================================
 */

import React, { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Filter, Clock, Trophy } from 'lucide-react'
import { useQuizStore } from '../store'
import type { AnswerResult } from '../types'

const ScoreLog: React.FC = () => {
  const { scoreLogs, teams } = useQuizStore()
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all')

  const filteredLogs = useMemo(() => {
    if (selectedTeamId === 'all') return scoreLogs
    return scoreLogs.filter((log) => log.teamId === selectedTeamId)
  }, [scoreLogs, selectedTeamId])

  const getResultLabel = (result: AnswerResult) => {
    switch (result) {
      case 'correct':
        return { text: '正确', className: 'text-green-400 bg-green-500/20' }
      case 'wrong':
        return { text: '错误', className: 'text-red-400 bg-red-500/20' }
      case 'timeout':
        return { text: '超时', className: 'text-yellow-400 bg-yellow-500/20' }
      default:
        return { text: '未知', className: 'text-gray-400 bg-gray-500/20' }
    }
  }

  const getScoreChangeClass = (change: number) => {
    if (change > 0) return 'text-green-400'
    if (change < 0) return 'text-red-400'
    return 'text-gray-400'
  }

  const team = teams.find((t) => t.id === selectedTeamId)

  return (
    <div className="w-full rounded-2xl backdrop-blur-lg bg-white/10 overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="text-yellow-400" size={20} />
          <h3 className="text-lg font-bold text-white">得分日志</h3>
          <span className="text-white/50 text-sm">({filteredLogs.length} 条)</span>
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-white/50" />
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-sm border border-white/20 focus:border-blue-400 focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-slate-800">
              全部小组
            </option>
            {teams.map((t) => (
              <option key={t.id} value={t.id} className="bg-slate-800">
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="mx-auto text-white/20 mb-2" size={32} />
            <p className="text-white/40">暂无得分记录</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 bg-white/5 backdrop-blur-sm">
              <tr className="text-white/60 text-sm">
                <th className="text-left p-3 font-medium">时间</th>
                <th className="text-left p-3 font-medium">小组</th>
                <th className="text-left p-3 font-medium">题目</th>
                <th className="text-left p-3 font-medium">结果</th>
                <th className="text-right p-3 font-medium">得分</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => {
                const resultInfo = getResultLabel(log.result)
                const teamInfo = teams.find((t) => t.id === log.teamId)
                return (
                  <tr
                    key={log.id}
                    className="border-t border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-3 text-white/60 text-sm whitespace-nowrap">
                      {format(log.timestamp, 'MM-dd HH:mm:ss', { locale: zhCN })}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {teamInfo && (
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: teamInfo.color }}
                          />
                        )}
                        <span className="text-white font-medium">{log.teamName}</span>
                      </div>
                    </td>
                    <td className="p-3 text-white/80 text-sm max-w-xs truncate">
                      {log.questionContent}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${resultInfo.className}`}
                      >
                        {resultInfo.text}
                      </span>
                    </td>
                    <td className={`p-3 text-right font-bold tabular-nums ${getScoreChangeClass(log.scoreChange)}`}>
                      {log.scoreChange > 0 ? '+' : ''}
                      {log.scoreChange}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default ScoreLog
