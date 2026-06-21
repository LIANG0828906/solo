import type { Questionnaire } from '../types';

export default function QuestionnairePreview({ questionnaire }: { questionnaire: Questionnaire }) {
  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>{questionnaire.title}</h2>
        <p style={inviteCodeStyle}>邀请码: {questionnaire.inviteCode}</p>
      </div>

      <div style={questionsStyle}>
        {questionnaire.questions.map((question, index) => (
          <div key={question.id} style={questionCardStyle}>
            <div style={questionHeaderStyle}>
              <span style={questionNumberStyle}>Q{index + 1}</span>
              <span style={questionTypeStyle}>
                {question.type === 'single' && '单选题'}
                {question.type === 'multiple' && '多选题'}
                {question.type === 'text' && '简答题'}
              </span>
            </div>
            <h3 style={questionTitleStyle}>{question.title}</h3>

            {question.type !== 'text' && question.options && (
              <div style={optionsStyle}>
                {question.options.map((option, optIndex) => (
                  <div key={optIndex} style={optionStyle}>
                    <div style={optionInputStyle}>
                      {question.type === 'single' ? '○' : '☐'}
                    </div>
                    <span style={optionTextStyle}>{option}</span>
                  </div>
                ))}
              </div>
            )}

            {question.type === 'text' && (
              <div style={textAreaStyle}>
                <span style={placeholderStyle}>请输入您的回答...</span>
                <span style={textLimitStyle}>最多 {question.maxLength || 500} 字</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={footerStyle}>
        <button className="btn-primary" disabled style={{ cursor: 'not-allowed', opacity: 0.7 }}>
          提交问卷
        </button>
        <p style={tipStyle}>这是预览模式，无法实际提交</p>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  maxHeight: '60vh',
  overflow: 'auto'
};

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  paddingBottom: '20px',
  marginBottom: '20px',
  borderBottom: '1px solid #E2E8F0'
};

const titleStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 600,
  color: '#1E293B',
  marginBottom: '8px'
};

const inviteCodeStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#64748B'
};

const questionsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px'
};

const questionCardStyle: React.CSSProperties = {
  backgroundColor: '#F8FAFC',
  borderRadius: '10px',
  padding: '16px',
  border: '1px solid #E2E8F0'
};

const questionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '10px'
};

const questionNumberStyle: React.CSSProperties = {
  width: '26px',
  height: '26px',
  borderRadius: '6px',
  backgroundColor: '#3B82F6',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  fontWeight: 600
};

const questionTypeStyle: React.CSSProperties = {
  padding: '3px 8px',
  borderRadius: '4px',
  backgroundColor: '#E0F2FE',
  color: '#0284C7',
  fontSize: '11px',
  fontWeight: 500
};

const questionTitleStyle: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 500,
  color: '#1E293B',
  marginBottom: '12px',
  lineHeight: '1.5'
};

const optionsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px'
};

const optionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 12px',
  backgroundColor: '#FFFFFF',
  borderRadius: '8px',
  border: '1px solid #E2E8F0'
};

const optionInputStyle: React.CSSProperties = {
  width: '20px',
  height: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#94A3B8',
  fontSize: '14px'
};

const optionTextStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#334155'
};

const textAreaStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: '8px',
  border: '1px solid #E2E8F0',
  padding: '12px',
  minHeight: '80px'
};

const placeholderStyle: React.CSSProperties = {
  color: '#CBD5E1',
  fontSize: '14px'
};

const textLimitStyle: React.CSSProperties = {
  display: 'block',
  textAlign: 'right',
  fontSize: '12px',
  color: '#94A3B8',
  marginTop: '8px'
};

const footerStyle: React.CSSProperties = {
  textAlign: 'center',
  paddingTop: '20px',
  marginTop: '20px',
  borderTop: '1px solid #E2E8F0'
};

const tipStyle: React.CSSProperties = {
  marginTop: '10px',
  fontSize: '12px',
  color: '#94A3B8'
};
