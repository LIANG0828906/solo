import React, { useState, useEffect, useRef } from 'react';
import ProjectGallery from './ProjectGallery';
import PhotoDetail from './PhotoDetail';
import type { Photo, Project } from './types';
import { getPhotos, getProjects, uploadPhoto } from './api';

const App: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsData, photosData] = await Promise.all([
          getProjects(),
          getPhotos(),
        ]);
        setProjects(projectsData);
        setCurrentProject(projectsData[0] || null);
        setPhotos(photosData);
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredPhotos = photos.filter((photo) =>
    photo.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePhotoClick = (photoId: string) => {
    setSelectedPhotoId(photoId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToGallery = () => {
    setSelectedPhotoId(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleUpload(files[0]);
    }
  };

  const handleUpload = async (file: File) => {
    if (!currentProject) return;
    
    if (file.size > 10 * 1024 * 1024) {
      alert('照片大小不能超过 10MB');
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      alert('仅支持 JPG 和 PNG 格式');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      setUploadProgress(30);
      const newPhoto = await uploadPhoto(
        file,
        currentProject.id,
        currentProject.photographerName
      );
      setUploadProgress(100);
      setPhotos((prev) => [newPhoto, ...prev]);
      
      setTimeout(() => {
        setShowUploadModal(false);
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      console.error('上传失败:', error);
      alert('上传失败，请重试');
      setUploading(false);
      setUploadProgress(0);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-left">
          <div
            className="hamburger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>
          <h1 className="navbar-title">光影交付</h1>
          {currentProject && !selectedPhotoId && (
            <span style={{ color: '#999', fontSize: 14 }}>
              / {currentProject.name}
            </span>
          )}
        </div>

        {!selectedPhotoId && (
          <div className="navbar-search">
            <input
              type="text"
              placeholder="搜索照片..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        <div className="navbar-right">
          {isAdmin && !selectedPhotoId && (
            <button
              className="nav-btn primary"
              onClick={() => setShowUploadModal(true)}
            >
              + 上传照片
            </button>
          )}
          <button
            className={`nav-btn ${isAdmin ? 'primary' : ''}`}
            onClick={() => setIsAdmin(!isAdmin)}
          >
            {isAdmin ? '管理模式' : '访客模式'}
          </button>
        </div>
      </nav>

      <main className="main-content">
        <div className="container">
          {selectedPhotoId ? (
            <PhotoDetail photoId={selectedPhotoId} onBack={handleBackToGallery} />
          ) : (
            <>
              <div className="page-header">
                <h2 className="page-title">
                  {currentProject?.name || '作品集'}
                </h2>
                <p className="page-subtitle">
                  {currentProject?.description || '精选作品展示'}
                  {' · '}
                  共 {filteredPhotos.length} 张照片
                </p>
              </div>

              <ProjectGallery
                photos={filteredPhotos}
                onPhotoClick={handlePhotoClick}
                loading={loading}
              />
            </>
          )}
        </div>
      </main>

      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 64,
            left: 0,
            right: 0,
            background: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            padding: 16,
            zIndex: 99,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <input
            type="text"
            placeholder="搜索照片..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setMobileMenuOpen(false);
            }}
            style={{
              padding: '10px 16px',
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              outline: 'none',
            }}
          />
          {isAdmin && (
            <button
              className="nav-btn"
              style={{ textAlign: 'left', padding: '12px 8px', width: '100%' }}
              onClick={() => {
                setShowUploadModal(true);
                setMobileMenuOpen(false);
              }}
            >
              + 上传照片
            </button>
          )}
          <button
            className="nav-btn"
            style={{ textAlign: 'left', padding: '12px 8px', width: '100%' }}
            onClick={() => {
              setIsAdmin(!isAdmin);
              setMobileMenuOpen(false);
            }}
          >
            {isAdmin ? '管理模式' : '访客模式'}
          </button>
        </div>
      )}

      {showUploadModal && (
        <div className="modal" onClick={() => !uploading && setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">上传照片</h2>
              <button
                className="modal-close"
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {uploading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div className="loading" style={{ padding: '20px 0' }}>
                    <div className="loading-spinner"></div>
                  </div>
                  <p style={{ color: '#666', marginTop: 16 }}>正在处理照片...</p>
                  <div style={{ 
                    width: '100%', 
                    height: 6, 
                    background: '#e0e0e0', 
                    borderRadius: 3, 
                    marginTop: 16,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${uploadProgress}%`,
                      background: '#1C3F60',
                      borderRadius: 3,
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>
              ) : (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  style={{
                    border: '2px dashed #ccc',
                    borderRadius: 8,
                    padding: '60px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s, background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#1C3F60';
                    e.currentTarget.style.backgroundColor = 'rgba(28, 63, 96, 0.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#ccc';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>📷</div>
                  <p style={{ color: '#666', marginBottom: 8 }}>
                    拖拽照片到此处或点击选择
                  </p>
                  <p style={{ color: '#999', fontSize: 12 }}>
                    支持 JPG、PNG 格式，单张最大 10MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
