import React, { useState, useEffect, useCallback } from 'react';
import { Exhibition } from '@/types';
import { useExhibitionStore } from '@/store/useExhibitionStore';
import { VENUE_CONFIGS } from '@/utils/venueConfigs';
import { VenuePreviewThumbnail } from './VenuePreviewThumbnail';

interface ExhibitionCreatedModalProps {
  exhibition: Exhibition;
  onClose: () => void;
  onStartCurating: () => void;
}

const copyTextSecure = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    if (document.hasFocus()) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.top = '0';
      textarea.style.left = '0';
      textarea.style.opacity = '0';
      textarea.style.pointerEvents = 'none';
      textarea.setAttribute('readonly', '');
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, text.length);
      let ok = false;
      try {
        ok = document.execCommand('copy');
      } catch (_) {
        ok = false;
      }
      document.body.removeChild(textarea);
      if (ok) return true;
    }
    return false;
  } catch (_) {
    return false;
  }
};

export const ExhibitionCreatedModal: React.FC<ExhibitionCreatedModalProps> = ({
  exhibition,
  onClose,
  onStartCurating,
}) => {
  const { getShareLink } = useExhibitionStore();
  const [linkCopied, setLinkCopied] = useState(false);
  const [idCopied, setIdCopied] = useState(false);

  const shareLink = React.useMemo(() => getShareLink(exhibition.id), [exhibition.id, getShareLink]);
  const venueConfig = VENUE_CONFIGS[exhibition.venueTemplate];

  const copyLink = useCallback(async () => {
    const ok = await copyTextSecure(