import React, { useCallback, useRef, useState } from 'react';
import { FONT_LIST, THEME } from '../types';
import type { DialogBox } from '../types';

interface TextPanelProps {
  dialogBoxes: DialogBox[];
  selectedBoxId: string | null;
  onUpdateBox: (id: string, updates: Partial<DialogBox>) => void;
  onSelectBox: (id: string | null) => void;
}

export default function TextPanel({
  dialogBoxes,
  selectedBoxId,
  onUpdateBox,
  onSelectBox,
}: TextPanelProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'edit'>('list');
  const selectedBox = dialogBoxes.find((b) => b.id === selectedBoxId);

  const handleUpdate = useCallback(
    (field: keyof DialogBox, value: string | number) => {
      if (selectedBoxId) {
        onUpdateBox(selectedBoxId, { [field]: value });
      }
    },
    [selectedBoxId, onUpdateBox]
  );

  const handleTranslate = useCallback(() => {
    if (!selectedBox) return;
    const mockTranslations: Record<string, string> = {
      '我会成为火影！': 'I will become Hokage!',
      '这个力量...超越极限！': 'This power... beyond the limit!',
      '不要放弃！': "Don't give up!",
      '终于见面了...': 'Finally we meet...',
      '一起走吧！': "Let's go together!",
      '这就是我的忍道！': "This is my ninja way!",
      '你准备好了吗？': 'Are you ready?',
      '绝对不原谅！': 'Absolutely unforgivable!',
    };
    const translated =
      mockTranslations[selectedBox.originalText] || 'Translated text...';
    onUpdateBox(selectedBox.id, { translatedText: translated });
  }, [selectedBox, onUpdateBox]);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: THEME.radius,
    padding: '8px',
    color: THEME.text,
    fontSize: '13px',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#aaa',
    marginBottom: '4px',
    display: 'block',
  };

  return (
    <div
      style={{
        width: '280px',
        minWidth: '280px',
        background: THEME.card,
        borderRadius: THEME.radius,
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {(['list', 'edit'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="btn-hover"
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === tab ? 'rgba(255,255,255,0.06)' : 'transparent',
              border: 'none',
              borderBottom:
                activeTab === tab
                  ? `2px solid ${THEME.orange}`
                  : '2px solid transparent',
              color: activeTab === tab ? THEME.text : '#888',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            {tab === 'list' ? '对话框列表' : '文字编辑'}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {activeTab === 'list' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {dialogBoxes.map((box, idx) => (
              <div
                key={box.id}
                onClick={() => onSelectBox(box.id)}
                className="btn-hover"
                style={{
                  padding: '10px',
                  borderRadius: THEME.radius,
                  cursor: 'pointer',
                  background:
                    selectedBoxId === box.id
                      ? 'rgba(255,140,66,0.15)'
                      : 'rgba(255,255,255,0.03)',
                  border:
                    selectedBoxId === box.id
                      ? `1px solid ${THEME.orange}`
                      : '1px solid rgba(255,255,255,0.06)',
                  transition: 'all 0.2s',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px',
                  }}
                >
                  <span
                    style={{
                      background: THEME.blue,
                      color: '#fff',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>
                    对话框 {idx + 1}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#aaa', marginLeft: '30px' }}>
                  {box.originalText}
                </div>
                {box.translatedText && (
                  <div
                    style={{
                      fontSize: '12px',
                      color: THEME.green,
                      marginLeft: '30px',
                      marginTop: '2px',
                    }}
                  >
                    → {box.translatedText}
                  </div>
                )}
              </div>
            ))}
            {dialogBoxes.length === 0 && (
              <div style={{ textAlign: 'center', color: '#666', padding: '24px', fontSize: '13px' }}>
                请先上传漫画图片
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {!selectedBox ? (
              <div style={{ textAlign: 'center', color: '#666', padding: '24px', fontSize: '13px' }}>
                请先选择一个对话框
              </div>
            ) : (
              <>
                <div>
                  <label style={labelStyle}>原文</label>
                  <input
                    type="text"
                    value={selectedBox.originalText}
                    onChange={(e) => handleUpdate('originalText', e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>译文</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      value={selectedBox.translatedText}
                      onChange={(e) => handleUpdate('translatedText', e.target.value)}
                      placeholder="输入翻译文字..."
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <button
                      onClick={handleTranslate}
                      className="btn-hover"
                      style={{
                        padding: '6px 10px',
                        background: THEME.accent,
                        border: 'none',
                        borderRadius: THEME.radius,
                        color: THEME.text,
                        cursor: 'pointer',
                        fontSize: '12px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      翻译
                    </button>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>字体</label>
                  <select
                    value={selectedBox.fontFamily}
                    onChange={(e) => handleUpdate('fontFamily', e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    {FONT_LIST.map((f) => (
                      <option key={f.name} value={f.family}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>
                    字号: {selectedBox.fontSize}px
                  </label>
                  <input
                    type="range"
                    min="12"
                    max="48"
                    value={selectedBox.fontSize}
                    onChange={(e) => handleUpdate('fontSize', Number(e.target.value))}
                    style={{ width: '100%', accentColor: THEME.orange }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>文字颜色</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="color"
                        value={selectedBox.fontColor}
                        onChange={(e) => handleUpdate('fontColor', e.target.value)}
                        style={{
                          width: '32px',
                          height: '32px',
                          border: 'none',
                          cursor: 'pointer',
                          borderRadius: '4px',
                        }}
                      />
                      <input
                        type="text"
                        value={selectedBox.fontColor}
                        onChange={(e) => handleUpdate('fontColor', e.target.value)}
                        style={{ ...inputStyle, width: '80px', fontSize: '12px' }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>描边颜色</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="color"
                        value={selectedBox.strokeColor}
                        onChange={(e) => handleUpdate('strokeColor', e.target.value)}
                        style={{
                          width: '32px',
                          height: '32px',
                          border: 'none',
                          cursor: 'pointer',
                          borderRadius: '4px',
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>
                      描边宽度: {selectedBox.strokeWidth}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="4"
                      value={selectedBox.strokeWidth}
                      onChange={(e) =>
                        handleUpdate('strokeWidth', Number(e.target.value))
                      }
                      style={{ width: '100%', accentColor: THEME.orange }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
