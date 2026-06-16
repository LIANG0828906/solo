export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,12}$/;
export const PHONE_REGEX = /^1[3-9]\d{9}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateUsername(name: string): { valid: boolean; message: string } {
  if (!name) return { valid: false, message: '用户名不能为空' };
  if (name.length < 3 || name.length > 12) {
    return { valid: false, message: '用户名长度必须在3-12个字符之间' };
  }
  if (!USERNAME_REGEX.test(name)) {
    return { valid: false, message: '用户名只能包含字母、数字和下划线' };
  }
  return { valid: true, message: '' };
}

export function validateContact(contact: string): { valid: boolean; message: string } {
  if (!contact) return { valid: true, message: '' };
  const isPhone = PHONE_REGEX.test(contact);
  const isEmail = EMAIL_REGEX.test(contact);
  if (!isPhone && !isEmail) {
    return { valid: false, message: '联系方式请输入正确的手机号或邮箱格式' };
  }
  return { valid: true, message: '' };
}

export function validateTitle(title: string): { valid: boolean; message: string } {
  if (!title.trim()) return { valid: false, message: '标题不能为空' };
  if (title.length > 30) return { valid: false, message: '标题最多30字' };
  return { valid: true, message: '' };
}

export function validateDescription(desc: string): { valid: boolean; message: string } {
  if (!desc.trim()) return { valid: false, message: '描述不能为空' };
  if (desc.length > 200) return { valid: false, message: '描述最多200字' };
  return { valid: true, message: '' };
}

export function validatePrice(price: number): { valid: boolean; message: string } {
  if (isNaN(price) || price < 0 || price > 9999) {
    return { valid: false, message: '价格范围0-9999元' };
  }
  return { valid: true, message: '' };
}

export function validateOfferMessage(msg: string): { valid: boolean; message: string } {
  if (!msg.trim()) return { valid: false, message: '留言内容不能为空' };
  if (msg.length > 100) return { valid: false, message: '留言最多100字' };
  return { valid: true, message: '' };
}

export function validateImages(images: string[]): { valid: boolean; message: string } {
  if (images.length === 0) return { valid: false, message: '请至少上传一张图片' };
  if (images.length > 6) return { valid: false, message: '最多上传6张图片' };
  return { valid: true, message: '' };
}
