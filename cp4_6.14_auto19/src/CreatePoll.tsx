import React, { useState } from 'react';

interface CreatePollProps {
  onCreate: (title: string, description: string, options: string[], deadline: number | null) => void;
  onBack: () => void;
}

const containerStyles: React.CSSProperties = {
  minHeight: '100vh',
  padding: '40px 20px',
  maxWidth: '680px',
  margin: '0 auto',
};

const headerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '32px',
};

const backBtnStyles: React.CSSProperties = {
  width: '44px',
  height: '44px',
  borderRadius: '12px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '20px',
  transition: 'all 200ms ease',
};

const headerTitleStyles: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 700,
};

const cardStyles: React.CSSProperties = {
  background: 'var(--bg-card)',
  borderRadius: '20px',
  padding: '32px',
  border: '1px solid var(--border-color)',
  animation: 'fadeInUp 0.5s ease-out',
};

const labelStyles: React.CSSProperties = {
  display: 'block',
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: '8px',
  marginTop: '20px',
};

const inputBaseStyles: React.CSSProperties = {
  width: '100%',
  padding: '14px 18px',
  background: 'rgba(15, 23, 42, 0.6)',
  border: '2px solid var(--border-color)',
  borderRadius: '12px',
  color: 'var(--text-primary)',
  fontSize: '16px',
  transition: 'border-color 200ms ease',
};

const textareaStyles: React.CSSProperties = {
  ...inputBaseStyles,
  resize: 'vertical',
  minHeight: '80px',
  lineHeight: 1.6,
};

const optionRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  alignItems: 'center',
  marginTop: '10px',
};

const optionInputStyles: React.CSSProperties = {
  ...inputBaseStyles,
  marginTop: 0,
  flex: 1,
};

const removeBtnStyles: React.CSSProperties = {
  width: '44px',
  height: '44px',
  borderRadius: '12px',
  background: 'rgba(239, 68, 68, 0.15)',
  color: '#ef4444',
  fontSize: '18px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  transition: 'all 200ms ease',
};

const addBtnStyles: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  marginTop: '12px',
  borderRadius: '12px',
  background: 'rgba(59, 130, 246, 0.1)',
  border: '2px dashed rgba(