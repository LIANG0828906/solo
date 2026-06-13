import { useState, useEffect, useCallback } from 'react';
import Toolbar from './Toolbar';
import ComponentPanel from './ComponentPanel';
import PageCanvas, { ComponentData } from './PageCanvas';
import { ComponentContent, ComponentStyle } from './EditModal';

function App() {
  const [components, setComponents] = useState<ComponentData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [panelWidth, setPanelWidth] = useState(240);
  const [loading, setLoading] = useState(true);

  const fetchComponents = useCallback(async () => {
    try {
      const response = await fetch('/api/components');
      if (response.ok) {
        const data = await response.json();
        setComponents(data);
      }
    } catch (error) {
      console.error('获取组件失败:', error);
      const localData = localStorage.getItem('landingPageComponents');
      if (localData) {
        setComponents(JSON.parse(localData));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComponents();
  }, [fetchComponents]);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('landingPageComponents', JSON.stringify(components));
    }
  }, [components, loading]);

  const handleDrop = async (type: string) => {
    try {
      const response = await fetch('/api/components', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, width: '100%' }),
      });
      if (response.ok) {
        const newComponent = await response.json();
        setComponents((prev) => [...prev, newComponent]);
        setSelectedId(newComponent.id);
      }
    } catch (error) {
      console.error('添加组件失败:', error);
      const localComponents = JSON.parse(localStorage.getItem('landingPageComponents') || '[]');
      const newComponent: ComponentData = {
        id: `local-${Date.now()}`,
        type,
        order_index: localComponents.length,
        content: JSON.stringify(getDefaultContent(type)),
        style: JSON.stringify(getDefaultStyle(type)),
        width: '100%',
      };
      setComponents((prev) => [...prev, newComponent]);
      setSelectedId(newComponent.id);
    }
  };

  const getDefaultContent = (type: string): ComponentContent => {
    switch (type) {
      case 'hero':
        return {
          title: '打造出色的产品体验',
          description: '使用我们的可视化构建器，快速创建专业的响应式落地页，无需编写任何代码。',
          imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20hero%20section%20with%20purple%20blue%20gradient%20background%20and%20product%20showcase&image_size=landscape_16_9',
          ctaText: '立即开始',
          ctaLink: '#',
        };
      case 'feature':
        return {
          title: '强大功能',
          description: '拖拽式操作，所见即所得，轻松创建精美页面。',
          imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=feature%20icon%20with%20purple%20blue%20gradient%20style&image_size=square',
        };
      case 'pricing':
        return {
          title: '专业版',
          description: '适合成长中的团队',
          price: '¥99/月',
          features: ['无限组件', '高级模板', '优先支持', '导出源码'],
        };
      case 'testimonial':
        return {
          description: '这是我用过的最好用的页面构建工具，节省了我大量的开发时间。',
          author: '张三',
          avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait%20friendly%20smile&image_size=square',
        };
      case 'footer':
        return {
          title: '准备好开始了吗？',
          description: '立即创建你的第一个落地页，免费开始使用。',
          ctaText: '免费试用',
          ctaLink: '#',
        };
      default:
        return {};
    }
  };

  const getDefaultStyle = (type: string): ComponentStyle => {
    switch (type) {
      case 'hero':
        return { backgroundColor: 'transparent', fontSize: '16px', textColor: '#ffffff' };
      case 'feature':
        return { backgroundColor: 'rgba(255,255,255,0.05)', fontSize: '14px', textColor: '#ffffff' };
      case 'pricing':
        return { backgroundColor: 'rgba(255,255,255,0.08)', fontSize: '14px', textColor: '#ffffff' };
      case 'testimonial':
        return { backgroundColor: 'rgba(255,255,255,0.05)', fontSize: '14px', textColor: '#ffffff' };
      case 'footer':
        return { backgroundColor: 'transparent', fontSize: '16px', textColor: '#ffffff' };
      default:
        return {};
    }
  };

  const handleUpdateComponent = async (
    id: string,
    content: ComponentContent,
    style: ComponentStyle
  ) => {
    try {
      const response = await fetch(`/api/components/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: JSON.stringify(content),
          style: JSON.stringify(style),
        }),
      });
      if (response.ok) {
        const updated = await response.json();
        setComponents((prev) => prev.map((c) => (c.id === id ? updated : c)));
      }
    } catch (error) {
      console.error('更新组件失败:', error);
      setComponents((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, content: JSON.stringify(content), style: JSON.stringify(style) }
            : c
        )
      );
    }
  };

  const handleUpdateWidth = async (id: string, width: string) => {
    try {
      const response = await fetch(`/api/components/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ width }),
      });
      if (response.ok) {
        const updated = await response.json();
        setComponents((prev) => prev.map((c) => (c.id === id ? updated : c)));
      }
    } catch (error) {
      console.error('更新宽度失败:', error);
      setComponents((prev) => prev.map((c) => (c.id === id ? { ...c, width } : c)));
    }
  };

  const handleDeleteComponent = async (id: string) => {
    try {
      const response = await fetch(`/api/components/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setComponents((prev) => prev.filter((c) => c.id !== id));
        if (selectedId === id) setSelectedId(null);
      }
    } catch (error) {
      console.error('删除组件失败:', error);
      setComponents((prev) => prev.filter((c) => c.id !== id));
      if (selectedId === id) setSelectedId(null);
    }
  };

  const handleTogglePreview = () => {
    setIsFlipping(true);
    setTimeout(() => {
      setIsPreviewMode((prev) => !prev);
      setTimeout(() => {
        setIsFlipping(false);
      }, 100);
    }, 250);
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'landing-page.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出功能需要后端服务支持，请确保后端服务已启动。');
    }
  };

  const handleResizeEnd = (width: number) => {
    setPanelWidth(width);
  };

  return (
    <div className="app-container">
      <Toolbar
        isPreviewMode={isPreviewMode}
        onTogglePreview={handleTogglePreview}
        onExport={handleExport}
      />
      <div className="main-content">
        {!isPreviewMode && (
          <ComponentPanel
            collapsed={panelCollapsed}
            onToggleCollapse={() => setPanelCollapsed((prev) => !prev)}
            panelWidth={panelWidth}
            onResizeEnd={handleResizeEnd}
          />
        )}
        <div className="page-canvas">
          <div className="canvas-container">
            <div className={`canvas-3d-wrapper ${isFlipping ? 'flipped' : ''}`}>
              <div className="canvas-face front">
                {loading ? (
                  <div className="empty-state">加载中...</div>
                ) : (
                  <PageCanvas
                    components={components}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onDrop={handleDrop}
                    onUpdateComponent={handleUpdateComponent}
                    onUpdateWidth={handleUpdateWidth}
                    onDeleteComponent={handleDeleteComponent}
                    isPreview={isPreviewMode}
                  />
                )}
              </div>
              <div className="canvas-face back">
                <PageCanvas
                  components={components}
                  selectedId={null}
                  onSelect={() => {}}
                  onDrop={() => {}}
                  onUpdateComponent={() => {}}
                  onUpdateWidth={() => {}}
                  onDeleteComponent={() => {}}
                  isPreview={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
