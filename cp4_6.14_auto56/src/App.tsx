import { useState, useEffect, useCallback, useRef } from 'react';
import { Save, GitCompare, Menu, X } from 'lucide-react';
import { Editor } from './editor/Editor';
import { LanguageSelector } from './editor/LanguageSelector';
import { VersionList } from './diff/VersionList';
import { DiffViewer } from './diff/DiffViewer';
import { localStore } from './storage/localStore';
import type { CodeVersion, Language } from './types';
import styles from './App.module.css';

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function App() {
  const [code, setCode] = useState<string>(`// 欢迎使用代码片段分享工具
// 在此输入或粘贴你的代码
function greet(name) {
  console.log("Hello, " + name + "!");
  return { message: "Welcome!", code: 200 };
}

greet("World");
`);
  const [language, setLanguage] = useState<Language>('javascript');
  const [versions, setVersions] = useState<CodeVersion[]>([]);
  const [showDiff, setShowDiff] = useState(false);
  const [leftVersion, setLeftVersion] = useState<CodeVersion | null>(null);
  const [rightVersion, setRightVersion] = useState<CodeVersion | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | undefined>(undefined);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const diffButtonRef = useRef<HTMLButtonElement>(null);

  const loadVersions = useCallback(async () => {
    try {
      const versionList = await localStore.getVersionList();
      setVersions(versionList);
    } catch (error) {
      console.error('Failed to load versions:', error);
    }
  }, []);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = 30;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.className = styles.ripple;
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 400);
  };

  const handleSave = async (e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e);
    try {
      const version = await localStore.saveVersion(code, language);
      setVersions((prev) => [version, ...prev.slice(0, 99)]);
      setSelectedVersionId(version.id);
    } catch (error) {
      console.error('Failed to save version:', error);
    }
  };

  const handleDiff = (e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e);
    if (versions.length >= 2) {
      setLeftVersion(versions[1]);
      setRightVersion(versions[0]);
      setShowDiff(true);
    } else if (versions.length === 1) {
      setLeftVersion(null);
      setRightVersion(versions[0]);
      setShowDiff(true);
    } else {
      alert('请先保存至少一个版本');
    }
  };

  const handleSelectVersion = (version: CodeVersion) => {
    setCode(version.code);
    setLanguage(version.language);
    setSelectedVersionId(version.id);
    setMobileMenuOpen(false);
  };

  const handleDeleteVersion = async (id: string) => {
    try {
      await localStore.deleteVersion(id);
      setVersions((prev) => prev.filter((v) => v.id !== id));
      if (selectedVersionId === id) {
        setSelectedVersionId(undefined);
      }
    } catch (error) {
      console.error('Failed to delete version:', error);
    }
  };

  const handleCloseDiff = () => {
    setShowDiff(false);
  };

  return (
    <div className={styles.app}>
      <div className={styles.mainContent}>
        <div className={styles.editorSection}>
          <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
              <LanguageSelector language={language} onChange={setLanguage} />
            </div>
            <div className={styles.toolbarRight}>
              <button
                ref={saveButtonRef}
                className={styles.primaryButton}
                onClick={handleSave}
              >
                <Save size={16} />
                <span>保存版本</span>
              </button>
              <button
                ref={diffButtonRef}
                className={styles.secondaryButton}
                onClick={handleDiff}
              >
                <GitCompare size={16} />
                <span>对比</span>
              </button>
              <button
                className={styles.menuButton}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          <div className={styles.editorWrapper}>
            <Editor code={code} language={language} onChange={setCode} />
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3 className={styles.sidebarTitle}>版本历史</h3>
          </div>
          <div className={styles.sidebarContent}>
            <VersionList
              versions={versions}
              selectedId={selectedVersionId}
              onSelect={handleSelectVersion}
              onDelete={handleDeleteVersion}
            />
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className={styles.mobileDrawer}>
          <div className={styles.mobileDrawerHeader}>
          <h3 className={styles.mobileDrawerTitle}>版本历史</h3>
          <button
            className={styles.closeDrawerButton}
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
          <div className={styles.mobileDrawerContent}>
            <VersionList
              versions={versions}
              selectedId={selectedVersionId}
              onSelect={handleSelectVersion}
              onDelete={handleDeleteVersion}
            />
          </div>
        </div>
      )}

      {showDiff && (
        <DiffViewer
          oldCode={leftVersion?.code || ''}
          newCode={rightVersion?.code || ''}
          language={language}
          onClose={handleCloseDiff}
          oldVersionLabel={leftVersion ? formatTimestamp(leftVersion.timestamp) : '无'}
          newVersionLabel={rightVersion ? formatTimestamp(rightVersion.timestamp) : '无'}
        />
      )}
    </div>
  );
}

export default App;
