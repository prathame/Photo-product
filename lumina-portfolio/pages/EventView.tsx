import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppStore } from '../App';
import { Download, X, ChevronLeft, ChevronRight, Calendar, ZoomIn, Loader2, Heart, Sparkles } from 'lucide-react';
import { Photo } from '../types';
import { API_URL } from '../services/db';

export const EventView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { events, photos, loading, togglePhotoFavorite } = useAppStore();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  const event = events.find(e => e.slug === slug);
  
  const eventPhotos = useMemo(() => {
    if (!event) return [];
    return photos.filter(p => p.eventId === event.id);
  }, [event, photos]);

  const favoritePhotos = useMemo(() => eventPhotos.filter((p) => p.isFavorite), [eventPhotos]);
  const otherPhotos = useMemo(() => eventPhotos.filter((p) => !p.isFavorite), [eventPhotos]);

  if (loading) return null;

  if (!event) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-2xl font-bold text-primary mb-2">Event Not Found</h2>
        <p className="text-secondary mb-6">The gallery you are looking for does not exist or has been removed.</p>
        <Link to="/" className="px-6 py-2 bg-surface hover:bg-primary/10 rounded-full text-primary border border-primary/10 transition-colors">
          Return Home
        </Link>
      </div>
    );
  }

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null && lightboxIndex < eventPhotos.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
    }
  };
  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null && lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    }
  };

  const downloadAll = async () => {
    if (!event || eventPhotos.length === 0) return;
    setIsZipping(true);

    try {
      const response = await fetch(`${API_URL}/events/${event.slug}/zip`);
      if (!response.ok) {
        throw new Error('Failed to download album');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${event.slug}-album.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error("Failed to download album", e);
      alert("Failed to download album.");
    } finally {
      setIsZipping(false);
    }
  };

  const handleFavoriteToggle = async (photo: Photo, nextState?: boolean) => {
    await togglePhotoFavorite(photo.id, nextState ?? !photo.isFavorite);
  };

  const renderPhotoCard = (photo: Photo) => {
    const photoIndex = eventPhotos.findIndex((p) => p.id === photo.id);
    if (photoIndex === -1) return null;
    return (
      <div
        key={photo.id}
        className="group relative mb-5 break-inside-avoid rounded-[26px] overflow-hidden border border-primary/10 bg-surface cursor-zoom-in shadow-xl shadow-black/5"
        onClick={() => openLightbox(photoIndex)}
      >
        <img
          src={photo.url}
          alt={photo.name}
          className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleFavoriteToggle(photo);
          }}
          className={`absolute top-3 right-3 z-20 flex items-center justify-center rounded-full p-2 transition-colors ${
            photo.isFavorite
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
              : 'bg-black/60 text-white/70 hover:text-white'
          }`}
          aria-label={photo.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className="w-4 h-4" fill={photo.isFavorite ? 'currentColor' : 'none'} />
        </button>
        {event.watermarkText && (
          <div className="absolute bottom-2 right-2 text-[10px] text-white/70 font-bold pointer-events-none select-none drop-shadow-md z-10">
            {event.watermarkText}
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn className="w-8 h-8 text-white drop-shadow-lg" />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-background min-h-screen pb-20 transition-colors duration-300">
      <div className="px-4">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="glass-panel rounded-3xl p-8 md:p-12 grid gap-10 md:grid-cols-[1.1fr,0.9fr]">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-xs font-semibold tracking-[0.3em]">
                <Calendar className="w-3 h-3" />
                {event.date}
              </div>
              <h1 className="hero-title text-4xl md:text-5xl font-semibold leading-tight">{event.title}</h1>
              {event.description && (
                <p className="text-secondary text-lg leading-relaxed">{event.description}</p>
              )}
              <div className="flex flex-wrap gap-3 pt-4">
                {eventPhotos.length > 0 && (
                  <button
                    onClick={downloadAll}
                    disabled={isZipping}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-background text-sm font-semibold shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    {isZipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {isZipping ? 'Bundling...' : 'Download full set'}
                  </button>
                )}
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-primary/10 text-sm font-semibold"
                >
                  <Sparkles className="w-4 h-4 text-accent" />
                  Back to collections
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rainbow-border rounded-2xl p-[1px] sm:col-span-2">
                <div className="rounded-2xl bg-surface/90 grid grid-cols-2 gap-4 p-5">
                  <div>
                    <p className="text-3xl font-display font-semibold">{eventPhotos.length}</p>
                    <p className="text-xs uppercase tracking-[0.3em] text-secondary">Photos</p>
                  </div>
                  <div>
                    <p className="text-3xl font-display font-semibold">{favoritePhotos.length}</p>
                    <p className="text-xs uppercase tracking-[0.3em] text-secondary">Favorites</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-primary/5 p-4 border border-primary/10">
                <p className="text-xs uppercase tracking-[0.4em] text-secondary mb-3">Venue</p>
                <p className="font-display text-lg">{event.slug.replace(/[-]/g, ' ').toUpperCase()}</p>
              </div>
              <div className="rounded-2xl bg-primary/5 p-4 border border-primary/10">
                <p className="text-xs uppercase tracking-[0.4em] text-secondary mb-3">Watermark</p>
                <p className="font-display text-lg">{event.watermarkText || '—'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-12">
            {favoritePhotos.length > 0 && (
              <section className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-secondary">Highlights</p>
                    <h2 className="text-2xl font-display font-semibold mt-1">Client favorites</h2>
                  </div>
                  <p className="text-sm text-secondary">{favoritePhotos.length} curated selects</p>
                </div>
                <div className="columns-1 sm:columns-2 lg:columns-3 gap-5">
                  {favoritePhotos.map((photo) => renderPhotoCard(photo))}
                </div>
              </section>
            )}

            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-secondary">
                    {favoritePhotos.length ? 'Full set' : 'Gallery'}
                  </p>
                  <h2 className="text-2xl font-display font-semibold mt-1">Every moment</h2>
                </div>
                <p className="text-sm text-secondary">{eventPhotos.length} total frames</p>
              </div>
              {eventPhotos.length === 0 ? (
                <div className="text-center py-16 rounded-3xl border border-dashed border-primary/20">
                  <p className="text-secondary">No photos uploaded to this event yet.</p>
                </div>
              ) : (
                <div className="columns-1 sm:columns-2 lg:columns-3 gap-5">
                  {(favoritePhotos.length ? otherPhotos : eventPhotos).map((photo) => renderPhotoCard(photo))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Lightbox Overlay - Always Dark */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
            {/* Controls */}
            <button 
                onClick={closeLightbox} 
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all z-20"
            >
                <X className="w-6 h-6" />
            </button>

            {/* Navigation Left */}
            <button 
                onClick={prevPhoto}
                disabled={lightboxIndex === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white/10 rounded-full disabled:opacity-30 disabled:hover:bg-transparent transition-all z-20"
            >
                <ChevronLeft className="w-8 h-8" />
            </button>

            {/* Main Image */}
            <div className="w-full h-full p-4 md:p-12 flex flex-col items-center justify-center relative">
                <div className="relative max-w-full max-h-[85vh]">
                    <img 
                        src={eventPhotos[lightboxIndex].url} 
                        alt="Lightbox view" 
                        className="max-w-full max-h-[85vh] object-contain shadow-2xl rounded-sm"
                    />
                    {event.watermarkText && (
                        <div className="absolute bottom-4 right-4 text-sm text-white/50 font-bold pointer-events-none select-none drop-shadow-lg">
                            {event.watermarkText}
                        </div>
                    )}
                </div>
                 {/* Caption & Info */}
                <div className="mt-4 flex items-center gap-4 text-center">
                   {eventPhotos[lightboxIndex].caption ? (
                        <p className="text-white/90 text-sm font-medium bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">
                            {eventPhotos[lightboxIndex].caption}
                        </p>
                   ) : null}
                    <button
                        onClick={() => handleFavoriteToggle(eventPhotos[lightboxIndex])}
                        className={`flex items-center gap-2 text-xs border px-3 py-1.5 rounded-full transition-colors ${
                          eventPhotos[lightboxIndex].isFavorite
                            ? 'border-rose-400 bg-rose-500/20 text-rose-100'
                            : 'border-white/10 text-gray-300 hover:text-white'
                        }`}
                    >
                        <Heart className="w-3 h-3" fill={eventPhotos[lightboxIndex].isFavorite ? 'currentColor' : 'none'} />
                        {eventPhotos[lightboxIndex].isFavorite ? 'Favorited' : 'Favorite'}
                    </button>
                    <a 
                        href={eventPhotos[lightboxIndex].url} 
                        download={`photo-${event.slug}-${lightboxIndex}.jpg`}
                        className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors border border-white/10 px-3 py-1.5 rounded-full"
                    >
                        <Download className="w-3 h-3" />
                        Download
                    </a>
                </div>
            </div>

            {/* Navigation Right */}
             <button 
                onClick={nextPhoto}
                disabled={lightboxIndex === eventPhotos.length - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white/10 rounded-full disabled:opacity-30 disabled:hover:bg-transparent transition-all z-20"
            >
                <ChevronRight className="w-8 h-8" />
            </button>
        </div>
      )}
    </div>
  );
};