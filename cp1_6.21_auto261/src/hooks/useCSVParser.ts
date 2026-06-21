import Papa from 'papaparse';
import type { CSVParseResult, TimelineEvent } from '@/types';
import { detectDateColumn, detectEventColumn, parseDate } from '@/utils/dateUtils';

export function useCSVParser() {
  const parseFile = (file: File): Promise<CSVParseResult> => {
    return new Promise((resolve) => {
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        resolve({
          success: false,
          data: [],
          dateColumn: '',
          eventColumn: '',
          error: '文件大小不能超过 10MB',
        });
        return;
      }

      Papa.parse<string[]>(file, {
        encoding: 'UTF-8',
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data;
          if (data.length < 2) {
            resolve({
              success: false,
              data: [],
              dateColumn: '',
              eventColumn: '',
              error: 'CSV 文件格式不正确，至少需要包含表头和一行数据',
            });
            return;
          }

          const headers = data[0];
          const rows = data.slice(1);

          const dateColumn = detectDateColumn(headers, rows);
          if (!dateColumn) {
            resolve({
              success: false,
              data: [],
              dateColumn: '',
              eventColumn: '',
              error: '未检测到日期列，请确保 CSV 文件包含有效的日期列',
            });
            return;
          }

          const eventColumn = detectEventColumn(headers);
          if (!eventColumn) {
            resolve({
              success: false,
              data: [],
              dateColumn: '',
              eventColumn: '',
              error: '未检测到事件列，请确保 CSV 文件包含事件列（列名包含"事件"或"event"）',
            });
            return;
          }

          const dateIndex = headers.indexOf(dateColumn);
          const eventIndex = headers.indexOf(eventColumn);
          const descriptionColumn = headers.find(
            (h) => h.toLowerCase().includes('描述') || h.toLowerCase().includes('description')
          );
          const descriptionIndex = descriptionColumn
            ? headers.indexOf(descriptionColumn)
            : -1;

          const events: TimelineEvent[] = [];
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const dateString = row[dateIndex] ?? '';
            const date = parseDate(dateString);
            if (!date) continue;

            const event: TimelineEvent = {
              id: `event-${i}`,
              date,
              dateString,
              eventName: row[eventIndex] ?? '',
            };

            if (descriptionIndex >= 0) {
              event.description = row[descriptionIndex];
            }

            for (let j = 0; j < headers.length; j++) {
              if (j !== dateIndex && j !== eventIndex && j !== descriptionIndex) {
                event[headers[j]] = row[j];
              }
            }

            events.push(event);
          }

          if (events.length === 0) {
            resolve({
              success: false,
              data: [],
              dateColumn: '',
              eventColumn: '',
              error: '未解析到有效的事件数据，请检查日期格式是否正确',
            });
            return;
          }

          resolve({
            success: true,
            data: events,
            dateColumn,
            eventColumn,
            descriptionColumn,
          });
        },
        error: (error) => {
          resolve({
            success: false,
            data: [],
            dateColumn: '',
            eventColumn: '',
            error: `解析 CSV 文件失败: ${error.message}`,
          });
        },
      });
    });
  };

  return { parseFile };
}
