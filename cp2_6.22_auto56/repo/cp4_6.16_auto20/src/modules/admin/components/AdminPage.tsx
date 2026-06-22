import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Plus, FileText, Upload, X } from 'lucide-react';
import { useAuthStore } from '@/modules/auth/store/authStore';
import { useVoteStore } from '@/modules/voting/store/voteStore';
import { NoteModal } from '@/modules/voting/components/NoteModal';
import type { FlavorNote } from '@/shared/types';
import './AdminPage.css';

export function AdminPage() {
  const { user } = useAuthStore();
  const { blends, createBlend, getNotesForBlend, loadBlends } = useVoteStore();
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    flavorDescription: '',
    flavorTags: '',
    beanRatio: '',
    audioBase64: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [audioError, setAudioError] = useState('');
  const [selectedBlendId, setSelectedBlendId] = useState<string | null>(null);
  const [selectedBlendName, setSelectedBlendName] = useState('');
  const [viewNotes, setViewNotes] = useState<FlavorNote[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!user || !user.isOwner) {
      navigate('/');
      return;
    }
    loadBlends(user.id);
  }, [user, navigate, loadBlends]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const MAX_AUDIO_SIZE = 5 * 1024 * 1024;

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioError('');

    if (file.size > MAX_AUDIO_SIZE) {
      setAudioError(`音频文件不能超过 5MB，当前文件大小：${(file.size / 1024 / 1024).toFixed(1)}MB`);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setFormData((prev) => ({ ...prev, audioBase64: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAudio = () => {
    setFormData((prev) => ({ ...prev, audioBase64: '' }));
    setAudioError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.flavorDescription.trim() || !formData.beanRatio.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const tags = formData.flavorTags
        .split(/[,，、]/)
        .map((t) => t.trim())
        .filter((t) => t);

      await createBlend({
        name: formData.name.trim(),
        flavorDescription: formData.flavorDescription.trim(),
        flavorTags: tags.length > 0 ? tags : ['经典'],
        beanRatio: formData.beanRatio.trim(),
        audioBase64: formData.audioBase64 || undefined,
      });

      setFormData({
        name: '',
        flavorDescription: '',
        flavorTags: '',
        beanRatio: '',
        audioBase64: '',
      });
      setShowForm(false);
    } catch (error) {
      console.error('发布失败', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewNotes = async (blendId: string, blendName: string) => {
    try {
      const notes = await getNotesForBlend(blendId);
      setViewNotes(notes);
      setSelectedBlendId(blendId);
      setSelectedBlendName(blendName);
      setModalOpen(true);
    } catch (error) {
      console.error('获取笔记失败', error);
    }
  };

  if (!user?.isOwner) {
    return null;
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div className="admin-title-section">
            <Settings className="admin-title-icon" size={28} />
            <div>
              <h1 className="admin-title">店主后台</h1>
              <p className="admin-subtitle">管理拼配方案，查看顾客反馈</p>
            </div>
          </div>
          <button
            className="btn btn-primary add-blend-btn"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus size={20} />
            <span>发布新方案</span>
          </button>
        </div>

        {showForm && (
          <div className="admin-form-card card">
            <div className="form-header">
              <h2 className="form-title">发布新拼配方案</h2>
            </div>
            <form className="admin-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    方案名称 *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className="form-input"
                    placeholder="给这款拼配起个名字"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="flavorDescription" className="form-label">
                  风味描述 *
                </label>
                <textarea
                  id="flavorDescription"
                  name="flavorDescription"
                  className="form-textarea"
                  placeholder="描述这款拼配的风味特点..."
                  value={formData.flavorDescription}
                  onChange={handleInputChange}
                  rows={3}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="flavorTags" className="form-label">
                    风味标签
                  </label>
                  <input
                    id="flavorTags"
                    name="flavorTags"
                    type="text"
                    className="form-input"
                    placeholder="用逗号分隔，如：可可, 坚果, 柑橘"
                    value={formData.flavorTags}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="beanRatio" className="form-label">
                    拼配比例 *
                  </label>
                  <input
                    id="beanRatio"
                    name="beanRatio"
                    type="text"
                    className="form-input"
                    placeholder="如：埃塞俄比亚 60% + 巴西 40%"
                    value={formData.beanRatio}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">介绍音频（可选，最大5MB）</label>
                {audioError && <div className="audio-error">{audioError}</div>}
                {formData.audioBase64 ? (
                  <div className="audio-preview">
                    <audio controls src={formData.audioBase64} />
                    <button
                      type="button"
                      className="remove-audio-btn"
                      onClick={handleRemoveAudio}
                    >
                      <X size={16} />
                      移除
                    </button>
                  </div>
                ) : (
                  <label className="audio-upload-label">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioUpload}
                      style={{ display: 'none' }}
                    />
                    <Upload size={20} />
                    <span>上传音频介绍</span>
                  </label>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '发布中...' : '发布方案'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="admin-section">
          <div className="section-header">
            <h2 className="section-title">已发布的方案</h2>
            <span className="section-count">{blends.length} 款</span>
          </div>

          <div className="admin-blend-list">
            {blends.map((blend) => (
              <div key={blend.id} className="admin-blend-item card">
                <div className="admin-blend-info">
                  <h3 className="admin-blend-name">{blend.name}</h3>
                  <div className="admin-blend-tags">
                    {blend.flavorTags.map((tag, index) => (
                      <span key={index} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="admin-blend-ratio">{blend.beanRatio}</p>
                </div>
                <button
                  className="btn btn-secondary view-notes-btn"
                  onClick={() => handleViewNotes(blend.id, blend.name)}
                >
                  <FileText size={18} />
                  <span>查看笔记</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <NoteModal
        isOpen={modalOpen}
        blendName={selectedBlendName}
        blendId={selectedBlendId || ''}
        mode="view"
        notes={viewNotes}
        onClose={() => {
          setModalOpen(false);
          setSelectedBlendId(null);
          setSelectedBlendName('');
          setViewNotes([]);
        }}
        onSubmit={async () => {}}
      />
    </div>
  );
}
