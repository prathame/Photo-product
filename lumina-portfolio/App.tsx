import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { EventView } from './pages/EventView';
import { Admin } from './pages/Admin';
import { AppState, Event, Photo, UploadProgress } from './types';
import * as db from './services/db';
import { ThemeProvider } from './context/ThemeContext';

const ENABLE_ADMIN = import.meta.env.VITE_ENABLE_ADMIN !== 'false';

const AppContext = createContext<AppState | undefined>(undefined);

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppStore must be used within AppProvider");
  return context;
};

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [allEvents, allPhotos] = await Promise.all([
        db.getEvents(),
        db.getAllPhotos()
      ]);
      // Sort events by date descending
      setEvents(allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setPhotos(allPhotos);
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const addEvent = async (eventData: Omit<Event, 'id' | 'createdAt'>) => {
    const created = await db.saveEvent(eventData);
    await refreshData();
    return created;
  };

  const deleteEvent = async (id: string) => {
      await db.removeEvent(id);
      await refreshData();
  };

  const addPhotos = async (
    eventId: string,
    files: File[],
    onProgress?: (progress: UploadProgress) => void
  ) => {
    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    let uploadedBytes = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const newPhoto = await db.savePhoto(eventId, file);
      uploadedBytes += file.size;
      setPhotos(prev => [...prev, newPhoto]);
      onProgress?.({
        current: i + 1,
        total: files.length,
        file,
        uploadedBytes,
        totalBytes,
      });
    }
    await refreshData();
  };

  const deletePhoto = async (photoId: string) => {
    await db.deletePhoto(photoId);
    await refreshData();
  };

  const deletePhotos = async (photoIds: string[]) => {
    if (!photoIds.length) return;
    await db.deletePhotos(photoIds);
    await refreshData();
  };

  const updatePhotoCaption = async (photoId: string, caption: string) => {
    const photo = photos.find(p => p.id === photoId);
    if (photo) {
        await db.updatePhoto(photoId, caption);
        await refreshData();
    }
  }

  const setCoverPhoto = async (eventId: string, photoId: string) => {
    await db.setEventCoverPhoto(eventId, photoId);
    await refreshData();
  };

  const togglePhotoFavorite = async (photoId: string, isFavorite: boolean) => {
    await db.setPhotoFavorite(photoId, isFavorite);
    await refreshData();
  };

  return (
    <AppContext.Provider value={{ events, photos, loading, refreshData, addEvent, deleteEvent, addPhotos, deletePhoto, deletePhotos, updatePhotoCaption, setCoverPhoto, togglePhotoFavorite }}>
      {children}
    </AppContext.Provider>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <HashRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/event/:slug" element={<EventView />} />
              {ENABLE_ADMIN && <Route path="/admin/*" element={<Admin />} />}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </HashRouter>
      </AppProvider>
    </ThemeProvider>
  );
}