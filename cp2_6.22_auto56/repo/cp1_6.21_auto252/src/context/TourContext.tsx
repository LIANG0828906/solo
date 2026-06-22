import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Tour, Show, Song } from '../types';
import axios from 'axios';

const API = 'http://localhost:3001/api';

interface TourContextType {
  tours: Tour[];
  shows: Show[];
  songs: Song[];
  loading: boolean;
  fetchTours: () => Promise<void>;
  fetchShows: (tourId: string) => Promise<void>;
  fetchSongs: (showId: string) => Promise<void>;
  addTour: (tour: Omit<Tour, 'id'>) => Promise<void>;
  updateTour: (id: string, tour: Partial<Tour>) => Promise<void>;
  deleteTour: (id: string) => Promise<void>;
  addShow: (show: Omit<Show, 'id'>) => Promise<void>;
  updateShow: (id: string, show: Partial<Show>) => Promise<void>;
  deleteShow: (id: string) => Promise<void>;
  addSong: (song: Omit<Song, 'id'>) => Promise<void>;
  updateSong: (id: string, song: Partial<Song>) => Promise<void>;
  deleteSong: (id: string) => Promise<void>;
  reorderSongs: (showId: string, songIds: string[]) => Promise<void>;
}

const TourContext = createContext<TourContextType | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
  const [tours, setTours] = useState<Tour[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTours = async () => {
    setLoading(true);
    const res = await axios.get(`${API}/tours`);
    setTours(res.data);
    setLoading(false);
  };

  const fetchShows = async (tourId: string) => {
    const res = await axios.get(`${API}/shows?tourId=${tourId}`);
    setShows(res.data);
  };

  const fetchSongs = async (showId: string) => {
    const res = await axios.get(`${API}/songs?showId=${showId}`);
    setSongs(res.data);
  };

  const addTour = async (tour: Omit<Tour, 'id'>) => {
    const res = await axios.post(`${API}/tours`, tour);
    setTours(prev => [...prev, res.data]);
  };

  const updateTour = async (id: string, tour: Partial<Tour>) => {
    const res = await axios.put(`${API}/tours/${id}`, tour);
    setTours(prev => prev.map(t => (t.id === id ? res.data : t)));
  };

  const deleteTour = async (id: string) => {
    await axios.delete(`${API}/tours/${id}`);
    setTours(prev => prev.filter(t => t.id !== id));
    setShows(prev => prev.filter(s => s.tourId !== id));
  };

  const addShow = async (show: Omit<Show, 'id'>) => {
    const res = await axios.post(`${API}/shows`, show);
    setShows(prev => [...prev, res.data]);
  };

  const updateShow = async (id: string, show: Partial<Show>) => {
    const res = await axios.put(`${API}/shows/${id}`, show);
    setShows(prev => prev.map(s => (s.id === id ? res.data : s)));
  };

  const deleteShow = async (id: string) => {
    await axios.delete(`${API}/shows/${id}`);
    setShows(prev => prev.filter(s => s.id !== id));
    setSongs(prev => prev.filter(sg => sg.showId !== id));
  };

  const addSong = async (song: Omit<Song, 'id'>) => {
    const res = await axios.post(`${API}/songs`, song);
    setSongs(prev => [...prev, res.data]);
  };

  const updateSong = async (id: string, song: Partial<Song>) => {
    const res = await axios.put(`${API}/songs/${id}`, song);
    setSongs(prev => prev.map(s => (s.id === id ? res.data : s)));
  };

  const deleteSong = async (id: string) => {
    await axios.delete(`${API}/songs/${id}`);
    setSongs(prev => prev.filter(s => s.id !== id));
  };

  const reorderSongs = async (showId: string, songIds: string[]) => {
    const res = await axios.put(`${API}/shows/${showId}/songs-reorder`, { songIds });
    setSongs(prev => {
      const updated = [...prev];
      songIds.forEach((id, idx) => {
        const song = updated.find(s => s.id === id);
        if (song) song.order = idx;
      });
      return updated;
    });
  };

  useEffect(() => {
    fetchTours();
  }, []);

  return (
    <TourContext.Provider
      value={{
        tours,
        shows,
        songs,
        loading,
        fetchTours,
        fetchShows,
        fetchSongs,
        addTour,
        updateTour,
        deleteTour,
        addShow,
        updateShow,
        deleteShow,
        addSong,
        updateSong,
        deleteSong,
        reorderSongs,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTourContext() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTourContext must be used within TourProvider');
  return ctx;
}
