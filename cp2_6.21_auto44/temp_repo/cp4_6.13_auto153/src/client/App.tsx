import React, { useState, useCallback } from 'react';
import { InputPanel } from './InputPanel';
import { GraphViewer } from './GraphViewer';
import { GraphData } from './types';

export const App: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const handleGenerate = useCallback(async (text: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || '生成图谱失败');
        return;
      }
      
      setGraphData(data);
    } catch (err) {
      setError('网络错误，请检查服务器连接');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleClear = useCallback(() => {
    setGraphData(null);
    setError(null);
    setSearchQuery('');
    setSuggestions([]);
  }, []);
  
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    
    if (graphData && value.length > 0) {
      const matching = graphData.nodes
        .map(n => n.name)
        .filter(name => name.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5);
      setSuggestions(matching);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [graphData]);
  
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
  }, []);
  
  const handleExport = useCallback(() => {
    console.log('图谱已导出');
  }, []);
  
  return (
    <div className="app">
      <header className="header">
        <h1 className="header-title">知识图谱探索器</h1>
        <div className="header-actions">
          {graphData && (
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="搜索概念..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul className="suggestions-list">
                  {suggestions.map((s, i) => (
                    <li key={i} onClick={() => handleSuggestionClick(s)}>
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </header>
      
      <main className="main">
        <aside className="sidebar">
          <InputPanel 
            onGenerate={handleGenerate}
            onClear={handleClear}
            isLoading={isLoading}
          />
          {error && (
            <div className="global-error">
              {error}
            </div>
          )}
        </aside>
        
        <section className="content">
          <GraphViewer 
            data={graphData}
            searchQuery={searchQuery}
            onExport={handleExport}
          />
        </section>
      </main>
    </div>
  );
};