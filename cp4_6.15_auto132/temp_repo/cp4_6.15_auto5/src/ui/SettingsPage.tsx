import React, { useEffect, useRef, useState } from 'react';
import { AppState, MonitoredEndpoint } from '../engine/types';
import { appStore, extractNameFromUrl } from '../store/appStore';

const INTERVAL_PRESETS = [
  { label: '30 秒', value: 30 },
  { label: '1 分钟', value: 60 },
  { label: '5 分钟', value: 300 },
  { label: '15 分钟', value: 900 },
  { label: '1 小时', value: 3600 },
];

const COMMON_STATUS_CODES = [200, 201, 204, 301, 302, 304, 307, 308, 400, 401, 403, 404, 429];

interface EndpointFormState {
  id?: string;
  name: string;
  url: string;
  interval: number;
  timeout: number;
  expectedStatuses: number[];
  failureThreshold: number;
}

const EMPTY_FORM: EndpointFormState = {
  name: '',
  url: '',
  interval: 60,
  timeout: 10,
  expectedStatuses: [200],
  failureThreshold: 3,
};

function endpointToForm(ep: MonitoredEndpoint): EndpointFormState {
  return {
    id: ep.id,
    name: ep.name,
    url: ep.url,
    interval: ep.interval,
    timeout: ep.timeout,
    expectedStatuses: [...ep.expectedStatuses],
    failureThreshold: ep.failureThreshold,
  };
}

function validateForm(form: EndpointFormState): { ok: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  if (!form.url.trim()) errors.url = '请输入端点 URL';
  else {
    try {
      const u = new URL(form.url.trim());
      if (!['http:', 'https:'].includes(u.protocol)) errors.url = '仅支持 http 或 https 协议';
    } catch {
      errors.url = 'URL 格式不正确（需包含 http:// 或 https://）';
    }
  }
  if (form.interval < 5) errors.interval = '检测间隔不能小于 5 秒';
  if (form.timeout < 1) errors.timeout = '超时时间不能小于 1 秒';
  if (form.timeout >= form.interval) errors.timeout = '超时时间必须小于检测间隔';
  if (form.expectedStatuses.length === 0) errors.expectedStatuses = '至少选择一个期望状态码';
  if (form.failureThreshold < 1) errors.failureThreshold = '告警阈值至少为 1';
  return { ok: Object.keys(errors).length === 0, errors };
}

export const SettingsPage: React.FC = () => {
  const [state, setState] = useState<AppState | null>(null);
  const [form, setForm] = useState<EndpointFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return appStore.subscribe((s) => setState(s));
  }, []);

  if (!state) return null;

  const endpoints = state.endpoints;

  const updateField = <K extends keyof EndpointFormState>(key: K, value: EndpointFormState[K]) => {
    setForm((prev) => {
      if (key === 'url' && typeof value === 'string') {
        const url = value.trim();
        if (!prev.name.trim() && url) {
          try {
            return { ...prev, url, name: extractNameFromUrl(url) };
          } catch {
            return { ...prev, url };
          }
        }
      }
      return { ...prev, [key]: value };
    });
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const toggleStatus = (code: number) => {
    setForm((prev) => {
      const exists = prev.expectedStatuses.includes(code);
      return {
        ...prev,
        expectedStatuses: exists
          ? prev.expectedStatuses.filter((c) => c !== code)
          : [...prev.expectedStatuses, code].sort((a, b) => a - b),
      };
    });
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const showBanner = (type: 'success' | 'error', message: string) => {
    setBanner({ type, message });
    setTimeout(() => setBanner(null), 3200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { ok, errors: formErrors } = validateForm(form);
    if (!ok) {
      setErrors(formErrors);
      return;
    }

    if (form.id) {
      appStore.updateEndpoint(form.id, {
        name: form.name.trim() || extractNameFromUrl(form.url),
        url: form.url.trim(),
        interval: form.interval,
        timeout: form.timeout,
        expectedStatuses: form.expectedStatuses,
        failureThreshold: form.failureThreshold,
      });
      showBanner('success', '端点已更新');
    } else {
      appStore.addEndpoint({
        name: form.name.trim() || extractNameFromUrl(form.url),
        url: form.url.trim(),
        interval: form.interval,
        timeout: form.timeout,
        expectedStatuses: form.expectedStatuses,
        failureThreshold: form.failureThreshold,
      });
      showBanner('success', '端点已添加，即将开始检测');
    }
    resetForm();
  };

  const handleEdit = (ep: MonitoredEndpoint) => {
    setForm(endpointToForm(ep));
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (ep: MonitoredEndpoint) => {
    if (!confirm(`确定删除端点「${ep.name}」吗？相关历史数据将一并移除。`)) return;
    appStore.removeEndpoint(ep.id);
    if (form.id === ep.id) resetForm();
    showBanner('success', '端点已删除');
  };

  const handleExport = () => {
    const json = appStore.exportConfig();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentinel-config-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showBanner('success', `已导出 ${endpoints.length} 个端点配置`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const res = appStore.importConfig(text);
      if (res.count > 0) {
        showBanner('success', `成功导入 ${res.count} 个端点`);
      }
      if (res.errors.length > 0) {
        showBanner('error', `导入错误：${res.errors[0]}`);
      }
    } catch (err) {
      showBanner('error', '读取文件失败');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const isEditing = !!form.id;

  return (
    <div className="page-container">
      {banner && (
        <div
          style={{
            ...styles.banner,
            background:
              banner.type === 'success'
                ? 'rgba(0,214,143,0.15)'
                : 'rgba(233,69,96,0.15)',
            borderColor:
              banner.type === 'success'
                ? 'rgba(0,214,143,0.35)'
                : 'rgba(233,69,96,0.35)',
            color:
              banner.type === 'success'
                ? 'var(--color-accent-success)'
                : 'var(--color-accent-warning)',
          }}
          className="anim-slide-down"
        >
          {banner.message}
        </div>
      )}

      <div style={styles.pageHeader}>
        <div>
          <h1 className="page-title">设置</h1>
          <p className="page-subtitle">管理监控端点、配置检测规则、导入或导出配置</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={handleImportClick}>
            ⇪ 导入配置
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={handleFileSelected}
          />
          <button className="btn btn-primary" onClick={handleExport} disabled={endpoints.length === 0}>
            ⇩ 导出配置
          </button>
        </div>
      </div>

      <div style={styles.layout}>
        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>{isEditing ? '编辑端点' : '添加新端点'}</h2>
            {isEditing && (
              <button className="btn btn-sm btn-ghost" onClick={resetForm}>
                ✕ 取消编辑
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGrid}>
              <div className="form-field" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">端点 URL *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://example.com/api/health"
                  value={form.url}
                  onChange={(e) => updateField('url', e.target.value)}
                />
                {errors.url && <span style={styles.errorText}>{errors.url}</span>}
              </div>

              <div className="form-field" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">显示名称</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="留空将自动从 URL 提取"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                />
              </div>

              <div className="form-field">
                <label className="form-label">检测间隔 (秒) *</label>
                <select
                  className="form-select"
                  value={
                    INTERVAL_PRESETS.find((p) => p.value === form.interval)
                      ? String(form.interval)
                      : 'custom'
                  }
                  onChange={(e) => {
                    if (e.target.value !== 'custom') updateField('interval', Number(e.target.value));
                  }}
                >
                  {INTERVAL_PRESETS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                  <option value="custom">自定义...</option>
                </select>
                {!INTERVAL_PRESETS.find((p) => p.value === form.interval) && (
                  <input
                    type="number"
                    className="form-input"
                    min={5}
                    value={form.interval}
                    onChange={(e) => updateField('interval', Number(e.target.value) || 0)}
                    style={{ marginTop: 6 }}
                  />
                )}
                {errors.interval && <span style={styles.errorText}>{errors.interval}</span>}
              </div>

              <div className="form-field">
                <label className="form-label">超时时间 (秒) *</label>
                <input
                  type="number"
                  className="form-input"
                  min={1}
                  max={120}
                  value={form.timeout}
                  onChange={(e) => updateField('timeout', Number(e.target.value) || 0)}
                />
                {errors.timeout && <span style={styles.errorText}>{errors.timeout}</span>}
              </div>

              <div className="form-field">
                <label className="form-label">连续失败告警阈值 (次) *</label>
                <input
                  type="number"
                  className="form-input"
                  min={1}
                  max={20}
                  value={form.failureThreshold}
                  onChange={(e) => updateField('failureThreshold', Number(e.target.value) || 1)}
                />
                {errors.failureThreshold && (
                  <span style={styles.errorText}>{errors.failureThreshold}</span>
                )}
              </div>

              <div className="form-field" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">期望 HTTP 状态码 *</label>
                <div className="checkbox-group">
                  {COMMON_STATUS_CODES.map((code) => {
                    const checked = form.expectedStatuses.includes(code);
                    return (
                      <label
                        key={code}
                        className={`checkbox-item ${checked ? 'checked' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleStatus(code)}
                        />
                        {code}
                      </label>
                    );
                  })}
                </div>
                {errors.expectedStatuses && (
                  <span style={styles.errorText}>{errors.expectedStatuses}</span>
                )}
              </div>
            </div>

            <div style={styles.formActions}>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                清空表单
              </button>
              <button type="submit" className="btn btn-primary">
                {isEditing ? '保存修改' : '+ 添加端点'}
              </button>
            </div>
          </form>
        </section>

        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>
              已有端点
              <span style={{ ...styles.countBadge, marginLeft: 10 }}>{endpoints.length}</span>
            </h2>
          </div>

          {endpoints.length === 0 ? (
            <div className="empty-state" style={{ padding: '48px 24px' }}>
              <div className="empty-icon">◎</div>
              <h3>暂无端点</h3>
              <p style={{ fontSize: 13, maxWidth: 360 }}>
                请在上方表单中添加您需要监控的服务端点
              </p>
            </div>
          ) : (
            <div style={styles.endpointList}>
              {endpoints.map((ep) => {
                const latest = state.latestResults[ep.id];
                const failCount = state.consecutiveFailures[ep.id] ?? 0;
                const isDown = !!state.activeFailures[ep.id];
                const statusColor = isDown
                  ? 'var(--color-accent-warning)'
                  : latest && latest.isSuccess && latest.latency > 2000
                  ? 'var(--color-accent-warning-soft)'
                  : latest
                  ? 'var(--color-accent-success)'
                  : 'var(--color-text-muted)';
                return (
                  <div key={ep.id} style={styles.endpointRow}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: statusColor, boxShadow: `0 0 8px ${statusColor}99`, flexShrink: 0, marginTop: 6 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ color: 'var(--color-text-primary)', fontWeight: 600, fontSize: 14 }}>
                          {ep.name}
                        </span>
                        <span className="badge badge-muted">{ep.interval}s 间隔</span>
                        <span className="badge badge-muted">{ep.timeout}s 超时</span>
                        <span className="badge badge-muted">
                          阈值 {ep.failureThreshold}
                        </span>
                        {failCount > 0 && (
                          <span className="badge badge-danger">
                            连续失败 {failCount}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          color: 'var(--color-text-muted)',
                          marginTop: 3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {ep.url} · 期望状态码 {ep.expectedStatuses.join(', ')}
                      </div>
                      {latest && (
                        <div style={{ fontSize: 11.5, color: 'var(--color-text-muted)', marginTop: 3, fontFamily: 'var(--font-mono)' }}>
                          最近检测：{latest.latency}ms · 状态码 {latest.statusCode ?? 'N/A'}
                          {latest.errorMessage && ` · ${latest.errorMessage}`}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleEdit(ep)}
                      >
                        编辑
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(ep)}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  pageHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  banner: {
    position: 'sticky',
    top: 80,
    zIndex: 20,
    padding: '10px 16px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid',
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 16,
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1.15fr 1fr',
    gap: 24,
  },
  card: {
    background: 'var(--color-bg-card)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    padding: 24,
    animation: 'floatUp 420ms cubic-bezier(0.23,1,0.32,1) both',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 14,
    borderBottom: '1px solid var(--color-border)',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--color-text-primary)',
    letterSpacing: '-0.01em',
    display: 'inline-flex',
    alignItems: 'center',
  },
  countBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 26,
    height: 22,
    padding: '0 8px',
    borderRadius: 11,
    background: 'rgba(15,52,96,0.7)',
    fontSize: 12,
    fontFamily: 'var(--font-mono)',
    color: 'var(--color-text-primary)',
    fontWeight: 500,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  errorText: {
    fontSize: 12,
    color: 'var(--color-accent-warning)',
    marginTop: 4,
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 6,
    borderTop: '1px solid var(--color-border)',
  },
  endpointList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    maxHeight: 620,
    overflowY: 'auto',
  },
  endpointRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '14px 12px',
    borderRadius: 'var(--radius-md)',
    borderBottom: '1px solid var(--color-border)',
    transition: 'background 180ms ease',
  },
};

const responsiveCss = document.createElement('style');
responsiveCss.textContent = `
  @media (max-width: 960px) {
    .settings-layout { grid-template-columns: 1fr !important; }
    .settings-form-grid { grid-template-columns: 1fr !important; }
    .settings-form-grid > * { grid-column: 1 / -1 !important; }
  }
`;
document.head.appendChild(responsiveCss);

export default SettingsPage;
