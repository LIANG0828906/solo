import { isDateInPast } from './dateUtils';
import { FormErrors } from '@/types';

export function validateName(name: string): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) {
    return '姓名不能为空';
  }
  if (trimmed.length < 2) {
    return '姓名至少需要2个字符';
  }
  if (trimmed.length > 50) {
    return '姓名不能超过50个字符';
  }
  return undefined;
}

export function validateBirthday(birthday: string): string | undefined {
  if (!birthday) {
    return '请选择生日日期';
  }
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(birthday)) {
    return '日期格式不正确';
  }
  if (isDateInPast(birthday)) {
    return '生日日期不能是过去的日期';
  }
  return undefined;
}

export function validateInterests(interests: string[]): string | undefined {
  if (interests.length === 0) {
    return '请至少选择一个兴趣标签';
  }
  return undefined;
}

export function validateForm(
  name: string,
  birthday: string,
  interests: string[]
): FormErrors {
  const errors: FormErrors = {};
  
  const nameError = validateName(name);
  if (nameError) errors.name = nameError;
  
  const birthdayError = validateBirthday(birthday);
  if (birthdayError) errors.birthday = birthdayError;
  
  const interestsError = validateInterests(interests);
  if (interestsError) errors.interests = interestsError;
  
  return errors;
}

export function hasErrors(errors: FormErrors): boolean {
  return Object.keys(errors).length > 0;
}
