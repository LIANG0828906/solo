export default function CreateActivity() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6 text-[var(--color-text-primary)]">
        创建读书会活动
      </h1>
      <div className="card">
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">活动名称</label>
            <input
              type="text"
              className="input"
              placeholder="请输入活动名称"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">开始时间</label>
              <input type="datetime-local" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">地点</label>
              <input type="text" className="input" placeholder="活动地点" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">活动描述</label>
            <textarea
              className="input min-h-[120px]"
              placeholder="请输入活动描述"
            />
          </div>
          <button type="submit" className="btn btn-primary w-full">
            创建活动
          </button>
        </form>
      </div>
    </div>
  )
}
