import React, { useState, useEffect } from 'react';
import { useIssueStore } from '@/store/issueStore';
import { IssueList } from '@/components/IssueList';
import { IssueDetail } from '@/components/IssueDetail';

const App: React.FC = () => {
  const { selectedIssueId } = useIssueStore();
  const [isMobile, setIsMobile] = useState(false);
  const [isWide, setIsWide] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
      setIsMobile(window.innerWidth < 768);
      setIsWide(window.innerWidth >= 1200);
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  const showDetail = selectedIssueId !== null;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F8FAFC',
    }}>
      <div
        style={{
          maxWidth: isWide ? '1200px' : '100%',
          margin: '0 auto',
          padding: isMobile ? '12px' : '24px',
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{
            fontSize: isMobile ? '20px' : '24px',
            fontWeight: 'bold',
            color: '#1E293B',
            marginBottom: '4px',
          }}>
            Issue 管理中心
          </h1>
          <p style={{
            fontSize: '13px',
            color: '#64748B',
          }}>
            高效管理开源项目 Issue，智能识别重复问题与自动标签
          </p>
        </div>

        {isMobile ? (
          <div>
            {showDetail ? (
              <IssueDetail />
            ) : (
              <IssueList />
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: showDetail ? 'minmax(0, 1.2fr) minmax(0, 1fr)' : '1fr',
            gap: '16px',
            alignItems: 'flex-start',
            transition: 'grid-template-columns 0.2s ease',
          }}>
            <div style={{ minWidth: 0 }}>
              <IssueList />
            </div>
            {showDetail && (
              <div style={{
                minWidth: 0,
                position: 'sticky',
                top: '24px',
                maxHeight: 'calc(100vh - 48px)',
              }}>
                <IssueDetail />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
