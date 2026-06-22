import { useState, useMemo, useEffect } from 'react';
import type { ParsedDoc, ApiPath } from './types';

interface MockTesterProps {
  doc: ParsedDoc;
  selectedApi: ApiPath | null;
  onSelectApi: (api: ApiPath) => void;
}

export default function MockTester({ 
  doc, 
  selectedApi,
  onSelectApi 
}: MockTesterProps) {
  const [params, setParams] = useState<Record<string, string>>({});
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState<{
    statusCode: number;
    data: any;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sortedPaths = useMemo(() => {
    return [...doc.paths].sort((a, b) => {
      if (a.tags[0] && b.tags[0]) {
        return a.tags[0].localeCompare(b.tags[0]);
      }
      return a.path.localeCompare(b.path);
    });
  }, [doc.paths]);

  useEffect(() => {
    if (selectedApi) {
      const initialParams: Record<string, string> = {};
      selectedApi.parameters.forEach(param => {
        initialParams[`${param.in}_${param.name}`] = param.example ? String(param.example) : '';
      });
      setParams(initialParams);

      if (selectedApi.requestBody) {
        const jsonContent = selectedApi.requestBody.content['application/json'];
        if (jsonContent?.example) {
          setRequestBody(JSON.stringify(jsonContent.example, null, 2));
        } else {
          setRequestBody('{}');
        }
      } else {
        setRequestBody('');
      }

      setResponse(null);
      setError('');
    }
  }, [selectedApi]);

  const handleApiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [method, ...pathParts] = e.target.value.split(' ');
    const path = pathParts.join(' ');
    const api = doc.paths.find(p => p.method === method && p.path === path);
    if (api) {
      onSelectApi(api);
    }
  };

  const handleParamChange = (key: string, value: string) => {
    setParams(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSendRequest = async () => {
    if (!selectedApi) return;

    setLoading(true);
    setError('');
    setResponse(null);

    try {
      const pathParams: Record<string, string> = {};
      const queryParams: Record<string, string> = {};
      
      selectedApi.parameters.forEach(param => {
        const key = `${param.in}_${param.name}`;
        const value = params[key] || '';
        if (param.in === 'path') {
          pathParams[param.name] = value;
        } else if (param.in === 'query') {
          queryParams[param.name] = value;
        }
      });

      const response = await fetch('/api/mock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          docId: doc.id,
          path: selectedApi.path,
          method: selectedApi.method,
          params: {
            path: pathParams,
            query: queryParams,
            body: requestBody
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '请求失败');
      }

      const data = await response.json();
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败');
    } finally {
      setLoading(false);
    }
  };

  const formatJson = (obj: any): string => {
    return JSON.stringify(obj, null, 2);
  };

  const JsonHighlight = ({ json }: { json: string }) => {
    return (
      <pre className="response-code-block" dangerouslySetInnerHTML={{ __html: syntaxHighlight(json) }} />
    );
  };

  const syntaxHighlight = (json: string): string => {
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
      let cls = 'json-number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'json-key';
        } else {
          cls = 'json-string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      }
      return `<span class="${cls}">${match}</span>`;
    });
  };

  const pathParams = selectedApi?.parameters.filter(p => p.in === 'path') || [];
  const queryParams = selectedApi?.parameters.filter(p => p.in === 'query') || [];
  const headerParams = selectedApi?.parameters.filter(p => p.in === 'header') || [];

  const methodColors: Record<string, string> = {
    GET: '#10B981',
    POST: '#3B82F6',
    PUT: '#F59E0B',
    DELETE: '#EF4444',
    PATCH: '#8B5CF6',
    OPTIONS: '#64748B',
    HEAD: '#64748B'
  };

  return (
    <div className="mock-container">
      <div className="mock-header">
        <h1 className="mock-title">Mock 测试</h1>
        <div className="mock-title-underline" />
      </div>

      <div className="mock-panel">
        <div className="api-selector">
          <select 
            value={selectedApi ? `${selectedApi.method} ${selectedApi.path}` : ''}
            onChange={handleApiChange}
          >
            <option value="">选择一个接口...</option>
            {sortedPaths.map(api => (
              <option key={`${api.method}-${api.path}`} value={`${api.method} ${api.path}`}>
                [{api.method}] {api.path} {api.summary ? `- ${api.summary}` : ''}
              </option>
            ))}
          </select>
          <button 
            className="btn-send"
            onClick={handleSendRequest}
            disabled={!selectedApi || loading}
          >
            {loading ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" strokeDasharray="40" strokeDashoffset="20" />
                </svg>
                发送中...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                发送请求
              </>
            )}
          </button>
        </div>

        {selectedApi && (
          <div style={{ 
            padding: '12px 16px', 
            background: '#F8FAFC', 
            borderRadius: 10,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            border: '1px solid #E2E8F0'
          }}>
            <span 
              style={{ 
                padding: '4px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                color: 'white',
                backgroundColor: methodColors[selectedApi.method] || '#64748B'
              }}
            >
              {selectedApi.method}
            </span>
            <code style={{ fontSize: 14, color: '#334155', fontFamily: "'Fira Code', monospace" }}>
              {selectedApi.path}
            </code>
          </div>
        )}

        {selectedApi && (
          <>
            {pathParams.length > 0 && (
              <div className="params-input-section">
                <h4 className="section-title">路径参数</h4>
                {pathParams.map(param => (
                  <div key={`path-${param.name}`} className="param-input-row">
                    <label className="param-input-label">
                      {param.name}
                      {param.required && <span className="required-star">*</span>}
                    </label>
                    <div className="param-input-field">
                      <input
                        type="text"
                        value={params[`path_${param.name}`] || ''}
                        onChange={(e) => handleParamChange(`path_${param.name}`, e.target.value)}
                        placeholder={param.description || `输入${param.name}`}
                      />
                      {param.description && (
                        <div className="param-input-desc">{param.description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {queryParams.length > 0 && (
              <div className="params-input-section">
                <h4 className="section-title">查询参数</h4>
                {queryParams.map(param => (
                  <div key={`query-${param.name}`} className="param-input-row">
                    <label className="param-input-label">
                      {param.name}
                      {param.required && <span className="required-star">*</span>}
                    </label>
                    <div className="param-input-field">
                      <input
                        type="text"
                        value={params[`query_${param.name}`] || ''}
                        onChange={(e) => handleParamChange(`query_${param.name}`, e.target.value)}
                        placeholder={param.description || `输入${param.name}`}
                      />
                      {param.description && (
                        <div className="param-input-desc">{param.description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {headerParams.length > 0 && (
              <div className="params-input-section">
                <h4 className="section-title">请求头</h4>
                {headerParams.map(param => (
                  <div key={`header-${param.name}`} className="param-input-row">
                    <label className="param-input-label">
                      {param.name}
                      {param.required && <span className="required-star">*</span>}
                    </label>
                    <div className="param-input-field">
                      <input
                        type="text"
                        value={params[`header_${param.name}`] || ''}
                        onChange={(e) => handleParamChange(`header_${param.name}`, e.target.value)}
                        placeholder={param.description || `输入${param.name}`}
                      />
                      {param.description && (
                        <div className="param-input-desc">{param.description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedApi.requestBody && (
              <div className="params-input-section">
                <h4 className="section-title">请求体</h4>
                <div className="param-input-field">
                  <textarea
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    placeholder="请求体 JSON..."
                    spellCheck={false}
                  />
                </div>
              </div>
            )}
          </>
        )}

        <div className="response-section">
          <div className="response-header">
            <h4 className="section-title">响应结果</h4>
            {response && (
              <div className={`status-badge ${response.statusCode >= 400 ? 'error' : ''}`}>
                <span style={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  background: response.statusCode >= 400 ? '#DC2626' : '#10B981' 
                }} />
                HTTP {response.statusCode}
              </div>
            )}
          </div>

          {error && (
            <div style={{ 
              padding: '12px 16px', 
              background: '#FEF2F2', 
              color: '#DC2626', 
              borderRadius: 10,
              fontSize: 14 
            }}>
              {error}
            </div>
          )}

          {!response && !error && !loading && (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-state-icon">📡</div>
              <div className="empty-state-text">选择接口并点击"发送请求"查看Mock响应</div>
            </div>
          )}

          {response && (
            <JsonHighlight json={formatJson(response.data)} />
          )}
        </div>
      </div>
    </div>
  );
}
