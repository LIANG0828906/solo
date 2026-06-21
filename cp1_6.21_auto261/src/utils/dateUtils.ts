export function parseDate(dateString: string): Date | null {
  const trimmed = dateString.trim();

  const yyyyMmDdRegex = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
  const yyyyMmDdMatch = trimmed.match(yyyyMmDdRegex);
  if (yyyyMmDdMatch) {
    const year = parseInt(yyyyMmDdMatch[1], 10);
    const month = parseInt(yyyyMmDdMatch[2], 10) - 1;
    const day = parseInt(yyyyMmDdMatch[3], 10);
    const date = new Date(year, month, day);
    if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
      return date;
    }
  }

  const mmDdYyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const mmDdYyyyMatch = trimmed.match(mmDdYyyyRegex);
  if (mmDdYyyyMatch) {
    const month = parseInt(mmDdYyyyMatch[1], 10) - 1;
    const day = parseInt(mmDdYyyyMatch[2], 10);
    const year = parseInt(mmDdYyyyMatch[3], 10);
    const date = new Date(year, month, day);
    if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
      return date;
    }
  }

  return null;
}

export function isDateColumn(values: string[]): boolean {
  if (values.length === 0) return false;

  const validDates = values.filter((value) => {
    if (!value || value.trim() === '') return false;
    return parseDate(value) !== null;
  });

  return validDates.length > values.length * 0.6;
}

export function detectDateColumn(headers: string[], rows: string[][]): string | null {
  for (let i = 0; i < headers.length; i++) {
    const columnValues = rows.map((row) => row[i] ?? '');
    if (isDateColumn(columnValues)) {
      return headers[i];
    }
  }

  for (const header of headers) {
    const lowerHeader = header.toLowerCase();
    if (lowerHeader.includes('date') || lowerHeader.includes('日期') || lowerHeader.includes('时间')) {
      const columnIndex = headers.indexOf(header);
      const columnValues = rows.map((row) => row[columnIndex] ?? '');
      if (isDateColumn(columnValues)) {
        return header;
      }
    }
  }

  return null;
}

export function detectEventColumn(headers: string[]): string | null {
  for (const header of headers) {
    const lowerHeader = header.toLowerCase();
    if (lowerHeader.includes('事件') || lowerHeader.includes('event')) {
      return header;
    }
  }
  return null;
}
