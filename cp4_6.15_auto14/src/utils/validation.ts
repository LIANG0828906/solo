import type { FormData, FormErrors } from '../types';

export const PHONE_REGEX = /^1\d{10}$/;

export function validatePhone(phone: string): boolean {
  return PHONE_REGEX.test(phone);
}

export function validateQuantity(quantity: string): boolean {
  const num = parseInt(quantity, 10);
  return !isNaN(num) && num > 0 && Number.isInteger(num) && quantity === String(num);
}

export function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.customerName.trim()) {
    errors.customerName = '请输入客户姓名';
  }

  if (!data.phone.trim()) {
    errors.phone = '请输入手机号';
  } else if (!validatePhone(data.phone)) {
    errors.phone = '手机号必须是11位数字';
  }

  if (!data.community.trim()) {
    errors.community = '请选择或输入小区名称';
  }

  if (!data.productName.trim()) {
    errors.productName = '请输入商品名称';
  }

  if (!data.quantity.trim()) {
    errors.quantity = '请输入数量';
  } else if (!validateQuantity(data.quantity)) {
    errors.quantity = '数量必须是正整数';
  }

  return errors;
}

export function hasErrors(errors: FormErrors): boolean {
  return Object.keys(errors).length > 0;
}
