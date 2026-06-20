import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { useStore } from '../store';
import { Order, RouteStop } from '../types';

const AdminDashboard: React.FC = () => {
  const { orders, setOrders, updateOrderStatus, routeStops, setRouteStops } = useStore();
  const [loading, setLoading] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [flashId, setFlashId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    axios.get<Order[]>('/api/orders').then((res) => setOrders(res.data));
  }, [setOrders]);

  useEffect(() => {
    if (routeStops.length === 0) return;
    drawRoute(routeStops, highlightIdx);
  }, [routeStops, highlightIdx]);

  const drawRoute = useCallback((stops: RouteStop[], hlIdx: number) => {
    const canvas = canvasRef.current;
    if (!canvas || stops.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    const lats = stops.map((s) => s.lat);
    const lngs = stops.map((s) => s.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const pad = 60;
    const rangeLat = maxLat - minLat || 0.01;
    const rangeLng = maxLng - minLng || 0.01;

    const toX = (lng: number) => pad + ((lng - minLng) / rangeLng) * (w - pad * 2);
    const toY = (lat: number) => (h - pad) - ((lat - minLat) / rangeLat) * (h - pad * 2);

    for (let i = 0; i < stops.length - 1; i++) {
      const from = stops[i];
      const to = stops[i + 1];
      const x1 = toX(from.lng);
      const y1 = toY(from.lat);
      const x2 = toX(to.lng);
      const y2 = toY(to.lat);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = i === hlIdx ? '#FF7043' : '#B0BEC5';
      ctx.lineWidth = i === hlIdx ? 3 : 2;
      ctx.stroke();

      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      ctx.font = '11px "Noto Sans SC", sans-serif';
      ctx.fillStyle = i === hlIdx ? '#FF7043' : '#666';
      ctx.textAlign = 'center';
      ctx.fillText(`${i + 1}→${i + 2}`, mx, my - 8);
      ctx.fillText(`${stops[i + 1].distanceFromPrev}km`, mx, my + 14);
    }

    stops.forEach((stop, i) => {
      const x = toX(stop.lng);
      const y = toY(stop.lat);

      ctx.beginPath();
      ctx.arc(x, y, i === hlIdx || i === hlIdx + 1 ? 10 : 8, 0, Math.PI * 2);
      ctx.fillStyle = '#4CAF50';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = 'bold 11px "Noto Sans SC", sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${stop.sequence}`, x, y);

      ctx.font = '11px "Noto Sans SC", sans-serif';
      ctx.fillStyle = '#333';
      ctx.textBaseline = 'top';
      ctx.fillText(stop.address, x, y + 14);
    });
  }, []);

  const handleOptimize = async () => {
    const pending = orders.filter((o) => o.status === 'pending' || o.status === 'delivering');
    if (pending.length === 0) {
      alert('没有待配送的订单');
      return;
    }
    setLoading(true);
    setHighlightIdx(-1);
    try {
      const res = await axios.post<RouteStop[]>('/api/optimize-route', {
        pendingOrders: pending,
      });
      setRouteStops(res.data);
    } catch {
      alert('路线优化失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: Order['status']) => {
    try {
      await axios.patch(`/api/orders/${id}/status`, { status });
      updateOrderStatus(id, status);
      setFlashId(id);
      setTimeout(() => setFlashId(null), 300);
    } catch {
      alert('状态更新失败');
    }
  };

  const statusLabel = (s: Order['status']) => {
    switch (s) {
      case 'pending': return '待配送';
      case 'delivering': return '配送中';
      case 'completed': return '已完成';
    }
  };

  const statusClass = (s: Order['status']) => `status-badge status-${s}`;

  const pendingCount = orders.filter((o) => o.status === 'pending' || o.status === 'delivering').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">📋 配送管理</h1>
          <p className="page-subtitle">管理订单与优化配送路线</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleOptimize}
          disabled={loading || pendingCount === 0}
        >
          {loading ? '🌸 优化中...' : `🗺️ 优化路线（${pendingCount}单）`}
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>花束内容</th>
              <th>配送地址</th>
              <th>配送时段</th>
              <th>状态</th>
              <th>提交时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>
                  暂无订单
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className={flashId === order.id ? 'status-flash' : ''}>
                  <td style={{ fontWeight: 600 }}>{order.id}</td>
                  <td>
                    {order.items.map((it) => `${it.bouquetName}×${it.quantity}`).join('、')}
                  </td>
                  <td>{order.address}</td>
                  <td>{order.timeSlot}</td>
                  <td>
                    <span className={statusClass(order.status)}>
                      {statusLabel(order.status)}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: '#999' }}>
                    {new Date(order.createdAt).toLocaleString('zh-CN')}
                  </td>
                  <td>
                    {order.status !== 'completed' && (
                      <select
                        className="status-select"
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                      >
                        <option value="pending">待配送</option>
                        <option value="delivering">配送中</option>
                        <option value="completed">已完成</option>
                      </select>
                    )}
                    {order.status === 'completed' && (
                      <span style={{ color: '#999', fontSize: 13 }}>已完结</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-card-list">
        {orders.map((order) => (
          <div
            key={order.id}
            className={`admin-order-card ${flashId === order.id ? 'status-flash' : ''}`}
          >
            <div className="field">
              <span className="field-label">订单号</span>
              <span style={{ fontWeight: 600 }}>{order.id}</span>
            </div>
            <div className="field">
              <span className="field-label">花束</span>
              <span>{order.items.map((it) => `${it.bouquetName}×${it.quantity}`).join('、')}</span>
            </div>
            <div className="field">
              <span className="field-label">地址</span>
              <span>{order.address}</span>
            </div>
            <div className="field">
              <span className="field-label">时段</span>
              <span>{order.timeSlot}</span>
            </div>
            <div className="field">
              <span className="field-label">状态</span>
              <span className={statusClass(order.status)}>{statusLabel(order.status)}</span>
            </div>
            <div className="field">
              <span className="field-label">时间</span>
              <span style={{ fontSize: 12, color: '#999' }}>
                {new Date(order.createdAt).toLocaleString('zh-CN')}
              </span>
            </div>
            {order.status !== 'completed' && (
              <div style={{ marginTop: 8 }}>
                <select
                  className="status-select"
                  value={order.status}
                  onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                >
                  <option value="pending">待配送</option>
                  <option value="delivering">配送中</option>
                  <option value="completed">已完成</option>
                </select>
              </div>
            )}
          </div>
        ))}
      </div>

      {loading && (
        <div className="route-loading">
          <div className="route-loading-icon">🌸</div>
          <div className="route-loading-text">正在计算最优配送路线...</div>
        </div>
      )}

      {!loading && routeStops.length > 0 && (
        <>
          <div className="route-canvas-wrap">
            <h3>🗺️ 配送路线图</h3>
            <canvas
              ref={canvasRef}
              className="route-canvas"
              onClick={(e) => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const lats = routeStops.map((s) => s.lat);
                const lngs = routeStops.map((s) => s.lng);
                const minLat = Math.min(...lats);
                const maxLat = Math.max(...lats);
                const minLng = Math.min(...lngs);
                const maxLng = Math.max(...lngs);
                const pad = 60;
                const w = rect.width;
                const h = rect.height;
                const rangeLat = maxLat - minLat || 0.01;
                const rangeLng = maxLng - minLng || 0.01;
                const toX = (lng: number) => pad + ((lng - minLng) / rangeLng) * (w - pad * 2);
                const toY = (lat: number) => (h - pad) - ((lat - minLat) / rangeLat) * (h - pad * 2);

                for (let i = 0; i < routeStops.length - 1; i++) {
                  const from = routeStops[i];
                  const to = routeStops[i + 1];
                  const x1 = toX(from.lng);
                  const y1 = toY(from.lat);
                  const x2 = toX(to.lng);
                  const y2 = toY(to.lat);

                  const mx = (x1 + x2) / 2;
                  const my = (y1 + y2) / 2;
                  const dist = Math.sqrt((x - mx) ** 2 + (y - my) ** 2);
                  if (dist < 30) {
                    setHighlightIdx(i === highlightIdx ? -1 : i);
                    return;
                  }
                }
                setHighlightIdx(-1);
              }}
            />
          </div>

          <div className="route-list">
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>📦 配送任务清单</h3>
            {routeStops.map((stop, i) => (
              <div
                key={stop.orderId}
                className={`route-stop ${highlightIdx === i || highlightIdx === i - 1 ? 'highlighted' : ''}`}
                onClick={() => setHighlightIdx(highlightIdx === i ? -1 : i)}
              >
                <div className="route-stop-seq">{stop.sequence}</div>
                <div className="route-stop-info">
                  <div className="route-stop-addr">{stop.address}</div>
                  <div className="route-stop-dist">
                    订单号 {stop.orderId}
                    {stop.distanceFromPrev > 0 && ` · 距上一站 ${stop.distanceFromPrev}km`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
