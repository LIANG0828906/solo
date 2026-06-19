import { useParams, Link } from 'react-router-dom'

export default function ActivityDetail() {
  const { id } = useParams()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card mb-6">
        <h1 className="text-3xl font-bold mb-4 text-[var(--color-text-primary)]">
          活动详情 #{id}
        </h1>
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-[var(--color-text-secondary)]">
            <span>时间：2024-01-15 19:00</span>
            <span>地点：书店二楼</span>
          </div>
          <p className="text-[var(--color-text-primary)] leading-relaxed">
            这是一个读书会活动的详细描述。我们将一起探讨书中的精彩内容，分享阅读心得。
          </p>
        </div>
      </div>
      <div className="flex gap-4">
        <Link
          to={`/checkin/${id}`}
          className="btn btn-primary"
        >
          前往签到
        </Link>
        <button className="btn btn-secondary">
          查看签到记录
        </button>
      </div>
    </div>
  )
}
