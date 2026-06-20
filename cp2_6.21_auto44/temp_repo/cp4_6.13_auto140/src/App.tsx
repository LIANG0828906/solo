import React, { useState, useCallback } from 'react';
import FileUploader from './components/FileUploader';
import ChartPanel from './components/ChartPanel';
import ScrollStory from './components/ScrollStory';
import { generateStoryScenes } from './utils/storyGenerator';
import type { ParsedCSVData, ChartConfig, TurningPoint, TrendLine, StoryScene } from './types';

const App: React.FC = () => {
  const [data, setData] = useState<ParsedCSVData | null>(null);
  const [chartConfig, setChartConfig] = useState<ChartConfig | null>(null);
  const [turningPoints, setTurningPoints] = useState<TurningPoint[]>([]);
  const [trendLines, setTrendLines] = useState<TrendLine[]>([]);
  const [scenes, setScenes] = useState<StoryScene[]>([]);
  const [showStory, setShowStory] = useState(false);

  const handleDataLoaded = useCallback((loadedData: ParsedCSVData) => {
    setData(loadedData);
    setChartConfig(null);
    setTurningPoints([]);
    setTrendLines([]);
    setScenes([]);
    setShowStory(false);
    
    console.log(`已加载 ${loadedData.rowCount} 行数据，${loadedData.headers.length} 个字段`);
  }, []);

  const handleGenerate = useCallback((
    config: ChartConfig,
    points: TurningPoint[],
    trends: TrendLine[]
  ) => {
    setChartConfig(config);
    setTurningPoints(points);
    setTrendLines(trends);
    
    const startTime = performance.now();
    const generatedScenes = generateStoryScenes(data!, config, points, trends);
    const endTime = performance.now();
    
    console.log(`故事生成耗时: ${(endTime - startTime).toFixed(2)}ms，共 ${generatedScenes.length} 个场景`);
    
    setScenes(generatedScenes);
    setShowStory(true);
    
    setTimeout(() => {
      const storyElement = document.querySelector('.scroll-story-container');
      if (storyElement) {
        storyElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 300);
  }, [data]);

  const handleReset = useCallback(() => {
    setData(null);
    setChartConfig(null);
    setTurningPoints([]);
    setTrendLines([]);
    setScenes([]);
    setShowStory(false);
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">
            <span className="title-icon">📊</span>
            交互式数据故事生成器
          </h1>
          <p className="app-subtitle">
            上传CSV时间序列数据，AI自动生成图文并茂的数据故事
          </p>
        </div>
        {data && (
          <button className="reset-btn" onClick={handleReset}>
            重新开始
          </button>
        )}
      </header>

      <main className="app-main">
        {!data ? (
          <section className="upload-section">
            <FileUploader onDataLoaded={handleDataLoaded} />
          </section>
        ) : (
          <>
            <section className="info-bar">
              <div className="info-item">
                <span className="info-label">文件名</span>
                <span className="info-value">{data.rowCount} 行数据</span>
              </div>
              <div className="info-item">
                <span className="info-label">字段数</span>
                <span className="info-value">{data.headers.length} 个</span>
              </div>
              <div className="info-item">
                <span className="info-label">字段类型</span>
                <div className="type-tags">
                  {Array.from(new Set(data.headers.map(h => h.type))).map(type => (
                    <span key={type} className={`type-tag type-${type}`}>
                      {type === 'time' ? '时间' : type === 'numeric' ? '数值' : '分类'}
                    </span>
                  ))}
                </div>
              </div>
            </section>
            
            <section className="chart-section">
              <ChartPanel 
                data={data} 
                onGenerate={handleGenerate}
              />
            </section>
            
            {showStory && scenes.length > 0 && (
              <section className="story-section">
                <ScrollStory 
                  scenes={scenes}
                  data={data}
                  config={chartConfig!}
                />
              </section>
            )}
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>支持 CSV 格式 | 最多 200 行数据 | Canvas 2D 渲染</p>
      </footer>
      
      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #0f0f1a;
          color: rgba(255, 255, 255, 0.9);
          min-height: 100vh;
          overflow-x: hidden;
        }
        
        #root {
          min-height: 100vh;
        }
        
        .app-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%);
        }
        
        .app-header {
          padding: 28px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(15, 15, 26, 0.8);
          backdrop-filter: blur(20px);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        
        .header-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .app-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.95);
          display: flex;
          align-items: center;
          gap: 12px;
          letter-spacing: -0.5px;
        }
        
        .title-icon {
          font-size: 28px;
        }
        
        .app-subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
          margin: 0;
        }
        
        .reset-btn {
          padding: 10px 20px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Inter', sans-serif;
        }
        
        .reset-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.9);
        }
        
        .app-main {
          flex: 1;
          padding: 40px 20px;
        }
        
        .upload-section {
          padding: 60px 20px;
        }
        
        .info-bar {
          max-width: 1000px;
          margin: 0 auto 32px;
          display: flex;
          gap: 32px;
          padding: 20px 28px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          flex-wrap: wrap;
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .info-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .info-value {
          font-size: 16px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          font-family: 'Space Grotesk', sans-serif;
        }
        
        .type-tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .type-tag {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .type-time {
          background: rgba(51, 87, 255, 0.15);
          color: #3357FF;
        }
        
        .type-numeric {
          background: rgba(51, 255, 87, 0.15);
          color: #33FF57;
        }
        
        .type-categorical {
          background: rgba(255, 51, 166, 0.15);
          color: #FF33A6;
        }
        
        .chart-section {
          margin-bottom: 40px;
        }
        
        .story-section {
          margin-top: 40px;
        }
        
        .app-footer {
          padding: 24px;
          text-align: center;
          color: rgba(255, 255, 255, 0.3);
          font-size: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
        }
        
        .app-footer p {
          margin: 0;
        }
        
        @media (max-width: 768px) {
          .app-header {
            padding: 16px 20px;
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }
          
          .app-title {
            font-size: 20px;
          }
          
          .app-main {
            padding: 24px 12px;
          }
          
          .upload-section {
            padding: 20px 0;
          }
          
          .info-bar {
            gap: 20px;
            padding: 16px 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
