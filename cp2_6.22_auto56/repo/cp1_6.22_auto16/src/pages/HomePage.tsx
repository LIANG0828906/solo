import React, { useState, useEffect } from 'react';
import type { Template } from '../types';
import TemplateCard from '../components/TemplateCard';
import CreateTemplateModal from '../components/CreateTemplateModal';
import { dataService } from '../DataService';
import '../styles/HomePage.css';

interface HomePageProps {
  onNavigateResult?: (templateId: string) => void;
}

const HomePage: React.FC<HomePageProps> = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await dataService.getAllTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('加载模板失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (name: string, dimensions: Omit<Template['dimensions'][0], 'id'>[]) => {
    try {
      const newTemplate = await dataService.createTemplate(name, dimensions);
      setTemplates(prev => [newTemplate, ...prev]);
    } catch (error) {
      console.error('创建模板失败:', error);
      alert('创建模板失败，请重试');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await dataService.deleteTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('删除模板失败:', error);
      alert('删除模板失败，请重试');
    }
  };

  return (
    <div className="home-page">
      <div className="home-hero">
        <h1 className="hero-title">
          敏捷复盘反馈
        </h1>
        <p className="hero-subtitle">
          快速收集团队反馈，实时生成权重可调的雷达图报告
        </p>
        <button
          className="create-template-btn"
          onClick={() => setIsModalOpen(true)}
        >
          <span className="btn-icon">+</span>
          创建复盘模板
        </button>
      </div>

      <div className="templates-section">
        <div className="section-header">
          <h2 className="section-title">我的模板</h2>
          <span className="template-count">{templates.length} 个模板</span>
        </div>

        {loading ? (
          <div className="loading-state">加载中...</div>
        ) : templates.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>暂无模板，点击上方按钮创建第一个模板</p>
          </div>
        ) : (
          <div className="templates-grid">
            {templates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onDelete={handleDeleteTemplate}
              />
            ))}
          </div>
        )}
      </div>

      <CreateTemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateTemplate}
      />
    </div>
  );
};

export default HomePage;
