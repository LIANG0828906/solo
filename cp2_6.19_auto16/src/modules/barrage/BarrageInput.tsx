import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useBarrageStore } from '../../stores/useBarrageStore';
import { LANGUAGE_OPTIONS, SPEED_DURATION, TRANSLATION_THROTTLE_MS, MAX_INPUT_LENGTH } from '../../types';
import type { LanguageCode, SpeedLevel, TranslationResult } from '../../types';
import { translatorEngine } from '../translator/TranslatorEngine';

export const BarrageInput: React.FC = function BarrageInput() {
  const [inputText, setInputText] = useState('');
  const [preview, setPreview] = useState<TranslationResult | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showSpeedDropdown, setShowSpeedDropdown] = useState(false);
  const [filterInput, setFilterInput] = useState('');
  const [speedToast, setSpeedToast] = useState<{ label: string; duration: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const speedRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<number | null>(null);

  const addBarrage = useBarrageStore((s) => s.addBarrage);
  const setTargetLanguage = useBarrageStore((s) => s.setTargetLanguage);
  const setSpeedLevel = useBarrageStore((s) => s.setSpeedLevel);
  const setFilterKeyword = useBarrageStore((s) => s.setFilterKeyword);
  const settings = useBarrageStore((s) => s.settings);

  const throttledTranslate = useRef(
    translatorEngine.throttle(
      (text: string, target: LanguageCode): Promise<TranslationResult> =>
        translatorEngine.translate(text, target),
      TRANSLATION_THROTTLE_MS
    )
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowLangDropdown(false);
      }
      if (speedRef.current && !speedRef.current.contains(e.target as Node)) {
        setShowSpeedDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const text = inputText.trim();
    if (!text) {
      setPreview(null);
      setIsTranslating(false);
      return;
    }

    let cancelled = false;
    setIsTranslating(true);

    void (async () => {
      const result = await throttledTranslate.current(text, settings.targetLanguage);
      if (!cancelled && result) {
        setPreview(result);
        setIsTranslating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [inputText, settings.targetLanguage]);

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;
    void addBarrage(text);
    setInputText('');
    setPreview(null);
  }, [inputText, addBarrage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleSelectLang = useCallback(
    (code: LanguageCode) => {
      void setTargetLanguage(code);
      setShowLangDropdown(false);
    },
    [setTargetLanguage]
  );

  const handleSpeedChange = useCallback((value: SpeedLevel, label: string) => {
    setSpeedLevel(value);
    setShowSpeedDropdown(false);
    setSpeedToast({ label, duration: SPEED_DURATION[value] / 1000 });
    if (toastTimer.current !== null) {
      window.clearTimeout(toastTimer.current);
    }
    toastTimer.current = window.setTimeout(() => {
      setSpeedToast(null);
      toastTimer.current = null;
    }, 2000);
  }, [setSpeedLevel]);

  const currentLang = LANGUAGE_OPTIONS.find((l) => l.code === settings.targetLanguage)!;

  const speedOptions: { value: SpeedLevel; label: string; duration: number }[] = [
    { value: 'slow', label: '慢速', duration: SPEED_DURATION.slow },
    { value: 'normal', label: '中速', duration: SPEED_DURATION.normal },
    { value: 'fast', label: '快速', duration: SPEED_DURATION.fast }
  ];
  const currentSpeed = speedOptions.find((s) => s.value === settings.speedLevel)!;

  const charCount = inputText.length;
  const isNearLimit = charCount >= MAX_INPUT_LENGTH * 0.8;

  return (
    <div className="input-section">
      <div className="filter-row">
        <div className="filter-input-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="filter-icon">
            <path
              d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            className="filter-input"
            placeholder="关键词过滤..."
            value={filterInput}
            onChange={(e) => {
              setFilterInput(e.target.value);
              setFilterKeyword(e.target.value);
            }}
          />
        </div>
        <div className="speed-selector" ref={speedRef}>
          <button
            className="speed-btn"
            onClick={() => setShowSpeedDropdown((v) => !v)}
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            <span>{currentSpeed.label}</span>
            <span className="speed-duration">{currentSpeed.duration / 1000}s</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>
          {showSpeedDropdown && (
            <div className="dropdown-menu">
              {speedOptions.map((opt) => (
                <button
                  key={opt.value}
                  className={`dropdown-item ${settings.speedLevel === opt.value ? 'active' : ''}`}
                  onClick={() => handleSpeedChange(opt.value, opt.label)}
                  type="button"
                >
                  <span>{opt.label}</span>
                  <span className="speed-item-duration">{opt.duration / 1000}s</span>
                </button>
              ))}
            </div>
          )}
          {speedToast && (
            <div className="speed-toast">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              <span className="speed-toast-label">{speedToast.label}</span>
              <span className="speed-toast-duration">{speedToast.duration}s</span>
            </div>
          )}
        </div>
      </div>

      <div className="input-row">
        <div className="lang-selector" ref={dropdownRef}>
          <button
            className="lang-btn"
            onClick={() => setShowLangDropdown((v) => !v)}
            type="button"
          >
            <span className="lang-flag">{currentLang.flag}</span>
            <span className="lang-label">{currentLang.label}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>
          {showLangDropdown && (
            <div className="dropdown-menu lang-menu">
              {LANGUAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  className={`dropdown-item ${settings.targetLanguage === opt.code ? 'active' : ''}`}
                  onClick={() => handleSelectLang(opt.code)}
                  type="button"
                >
                  <span className="lang-flag">{opt.flag}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="input-wrapper">
          <input
            type="text"
            className="barrage-input"
            placeholder="输入弹幕，支持实时翻译预览..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value.slice(0, MAX_INPUT_LENGTH))}
            onKeyDown={handleKeyDown}
            maxLength={MAX_INPUT_LENGTH}
          />
          <div className="input-meta">
            {inputText && (
              <div className={`translation-preview ${isTranslating ? 'loading' : ''}`}>
                {isTranslating && (
                  <span className="preview-spinner">
                    <svg className="spinner-svg" viewBox="0 0 24 24" width="14" height="14">
                      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="31.4" strokeLinecap="round" />
                    </svg>
                  </span>
                )}
                {preview && !isTranslating && <span>{preview.translatedText}</span>}
                {isTranslating && <span className="preview-loading-text">翻译中</span>}
              </div>
            )}
            <span className={`char-counter ${isNearLimit ? 'near-limit' : ''} ${charCount >= MAX_INPUT_LENGTH ? 'at-limit' : ''}`}>
              {charCount}/{MAX_INPUT_LENGTH}
            </span>
          </div>
        </div>

        <button className="send-btn" onClick={handleSend} type="button" disabled={!inputText.trim()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
          <span>发送</span>
        </button>
      </div>
    </div>
  );
};
