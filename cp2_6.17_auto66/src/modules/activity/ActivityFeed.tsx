import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatRelative } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Heart, MessageCircle } from 'lucide-react'
import { useActivityStore } from './store'
import { parseTimestamp } from '@/utils/time'

function formatTime(timestamp: number): string {
  return formatRelative(parseTimestamp(timestamp), Date.now(), { locale: zhCN })
}

export default function ActivityFeed() {
  const navigate = useNavigate()
  const allActivities = useActivityStore(s => s.activities)
  const activities = useMemo(
    () =>
      [...allActivities]
        .sort((a, b) => parseTimestamp(b.createdAt) - parseTimestamp(a.createdAt))
        .slice(0, 5),
    [allActivities]
  )

  return (
    <div className="w-[320px] max-md:w-full flex-shrink-0 bg-[#F5F6FA] p-5 max-md:rounded-2xl max-md:mb-6 h-fit">
      <h2 className="text-lg font-bold text-gray-800 mb-4">最近活动</h2>

      {activities.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">暂无活动动态</p>
      ) : (
        <div className="space-y-4">
          {activities.map(activity => (
            <div
              key={activity.id}
              onClick={() => navigate(`/project/${activity.projectId}`)}
              className="flex gap-3 cursor-pointer p-2 -mx-2 rounded-lg hover:bg-white/60 transition-colors"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
                {activity.type === 'like' ? (
                  <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                    <Heart size={14} fill="#E74C3C" color="#E74C3C" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                    <MessageCircle size={14} color="#27AE60" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 leading-snug">
                  <span className="font-medium text-gray-800">{activity.user}</span>
                  {activity.type === 'like' ? ' 赞了 ' : ' 评论了 '}
                  <span className="font-medium text-[#27AE60]">「{activity.projectTitle}」</span>
                </p>
                {activity.type === 'comment' && activity.content && (
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    「{activity.content}」
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {formatTime(activity.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
