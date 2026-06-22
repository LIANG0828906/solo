import React, { useState } from 'react'
import { meetingApi } from '../api/meetingApi'
import { Meeting } from '../types'

interface MeetingFormProps {
  onMeetingCreated: (meeting: Meeting) => void
}

const MeetingForm: React.FC<MeetingFormProps> = ({ onMeetingCreated }) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!content.trim()) {
      setError('请输入会议内容')
      return
    }

    setLoading(true)
    
    try {
      const meeting = await meetingApi.createMeeting({ content, title })
      onMeetingCreated(meeting)
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成纪要失败')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''))
    }
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h2 style={styles.title}>创建新会议纪要</h2>
      
      <div style={styles.field}>
        <label style={styles.label}>会议标题（可选）</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="输入会议标题，或从内容自动提取"
          className="text-input"
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>会议内容</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`示例：
产品研发部门周会，参会人员：张三、李四、王五。
张三汇报了本周的开发进度，决定在11月20日前完成登录模块的开发。
由李四负责用户反馈系统的设计，下周五前提交设计方案。
王五需要在三天后完成测试用例的编写。
会议确定了下周的工作重点，决定优先处理性能优化问题。
请张三跟进服务器扩容事宜，尽快完成预算申请。`}
          className="textarea-input"
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>或上传会议录音（WAV格式）</label>
        <div style={styles.uploadContainer}>
          <input
            type="file"
            accept=".wav"
            onChange={handleFileUpload}
            style={styles.fileInput}
            id="file-upload"
          />
          <label htmlFor="file-upload" className="upload-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            选择文件
          </label>
          <span style={styles.uploadHint}>支持 WAV 格式，语音转文字功能演示</span>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <button
        type="submit"
        disabled={loading}
        className="primary-button"
      >
        {loading ? (
          <>
            <span className="spinner"></span>
            解析中...
          </>
        ) : (
          '生成纪要'
        )}
      </button>
    </form>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  form: {
    background: '#FFFFFF',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '24px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '24px',
    color: '#1E293B',
  },
  field: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '8px',
    color: '#374151',
  },
  uploadContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  fileInput: {
    display: 'none',
  },
  uploadHint: {
    fontSize: '12px',
    color: '#9CA3AF',
  },
  error: {
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
}

export default MeetingForm
