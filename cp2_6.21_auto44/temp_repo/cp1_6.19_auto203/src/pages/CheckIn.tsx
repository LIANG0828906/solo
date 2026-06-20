import { useState } from 'react'
import { useParams } from 'react-router-dom'

export default function CheckIn() {
  const { activityId } = useParams()
  const [checkedIn, setCheckedIn] = useState(false)

  const handleCheckIn = () => {
    setCheckedIn(true)
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card text-center">
        <h1 className="text-2xl font-bold mb-2 text-[var(--color-text-primary)]">
          活动签到
        </h1>
        <p className="text-[var(--color-text-secondary)] mb-6">
          活动 #{activityId}
        </p>

        {checkedIn ? (
          <div className="checkin-success">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-xl font-semibold text-green-600">签到成功！</p>
            <p className="text-[var(--color-text-secondary)] mt-2">
              感谢您的参与
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-left">
                  姓名
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="请输入您的姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-left">
                  手机号
                </label>
                <input
                  type="tel"
                  className="input"
                  placeholder="请输入您的手机号"
                />
              </div>
            </div>
            <button
              onClick={handleCheckIn}
              className="btn btn-primary w-full"
            >
              确认签到
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
