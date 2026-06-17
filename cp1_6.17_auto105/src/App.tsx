import React from 'react'
import { FileUploader } from './FileUploader'
import { DiffViewer } from './DiffViewer'
import { StatsDashboard } from './StatsDashboard'
import { useAppStore } from './store'
import { FileText, Upload, RotateCcw, AlertCircle } from 'lucide-react'

export const App: React.FC = () => {
  const { error, setError, resetAll, oldFile, newFile } = useAppStore()

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F4F6]">
      <header className="h-[60px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] flex items-center justify-between px-6 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <FileText size={24} className="text-[#4F46E5]" />
            <FileText size={24} className="text-[#6C63FF] absolute -top-1 -left-1 opacity-70" />
          </div>
          <h1 className="text-lg font-semibold text-gray-800">文件版本对比工具</h1>
        </div>
        <div className="flex items-center gap-3">
          {(oldFile || newFile) && (
            <button
              onClick={resetAll}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RotateCcw size={16} />
              重置
            </button>
          )}
          <label className="flex items-center gap-2 px-4 py-2 bg-[#6C63FF] text-white rounded-lg cursor-pointer hover:bg-[#5B52E0] transition-colors shadow-sm">
            <Upload size={16} />
            <span className="text-sm font-medium">上传文件</span>
          </label>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-[1400px] w-full mx-auto">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">上传文件</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <FileUploader type="old" label="旧版本文件" />
            <FileUploader type="new" label="新版本文件" />
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">差异对比</h2>
          <div className="transition-all duration-300">
            <DiffViewer />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">统计看板</h2>
          <StatsDashboard />
        </section>
      </main>

      <footer className="py-4 text-center text-sm text-gray-500 border-t border-gray-200 bg-white">
        文件版本对比工具 © 2026
      </footer>
    </div>
  )
}
