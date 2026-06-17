import { useAnalysisStore } from '../stores/analysisStore'

export const TextInput = () => {
  const { inputText, setInputText, status, runAnalysis, clearAnalysis, error } = useAnalysisStore()
  const isLoading = status === 'loading'

  return (
    <div className="card text-input-card">
      <textarea
        className="text-area"
        placeholder="在此粘贴或输入英文文本"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        disabled={isLoading}
      />
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="button-row">
        <button
          className="btn btn-analyze"
          onClick={runAnalysis}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              <span>分析中</span>
            </>
          ) : (
            '开始分析'
          )}
        </button>
        
        <button
          className="btn btn-clear"
          onClick={clearAnalysis}
          disabled={isLoading}
        >
          清空重填
        </button>
      </div>
    </div>
  )
}
