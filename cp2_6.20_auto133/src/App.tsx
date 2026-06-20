import { ConfigProvider, theme } from 'antd'
import Dashboard from '@/pages/Dashboard'

function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#00b4d8',
          colorBgBase: '#0a1628',
          colorTextBase: '#ffffff',
          borderRadius: 12,
        },
      }}
    >
      <Dashboard />
    </ConfigProvider>
  )
}

export default App
