import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ContractTemplate, TemplateVariable, ValidationError } from '../types';
import { downloadPDF } from '../utils/pdfGenerator';

function Editor() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<ContractTemplate | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [htmlPreview, setHtmlPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [ripple, setRipple] = useState<{ show: boolean; x: number; y: number }>({ show: false, x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await fetch(`/api/templates/${templateId}`);
        if (!response.ok) {
          navigate('/');
          return;
        }
        const data = await response.json();
        setTemplate(data);
        const initialVars: Record<string, string> = {};
        data.variables.forEach((v: TemplateVariable) => {
          initialVars[v.name] = '';
        });
        setVariables(initialVars);
      } catch (error) {
        console.error('Failed to fetch template:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, [templateId, navigate]);

  const handleInputChange = (name: string, value: string) => {
    setVariables(prev => ({ ...prev, [name]: value }));
    if (errors.some(e => e.field === name)) {
      setErrors(prev => prev.filter(e => e.field !== name));
    }
  };

  const handleGenerate = async () => {
    if (!template) return;
    
    setGenerating(true);
    setErrors([]);

    try {
      const startTime = performance.now();
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, variables })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors(data.errors || []);
        setGenerating(false);
        return;
      }

      setPdfBase64(data.pdfBase64);
      setHtmlPreview(data.htmlPreview);
      const endTime = performance.now();
      console.log(`PDF generated in ${endTime - startTime}ms`);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!template || !pdfBase64) return;

    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setRipple({
        show: true,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setTimeout(() => setRipple({ ...ripple, show: false }), 300);
    }

    const filename = `${template.name}_${variables['partyA'] || 'contract'}_${Date.now()}.pdf`;
    downloadPDF(templateId!, variables, filename);
  };

  const getErrorMessage = (fieldName: string): string => {
    const error = errors.find(e => e.field === fieldName);
    return error ? error.message : '';
  };

  const handleBack = () => {
    navigate('/');
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (!template) {
    return <div className="loading">模板不存在</div>;
  }

  return (
    <div className="editor">
      <header className="editor-header">
        <button className="back-btn" onClick={handleBack}>
          ← 返回
        </button>
        <h1>{template.name}</h1>
        <p className="template-desc">{template.description}</p>
      </header>

      <div className="editor-content">
        <div className="input-section">
          <h2>填写合同变量</h2>
          <div className="form-group">
            {template.variables.map((variable) => {
              const errorMsg = getErrorMessage(variable.name);
              const hasError = !!errorMsg;

              return (
                <div key={variable.name} className="input-wrapper">
                  <label className="input-label">
                    {variable.label}
                    {variable.required && <span className="required">*</span>}
                  </label>
                  <div className={`input-container ${hasError ? 'error' : ''}`}>
                    <div className="focus-indicator"></div>
                    {variable.type === 'date' ? (
                      <input
                        type="date"
                        value={variables[variable.name] || ''}
                        onChange={(e) => handleInputChange(variable.name, e.target.value)}
                        placeholder={variable.placeholder}
                        className="form-input date-input"
                      />
                    ) : (
                      <input
                        type={variable.type === 'number' ? 'text' : 'text'}
                        value={variables[variable.name] || ''}
                        onChange={(e) => handleInputChange(variable.name, e.target.value)}
                        placeholder={variable.placeholder}
                        className="form-input"
                      />
                    )}
                  </div>
                  {hasError && (
                    <span className="error-message">{errorMsg}</span>
                  )}
                </div>
              );
            })}
          </div>

          <button
            className="generate-btn"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? '生成中...' : '生成PDF'}
          </button>
        </div>

        <div className="divider"></div>

        <div className="preview-section">
          <div className="preview-header">
            <h2>PDF预览</h2>
            {pdfBase64 && (
              <button
                ref={buttonRef}
                className="download-btn"
                onClick={handleDownload}
              >
                {ripple.show && (
                  <span
                    className="ripple"
                    style={{ left: ripple.x, top: ripple.y }}
                  ></span>
                )}
                下载PDF
              </button>
            )}
          </div>

          <div className="pdf-preview">
            {htmlPreview ? (
              <div
                className="pdf-html-preview"
                dangerouslySetInnerHTML={{ __html: htmlPreview }}
              />
            ) : (
              <div className="preview-placeholder">
                <span className="placeholder-icon">📑</span>
                <p>填写变量后点击"生成PDF"按钮预览</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Editor;
