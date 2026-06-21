import { Field, Rule, ValidationResult, RuleType } from '../../types';

const isEmptyValue = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
};

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const phoneRegex = /^1[3-9]\d{9}$/;

const validateRequired = (value: any): ValidationResult => {
  const valid = !isEmptyValue(value);
  return {
    valid,
    ruleType: 'required',
    message: valid ? '必填验证通过' : '此字段为必填项'
  };
};

const validateMinLength = (value: any, min: number): ValidationResult => {
  if (isEmptyValue(value)) {
    return { valid: true, ruleType: 'minLength', message: '最小长度验证通过（空值）' };
  }
  const strValue = String(value);
  const valid = strValue.length >= min;
  return {
    valid,
    ruleType: 'minLength',
    message: valid ? `长度符合要求（≥${min}）` : `长度不能少于 ${min} 个字符`
  };
};

const validateMaxLength = (value: any, max: number): ValidationResult => {
  if (isEmptyValue(value)) {
    return { valid: true, ruleType: 'maxLength', message: '最大长度验证通过（空值）' };
  }
  const strValue = String(value);
  const valid = strValue.length <= max;
  return {
    valid,
    ruleType: 'maxLength',
    message: valid ? `长度符合要求（≤${max}）` : `长度不能超过 ${max} 个字符`
  };
};

const validateMin = (value: any, min: number): ValidationResult => {
  if (isEmptyValue(value)) {
    return { valid: true, ruleType: 'min', message: '最小值验证通过（空值）' };
  }
  const numValue = Number(value);
  if (isNaN(numValue)) {
    return { valid: false, ruleType: 'min', message: '请输入有效的数字' };
  }
  const valid = numValue >= min;
  return {
    valid,
    ruleType: 'min',
    message: valid ? `数值符合要求（≥${min}）` : `数值不能小于 ${min}`
  };
};

const validateMax = (value: any, max: number): ValidationResult => {
  if (isEmptyValue(value)) {
    return { valid: true, ruleType: 'max', message: '最大值验证通过（空值）' };
  }
  const numValue = Number(value);
  if (isNaN(numValue)) {
    return { valid: false, ruleType: 'max', message: '请输入有效的数字' };
  }
  const valid = numValue <= max;
  return {
    valid,
    ruleType: 'max',
    message: valid ? `数值符合要求（≤${max}）` : `数值不能大于 ${max}`
  };
};

const validatePattern = (value: any, pattern: string, customMessage?: string): ValidationResult => {
  if (isEmptyValue(value)) {
    return { valid: true, ruleType: 'pattern', message: '正则验证通过（空值）' };
  }
  try {
    const regex = new RegExp(pattern);
    const strValue = String(value);
    const valid = regex.test(strValue);
    return {
      valid,
      ruleType: 'pattern',
      message: valid ? '格式验证通过' : customMessage || '格式不符合要求'
    };
  } catch (e) {
    return {
      valid: false,
      ruleType: 'pattern',
      message: '正则表达式无效'
    };
  }
};

const validateEmail = (value: any): ValidationResult => {
  if (isEmptyValue(value)) {
    return { valid: true, ruleType: 'pattern', message: '邮箱格式验证通过（空值）' };
  }
  const strValue = String(value);
  const valid = emailRegex.test(strValue);
  return {
    valid,
    ruleType: 'pattern',
    message: valid ? '邮箱格式正确' : '请输入有效的邮箱地址'
  };
};

const validatePhone = (value: any): ValidationResult => {
  if (isEmptyValue(value)) {
    return { valid: true, ruleType: 'pattern', message: '手机号格式验证通过（空值）' };
  }
  const strValue = String(value);
  const valid = phoneRegex.test(strValue);
  return {
    valid,
    ruleType: 'pattern',
    message: valid ? '手机号格式正确' : '请输入有效的11位手机号'
  };
};

const evaluateLinkedCondition = (condition: string, linkedValue: any): boolean => {
  try {
    const trimmed = condition.trim();
    const equalsMatch = trimmed.match(/^等于\s*['"](.+)['"]\s*$/);
    if (equalsMatch) {
      return String(linkedValue) === equalsMatch[1];
    }
    const notEqualsMatch = trimmed.match(/^不等于\s*['"](.+)['"]\s*$/);
    if (notEqualsMatch) {
      return String(linkedValue) !== notEqualsMatch[1];
    }
    const containsMatch = trimmed.match(/^包含\s*['"](.+)['"]\s*$/);
    if (containsMatch) {
      return String(linkedValue).includes(containsMatch[1]);
    }
    if (trimmed === '为空' || trimmed === '是空') {
      return isEmptyValue(linkedValue);
    }
    if (trimmed === '不为空' || trimmed === '非空') {
      return !isEmptyValue(linkedValue);
    }
    return false;
  } catch (e) {
    return false;
  }
};

const validateLinked = (
  value: any,
  linkedFieldValue: any,
  condition: string,
  required: boolean
): ValidationResult => {
  const conditionMet = evaluateLinkedCondition(condition, linkedFieldValue);
  if (!conditionMet) {
    return {
      valid: true,
      ruleType: 'linked',
      message: '联动条件未触发'
    };
  }
  if (required) {
    const valid = !isEmptyValue(value);
    return {
      valid,
      ruleType: 'linked',
      message: valid ? '联动必填验证通过' : '联动条件触发，此字段为必填项'
    };
  }
  return { valid: true, ruleType: 'linked', message: '联动验证通过' };
};

export const validateField = (
  field: Field,
  value: any,
  allFields: Field[] = [],
  fieldValues: Record<string, any> = {}
): ValidationResult[] => {
  const results: ValidationResult[] = [];
  const enabledRules = field.rules.filter(r => r.enabled);

  if (field.type === 'email') {
    results.push(validateEmail(value));
  } else if (field.type === 'phone') {
    results.push(validatePhone(value));
  }

  for (const rule of enabledRules) {
    switch (rule.type) {
      case 'required':
        results.push(validateRequired(value));
        break;
      case 'minLength':
        if (rule.options.value !== undefined && rule.options.value !== null) {
          results.push(validateMinLength(value, Number(rule.options.value)));
        }
        break;
      case 'maxLength':
        if (rule.options.value !== undefined && rule.options.value !== null) {
          results.push(validateMaxLength(value, Number(rule.options.value)));
        }
        break;
      case 'min':
        if (rule.options.value !== undefined && rule.options.value !== null) {
          results.push(validateMin(value, Number(rule.options.value)));
        }
        break;
      case 'max':
        if (rule.options.value !== undefined && rule.options.value !== null) {
          results.push(validateMax(value, Number(rule.options.value)));
        }
        break;
      case 'pattern':
        if (field.type === 'string' && rule.options.value) {
          results.push(validatePattern(value, rule.options.value, rule.options.message));
        }
        break;
      case 'linked':
        if (rule.options.linkedFieldId && rule.options.condition) {
          const linkedValue = fieldValues[rule.options.linkedFieldId];
          results.push(
            validateLinked(
              value,
              linkedValue,
              rule.options.condition,
              rule.options.required !== false
            )
          );
        }
        break;
    }
  }

  return results;
};

export const isPatternValid = (pattern: string): boolean => {
  if (!pattern) return true;
  try {
    new RegExp(pattern);
    return true;
  } catch (e) {
    return false;
  }
};

export const exportToJSON = (fields: Field[]): string => {
  const exportedFields = fields.map(field => ({
    name: field.name,
    type: field.type,
    rules: field.rules
      .filter(r => r.enabled)
      .map(rule => ({
        type: rule.type,
        options: rule.options
      }))
  }));

  return JSON.stringify({ fields: exportedFields }, null, 2);
};
