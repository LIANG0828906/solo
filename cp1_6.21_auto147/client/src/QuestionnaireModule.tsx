import { useState } from 'react';
import { useApp } from './context/AppContext';
import axios from 'axios';
import type { Questionnaire, Question } from './types';
import QuestionnaireEditor from './components/QuestionnaireEditor';
import QuestionnairePreview from './components/QuestionnairePreview';
import Modal from './components/Modal';

export default function QuestionnaireModule() {
  const { questionnaires, loading, refreshQuestionnaires } = useApp();
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingQuestionnaire, setEditingQuestionnaire] = useState<Questionnaire | null>(null);
  const [previewQuestionnaire, setPreviewQuestionnaire] = useState<Questionnaire | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingQuestionnaire(null);
    setShowEditor(true);
  };

  const handleEdit = async (id: string) => {
    try {
      const response = await axios.get(`/api/questionnaire/${id}`);
      setEditingQuestionnaire(response.data);
      setShowEditor(true);
    } catch (error) {
      console.error('Failed to load questionnaire:', error);
    }
  };

  const handlePreview = async (id: string) => {
    try {
      const response = await axios.get(`/api/questionnaire/${id}`);
      setPreviewQuestionnaire(response.data);
      setShowPreview(true);
    } catch (error) {
      console.error('Failed to load questionnaire:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除这份问卷吗？')) return;

    setDeletingId(id);
    try {
      await axios.delete(`/api/questionnaire/${id}`);
      await refreshQuestionnaires();
    } catch (error) {
      console.error('Failed to delete questionnaire:', error);
      alert('删除失败，请重试');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = async (title: string, questions: Question[]) => {
    try {
      if (editingQuestionnaire) {
        await axios.put(`/api/questionnaire/${editingQuestionnaire.id}`, { title, questions });
      } else {
        await axios.post('/api/questionnaire', { title, questions });
      }
      await refreshQuestionnaires();
      setShowEditor(false);
      setEditingQuestionnaire(null);
    } catch (error: any) {
      alert(error.response?.data?.error || '保存失败，请重试');
      throw error;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div style={headerStyle}>
        <button className="btn-primary" onClick={handleCreate}>
          + 创建问卷
        </button>
      </div>

      {questionnaires.length === 0 ? (
        <div style={emptyStyle}>
          <p style={{ fontSize: '48px', marginBottom: '16px' }}>📝</p>
          <p style={{ color: '#64748B', marginBottom: '16px' }}>还没有创建问卷</p>
          <button className="btn-primary" onClick={handleCreate}>
            创建第一份问卷
          </button>
        </div>
      ) : (
        <div style={gridStyle}>
          {questionnaires.map(q => (
            <div key={q.id} style={cardStyle}>
              <div style={cardContentStyle}>
                <h3 style={cardTitleStyle} title={q.title}>
                  {q.title}
                </h3>
                <div style={cardMetaStyle}>
                  <span style={metaItemStyle}>
                    <span style={metaIconStyle}>❓</span>
                    {q.questionCount} 题
                  </span>
                  <span style={metaItemStyle}>
                    <span style={metaIconStyle}>🔗</span>
                    {q.inviteCode}
                  </span>
                </div>
                <p style={cardDateStyle}>
                  创建于 {formatDate(q.createdAt)}
                </p>
              </div>
              <div style={cardActionsStyle}>
                <button
                  className="btn-icon"
                  onClick={() => handlePreview(q.id)}
                  title="预览"
                >
                  👁️
                </button>
                <button
                  className="btn-icon"
                  onClick={() => handleEdit(q.id)}
                  title="编辑"
                >
                  ✏️
                </button>
                <button
                  className="btn-icon"
                  onClick={() => handleDelete(q.id)}
                  title="删除"
                  style={{ color: deletingId === q.id ? '#DC2626' : undefined }}
                  disabled={deletingId === q.id}
                >
                  {deletingId === q.id ? '⏳' : '🗑️'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        title={editingQuestionnaire ? '编辑问卷' : '创建问卷'}
        width={700}
      >
        <QuestionnaireEditor
          initialTitle={editingQuestionnaire?.title || ''}
          initialQuestions={editingQuestionnaire?.questions || []}
          onSave={handleSave}
          onCancel={() => setShowEditor(false)}
        />
      </Modal>

      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="问卷预览"
        width={600}
      >
        {previewQuestionnaire && (
          <QuestionnairePreview questionnaire={previewQuestionnaire} />
        )}
      </Modal>
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginBottom: '24px'
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
  gap: '20px'
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: '12px',
  backgroundColor: '#FFFFFF',
  border: '1px solid #E2E8F0',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  transition: 'box-shadow 0.2s ease, transform 0.2s ease',
  cursor: 'default',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column'
};

const cardContentStyle: React.CSSProperties = {
  padding: '20px',
  flex: 1
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  color: '#1E293B',
  marginBottom: '12px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  lineHeight: '1.4',
  minHeight: '44px'
};

const cardMetaStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  marginBottom: '12px'
};

const metaItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '13px',
  color: '#64748B'
};

const metaIconStyle: React.CSSProperties = {
  fontSize: '14px'
};

const cardDateStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#94A3B8'
};

const cardActionsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '4px',
  padding: '12px 16px',
  borderTop: '1px solid #F1F5F9',
  backgroundColor: '#FAFAFA'
};

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '80px 20px',
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  border: '1px solid #E2E8F0'
};
