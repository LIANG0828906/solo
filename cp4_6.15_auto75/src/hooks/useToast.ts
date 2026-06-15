import { useState, useEffect, useCallback } from 'react';
import type { ToastMessage } from '@/types';

export type ToastType = ToastMessage['type'];

type ToastListener = (messages: ToastMessage[]) => void;

let listeners: ToastListener[] = [];
let messages: ToastMessage[] = [];

function notifyListeners() {
  listeners.forEach((listener) => listener([...messages]));
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function toast(message: string, type: ToastType = 'info') {
  const id = generateId();
  const newMessage: ToastMessage = { id, message, type };
  messages = [...messages, newMessage];
  notifyListeners();

  setTimeout(() => {
    messages = messages.filter((m) => m.id !== id);
    notifyListeners();
  }, 3000);
}

function subscribe(listener: ToastListener) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getMessages() {
  return messages;
}

export function useToast() {
  const [state, setState] = useState<ToastMessage[]>(getMessages());

  useEffect(() => {
    const unsubscribe = subscribe(setState);
    return unsubscribe;
  }, []);

  const removeMessage = useCallback((id: string) => {
    messages = messages.filter((m) => m.id !== id);
    notifyListeners();
  }, []);

  return { messages: state, removeMessage, toast };
}
