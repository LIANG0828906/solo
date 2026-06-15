import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import {
  Exhibition,
  Artwork,
  Comment,
  initialExhibitions,
  initialArtworks,
  initialComments,
  MAX_ARTWORKS_PER_EXHIBITION,
} from '@/data/mockData';

interface GalleryState {
  exhibitions: Exhibition[];
  artworks: Artwork[];
  comments: Comment[];

  addExhibition: (data: Omit<Exhibition, 'id' | 'createdAt' | 'artworkIds'>) => Exhibition;
  addArtwork: (data: Omit<Artwork, 'id'> & { exhibitionId: string }) => Artwork | null;
  addComment: (data: Omit<Comment, 'id' | 'createdAt'>) => Comment;
  getExhibitionById: (id: string) => Exhibition | undefined;
  getArtworksByExhibition: (exhibitionId: string) => Artwork[];
  getCommentsByArtwork: (artworkId: string) => Comment[];
  getArtworkById: (id: string) => Artwork | undefined;
}

export const useGalleryStore = create<GalleryState>()(
  persist(
    (set, get) => ({
      exhibitions: initialExhibitions,
      artworks: initialArtworks,
      comments: initialComments,

      addExhibition: (data) => {
        const newExhibition: Exhibition = {
          ...data,
          id: uuidv4(),
          createdAt: Date.now(),
          artworkIds: [],
        };
        set((state) => ({
          exhibitions: [newExhibition, ...state.exhibitions],
        }));
        return newExhibition;
      },

      addArtwork: (data) => {
        const state = get();
        const exhibition = state.exhibitions.find((e) => e.id === data.exhibitionId);
        if (!exhibition) return null;
        if (exhibition.artworkIds.length >= MAX_ARTWORKS_PER_EXHIBITION) return null;

        const newArtwork: Artwork = {
          ...data,
          id: uuidv4(),
        };
        set((prev) => ({
          artworks: [...prev.artworks, newArtwork],
          exhibitions: prev.exhibitions.map((e) =>
            e.id === data.exhibitionId
              ? { ...e, artworkIds: [...e.artworkIds, newArtwork.id] }
              : e
          ),
        }));
        return newArtwork;
      },

      addComment: (data) => {
        const newComment: Comment = {
          ...data,
          id: uuidv4(),
          createdAt: Date.now(),
        };
        set((state) => ({
          comments: [newComment, ...state.comments],
        }));
        return newComment;
      },

      getExhibitionById: (id) => get().exhibitions.find((e) => e.id === id),

      getArtworksByExhibition: (exhibitionId) => {
        const state = get();
        const exhibition = state.exhibitions.find((e) => e.id === exhibitionId);
        if (!exhibition) return [];
        return exhibition.artworkIds
          .map((id) => state.artworks.find((a) => a.id === id))
          .filter(Boolean) as Artwork[];
      },

      getCommentsByArtwork: (artworkId) =>
        get()
          .comments.filter((c) => c.artworkId === artworkId)
          .sort((a, b) => b.createdAt - a.createdAt),

      getArtworkById: (id) => get().artworks.find((a) => a.id === id),
    }),
    {
      name: 'virtual-gallery-storage',
    }
  )
);
