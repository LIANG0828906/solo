export default function ActivityList() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6 text-[var(--color-text-primary)]">
        读书会活动
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-2">活动列表页</h2>
          <p className="text-[var(--color-text-secondary)]">
            显示所有读书会活动
          </p>
        </div>
      </div>
    </div>
  )
}
