import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ModelEditor from '@/pages/ModelEditor'
import { Component, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center w-full h-screen bg-[#0B0F19]">
          <div className="text-center space-y-3">
            <p className="text-[#E53E3E] text-xl font-bold">应用出错</p>
            <p className="text-[#A0AEC0] text-sm">请刷新页面重试</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#4FD1C5] text-[#0B0F19] rounded-lg text-sm font-medium hover:brightness-110 transition-all duration-200"
            >
              刷新页面
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<ModelEditor />} />
          <Route path="/view/*" element={<ModelEditor />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  )
}
