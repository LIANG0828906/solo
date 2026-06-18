import CryptoJS from 'crypto-js';

const SECRET_KEY = 'keyvault-secret-key-2024';

export function generateRandomKey(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}

export function encryptKey(plainKey: string): string {
  return CryptoJS.AES.encrypt(plainKey, SECRET_KEY).toString();
}

export function decryptKey(encryptedKey: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedKey, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
