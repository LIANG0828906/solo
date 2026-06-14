import React, { useEffect, useState } from 'react';
import CharacterPanel from './CharacterPanel';
import SkillTree from '../skillModule/SkillTree';
import CombatPreview from '../combatModule/CombatPreview';
import Toast from './Toast';
import { useCharacterStore } from '../characterModule/CharacterStore';
import { eventBus } from '../shared/eventBus';

const MainLayout: React.FC = () => {
  const [viewport, setViewport] = useState<'desktop' | 'medium' | 'mobile'>('desktop');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const loaded = useCharacterStore((s) => s.loaded);
  const loadFromStorage = useCharacterStore((s) => s.loadFromStorage);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width > 1200) {
        setViewport('desktop');
      } else if (width >= 992) {
        setViewport('medium');
      } else {
        setViewport('mobile');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!loaded) {
      loadFromStorage();
    }
  }, [loaded, loadFromStorage]);

  useEffect(() => {
    const showToast = () => {
      setToastMessage('角色配置已恢复');
      setToastVisible(true);
    };

    const unsub = eventBus.on('character:loaded', showToast);
    return unsub;
  }, []);

  const handleToastClose = () => {
    setToastVisible(false);
  };

  const layoutStyle = getLayoutStyle(viewport);

  return (
    <div style={styles.container}>
      {viewport === 'desktop' && (
        <>
          <div style={styles.leftPanel}>
            <CharacterPanel />
          </div>
          <div style={styles.divider} />
          <div style={styles.centerPanel}>
            <SkillTree />
          </div>
          <div style={styles.divider} />
          <div style={styles.rightPanel}>
            <CombatPreview />
          </div>
        </>
      )}

      {viewport === 'medium' && (
        <>
          <div style={styles.leftRightContainer}>
            <div style={styles.leftPanel}>
              <CharacterPanel />
            </div>
            <div style={styles.divider} />
            <div style={styles.rightPanel}>
              <CombatPreview />
            </div>
          </div>
          <div style={styles.dividerHorizontal} />
          <div style={{ ...styles.centerPanel, height: '50%' }}>
            <SkillTree />
          </div>
        </>
      )}

      {viewport === 'mobile' && (
        <div style={styles.mobileContainer}>
          <div style={{ ...styles.leftPanel, width: '100%', height: 'auto', minHeight: '400px' }}>
            <CharacterPanel />
          </div>
          <div style={styles.dividerHorizontal} />
          <div style={{ ...styles.centerPanel, width: '100%', height: '400px', minHeight: '400px' }}>
            <SkillTree />
          </div>
          <div style={styles.dividerHorizontal} />
          <div style={{ ...styles.rightPanel, width: '100%', height: 'auto', minHeight: '400px' }}>
            <CombatPreview />
          </div>
        </div>
      )}

      <Toast message={toastMessage} visible={toastVisible} onClose={handleToastClose} />
    </div>
  );
};

function getLayoutStyle(viewport: string): React.CSSProperties {
  if (viewport === 'desktop') {
    return {
      display: 'flex',
      flexDirection: 'row',
      height: '100%',
      width: '100%',
    };
  } else if (viewport === 'medium') {
    return {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
    };
  } else {
    return {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
    };
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0f172a',
    display: 'flex',
    overflow: 'hidden',
  },
  leftRightContainer: {
    display: 'flex',
    flexDirection: 'row',
    height: '50%',
    width: '100%',
    flexShrink: 0,
  },
  mobileContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    overflowY: 'auto',
  },
  leftPanel: {
    width: '300px',
    backgroundColor: '#1e293b',
    height: '100%',
    flexShrink: 0,
    overflow: 'hidden',
  },
  centerPanel: {
    flex: 1,
    backgroundColor: '#0f172a',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  rightPanel: {
    width: '320px',
    backgroundColor: '#1e293b',
    height: '100%',
    flexShrink: 0,
    overflow: 'hidden',
  },
  divider: {
    width: '2px',
    backgroundColor: '#334155',
    flexShrink: 0,
  },
  dividerHorizontal: {
    height: '2px',
    backgroundColor: '#334155',
    flexShrink: 0,
  },
};

export default MainLayout;
