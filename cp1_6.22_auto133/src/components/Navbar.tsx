import React from 'react';
import { useDispatch } from 'react-redux';
import { HelpCircle, Settings, Layers, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { AppDispatch, resetLayout, toggleLeftPanel, toggleRightPanel } from '@/store/store';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

const Navbar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const leftOpen = useSelector((s: RootState) => s.app.ui.leftPanelOpen);
  const rightOpen = useSelector((s: RootState) => s.app.ui.rightPanelOpen);

  const handleReset = () => {
    dispatch(resetLayout());
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button
          className="panel-toggle"
          onClick={() => dispatch(toggleLeftPanel())}
          title={leftOpen ? '收起组件面板' : '展开组件面板'}
        >
          {leftOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
        <div className="brand">
          <Layers size={22} className="brand-icon" />
          <span className="brand-name">ProtoPlayground</span>
        </div>
      </div>

      <div className="navbar-right">
        <button
          className="reset-btn"
          onClick={handleReset}
          title="清空画布与日志"
        >
          <RotateCcw size={16} />
          <span>重置布局</span>
        </button>

        <button className="icon-btn" title="帮助">
          <HelpCircle size={20} />
        </button>
        <button className="icon-btn" title="设置">
          <Settings size={20} />
        </button>
        <button
          className="panel-toggle"
          onClick={() => dispatch(toggleRightPanel())}
          title={rightOpen ? '收起日志面板' : '展开日志面板'}
        >
          {rightOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
