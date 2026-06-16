import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Capsule, Attachment } from '@/types';
import {
  saveCapsule,
  saveAttachment,
  getAllCapsules,
  getAttachment,
  deleteCapsule,
  updateCapsule,
  getAttachmentsByCapsuleId,
} from '@/utils/db';
import { getRandomThemeColor } from '@/utils/colors';
import { hashPassword } from '@/utils/crypto';

interface CreateCapsuleData {
  title: string;
  content: string;
  openDate: string;
  isPrivate: boolean;
  password?: string;
  attachments: Array<{ blob: Blob; mimeType: string; filename: string; dataUrl: string }>;
}

interface CapsuleStore {
  capsules: Capsule[];
  isLoading: boolean;
  init: () => Promise<void>;
  createCapsule: (data: CreateCapsuleData) => Promise<Capsule>;
  removeCapsule: (id: string) => Promise<void>;
  markAsOpened: (id: string) => Promise<void>;
  recordFailedAttempt: (id: string) => Promise<boolean>;
  resetFailedAttempts: (id: string) => Promise<void>;
  getAttachmentDataUrl: (id: string) => Promise<string | null>;
  getCapsuleAttachments: (capsuleId: string) => Promise<string[]>;
  refreshCapsules: () => Promise<void>;
}

export const useCapsuleStore = create<CapsuleStore>((set, get) => ({
  capsules: [],
  isLoading: true,

  init: async () => {
    try {
      const capsules = await getAllCapsules();
      capsules.sort((a, b) => new Date(a.openDate).getTime() - new Date(b.openDate).getTime());
      set({ capsules, isLoading: false });
    } catch (error) {
      console.error('Failed to initialize store:', error);
      set({ isLoading: false });
    }
  },

  refreshCapsules: async () => {
    const capsules = await getAllCapsules();
    capsules.sort((a, b) => new Date(a.openDate).getTime() - new Date(b.openDate).getTime());
    set({ capsules });
  },

  createCapsule: async (data: CreateCapsuleData) => {
    const capsuleId = uuidv4();
    const attachmentIds: string[] = [];

    for (const att of data.attachments) {
      const attId = uuidv4();
      attachmentIds.push(attId);
      const attachment: Attachment = {
        id: attId,
        capsuleId,
        data: att.blob,
        mimeType: att.mimeType,
        size: att.blob.size,
        filename: att.filename,
      };
      await saveAttachment(attachment);
    }

    const passwordHash = data.isPrivate && data.password ? await hashPassword(data.password) : null;

    const capsule: Capsule = {
      id: capsuleId,
      title: data.title,
      content: data.content,
      themeColor: getRandomThemeColor(),
      openDate: data.openDate,
      createdAt: new Date().toISOString(),
      openedAt: null,
      isPrivate: data.isPrivate,
      passwordHash,
      attachmentIds,
      failedAttempts: 0,
      lockUntil: null,
    };

    await saveCapsule(capsule);

    const capsules = [...get().capsules, capsule];
    capsules.sort((a, b) => new Date(a.openDate).getTime() - new Date(b.openDate).getTime());
    set({ capsules });

    return capsule;
  },

  removeCapsule: async (id: string) => {
    await deleteCapsule(id);
    set({ capsules: get().capsules.filter((c) => c.id !== id) });
  },

  markAsOpened: async (id: string) => {
    const capsule = get().capsules.find((c) => c.id === id);
    if (!capsule) return;

    const updated: Capsule = {
      ...capsule,
      openedAt: new Date().toISOString(),
      failedAttempts: 0,
      lockUntil: null,
    };
    await updateCapsule(updated);

    set({
      capsules: get().capsules.map((c) => (c.id === id ? updated : c)),
    });
  },

  recordFailedAttempt: async (id: string): Promise<boolean> => {
    const capsule = get().capsules.find((c) => c.id === id);
    if (!capsule) return false;

    const newAttempts = capsule.failedAttempts + 1;
    const shouldLock = newAttempts >= 5;
    const lockUntil = shouldLock ? new Date(Date.now() + 60 * 1000).toISOString() : capsule.lockUntil;

    const updated: Capsule = {
      ...capsule,
      failedAttempts: newAttempts,
      lockUntil,
    };
    await updateCapsule(updated);

    set({
      capsules: get().capsules.map((c) => (c.id === id ? updated : c)),
    });

    return shouldLock;
  },

  resetFailedAttempts: async (id: string) => {
    const capsule = get().capsules.find((c) => c.id === id);
    if (!capsule) return;

    const updated: Capsule = {
      ...capsule,
      failedAttempts: 0,
      lockUntil: null,
    };
    await updateCapsule(updated);

    set({
      capsules: get().capsules.map((c) => (c.id === id ? updated : c)),
    });
  },

  getAttachmentDataUrl: async (id: string): Promise<string | null> => {
    const attachment = await getAttachment(id);
    if (!attachment) return null;

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(attachment.data);
    });
  },

  getCapsuleAttachments: async (capsuleId: string): Promise<string[]> => {
    const attachments = await getAttachmentsByCapsuleId(capsuleId);
    const dataUrls: string[] = [];

    for (const att of attachments) {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(att.data);
      });
      if (dataUrl) dataUrls.push(dataUrl);
    }

    return dataUrls;
  },
}));
