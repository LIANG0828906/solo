import { ConfigProvider, theme } from 'antd'
import MoleculeViewer from '@/components/MoleculeViewer'
import ControlPanel from '@/components/ControlPanel'

const appStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  background: '#000',
  overflow: 'hidden',
}

const viewerContainerStyle: React.CSSProperties = {
  flex: 1,
  width: '65%',
  height: '100%',
  position: 'relative',
}

const panelContainerStyle: React.CSSProperties = {
  width: '35%',
  minWidth: '320px',
  height: '100%',
  flexShrink: 0,
}

export default function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#00d4ff',
          colorInfo: '#00d4ff',
          borderRadius: 6,
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
        components: {
          Select: {
            colorBgContainer: '#3a3a54',
            colorBorder: '#4a4a6a',
            colorText: '#ffffff',
            borderRadius: 6,
          },
          Slider: {
            trackBg: '#00d4ff',
            railBg: '#4a4a6a',
            handleColor: '#00d4ff',
            handleActiveColor: '#00d4ff',
            handleSize: 18,
            handleSizeHover: 20,
          },
          Switch: {
            colorPrimary: '#00d4ff',
            colorPrimaryHover: '#00b8e6',
          },
          Button: {
            colorPrimary: '#00d4ff',
            colorPrimaryHover: '#00b8e6',
            colorPrimaryActive: '#00a0cc',
            borderRadius: 6,
          },
          Card: {
            colorBgContainer: '#3a3a54',
            borderRadiusLG: 8,
          },
        },
      }}
    >
      <div style={appStyle}>
        <div style={viewerContainerStyle}>
          <MoleculeViewer />
        </div>
        <div style={panelContainerStyle}>
          <ControlPanel />
        </div>
      </div>
    </ConfigProvider>
  )
}
