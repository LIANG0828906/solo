import { useState, useEffect } from 'react';
import { Drawer, Button } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import ScoreEditor from './modules/score/ScoreEditor';
import PlayerControls from './modules/score/PlayerControls';
import './styles.css';

function App() {
  const [mobile, setMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh', background: '#1E1E1E', position: 'relative' }}>
      {mobile && (
        <Button
          className="mobile-menu-btn"
          icon={drawerOpen ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setDrawerOpen(!drawerOpen)}
        />
      )}

      {mobile && drawerOpen ? (
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={360}
          bodyStyle={{ padding: 0, background: '#1E1E1E' }}
          styles={{ header: { background: '#1E1E1E', borderBottom: '1px solid #333', color: '#FF7043' } }}
          title="编辑面板"
        >
          <MobileEditorPanel />
        </Drawer>
      ) : null}

      <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
        <ScoreEditor />
      </div>

      <PlayerControls />
    </div>
  );
}

function MobileEditorPanel() {
  return <div />;
}

export default App;
