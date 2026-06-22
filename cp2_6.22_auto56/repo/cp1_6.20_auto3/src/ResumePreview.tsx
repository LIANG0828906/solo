import React, { forwardRef, useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ResumeData } from './hooks/useResumeState';
import { TemplateId, getTemplateRenderer, templateNames } from './templates';

interface ResumePreviewProps {
  resumeData: ResumeData;
  templateId: TemplateId;
  onTemplateChange: (templateId: TemplateId) => void;
}

export const ResumePreview = forwardRef<HTMLDivElement, ResumePreviewProps>(
  ({ resumeData, templateId, onTemplateChange }, ref) => {
    const [isExporting, setIsExporting] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const handleTemplateChange = useCallback(
      (newTemplateId: TemplateId) => {
        if (newTemplateId !== templateId) {
          setIsTransitioning(true);
          setTimeout(() => {
            onTemplateChange(newTemplateId);
            setTimeout(() => {
              setIsTransitioning(false);
            }, 50);
          }, 200);
        }
      },
      [templateId, onTemplateChange]
    );

    const exportToPDF = useCallback(async () => {
      if (!ref || !('current' in ref) || !ref.current) return;

      setIsExporting(true);
      try {
        const element = ref.current;
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 0;

        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
        pdf.save(`${resumeData.personalInfo.name}_简历.pdf`);
      } catch (error) {
        console.error('PDF导出失败:', error);
        alert('PDF导出失败，请重试');
      } finally {
        setIsExporting(false);
      }
    }, [ref, resumeData.personalInfo.name]);

    const renderTemplate = getTemplateRenderer(templateId);

    return (
      <div className="h-full flex flex-col bg-[#F8F9FA]">
        <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[#2C3E50]">选择模板：</span>
            <div className="flex gap-2">
              {(Object.keys(templateNames) as TemplateId[]).map((id) => (
                <button
                  key={id}
                  onClick={() => handleTemplateChange(id)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                    templateId === id
                      ? 'bg-[#3498DB] text-white shadow-md shadow-[#3498DB]/20'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {templateNames[id]}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={exportToPDF}
            disabled={isExporting}
            className="px-5 py-2 bg-gradient-to-r from-[#2C3E50] to-[#34495E] text-white text-sm font-medium rounded-lg hover:from-[#34495E] hover:to-[#2C3E50] transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[120px] justify-center"
          >
            {isExporting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                导出中...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                导出PDF
              </>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 flex justify-center items-start">
          <div
            className="relative transition-all duration-400 ease-in-out"
            style={{
              opacity: isTransitioning ? 0 : 1,
              transform: isTransitioning ? 'scale(0.98)' : 'scale(1)',
            }}
          >
            <div
              ref={ref}
              className="bg-white shadow-xl rounded-lg overflow-hidden"
              style={{
                width: '210mm',
                minHeight: '297mm',
                transformOrigin: 'top center',
              }}
            >
              {renderTemplate(resumeData)}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ResumePreview.displayName = 'ResumePreview';
