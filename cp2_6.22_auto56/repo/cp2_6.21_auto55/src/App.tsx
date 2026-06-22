import React from 'react';
import ProductConfigurator from './components/ProductConfigurator';
import ComparisonView from './components/ComparisonView';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">商品颜色配置器</h1>
          <p className="app-subtitle">实时预览双方案配色，直观对比色差</p>
        </div>
      </header>

      <main className="app-main">
        <div className="main-layout">
          <aside className="side-panel">
            <ProductConfigurator />
          </aside>

          <section className="main-content">
            <ComparisonView />
          </section>
        </div>
      </main>

      <footer className="app-footer">
        <p>支持运动鞋、耳机、背包三种产品的多部件颜色定制</p>
      </footer>
    </div>
  );
};

export default App;
