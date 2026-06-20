import React, { useCallback, useRef, useState } from "react";
import { Upload, FileText, AlertCircle, Download, Sparkles } from "lucide-react";
import { ProgressRing } from "./ProgressRing";
import type { DataSummary } from "../types";
import { downloadSampleCSV } from "../utils/mockData";

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  summary: DataSummary | null;
  compact?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  isUploading,
  uploadProgress,
  error,
  summary,
  compact = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (isUploading) return;
      const file = e.dataTransfer.files?.[0];
      if (file) {
        const isCSV =
          file.type === "text/csv" ||
          file.name.toLowerCase().endsWith(".csv");
        if (isCSV) onFileSelect(file);
      }
    },
    [onFileSelect, isUploading]
  );

  const handleSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFileSelect(file);
      if (inputRef.current) inputRef.current.value = "";
    },
    [onFileSelect]
  );

  if (compact && summary) {
    return (
      <div className="space-y-2 rounded-card border border-[#1e3355] bg-bg-secondary/60 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-accent-teal">
            <FileText size={14} />
            <span className="font-mono font-medium">{summary.totalPoints} 个数据点</span>
          </div>
          <button
            onClick={() => inputRef.current?.click()}
            className="rounded-md border border-accent-cyan/40 px-2 py-1 text-xs text-accent-cyan transition hover:bg-accent-cyan/10"
          >
            重新上传
          </button>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] font-mono text-slate-400">
          <div>纬度: {summary.latRange.min}° ~ {summary.latRange.max}°</div>
          <div>经度: {summary.lngRange.min}° ~ {summary.lngRange.max}°</div>
          <div className="col-span-2">
            强度: {summary.intensityRange.min} ~ {summary.intensityRange.max}
          </div>
        </div>
        <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleSelect} />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!isUploading) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && inputRef.current?.click()}
        className={[
          "relative group cursor-pointer rounded-card border-2 border-dashed transition-all duration-200",
          "flex flex-col items-center justify-center gap-4 p-8",
          isDragging
            ? "border-accent-cyan bg-accent-cyan/5 shadow-glow scale-[1.01]"
            : error
              ? "border-red-500/50 bg-red-500/5"
              : "border-[#233554] bg-bg-secondary/30 hover:border-accent-cyan/60 hover:bg-bg-secondary/60",
        ].join(" ")}
      >
        <div className="absolute inset-0 overflow-hidden rounded-card opacity-0 transition-opacity group-hover:opacity-100">
          <div className="absolute -inset-1 bg-gradient-to-r from-accent-cyan/20 via-transparent to-accent-teal/20 blur-xl" />
        </div>

        {!isUploading && !summary && (
          <>
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#1e3355] bg-bg-primary transition-all group-hover:scale-110 group-hover:border-accent-cyan/60 group-hover:shadow-glow">
              <Upload className="text-accent-cyan" size={32} strokeWidth={1.5} />
              <Sparkles
                className="absolute -right-1 -top-1 text-accent-teal opacity-0 transition-opacity group-hover:opacity-100"
                size={18}
              />
            </div>
            <div className="text-center">
              <p className="font-display text-lg font-semibold text-slate-200">
                拖拽 CSV 文件到此处
              </p>
              <p className="mt-1 text-sm text-slate-500">
                或点击选择文件 &middot; latitude, longitude, intensity 列
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadSampleCSV();
                }}
                className="flex items-center gap-1.5 rounded-md border border-accent-teal/40 bg-accent-teal/5 px-3 py-1.5 text-xs text-accent-teal transition hover:bg-accent-teal/15"
              >
                <Download size={12} />
                下载示例数据
              </button>
            </div>
          </>
        )}

        {isUploading && (
          <div className="flex flex-col items-center gap-4 py-4">
            <ProgressRing active={true} progress={uploadProgress} />
            <p className="font-mono text-sm text-slate-400">正在解析光照数据...</p>
          </div>
        )}

        {summary && !isUploading && (
          <div className="flex w-full flex-col items-center gap-4 py-2">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent-teal/50 bg-accent-teal/10 shadow-glow">
              <FileText size={28} className="text-accent-teal" />
            </div>
            <div className="w-full space-y-2 rounded-lg border border-[#1e3355] bg-bg-primary/50 p-4">
              <div className="flex items-center justify-between border-b border-[#1e3355] pb-2">
                <span className="font-mono text-sm font-semibold text-slate-200">
                  解析成功
                </span>
                <span className="rounded-full bg-accent-teal/15 px-2 py-0.5 font-mono text-xs font-medium text-accent-teal">
                  {summary.totalPoints} 条记录
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md bg-bg-secondary/60 p-2">
                  <div className="font-mono text-[10px] uppercase text-slate-500">纬度范围</div>
                  <div className="mt-0.5 font-mono text-slate-300">
                    {summary.latRange.min}°
                    <br />
                    {summary.latRange.max}°
                  </div>
                </div>
                <div className="rounded-md bg-bg-secondary/60 p-2">
                  <div className="font-mono text-[10px] uppercase text-slate-500">经度范围</div>
                  <div className="mt-0.5 font-mono text-slate-300">
                    {summary.lngRange.min}°
                    <br />
                    {summary.lngRange.max}°
                  </div>
                </div>
              </div>
              <div className="rounded-md bg-bg-secondary/60 p-2">
                <div className="font-mono text-[10px] uppercase text-slate-500">光照强度范围</div>
                <div className="mt-0.5 flex items-center justify-between font-mono text-slate-300">
                  <span>{summary.intensityRange.min}</span>
                  <div className="mx-2 h-1.5 flex-1 rounded-full bg-gradient-to-r from-light-purple via-accent-cyan to-light-yellow" />
                  <span>{summary.intensityRange.max}</span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
                className="mt-2 w-full rounded-md border border-accent-cyan/40 py-2 text-xs text-accent-cyan transition hover:bg-accent-cyan/10"
              >
                更换其他文件
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs text-red-400 backdrop-blur animate-fade-in">
            <AlertCircle size={12} />
            {error}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleSelect}
          disabled={isUploading}
        />
      </div>
    </div>
  );
};
