export interface LyricLine {
  time: number
  text: string
}

const TIME_TAG_REGEX = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g

export class LyricParser {
  static parseTime(tag: string): number {
    const match = tag.match(/\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/)
    if (!match) return 0
    const minutes = parseInt(match[1], 10)
    const seconds = parseInt(match[2], 10)
    const ms = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0
    return minutes * 60 + seconds + ms / 1000
  }

  static formatTime(seconds: number): string {
    if (isNaN(seconds) || seconds < 0) seconds = 0
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    const ms = Math.floor((seconds - Math.floor(seconds)) * 100)
    return `[${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}]`
  }

  static parse(text: string): LyricLine[] {
    const lines: LyricLine[] = []
    const rawLines = text.split(/\r?\n/)

    for (const raw of rawLines) {
      if (!raw.trim()) continue

      const matches = [...raw.matchAll(TIME_TAG_REGEX)]
      if (matches.length === 0) continue

      const textPart = raw.replace(TIME_TAG_REGEX, '').trim()

      for (const m of matches) {
        const time = LyricParser.parseTime(m[0])
        lines.push({ time, text: textPart })
      }
    }

    return LyricParser.sortLines(lines)
  }

  static sortLines(lines: LyricLine[]): LyricLine[] {
    return [...lines].sort((a, b) => a.time - b.time)
  }

  static serialize(lines: LyricLine[]): string {
    const sorted = LyricParser.sortLines(lines)
    return sorted
      .map((line) => `${LyricParser.formatTime(line.time)} ${line.text}`)
      .join('\n')
  }
}
