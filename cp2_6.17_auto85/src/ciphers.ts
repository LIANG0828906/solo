import { CipherType, EncryptionResult } from './types'

function mod(n: number, m: number): number {
  return ((n % m) + m) % m
}

export function caesarEncrypt(plaintext: string, shift: number): EncryptionResult {
  const s = mod(shift, 26)
  let ciphertext = ''
  for (const char of plaintext) {
    if (/[a-zA-Z]/.test(char)) {
      const base = char === char.toUpperCase() ? 65 : 97
      ciphertext += String.fromCharCode(mod(char.charCodeAt(0) - base + s, 26) + base)
    } else {
      ciphertext += char
    }
  }
  return {
    plaintext,
    ciphertext,
    cipherType: CipherType.CAESAR,
    key: shift
  }
}

export function caesarDecrypt(ciphertext: string, shift: number): EncryptionResult {
  const result = caesarEncrypt(ciphertext, -shift)
  return {
    plaintext: result.ciphertext,
    ciphertext,
    cipherType: CipherType.CAESAR,
    key: shift
  }
}

export function vigenereEncrypt(plaintext: string, key: string): EncryptionResult {
  if (!key || key.length === 0) {
    return { plaintext, ciphertext: plaintext, cipherType: CipherType.VIGENERE, key }
  }
  const cleanKey = key.replace(/[^a-zA-Z]/g, '').toUpperCase()
  if (cleanKey.length === 0) {
    return { plaintext, ciphertext: plaintext, cipherType: CipherType.VIGENERE, key }
  }
  let ciphertext = ''
  let keyIndex = 0
  for (const char of plaintext) {
    if (/[a-zA-Z]/.test(char)) {
      const base = char === char.toUpperCase() ? 65 : 97
      const shift = cleanKey.charCodeAt(keyIndex % cleanKey.length) - 65
      ciphertext += String.fromCharCode(mod(char.charCodeAt(0) - base + shift, 26) + base)
      keyIndex++
    } else {
      ciphertext += char
    }
  }
  return {
    plaintext,
    ciphertext,
    cipherType: CipherType.VIGENERE,
    key
  }
}

export function vigenereDecrypt(ciphertext: string, key: string): EncryptionResult {
  if (!key || key.length === 0) {
    return { plaintext: ciphertext, ciphertext, cipherType: CipherType.VIGENERE, key }
  }
  const cleanKey = key.replace(/[^a-zA-Z]/g, '').toUpperCase()
  if (cleanKey.length === 0) {
    return { plaintext: ciphertext, ciphertext, cipherType: CipherType.VIGENERE, key }
  }
  let plaintext = ''
  let keyIndex = 0
  for (const char of ciphertext) {
    if (/[a-zA-Z]/.test(char)) {
      const base = char === char.toUpperCase() ? 65 : 97
      const shift = cleanKey.charCodeAt(keyIndex % cleanKey.length) - 65
      plaintext += String.fromCharCode(mod(char.charCodeAt(0) - base - shift, 26) + base)
      keyIndex++
    } else {
      plaintext += char
    }
  }
  return {
    plaintext,
    ciphertext,
    cipherType: CipherType.VIGENERE,
    key
  }
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

function modInverse(a: number, m: number): number {
  a = mod(a, m)
  for (let x = 1; x < m; x++) {
    if (mod(a * x, m) === 1) return x
  }
  return 1
}

export function affineEncrypt(plaintext: string, a: number, b: number): EncryptionResult {
  const aMod = mod(a, 26)
  if (gcd(aMod, 26) !== 1) {
    return { plaintext, ciphertext: plaintext, cipherType: CipherType.AFFINE, key: `${a},${b}` }
  }
  const bMod = mod(b, 26)
  let ciphertext = ''
  for (const char of plaintext) {
    if (/[a-zA-Z]/.test(char)) {
      const base = char === char.toUpperCase() ? 65 : 97
      const x = char.charCodeAt(0) - base
      ciphertext += String.fromCharCode(mod(aMod * x + bMod, 26) + base)
    } else {
      ciphertext += char
    }
  }
  return {
    plaintext,
    ciphertext,
    cipherType: CipherType.AFFINE,
    key: `${a},${b}`
  }
}

export function affineDecrypt(ciphertext: string, a: number, b: number): EncryptionResult {
  const aMod = mod(a, 26)
  if (gcd(aMod, 26) !== 1) {
    return { plaintext: ciphertext, ciphertext, cipherType: CipherType.AFFINE, key: `${a},${b}` }
  }
  const bMod = mod(b, 26)
  const aInv = modInverse(aMod, 26)
  let plaintext = ''
  for (const char of ciphertext) {
    if (/[a-zA-Z]/.test(char)) {
      const base = char === char.toUpperCase() ? 65 : 97
      const y = char.charCodeAt(0) - base
      plaintext += String.fromCharCode(mod(aInv * (y - bMod), 26) + base)
    } else {
      plaintext += char
    }
  }
  return {
    plaintext,
    ciphertext,
    cipherType: CipherType.AFFINE,
    key: `${a},${b}`
  }
}
