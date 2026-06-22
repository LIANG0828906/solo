import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map,
  Edit3,
  Eye,
  Download,
  Share2,
  Home,
  Sun,
  Cloud,
  CloudRain,
  X,
  Check,
  Copy
} from 'lucide-react';
import { useStore } from './store';
import MapView from './MapView';
import StoryEditor from './StoryEditor';
import StoryPage from './StoryPage';

const App: React.FC = () => {
  const {
    photos,
    story,
    currentPage,
    isPreviewMode,
    isLoading,
    error,
    setCurrentPage,
    togglePreviewMode,
    exportPDF,
    generateShareLink,
    updateStoryTitle,
    updateWeather,
    generateCover,
    updateDescription,
    loadFromStorage
  } = useStore((state) => ({
    photos: state.photos,
    story: state.story,
    currentPage: state.currentPage,
    isPreviewMode: state.isPreviewMode,
    isLoading: state.isLoading,
    error: state.error,
    setCurrentPage: state.setCurrentPage,
    togglePreviewMode: state.togglePreviewMode,
    exportPDF: state.exportPDF,
    generateShareLink: state.generateShareLink,
    updateStoryTitle: state.updateStoryTitle,
    updateWeather: state.updateWeather,
    generateCover: state.generateCover,
    updateDescription: state.updateDescription,
    loadFromStorage: state.loadFromStorage
  }));

  const [activeTab, setActiveTab] = useState<'editor' | 'map'>('editor');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [showCoverEditor, setShowCoverEditor] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('share');
    if (shareId) {
      loadFromStorage(shareId);
    }
  }, [loadFromStorage]);

  const handleGenerateShareLink = () => {
    const link = generateShareLink();
    setShareLink(link);
    setShowShareModal(true);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const handleExportPDF = async () => {
    await exportPDF();
  };

  const navItems = [
    { id: 'editor', icon: Edit3, label: '编辑' },
    { id: 'map', icon: Map, label: '地图' },
  ];

  return (
    <div style={styles.app}>
      <nav style={styles.sidebar}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>✈️</span>
        </div>
        
        <div style={styles.navItems}>
          {navItems.map((item) => (
            <button
              key={item.id}
              style={{
                ...styles.navButton,
                background: activeTab === item.id ? 'rgba(74, 144, 217, 0.2)' : 'transparent'
              }}
              onClick={() => setActiveTab(item.id as 'editor' | 'map')}
              title={item.label}
            >
              <item.icon size={22} color="white" />
            </button>
          ))}
        </div>
        
        <div style={styles.navBottom}>
          <button
            style={styles.navButton}
            onClick={togglePreviewMode}
            title={isPreviewMode ? '编辑模式' : '预览模式'}
          >
            {isPreviewMode ? (
              <Edit3 size={22} color="white" />
            ) : (
              <Eye size={22} color="white" />
            )}
          </button>
          
          {story && (
            <>
              <button
                style={styles.navButton}
                onClick={handleExportPDF}
                title="导出PDF"
                disabled={isLoading}
              >
                <Download size={22} color="white" />
              </button>
              
              <button
                style={styles.navButton}
                onClick={handleGenerateShareLink}
                title="生成分享链接"
              >
                <Share2 size={22} color="white