import { useAppStore } from './store/appStore'
import UploadPage from './pages/UploadPage'
import ResultPage from './pages/ResultPage'
import DetailPage from './pages/DetailPage'

function App() {
  const { currentPage } = useAppStore()

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFF7ED' }}>
      {currentPage === 'upload' && <UploadPage />}
      {currentPage === 'result' && <ResultPage />}
      {currentPage === 'detail' && <DetailPage />}
    </div>
  )
}

export default App
