import React from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../App';
import { Calendar, ArrowRight, Image as ImageIcon, Sparkles, Star, Camera } from 'lucide-react';

export const Home: React.FC = () => {
  const { events, photos, loading } = useAppStore();
  const totalFavorites = photos.filter((p) => p.isFavorite).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent" />
      </div>
    );
  }

  const getCoverPhoto = (event: any) => {
    if (event.coverPhotoId) {
      return photos.find((p) => p.id === event.coverPhotoId)?.url;
    }
    return photos.find((p) => p.eventId === event.id)?.url;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      <section className="grid lg:grid-cols-[1.2fr_0.8fr] gap-10 items-center aurora-wrap">
        <div className="space-y-6">
          <p className="text-xs uppercase tracking-[0.5em] text-accent flex items-center gap-2">
            <span className="h-px w-8 bg-accent/50" />
            LUMINA ARCHIVES
          </p>
          <h1 className="hero-title text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight">
            Timeless stories told through modern editorial imagery.
          </h1>
          <p className="text-lg text-secondary max-w-2xl">
            We craft immersive galleries for weddings, brand launches, and bespoke celebrations—delivered
            as curated experiences your clients can relive forever.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to={events.length ? `/event/${events[0].slug}` : '#'}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-background text-sm font-semibold shadow-lg shadow-primary/20"
            >
              Browse Galleries <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="mailto:hello@lumina.studio"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-primary/10 text-sm font-semibold"
            >
              Request a Collection <Sparkles className="w-4 h-4 text-accent" />
            </a>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="glass-panel py-4 rounded-2xl">
              <p className="text-3xl font-display font-semibold">{events.length}</p>
              <p className="text-xs uppercase tracking-wider text-secondary">Events</p>
            </div>
            <div className="glass-panel py-4 rounded-2xl">
              <p className="text-3xl font-display font-semibold">{photos.length}</p>
              <p className="text-xs uppercase tracking-wider text-secondary">Photographs</p>
            </div>
            <div className="glass-panel py-4 rounded-2xl">
              <p className="text-3xl font-display font-semibold">{totalFavorites}</p>
              <p className="text-xs uppercase tracking-wider text-secondary">Client Picks</p>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-6 relative overflow-hidden grid-fade">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-emerald-300/10" />
          <div className="relative space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-accent/20 text-accent flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-secondary">Signature style</p>
                <p className="font-display text-xl">Editorial x Documentary</p>
              </div>
            </div>
            <div className="space-y-4 text-sm text-secondary">
              <p>
                From editorial portraits to cinematic reportage, our collections are designed to feel
                tactile, luminous, and deeply personal.
              </p>
              <div className="flex items-center gap-2 text-primary font-medium">
                <Star className="w-4 h-4 text-yellow-400" />
                4.9 / 5 client experience rating
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="events" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-secondary">Recent Work</p>
            <h2 className="text-3xl font-display font-semibold mt-2">Featured collections</h2>
          </div>
          <p className="text-secondary text-sm max-w-xl">
            Each gallery is delivered in high-resolution with built-in favorite tools for your couples and
            collaborators.
          </p>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-20 glass-panel rounded-3xl">
            <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-5">
              <ImageIcon className="w-8 h-8 text-secondary" />
            </div>
            <p className="text-secondary">No events published yet. Once you add an event it will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {events.map((event) => {
              const coverUrl = getCoverPhoto(event);
              return (
                <Link
                  key={event.id}
                  to={`/event/${event.slug}`}
                  className="rounded-3xl overflow-hidden group relative border border-primary/10 hover:border-accent/40 transition-all duration-500"
                >
                  <div className="relative aspect-[5/3] overflow-hidden">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/5">
                        <ImageIcon className="w-10 h-10 text-primary/10" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute top-4 left-4 inline-flex items-center gap-2 text-xs font-semibold text-white/90 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full">
                      <Calendar className="w-3.5 h-3.5" />
                      {event.date}
                    </div>
                  </div>
                  <div className="p-6 space-y-3 bg-surface">
                    <h3 className="text-2xl font-display font-semibold group-hover:text-accent transition-colors">
                      {event.title}
                    </h3>
                    {event.description && (
                      <p className="text-secondary text-sm leading-relaxed line-clamp-2">{event.description}</p>
                    )}
                    <div className="flex items-center text-sm font-medium text-primary/80">
                      View gallery
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};