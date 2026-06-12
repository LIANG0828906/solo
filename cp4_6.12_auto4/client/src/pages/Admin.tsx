function Admin() {
  return (
    <div className="admin-layout">
      <div className="admin-content">
        <div className="admin-header">
          <h1 className="admin-title">后台管理</h1>
          <div className="admin-tabs">
            <button className="admin-tab active">订单管理</button>
            <button className="admin-tab">库存预警</button>
            <button className="admin-tab">消息记录</button>
          </div>
        </div>

        <div className="card">
          <div className="table-toolbar">
            <select className="filter-select">
              <option value="">全部状态</option>
              <option value="pending">待确认</option>
              <option value="producing">生产中</option>
              <option value="inspecting">质检中</option>
              <option value="shipped">已发货</option>
              <option value="completed">已完成</option>
            </select>
            <button className="sort-btn">按创建时间 ↓</button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>订单号</th>
                <th>客户信息</th>
                <th>配置摘要</th>
                <th>金额</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <div className="empty-text">暂无订单数据</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Admin;
