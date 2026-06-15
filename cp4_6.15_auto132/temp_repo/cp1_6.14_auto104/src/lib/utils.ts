export type ClassValue =
  | string
  | number
  | null
  | false
  | undefined
  | ClassValue[]
  | Record<string, boolean | null | undefined>

function toVal(mix: ClassValue): string {
  let k: string
  let i: number
  let y: string
  let str = ''

  if (typeof mix === 'string' || typeof mix === 'number') {
    str += mix
  } else if (mix && typeof mix === 'object') {
    if (Array.isArray(mix)) {
      for (i = 0; i < mix.length; i++) {
        if (mix[i]) {
          y = toVal(mix[i] as ClassValue)
          if (y) {
            if (str) str += ' '
            str += y
          }
        }
      }
    } else {
      for (k in mix) {
        if ((mix as Record<string, unknown>)[k]) {
          if (str) str += ' '
          str += k
        }
      }
    }
  }
  return str
}

export function cn(...inputs: ClassValue[]): string {
  let i = 0
  let tmp: ClassValue
  let x: string
  let str = ''
  const len = inputs.length
  for (; i < len; i++) {
    tmp = inputs[i]
    if (tmp) {
      x = toVal(tmp)
      if (x) str && (str += ' '), str += x
    }
  }
  return str
}
