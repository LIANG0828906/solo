import { useEffect, useState } from 'react';
import axios from 'axios';
import type { LayoutComponent } from '../types';
import { ComponentRenderer } from './ComponentRenderer';

export function StorePreview() {
  const [components, setComponents] = useState<LayoutComponent[]>([]);
  const [storeName, setStoreName] = useState('我的店铺');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get<{ components: LayoutComponent[]; name: string }>('/api/store')
      .then((res) => {
        setComponents(res.data.components || []);
        setStoreName(res.data.name || '我的店铺');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#f8f9fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ color: '#666', fontSize: 14 }}>加载中...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '32px 24px',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            padding: '32px 0',
            marginBottom: 24,
            backgroundColor: '#fff',
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ fontSize: 14, color: '#999', marginBottom: 8 }}>欢迎光临</div>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: '#3a7bd5',
              margin: 0,
            }}
          >
            🏪 {storeName}
          </h1>
        </div>

        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          {components.length === 0 ? (
            <div
              style={{
                padding: 80,
                textAlign: 'center',
                color: '#999',
                fontSize: 15,
              }}
            >
              <div style={{ fontSize: 56, marginBottom: 20 }}>🏗️</div>
              <div>店铺正在装修中，敬请期待...</div>
            </div>
          ) : (
            components.map((comp, index) => (
              <div key={comp.id} style={{ position: 'relative' }}>
                <div style={{ marginBottom: index < components.length - 1 ? 12 : 0 }}>
                  <ComponentRenderer component={comp} isEditor={false} />
                </div>
                {index < components.length - 1 && (
                  <div style={{ borderTop: '1px dashed #eee', margin: '4px 0 12px' }} />
                )}
              </div>
            ))
          )}
        </div>

        <div
          style={{
            textAlign: 'center',
            padding: '32px 0 16px',
            color: '#bbb',
            fontSize: 12,
          }}
        >
          © 2024 {storeName} - Powered by 店铺装修平台
        </div>
      </div>
    </div>
  );
}
