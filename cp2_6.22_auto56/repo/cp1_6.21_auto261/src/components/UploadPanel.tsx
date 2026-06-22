import React, { useRef, useState, useCallback } from 'react';
import { useCSVParser } from '@/hooks/useCSVParser';
import type { TimelineEvent } from '@/types';

interface RawDataRecord {
  [key: string]: unknown;
}

interface UploadPanelProps {
  onParseSuccess: (result: {
    events: TimelineEvent[];
    dateColumn: string;
    eventColumn: string;
    descriptionColumn?: string;
    headers: string[];
    rawData: RawDataRecord[];
  }) => void;
  onError: (message: string) => void;
}

export default function UploadPanel({ onParseSuccess, onError }: UploadPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { parseFile } = useCSVParser();
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<RawDataRecord[]>([]);
  const [parseResult, setParseResult] = useState<{
    events: TimelineEvent[];
    dateColumn: string;
    eventColumn: string;
    descriptionColumn?: string;
  } | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      onError('请上传 CSV 格式的文件');
      return;
    }

    setIsLoading(true);
    setFileName(file.name);

    try {
      const result = await parseFile(file);

      if (result.success && result.data.length > 0) {
        const headers = Object.keys(result.data[0]).filter(
          (key) => !['id', 'date', 'dateString', 'eventName', 'description'].includes(key)
        );
        const allHeaders = ['dateString', 'eventName', 'description', ...headers].filter(Boolean);
        const rawData = result.data.map((event) => {
          const raw: RawDataRecord = {};
          allHeaders.forEach((h) => {
            raw[h] = event[h];
          });
          return raw;
        });

        setParsedHeaders(allHeaders);
        setParsedData(rawData);
        setParseResult({
          events: result.data,
          dateColumn: result.dateColumn,
          eventColumn: result.eventColumn,
          descriptionColumn: result.descriptionColumn,
        });
      } else {
        onError(result.error || '文件解析失败');
        setFileName('');
        setParsedHeaders([]);
        setParsedData([]);
        setParseResult(null);
      }
    } catch {
      onError('文件解析过程中发生错误');
      setFileName('');
      setParsedHeaders([]);
      setParsedData([]);
      setParseResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [parseFile, onError]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePreviewClick = () => {
    if (parseResult && parsedHeaders.length > 0) {
      onParseSuccess({
        events: parseResult.events,
        dateColumn: parseResult.dateColumn,
        eventColumn: parseResult.eventColumn,
        descriptionColumn: parseResult.descriptionColumn,
        headers: parsedHeaders,
        rawData: parsedData,
      });
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-4">
        <div
          className={`flex-1 border-2 border-dashed rounded-lg p-6 cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : fileName
              ? 'border-green-400 bg-green-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          style={{ borderRadius: '8px', padding: '24px' }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleInputChange}
          />
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isLoading
                  ? 'bg-gray-100'
                  : fileName
                  ? 'bg-green-100'
                  : 'bg-blue-100'
              }`}
            >
              {isLoading ? (
                <svg className="w-6 h-6 text-gray-500 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : fileName ? (
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <p className="text-sm font-medium text-gray-700">正在解析文件...</p>
              ) : fileName ? (
                <>
                  <p className="text-sm font-medium text-gray-800 truncate">{fileName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">点击重新上传</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-700">
                    拖拽 CSV 文件到此处，或点击上传
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    支持最大 10MB，UTF-8 编码
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handlePreviewClick}
          disabled={!parseResult || isLoading}
          className={`h-12 px-4 rounded-lg text-white font-medium transition-all duration-200 ${
            parseResult && !isLoading
              ? 'bg-blue-500 hover:bg-blue-600 cursor-pointer'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
          style={{
            backgroundColor: parseResult && !isLoading ? '#3B82F6' : undefined,
            borderRadius: '8px',
            paddingLeft: '16px',
            paddingRight: '16px',
          }}
        >
          预览数据
        </button>
      </div>

      {parseResult && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-sm text-blue-800">
            <span className="font-medium">解析成功：</span>
            检测到日期列「{parseResult.dateColumn}」，
            事件列「{parseResult.eventColumn}」
            {parseResult.descriptionColumn && `，描述列「${parseResult.descriptionColumn}」`}
            ，共 {parseResult.events.length} 条有效数据
          </p>
        </div>
      )}
    </div>
  );
}
