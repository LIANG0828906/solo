import { useState, useEffect } from 'react';
import { useStore } from './store';
import { Layout } from './components/Layout';
import { BeanCard } from './components/BeanCard';
import { BrewTimeline } from './components/BrewTimeline';
import { ComparisonView } from './components/ComparisonView';
import { QRCodeDisplay } from './components/QRCodeDisplay';
import { StoryPage } from './pages/StoryPage';

function App() {
  const [activePage, setActivePage] = useState('beans');
  const [qrRecordId, setQrRecordId] = useState<string | null>(null);
  const [storyId, setStoryId] = useState<string | null>(null);

  const { beans, brewRecords, selectedForComparison } = useStore();

  useEffect(() => {
    const hash = window.location.hash.replace('#/', '');
    if (hash.startsWith('story/')) {
      const id = hash.replace('story/', '');
      setStoryId(id);
    }
  }, []);

  if (storyId) {
    return <StoryPage recordId={storyId} />;
  }

  const selectedRecords = brewRecords.filter((r) =>
    selectedForComparison.includes(r.id)
  );

  const renderPage = () => {
    switch (activePage) {
      case 'beans':
        return (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              <div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 24,
                    color: '#4E342E',
                    fontFamily: "'Playfair Display', serif",
                  }}
                >
                  咖啡豆档案
                </h1>
                <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#8D6E63' }}>
                  共 {beans.length} 款咖啡豆
                </p>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 20,
              }}
            >
              {beans.map((bean) => (
                <BeanCard key={bean.id} bean={bean} />
              ))}
            </div>
          </div>
        );

      case 'brews':
        return (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              <div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 24,
                    color: '#4E342E',
                    fontFamily: "'Playfair Display', serif",
                  }}
                >
                  冲煮记录
                </h1>
                <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#8D6E63' }}>
                  共 {brewRecords.length} 条记录
                </p>
              </div>
              {selectedForComparison.length > 0 && (
                <button
                  onClick={() => setActivePage('compare')}
                  style={{
                    padding: '8px 16px',
                    fontSize: 12,
                    borderRadius: 6,
                    border: '1px solid #6D4C41',
                    backgroundColor: '#6D4C41',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                  }}
                >
                  对比 {selectedForComparison.length} 条记录 →
                </button>
              )}
            </div>
            <BrewTimeline
              records={brewRecords}
              beans={beans}
              onGenerateQR={(id) => setQrRecordId(id)}
            />
          </div>
        );

      case 'compare':
        return (
          <ComparisonView selectedRecords={selectedRecords} beans={beans} />
        );

      default:
        return null;
    }
  };

  return (
    <Layout activePage={activePage} onNavigate={setActivePage}>
      {renderPage()}
      {qrRecordId && (
        <QRCodeDisplay recordId={qrRecordId} onClose={() => setQrRecordId(null)} />
      )}
    </Layout>
  );
}

export default App;
