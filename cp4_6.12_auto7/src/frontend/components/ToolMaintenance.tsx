import { useState, useEffect } from 'react';
import {
  getTools,
  getOverdueTools,
  recordMaintenance,
  addTool,
  getToolById,
  type Tool,
  type MaintenanceRecord,
  type ToolDetail
} from '../api/tools';

const ToolMaintenance = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [overdueTools, setOverdueTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showAddToolModal, setShowAddToolModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ToolDetail | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [maintenanceForm, setMaintenanceForm] = useState({
    maintenance_date: new Date().toISOString().split('T')[0],
    description: '',
    cost: ''
  });

  const [toolForm, setToolForm] = useState({
    name: '',
    model: '',
    purchase_date: new Date().toISOString().split('T')[0],
    last_maintenance_date: new Date().toISOString().split('T')[0],
    maintenance_cycle_months: 3
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [allTools, overdue] = await Promise.all([
        getTools(),
        getOverdueTools()
      ]);
      setTools(allTools);
      setOverdueTools(overdue);
    } catch (err) {
      setError('加载工具列表失败，请稍后重试');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const openMaintenanceModal = async (tool: Tool) => {
    try {
      const detail = await getToolById(tool.id);
      setSelectedTool(detail);
      setMaintenanceForm({
        maintenance_date: new Date().toISOString().split('T')[0],
        description: '',
        cost: ''
      });
      setShowMaintenanceModal(true);
      requestAnimationFrame(() => {
        setModalVisible(true);
      });
    } catch (err) {
      setError('加载工具详情失败');
      console.error(err);
    }
  };

  const closeMaintenanceModal = () => {
    setModalVisible(false);
    setTimeout(() => {
      setShowMaintenanceModal(false);
      setSelectedTool(null);
    }, 400);
  };

  const handleRecordMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTool) return;

    try {
      setError(null);
      await recordMaintenance(selectedTool.id, {
        maintenance_date: maintenanceForm.maintenance_date,
        description: maintenanceForm.description || undefined,
        cost: maintenanceForm.cost ? parseFloat(maintenanceForm.cost) : undefined
      });
      setSuccessMessage('维护记录已保存');
      closeMaintenanceModal();
      await loadData();
    } catch (err) {
      setError('记录维护失败，请稍后重试');
      console.error(err);
    }
  };

  const handleAddTool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await addTool(toolForm);
      setSuccessMessage('工具添加成功');
      setShowAddToolModal(false);
      setToolForm({
        name: '',
        model: '',
        purchase_date: new Date().toISOString().split('T')[0],
        last_maintenance_date: new Date().toISOString().split('T')[0],
        maintenance_cycle_months: 3
      });
      await loadData();
    } catch (err) {
      setError('添加工具失败，请稍后重试');
      console.error(err);
    }
  };

  const getMaintenanceStatusColor = (tool: Tool) => {
    if (tool.is_overdue) return '#FFEBEE';
    if (tool.days_until_maintenance < 7) return '#FFE0B2';
    return 'transparent';
  };

  const getMaintenanceStatusText = (tool: Tool) => {
    if (tool.is_overdue) return `已超期 ${Math.abs(tool.days_until_maintenance)} 天`;
    if (tool.days_until_maintenance === 0) return '今日需维护';
    if (tool.days_until_maintenance < 7) return `${tool.days_until_maintenance} 天后需维护`;
    return `${tool.days_until_maintenance} 天后`;
  };

  const getMaintenanceStatusTextColor = (tool: Tool) => {
    if (tool.is_overdue) return '#D32F2F';
    if (tool.days_until_maintenance < 7) return '#E65100';
    return '#4CAF50';
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#757575' }}>加载中...</div>;
  }

  return (
    <div>
      {error && <div className="error">{error}</div>}
      {successMessage && <div className="success">{successMessage}</div>}

      {overdueTools.length > 0 && (
        <div
          style={{
            backgroundColor: '#FFEBEE',
            border: '1px solid #D32F2F',
            borderRadius: '12px',
            padding: '12px 20px',
            marginBottom: '24px',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ color: '#D32F2F', fontWeight: '600' }}>
              ⚠️ 有 {overdueTools.length} 台工具已超期未维护
            </span>
          </div>
          <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <div
              style={{
                display: 'inline-block',
                animation: 'scrollText 15s linear infinite',
                color: '#B71C1C',
                fontSize: '13px'
              }}
            >
              {overdueTools.map((tool, index) => (
                <span key={tool.id} style={{ marginRight: '60px' }}>
                  🔧 {tool.name} ({tool.model}) - 已超期 {Math.abs(tool.days_until_maintenance)} 天
                  {index < overdueTools.length - 1 ? ' | ' : ''}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ color: '#616161', margin: 0 }}>
          共 {tools.length} 台设备
          {overdueTools.length > 0 && (
            <span style={{ color: '#D32F2F', marginLeft: '12px' }}>
              超期 {overdueTools.length} 台
            </span>
          )}
        </p>
        <button className="btn btn-primary" onClick={() => setShowAddToolModal(true)}>
          + 添加工具
        </button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#EFEBE9' }}>
                <th
                  style={{
                    padding: '14px 20px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#4E342E'
                  }}
                >
                  工具名称
                </th>
                <th
                  style={{
                    padding: '14px 20px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#4E342E'
                  }}
                >
                  型号
                </th>
                <th
                  style={{
                    padding: '14px 20px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#4E342E'
                  }}
                >
                  购买日期
                </th>
                <th
                  style={{
                    padding: '14px 20px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#4E342E'
                  }}
                >
                  上次维护
                </th>
                <th
                  style={{
                    padding: '14px 20px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#4E342E'
                  }}
                >
                  下次维护日期
                </th>
                <th
                  style={{
                    padding: '14px 20px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#4E342E'
                  }}
                >
                  状态
                </th>
                <th
                  style={{
                    padding: '14px 20px',
                    textAlign: 'right',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#4E342E'
                  }}
                >
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {tools.map((tool) => (
                <tr
                  key={tool.id}
                  style={{
                    backgroundColor: getMaintenanceStatusColor(tool),
                    borderTop: '1px solid #F0EBE5',
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: '500', color: '#212121' }}>
                    {tool.name}
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: '13px', color: '#616161' }}>
                    {tool.model}
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: '13px', color: '#616161' }}>
                    {tool.purchase_date}
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: '13px', color: '#616161' }}>
                    {tool.last_maintenance_date}
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: '13px', color: '#616161' }}>
                    {tool.next_maintenance_date}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: getMaintenanceStatusTextColor(tool)
                      }}
                    >
                      {getMaintenanceStatusText(tool)}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                      onClick={() => openMaintenanceModal(tool)}
                    >
                      记录维护
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showMaintenanceModal && selectedTool && (
        <div className="modal-overlay" onClick={closeMaintenanceModal}>
          <div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '480px',
              maxWidth: '100vw',
              backgroundColor: '#fff',
              boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
              overflowY: 'auto',
              transform: modalVisible ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              zIndex: 1001
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #E0E0E0' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#212121', margin: 0 }}>
                  维护记录 - {selectedTool.name}
                </h3>
                <button
                  onClick={closeMaintenanceModal}
                  style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#757575', lineHeight: 1 }}
                >
                  ×
                </button>
              </div>

              <div style={{ backgroundColor: '#F8F5F0', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#616161' }}>
                  <span style={{ color: '#757575' }}>型号：</span>{selectedTool.model}
                </p>
                <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#616161' }}>
                  <span style={{ color: '#757575' }}>上次维护：</span>{selectedTool.last_maintenance_date}
                </p>
                <p style={{ margin: 0, fontSize: '13px', color: '#616161' }}>
                  <span style={{ color: '#757575' }}>维护周期：</span>每 {selectedTool.maintenance_cycle_months} 个月
                </p>
              </div>

              <form onSubmit={handleRecordMaintenance}>
                <div className="form-group">
                  <label className="form-label">维护日期</label>
                  <input
                    type="date"
                    className="form-input"
                    value={maintenanceForm.maintenance_date}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, maintenance_date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">维护内容</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={maintenanceForm.description}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                    placeholder="请描述本次维护的具体内容..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">维护费用（元）</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-input"
                    value={maintenanceForm.cost}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost: e.target.value })}
                    placeholder="可选"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn btn-secondary" onClick={closeMaintenanceModal}>
                    取消
                  </button>
                  <button type="submit" className="btn btn-primary">
                    保存记录
                  </button>
                </div>
              </form>

              {selectedTool.maintenance_records && selectedTool.maintenance_records.length > 0 && (
                <div style={{ marginTop: '28px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#212121', margin: '0 0 12px 0' }}>
                    历史维护记录
                  </h4>
                  <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                    {selectedTool.maintenance_records.map((record: MaintenanceRecord, index: number) => (
                      <div
                        key={record.id}
                        style={{
                          padding: '12px',
                          backgroundColor: index % 2 === 0 ? '#FAFAFA' : '#fff',
                          borderRadius: '6px',
                          marginBottom: '8px',
                          border: '1px solid #F0EBE5'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '500', color: '#424242' }}>
                            {record.maintenance_date}
                          </span>
                          {record.cost !== undefined && record.cost !== null && (
                            <span style={{ fontSize: '13px', color: '#4E342E', fontWeight: '500' }}>
                              ¥{record.cost}
                            </span>
                          )}
                        </div>
                        {record.description && (
                          <p style={{ fontSize: '12px', color: '#757575', margin: 0, lineHeight: 1.5 }}>
                            {record.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddToolModal && (
        <div className="modal-overlay" onClick={() => setShowAddToolModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">添加工具</h3>
              <button className="modal-close" onClick={() => setShowAddToolModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddTool}>
              <div className="form-group">
                <label className="form-label">工具名称 *</label>
                <input
                  type="text"
                  className="form-input"
                  value={toolForm.name}
                  onChange={(e) => setToolForm({ ...toolForm, name: e.target.value })}
                  placeholder="如：台锯"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">型号 *</label>
                <input
                  type="text"
                  className="form-input"
                  value={toolForm.model}
                  onChange={(e) => setToolForm({ ...toolForm, model: e.target.value })}
                  placeholder="如：SawStop PCS31230"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">购买日期 *</label>
                <input
                  type="date"
                  className="form-input"
                  value={toolForm.purchase_date}
                  onChange={(e) => setToolForm({ ...toolForm, purchase_date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">上次维护日期 *</label>
                <input
                  type="date"
                  className="form-input"
                  value={toolForm.last_maintenance_date}
                  onChange={(e) => setToolForm({ ...toolForm, last_maintenance_date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">维护周期（月）*</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={toolForm.maintenance_cycle_months}
                  onChange={(e) => setToolForm({ ...toolForm, maintenance_cycle_months: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddToolModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolMaintenance;
