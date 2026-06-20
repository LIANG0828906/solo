import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'

const Dashboard = () => (
  <div>
    <h1 className="page-title">巡演仪表盘</h1>
    <div className="grid-4 mb-4">
      <div className="card card-expand">
        <div className="text-muted mb-2">巡演场次</div>
        <div className="text-gold" style={{ fontSize: 32, fontWeight: 700 }}>0</div>
      </div>
      <div className="card card-expand">
        <div className="text-muted mb-2">歌单数量</div>
        <div className="text-purple" style={{ fontSize: 32, fontWeight: 700 }}>0</div>
      </div>
      <div className="card card-expand">
        <div className="text-muted mb-2">乐队成员</div>
        <div style={{ fontSize: 32, fontWeight: 700 }}>0</div>
      </div>
      <div className="card card-expand">
        <div className="text-muted mb-2">参与率</div>
        <div className="text-gold" style={{ fontSize: 32, fontWeight: 700 }}>0%</div>
      </div>
    </div>
    <div className="card">
      <h2 className="section-title">最近巡演</h2>
      <p className="text-muted">暂无巡演数据，点击导航栏"巡演编辑"创建新的巡演计划。</p>
    </div>
  </div>
)

const TourDetail = () => (
  <div>
    <h1 className="page-title">巡演详情</h1>
    <div className="grid-2">
      <div className="card">
        <h2 className="section-title">巡演信息</h2>
        <p className="text-muted">选择或创建一个巡演开始编辑城市路线。</p>
      </div>
      <div className="card">
        <h2 className="section-title">成员出勤</h2>
        <p className="text-muted">实时同步乐队成员的出勤状态。</p>
      </div>
    </div>
  </div>
)

const SongSetlists = () => (
  <div>
    <h1 className="page-title">歌单管理</h1>
    <div className="flex-between mb-4">
      <p className="text-muted">创建和管理巡演歌单，拖拽调整演出顺序。</p>
      <button className="btn btn-gold">+ 新建歌单</button>
    </div>
    <div className="card">
      <h2 className="section-title">歌单列表</h2>
      <p className="text-muted">暂无歌单，点击上方按钮创建第一个歌单。</p>
    </div>
  </div>
)

const Settings = () => (
  <div>
    <h1 className="page-title">设置</h1>
    <div className="grid-2">
      <div className="card">
        <h2 className="section-title">个人信息</h2>
        <div className="gap-3" style={{ display: 'flex', flexDirection: 'column' }}>
          <div>
            <label className="text-muted mb-2" style={{ display: 'block' }}>昵称</label>
            <input className="input" placeholder="请输入昵称" />
          </div>
          <div>
            <label className="text-muted mb-2" style={{ display: 'block' }}>角色</label>
            <input className="input" placeholder="如：主唱 / 吉他手" />
          </div>
        </div>
      </div>
      <div className="card">
        <h2 className="section-title">系统设置</h2>
        <div className="gap-3" style={{ display: 'flex', flexDirection: 'column' }}>
          <div>
            <label className="text-muted mb-2" style={{ display: 'block' }}>默认时区</label>
            <input className="input" defaultValue="Asia/Shanghai" />
          </div>
          <div>
            <label className="text-muted mb-2" style={{ display: 'block' }}>服务端地址</label>
            <input className="input" defaultValue="http://localhost:3001" />
          </div>
        </div>
      </div>
    </div>
  </div>
)

const Navbar = () => (
  <nav className="nav">
    <div className="nav-brand">♪ 乐队巡演协作平台</div>
    <NavLink to="/" end className="nav-link">
      仪表盘
    </NavLink>
    <NavLink to="/tour/0" className="nav-link">
      巡演编辑
    </NavLink>
    <NavLink to="/songs" className="nav-link">
      歌单管理
    </NavLink>
    <NavLink to="/settings" className="nav-link">
      设置
    </NavLink>
  </nav>
)

const PageRoutes = () => {
  const location = useLocation()
  return (
    <div key={location.pathname} className="page-fade">
      <Routes location={location}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tour/:id" element={<TourDetail />} />
        <Route path="/songs" element={<SongSetlists />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

const App = () => {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main className="page-container" style={{ flex: 1 }}>
          <PageRoutes />
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
