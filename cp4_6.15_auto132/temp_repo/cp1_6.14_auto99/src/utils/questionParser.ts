import { Question, QuestionType, ChoiceQuestion, SortQuestion, BlankQuestion } from '../types/question';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateQuestion(question: Question): ValidationResult {
  const errors: string[] = [];

  if (!question.id) {
    errors.push('题目ID不能为空');
  }

  if (!question.type) {
    errors.push('题目类型不能为空');
  }

  if (!question.stem?.trim()) {
    errors.push('题干不能为空');
  }

  switch (question.type) {
    case QuestionType.CHOICE:
      validateChoiceQuestion(question as ChoiceQuestion, errors);
      break;
    case QuestionType.SORT:
      validateSortQuestion(question as SortQuestion, errors);
      break;
    case QuestionType.BLANK:
      validateBlankQuestion(question as BlankQuestion, errors);
      break;
    default:
      errors.push(`未知的题目类型: ${(question as Question).type}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function validateChoiceQuestion(question: ChoiceQuestion, errors: string[]): void {
  if (!question.options || question.options.length < 2) {
    errors.push('选择题至少需要2个选项');
  }

  if (question.options) {
    const labels = question.options.map((opt) => opt.label);
    const uniqueLabels = new Set(labels);
    if (labels.length !== uniqueLabels.size) {
      errors.push('选项标签不能重复');
    }

    question.options.forEach((opt, index) => {
      if (!opt.content?.trim()) {
        errors.push(`第${index + 1}个选项内容不能为空`);
      }
    });
  }

  if (!question.correctAnswers || question.correctAnswers.length === 0) {
    errors.push('请设置正确答案');
  }

  if (question.correctAnswers && question.options) {
    const validLabels = question.options.map((opt) => opt.label);
    question.correctAnswers.forEach((answer) => {
      if (!validLabels.includes(answer)) {
        errors.push(`正确答案 "${answer}" 不在选项中`);
      }
    });
  }

  if (!question.isMultiple && question.correctAnswers && question.correctAnswers.length > 1) {
    errors.push('单选题只能有一个正确答案');
  }
}

function validateSortQuestion(question: SortQuestion, errors: string[]): void {
  if (!question.items || question.items.length < 4) {
    errors.push('排序题至少需要4个选项');
  }

  if (question.items) {
    question.items.forEach((item, index) => {
      if (!item.content?.trim()) {
        errors.push(`第${index + 1}个排序项内容不能为空`);
      }
    });
  }

  if (!question.correctOrder || question.correctOrder.length === 0) {
    errors.push('请设置正确排序');
  }

  if (question.items && question.correctOrder) {
    const itemIds = question.items.map((item) => item.id);
    if (question.correctOrder.length !== itemIds.length) {
      errors.push('正确排序的项数与选项数不一致');
    }

    const allInItems = question.correctOrder.every((id) => itemIds.includes(id));
    if (!allInItems) {
      errors.push('正确排序包含不存在的选项');
    }
  }
}

function validateBlankQuestion(question: BlankQuestion, errors: string[]): void {
  const blankPattern = /\{\{blank\}\}/g;
  const matches = question.stem.match(blankPattern);
  const blankCount = matches ? matches.length : 0;

  if (blankCount === 0) {
    errors.push('填空题题干中需要包含 {{blank}} 标记');
  }

  if (!question.blanks || question.blanks.length !== blankCount) {
    errors.push(`空位数量不匹配：题干中有${blankCount}个空位，但设置了${question.blanks?.length || 0}个答案`);
  }

  if (question.blanks) {
    question.blanks.forEach((blank, index) => {
      if (!blank.correctAnswers || blank.correctAnswers.length === 0) {
        errors.push(`第${index + 1}个空位至少需要一个正确答案`);
      }

      if (blank.correctAnswers) {
        const hasEmpty = blank.correctAnswers.some((answer) => !answer.trim());
        if (hasEmpty) {
          errors.push(`第${index + 1}个空位的答案不能为空字符串`);
        }
      }
    });
  }
}

export function serializeQuestion(question: Question): string {
  return JSON.stringify(question, null, 2);
}

export function deserializeQuestion(json: string): Question | null {
  try {
    const parsed = JSON.parse(json) as Question;
    const result = validateQuestion(parsed);
    if (!result.valid) {
      console.warn('Question validation warnings:', result.errors);
    }
    return parsed;
  } catch (e) {
    console.error('Failed to parse question JSON:', e);
    return null;
  }
}

export function parseRichText(text: string): string {
  let result = text;
  result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/\*(.*?)\*/g, '<em>$1</em>');
  return result;
}
