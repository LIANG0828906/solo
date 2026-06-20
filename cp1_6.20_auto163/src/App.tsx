import React, { useState, useRef, useCallback, useEffect } from 'react';
import ResumeForm, { ResumeData } from './components/ResumeForm';
import ResumePreview, { ResumePreviewRef } from './components/ResumePreview';
import ThemeSelector from './components/ThemeSelector';
import { Theme, themes } from './styles/themes';
import { exportAsImage } from './utils/exportImage';
import './App.css';

const defaultResumeData: ResumeData = {
  basicInfo: {
    name: '张明远',
    title: '高级前端开发工程师',
    email: 'zhangmingyuan@email.com',
    phone: '138-8888-8888',
    summary: '5年前端开发经验，精通React、Vue等主流框架，熟悉TypeScript和Node.js。具有良好的团队协作能力和项目管理经验，热爱技术，追求卓越的用户体验。'
  },
  education: [
    {
      id: '1',
      school: '北京理工大学',
      major: '计算机科学与技术',
      period: '2015.09 - 2019.06',
      description: '本科学历，GPA 3.8/4.0，获得校级奖学金两次，担任计算机协会技术部部长。'
    }
  ],
  workExperience: [
    {
      id: '1',
      company: '字节跳动',
      position: '高级前端工程师',
      period: '2021.07 - 至今',
      description: '负责抖音电商核心模块的前端架构设计与开发，主导微前端方案落地，提升团队开发效率30%。优化首屏加载性能，LCP从3.2s降至1.5s。'
    },
    {
      id: '2',
      company: '阿里巴巴',
      position: '前端开发工程师',
      period: '2019.07 - 2021.06',
      description: '参与淘宝商家后台系统开发，负责商品管理、订单处理等核心模块。推动组件库建设，沉淀通用组件40+，覆盖80%业务场景。'
    }
  ],
  skills: [
    { name: '沟通', value: 85 },
    { name: '编程', value: 92 },
    { name: '设计', value: 70 },
    { name: '管理', value: 75 },
    { name: '英语', value: 80 }
  ]
};

const App: React.FC = () => {
  const [resumeData, setResumeData] = useState<ResumeData>(defaultResumeData);
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0]);
  const [isMobile, setIsMobile] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const previewRef = useRef<ResumePreviewRef>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleThemeChange = useCallback((theme: Theme) => {
    setCurrentTheme(theme);
  }, []);

  const handleExport = useCallback(async () => {
    setIsFlashing(true);
    setTimeout(async () => {
      setIsFlashing(false);
      const element = previewRef.current?.getResumeElement();
      if (element) {
        try {
          await exportAsImage(element, resumeData.basicInfo.name || 'resume');
        } catch (error) {
          console.error('导出失败:', error);
        }
      }
    }, 300);
  }, [resumeData.basicInfo.name]);

  const layoutStyle: React.CSSProperties = isMobile
    ? {
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100%'
      }
    : {
        display: 'flex',
        height: '100vh',
        width: '100%'
      };

  const formPanelStyle: React.CSSProperties = {
    width: isMobile ? '100%' : '40%',
    height: isMobile ? '50%' : '100%',
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  };

  const previewPanelStyle: React.CSSProperties = {
    width: isMobile ? '100%' : '60%',
    height: isMobile ? '50%' : '100%',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  };

  const formHeaderStyle: React.CSSProperties = {
    padding: '16px 24px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const previewHeaderStyle: React.CSSProperties = {
    padding: '12px 24px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  return (
    <div style={layoutStyle}>
      <div style={formPanelStyle}>
        <div style={formHeaderStyle}>
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#333' }}>
            📝 简历编辑
          </h1>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <ResumeForm data={resumeData} onChange={setResumeData} />
        </div>
      </div>

      <div style={previewPanelStyle}>
        <div style={previewHeaderStyle}>
          <div className="export-btn-container" style={{ position: 'relative', overflow: 'hidden', borderRadius: '8px' }}>
            <button
              style={{
                padding: '10px 24px',
                backgroundColor: '#4a90d9',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'background-color 0.2s'
              }}
              onClick={handleExport}
            >
              导出图片
            </button>
            {isFlashing && <div className="flash-effect" />}
          </div>
          <ThemeSelector currentTheme={currentTheme} onThemeChange={handleThemeChange} />
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <ResumePreview
            ref={previewRef}
            data={resumeData}
            theme={currentTheme}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
