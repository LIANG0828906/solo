import React from 'react';
import { useStore } from '@/store/useStore';
import { Map, Thermometer, HelpCircle } from 'lucide-react';

export const NavBar: React.FC = () => {
  const {
    dataSource,
    temperatureUnit,
    showHelp,
    toggleDataSource,
    toggleTemperatureUnit,
    setShowHelp,
  } = useStore();

  return (
    <>
      <nav className="navbar">
        <div className="nav-left">
          <h1 className="app-title">3D气象可视化</h1>
        </div>
        <div className="nav-right">
          <button
            className="nav-icon-btn"
            onClick={toggleDataSource}
            title={`切换数据源: ${dataSource === 'cityA' ? '城市A' : '城市B'}`}
          >
            <Map className="w-5 h-5" />
            <span className="btn-tooltip">{dataSource === 'cityA' ? 'A' : 'B'}</span>
          </button>
          <button
            className="nav-icon-btn"
            onClick={toggleTemperatureUnit}
            title={`切换单位: ${temperatureUnit === 'celsius' ? '°C' : '°F'}`}
          >
            <Thermometer className="w-5 h-5" />
            <span className="btn-tooltip">
              {temperatureUnit === 'celsius' ? '°C' : '°F'}
            </span>
          </button>
          <button
            className="nav-icon-btn"
            onClick={() => setShowHelp(true)}
            title="帮助"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <div className={`help-overlay ${showHelp ? 'visible' : ''}`} onClick={() => setShowHelp(false)}>
        <div className="help-panel" onClick={(e) => e.stopPropagation()}>
          <h2>使用帮助</h2>
          <div className="help-content">
            <div className="help-item">
              <h3>🖱️ 鼠标操作</h3>
              <ul>
                <li><strong>拖拽</strong>：旋转视角</li>
                <li><strong>滚轮</strong>：缩放视图</li>
                <li><strong>双击网格</strong>：查看详细气象数据</li>
              </ul>
            </div>
            <div className="help-item">
              <h3>🎚️ 控制面板</h3>
              <ul>
                <li><strong>温度滑块</strong>：调节整体温度等级</li>
                <li><strong>湿度滑块</strong>：调节空气湿度</li>
                <li><strong>风力滑块</strong>：调节风力等级</li>
              </ul>
            </div>
            <div className="help-item">
              <h3>⏱️ 时间动画</h3>
              <ul>
                <li>点击播放按钮开始24小时循环</li>
                <li>以10倍速展示气象变化</li>
              </ul>
            </div>
            <div className="help-item">
              <h3>🌆 数据源</h3>
              <ul>
                <li>切换城市A/城市B查看不同区域</li>
                <li>地形和气候特征各不相同</li>
              </ul>
            </div>
          </div>
          <button className="help-close" onClick={() => setShowHelp(false)}>
            关闭
          </button>
        </div>
      </div>
    </>
  );
};
