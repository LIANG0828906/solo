import { Card } from 'antd';
import { Question, QuestionType, FontSize } from '../types/question';
import ChoicePreview from './ChoicePreview';
import SortPreview from './SortPreview';
import BlankPreview from './BlankPreview';

interface QuestionPreviewProps {
  value: Question;
  fontSize: FontSize;
  isVisible: boolean;
}

export default function QuestionPreview({ value, fontSize, isVisible }: QuestionPreviewProps) {
  const renderPreview = () => {
    switch (value.type) {
      case QuestionType.CHOICE:
        return <ChoicePreview value={value} fontSize={fontSize} />;
      case QuestionType.SORT:
        return <SortPreview value={value} fontSize={fontSize} />;
      case QuestionType.BLANK:
        return <BlankPreview value={value} fontSize={fontSize} />;
      default:
        return <div>请选择题型</div>;
    }
  };

  return (
    <div className={`preview-container ${isVisible ? 'fade-in' : 'fade-out'}`}>
      <Card
        className="preview-card"
        title="题目预览"
        styles={{ body: { padding: '24px' } }}
      >
        {renderPreview()}
      </Card>
    </div>
  );
}
