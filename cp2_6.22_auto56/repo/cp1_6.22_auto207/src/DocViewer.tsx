import { useState } from 'react';
import type { ParsedDoc, ApiPath, SchemaField } from './types';

interface DocViewerProps {
  doc: ParsedDoc;
  selectedApi: ApiPath | null;
  onSelectApi: (api: ApiPath) => void;
  onSwitchToMock: (api: ApiPath) => void;
}

const methodColors: Record<string, string> = {
  GET: '#10B981',
  POST: '#3B82F6',
  PUT: '#F59E0B',
  DELETE: '#EF4444',
  PATCH: '#8B5CF6',
  OPTIONS: '#64748B',
  HEAD: '#64748B'
};

export default function DocViewer({ 
  doc, 
  selectedApi, 
  onSelectApi,
  onSwitchToMock 
}: DocViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCurl = (api: ApiPath) => {
    const curl = generateCurl(api);
    navigator.clipboard.writeText(curl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!selectedApi) {
    return (
      <div className="doc-container">
        <div className="doc-header">
          <h1 className="doc-title">{doc.info.title}</h1>
          <div className="doc-title-underline" />
          <div className="doc-meta">
            <span>版本: {doc.info.version}</span>
            <span>接口数: {doc.paths.length}</span>
          </div>
          {doc.info.description && (
            <p className="doc-description">{doc.info.description}</p>
          )}
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">👈</div>
          <div className="empty-state-text">请从左侧选择一个接口查看详情</div>
        </div>
      </div>
    );
  }

  return (
    <div className="doc-container">
      {copied && <div className="copied-toast">✓ 已复制到剪贴板</div>}
      
      <div className="doc-header">
        <h1 className="doc-title">{doc.info.title}</h1>
        <div className="doc-title-underline" />
        <div className="doc-meta">
          <span>版本: {doc.info.version}</span>
          <span>接口数: {doc.paths.length}</span>
        </div>
      </div>

      <div className="api-detail-card">
        <div className="api-path-header">
          <span 
            className="api-method-badge"
            style={{ backgroundColor: methodColors[selectedApi.method] || '#64748B' }}
          >
            {selectedApi.method}
          </span>
          <span className="api-path-text">{selectedApi.path}</span>
          <div className="api-actions">
            <button 
              className="btn-secondary"
              onClick={() => handleCopyCurl(selectedApi)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              复制Curl
            </button>
            <button 
              className="btn-primary"
              onClick={() => onSwitchToMock(selectedApi)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Mock测试
            </button>
          </div>
        </div>

        {selectedApi.summary && (
          <h3 className="api-summary">{selectedApi.summary}</h3>
        )}
        {selectedApi.description && (
          <p className="api-description">{selectedApi.description}</p>
        )}

        {selectedApi.parameters.length > 0 && (
          <>
            <h4 className="section-title">请求参数</h4>
            <table className="params-table">
              <thead>
                <tr>
                  <th>参数名</th>
                  <th>位置</th>
                  <th>类型</th>
                  <th>必填</th>
                  <th>描述</th>
                </tr>
              </thead>
              <tbody>
                {selectedApi.parameters.map((param, index) => (
                  <tr key={`${param.name}-${param.in}-${index}`}>
                    <td><span className="param-name">{param.name}</span></td>
                    <td><span className="param-in">{param.in}</span></td>
                    <td><span className="param-type">{param.type}</span></td>
                    <td>
                      {param.required ? (
                        <span className="param-required">是</span>
                      ) : (
                        <span style={{ color: '#94A3B8', fontSize: 12 }}>否</span>
                      )}
                    </td>
                    <td><span className="param-desc">{param.description}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {selectedApi.requestBody && (
          <>
            <h4 className="section-title">请求体</h4>
            <div className="schema-viewer">
              <div style={{ marginBottom: 8, color: '#64748B', fontSize: 13 }}>
                {selectedApi.requestBody.description}
                {selectedApi.requestBody.required && (
                  <span style={{ color: '#EF4444', marginLeft: 8 }}>必填</span>
                )}
              </div>
              {Object.entries(selectedApi.requestBody.content).map(([mediaType, content]) => (
                <div key={mediaType}>
                  <div style={{ 
                    fontSize: 12, 
                    color: '#6366F1', 
                    marginBottom: 8,
                    fontFamily: "'Fira Code', monospace" 
                  }}>
                    {mediaType}
                  </div>
                  {content.schema && (
                    <SchemaTree schema={content.schema} />
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {Object.keys(selectedApi.responses).length > 0 && (
          <>
            <h4 className="section-title">响应</h4>
            {Object.entries(selectedApi.responses).map(([statusCode, response]) => (
              <div key={statusCode} className="schema-viewer" style={{ marginBottom: 16 }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 10,
                  marginBottom: 12 
                }}>
                  <span style={{
                    padding: '4px 10px',
                    background: statusCode.startsWith('2') ? '#D1FAE5' : '#FEE2E2',
                    color: statusCode.startsWith('2') ? '#059669' : '#DC2626',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "'Fira Code', monospace"
                  }}>
                    {statusCode}
                  </span>
                  <span style={{ fontSize: 13, color: '#475569' }}>
                    {response.description}
                  </span>
                </div>
                {Object.entries(response.content).map(([mediaType, content]) => (
                  <div key={mediaType}>
                    <div style={{ 
                      fontSize: 12, 
                      color: '#6366F1', 
                      marginBottom: 8,
                      fontFamily: "'Fira Code', monospace" 
                    }}>
                      {mediaType}
                    </div>
                    {content.schema && (
                      <SchemaTree schema={content.schema} />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function SchemaTree({ schema, level = 0 }: { schema: SchemaField; level?: number }) {
  const [expanded, setExpanded] = useState(true);

  const hasChildren = schema.properties && Object.keys(schema.properties).length > 0;
  const hasItems = schema.type === 'array' && schema.items;

  const renderTypeLabel = () => {
    if (schema.type === 'array' && schema.items) {
      return `array<${schema.items.type || 'object'}>`;
    }
    return schema.type;
  };

  return (
    <div className="schema-field">
      <div className="schema-field-header" style={{ cursor: hasChildren || hasItems ? 'pointer' : 'default' }}
        onClick={() => (hasChildren || hasItems) && setExpanded(!expanded)}
      >
        {(hasChildren || hasItems) && (
          <svg 
            style={{ 
              width: 12, 
              height: 12, 
              transition: 'transform 0.2s ease',
              transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
              color: '#94A3B8'
            }}
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        )}
        {!hasChildren && !hasItems && <span style={{ width: 12 }} />}
        <span className="schema-field-name">{schema.example !== null && schema.example !== undefined ? ` (示例: ${schema.example})` : ''}</span>
        <span className="schema-field-type">{renderTypeLabel()}</span>
        {schema.enum && (
          <span style={{ fontSize: 11, color: '#8B5CF6' }}>
            enum: [{schema.enum.join(', ')}]
          </span>
        )}
      </div>
      {schema.description && (
        <div className="schema-field-desc">{schema.description}</div>
      )}
      
      {expanded && hasChildren && (
        <div className="schema-children">
          {Object.entries(schema.properties!).map(([name, field]) => (
            <SchemaFieldItem 
              key={name} 
              name={name} 
              schema={field}
              required={schema.required?.includes(name)}
            />
          ))}
        </div>
      )}

      {expanded && hasItems && schema.items && (
        <div className="schema-children">
          <SchemaTree schema={schema.items} level={level + 1} />
        </div>
      )}
    </div>
  );
}

function SchemaFieldItem({ 
  name, 
  schema, 
  required 
}: { 
  name: string; 
  schema: SchemaField;
  required?: boolean;
}) {
  const [expanded, setExpanded] = useState(true);

  const hasChildren = schema.properties && Object.keys(schema.properties).length > 0;
  const hasItems = schema.type === 'array' && schema.items;

  const renderTypeLabel = () => {
    if (schema.type === 'array' && schema.items) {
      return `array<${schema.items.type || 'object'}>`;
    }
    return schema.type;
  };

  return (
    <div className="schema-field">
      <div 
        className="schema-field-header"
        style={{ cursor: hasChildren || hasItems ? 'pointer' : 'default' }}
        onClick={() => (hasChildren || hasItems) && setExpanded(!expanded)}
      >
        {(hasChildren || hasItems) && (
          <svg 
            style={{ 
              width: 12, 
              height: 12, 
              transition: 'transform 0.2s ease',
              transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
              color: '#94A3B8',
              flexShrink: 0
            }}
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        )}
        {!hasChildren && !hasItems && <span style={{ width: 12, flexShrink: 0 }} />}
        <span className="schema-field-name">{name}</span>
        <span className="schema-field-type">{renderTypeLabel()}</span>
        {required && <span className="schema-field-required">必填</span>}
      </div>
      {schema.description && (
        <div className="schema-field-desc" style={{ paddingLeft: 12 }}>{schema.description}</div>
      )}
      
      {expanded && hasChildren && (
        <div className="schema-children">
          {Object.entries(schema.properties!).map(([propName, field]) => (
            <SchemaFieldItem 
              key={propName} 
              name={propName} 
              schema={field}
              required={schema.required?.includes(propName)}
            />
          ))}
        </div>
      )}

      {expanded && hasItems && schema.items && (
        <div className="schema-children">
          <SchemaFieldItem 
            name="[item]" 
            schema={schema.items}
          />
        </div>
      )}
    </div>
  );
}

function generateCurl(api: ApiPath): string {
  let url = api.path;
  const pathParams = api.parameters.filter(p => p.in === 'path');
  pathParams.forEach(param => {
    const example = param.example || `{${param.name}}`;
    url = url.replace(`{${param.name}}`, String(example));
  });

  const queryParams = api.parameters.filter(p => p.in === 'query');
  if (queryParams.length > 0) {
    const queryString = queryParams
      .map(p => `${encodeURIComponent(p.name)}=${encodeURIComponent(String(p.example || ''))}`)
      .join('&');
    url += `?${queryString}`;
  }

  let curl = `curl -X ${api.method} "${url}"`;

  const headerParams = api.parameters.filter(p => p.in === 'header');
  headerParams.forEach(param => {
    curl += ` \\\n  -H "${param.name}: ${param.example || ''}"`;
  });

  if (api.method !== 'GET' && api.method !== 'HEAD') {
    if (api.requestBody) {
      const jsonContent = api.requestBody.content['application/json'];
      if (jsonContent) {
        curl += ` \\\n  -H "Content-Type: application/json"`;
        if (jsonContent.example) {
          curl += ` \\\n  -d '${JSON.stringify(jsonContent.example)}'`;
        } else {
          curl += ` \\\n  -d '{}'`;
        }
      }
    }
  }

  return curl;
}
