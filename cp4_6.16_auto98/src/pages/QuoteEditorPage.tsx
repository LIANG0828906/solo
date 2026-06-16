import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, FileSpreadsheet } from 'lucide-react';
import QuoteEditor from '@/modules/quote/components/QuoteEditor';
import InvoicePanel from '@/modules/quote/components/InvoicePanel';
import { useClientStore } from '@/modules/client/store';
import { useQuoteStore } from '@/modules/quote/store';
import { cn } from '@/lib/utils';

type TabType = 'quote' | 'invoice';

export default function QuoteEditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('quote');
  const { projects } = useClientStore();
  const { quotes } = useQuoteStore();

  const project = useMemo(() => {
    return projects.find((p) => p.id === projectId);
  }, [projects, projectId]);

  const quote = useMemo(() => {
    if (!projectId) return undefined;
    return quotes.find((q) => q.projectId === projectId);
  }, [quotes, projectId]);

  const handleBack = () => {
    if (project) {
      navigate(`/client/${project.clientId}`);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 text-gray-600 transition-colors hover:text-gray-900"
            >
              <ArrowLeft size={18} />
              返回
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {project?.name || '项目报价'}
              </h1>
              {quote && (
                <p className="mt-1 text-sm text-gray-500">
                  报价单版本数：{quote.versions.length}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6 flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab('quote')}
            className={cn(
              'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              activeTab === 'quote'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <FileText size={18} />
            报价编辑
          </button>
          <button
            onClick={() => setActiveTab('invoice')}
            className={cn(
              'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              activeTab === 'invoice'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <FileSpreadsheet size={18} />
            发票面板
          </button>
        </div>

        <div className="min-h-[600px]">
          {activeTab === 'quote' ? <QuoteEditor /> : <InvoicePanel />}
        </div>
      </div>
    </div>
  );
}
