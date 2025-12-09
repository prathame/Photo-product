import React, { useState, useRef, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '../App';
import { Plus, Trash2, Upload, ExternalLink, Sparkles, AlertTriangle, Copyright, Star, CheckSquare, Square } from 'lucide-react';
import { generateEventDescription } from '../services/geminiService';
import { Event, UploadProgress } from '../types';

const ADMIN_PASSCODE = 'admin';

// --- Components for Admin Section ---

const Login: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pass === ADMIN_PASSCODE) {
      onLogin();
    } else {
      setError('Invalid passcode');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md bg-surface p-8 rounded-2xl border border-primary/10 shadow-2xl">
        <h2 className="text-2xl font-bold text-primary mb-6 text-center">Photographer Access</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Passcode</label>
            <input 
              type="password" 
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full bg-background border border-primary/10 rounded-lg px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
              placeholder="Enter 'admin'"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="w-full bg-primary text-background font-bold py-3 rounded-lg hover:opacity-90 transition-opacity">
            Unlock Dashboard
          </button>
        </form>
      </div>
    </div>

  );
};

const Dashboard: React.FC = () => {
  const { events, deleteEvent } = useAppStore();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      <div className="glass-panel rounded-3xl p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-secondary">Studio Control</p>
          <h1 className="text-3xl font-display font-semibold mt-3">Manage your collections</h1>
          <p className="text-secondary text-sm mt-2">
            Create new events, upload galleries, and deliver polished experiences to your clients.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-primary text-background text-sm font-semibold shadow-lg shadow-primary/30"
        >
          <Plus className="w-4 h-4" /> New Event
        </button>
      </div>

      {showCreate && <CreateEventModal onClose={() => setShowCreate(false)} />}

      <div className="glass-panel rounded-3xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="text-secondary text-xs uppercase tracking-[0.4em]">
            <tr>
              <th className="px-6 py-4">Event</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Slug</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/10">
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-primary/5 transition-colors">
                <td className="px-6 py-5">
                  <p className="font-medium text-primary">{event.title}</p>
                  <p className="text-xs text-secondary">{event.description?.slice(0, 60)}</p>
                </td>
                <td className="px-6 py-5 text-secondary">{event.date}</td>
                <td className="px-6 py-5 text-secondary font-mono text-sm">/event/{event.slug}</td>
                <td className="px-6 py-5">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      to={`/event/${event.slug}`}
                      target="_blank"
                      className="p-2 rounded-xl text-secondary hover:text-primary hover:bg-primary/5 transition-colors"
                      title="View Public Page"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <Link to={`edit/${event.id}`} className="text-sm font-semibold text-accent hover:underline">
                      Manage
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm('Delete event?')) deleteEvent(event.id);
                      }}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-secondary">
                  No events found. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CreateEventModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { addEvent } = useAppStore();
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    watermarkText: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setFormData(prev => ({ ...prev, title, slug }));
  };

  const handleAI = async () => {
    if (!formData.title) return;
    setIsGenerating(true);
    const desc = await generateEventDescription(formData.title, formData.date);
    if (desc) {
      setFormData(prev => ({ ...prev, description: desc }));
    }
    setIsGenerating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addEvent(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-secondary">New Collection</p>
            <h2 className="text-2xl font-display font-semibold mt-2">Create event</h2>
          </div>
          <button onClick={onClose} type="button" className="text-secondary hover:text-primary text-sm">
            Close
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-secondary mb-1 uppercase">Event Title</label>
            <input 
              required
              type="text" 
              value={formData.title}
              onChange={handleTitleChange}
              className="w-full bg-background border border-primary/10 rounded-lg px-3 py-2 text-primary focus:outline-none focus:border-accent"
              placeholder="e.g. Smith Wedding"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-medium text-secondary mb-1 uppercase">Date</label>
                <input 
                  required
                  type="date" 
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full bg-background border border-primary/10 rounded-lg px-3 py-2 text-primary focus:outline-none focus:border-accent"
                />
             </div>
             <div>
                <label className="block text-xs font-medium text-secondary mb-1 uppercase">URL Slug</label>
                <input 
                  required
                  type="text" 
                  value={formData.slug}
                  onChange={e => setFormData({...formData, slug: e.target.value})}
                  className="w-full bg-background border border-primary/10 rounded-lg px-3 py-2 text-secondary focus:outline-none focus:border-accent"
                />
             </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary mb-1 uppercase">Watermark Text (Optional)</label>
            <div className="relative">
                <input 
                  type="text" 
                  value={formData.watermarkText}
                  onChange={e => setFormData({...formData, watermarkText: e.target.value})}
                  className="w-full bg-background border border-primary/10 rounded-lg px-3 py-2 pl-9 text-primary focus:outline-none focus:border-accent"
                  placeholder="e.g. © Lumina Photography"
                />
                <Copyright className="w-4 h-4 text-secondary absolute left-3 top-2.5" />
            </div>
            <p className="text-[10px] text-secondary mt-1">This text will be overlayed on all photos in this gallery.</p>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
                 <label className="block text-xs font-medium text-secondary uppercase">Description</label>
                 <button 
                   type="button" 
                   onClick={handleAI}
                   disabled={isGenerating || !formData.title}
                   className="text-xs text-accent flex items-center gap-1 hover:text-primary transition-colors disabled:opacity-50"
                 >
                   <Sparkles className="w-3 h-3" />
                   {isGenerating ? 'Thinking...' : 'AI Write'}
                 </button>
            </div>
            <textarea 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full bg-background border border-primary/10 rounded-lg px-3 py-2 text-primary focus:outline-none focus:border-accent h-24 resize-none"
              placeholder="Optional description..."
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-secondary hover:text-primary">
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-primary text-background font-semibold hover:opacity-90"
            >
              Create Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EventManager: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { events, photos, addPhotos, deletePhoto, deletePhotos, setCoverPhoto } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const event = events.find(e => e.id === id);
  const eventPhotos = photos.filter(p => p.eventId === id);

  useEffect(() => {
    setSelectedPhotoIds(prev => {
      const valid = new Set(eventPhotos.map(photo => photo.id));
      const next = new Set<string>();
      prev.forEach(id => {
        if (valid.has(id)) next.add(id);
      });
      return next;
    });
  }, [eventPhotos]);

  const selectionCount = selectedPhotoIds.size;
  const hasSelection = selectionCount > 0;
  const allSelected = eventPhotos.length > 0 && selectionCount === eventPhotos.length;

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotoIds(prev => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  };

  const handleSelectAllToggle = () => {
    if (allSelected) {
      setSelectedPhotoIds(new Set());
      return;
    }
    setSelectedPhotoIds(new Set(eventPhotos.map(photo => photo.id)));
  };

  const handleDeleteSelected = async () => {
    if (!hasSelection) return;
    const message = `Delete ${selectionCount} selected photo${selectionCount > 1 ? 's' : ''}? This cannot be undone.`;
    if (!confirm(message)) return;
    setIsBulkDeleting(true);
    try {
      await deletePhotos(Array.from(selectedPhotoIds));
      setSelectedPhotoIds(new Set());
    } catch (error) {
      console.error('Failed to delete selected photos', error);
      alert('Failed to delete selected photos. Please try again.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!eventPhotos.length) return;
    const message = `Delete all ${eventPhotos.length} photo${eventPhotos.length > 1 ? 's' : ''} in this event? This cannot be undone.`;
    if (!confirm(message)) return;
    setIsBulkDeleting(true);
    try {
      await deletePhotos(eventPhotos.map(photo => photo.id));
      setSelectedPhotoIds(new Set());
    } catch (error) {
      console.error('Failed to delete all photos', error);
      alert('Failed to delete photos. Please try again.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleDeleteSingle = async (photoId: string) => {
    if (!confirm('Delete this photo? This cannot be undone.')) return;
    try {
      await deletePhoto(photoId);
      setSelectedPhotoIds(prev => {
        if (!prev.has(photoId)) return prev;
        const next = new Set(prev);
        next.delete(photoId);
        return next;
      });
    } catch (error) {
      console.error('Failed to delete photo', error);
      alert('Failed to delete photo. Please try again.');
    }
  };

  if (!event) return <div>Event not found</div>;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    if (!selectedFiles.length) return;

    setIsUploading(true);
    try {
       await addPhotos(event.id, selectedFiles, (progress) => {
         setUploadStatus(progress);
       });
    } catch (error) {
       console.error('Failed to upload photos', error);
       alert('Upload failed. Please try again.');
    } finally {
       setIsUploading(false);
       setUploadStatus(null);
       if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      <Link to="/admin" className="inline-flex items-center gap-2 text-secondary hover:text-primary text-sm">
        &larr; Back to dashboard
      </Link>

      <div className="glass-panel rounded-3xl p-8 grid gap-8 md:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-secondary">Managing</p>
          <h1 className="text-3xl font-display font-semibold">{event.title}</h1>
          <p className="text-secondary text-sm">/event/{event.slug}</p>
          {event.watermarkText && (
            <p className="text-xs text-accent mt-2 flex items-center gap-1">
              <Copyright className="w-3 h-3" /> Watermark: {event.watermarkText}
            </p>
          )}
        </div>
        <div className="glass-panel rounded-2xl p-4 space-y-3 border border-primary/10">
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary text-background px-4 py-3 rounded-2xl font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Upload className="w-4 h-4 animate-pulse" /> Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" /> Upload photos
              </>
            )}
          </button>
          {uploadStatus && <UploadProgressCard status={uploadStatus} />}
        </div>
      </div>

      {eventPhotos.length > 0 && (
        <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-center gap-3">
          <p className="text-sm text-secondary">
            {hasSelection ? `${selectionCount} photo${selectionCount > 1 ? 's' : ''} selected` : 'No photos selected'}
          </p>
          <div className="flex flex-wrap gap-2 ml-auto">
            <button
              type="button"
              onClick={handleSelectAllToggle}
              className="flex items-center gap-1 px-4 py-2 text-sm rounded-xl border border-primary/20 text-secondary hover:border-accent/50 hover:text-primary transition-colors"
            >
              {allSelected ? (
                <>
                  <Square className="w-4 h-4" />
                  Clear
                </>
              ) : (
                <>
                  <CheckSquare className="w-4 h-4" />
                  Select all
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={!hasSelection || isBulkDeleting}
              className="flex items-center gap-1 px-4 py-2 text-sm rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {isBulkDeleting && hasSelection ? 'Deleting...' : 'Delete selected'}
            </button>
            <button
              type="button"
              onClick={handleDeleteAll}
              disabled={isBulkDeleting}
              className="flex items-center gap-1 px-4 py-2 text-sm rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {isBulkDeleting && !hasSelection ? 'Deleting...' : 'Delete all'}
            </button>
          </div>
        </div>
      )}

      {eventPhotos.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center rounded-3xl border border-dashed border-primary/20 bg-primary/5 text-center space-y-4">
          <Upload className="w-12 h-12 text-secondary" />
          <div>
            <p className="text-secondary font-medium">No photos yet.</p>
            <p className="text-sm text-secondary/80">Use the uploader above to add your first gallery.</p>
          </div>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5">
          {eventPhotos.map(photo => {
            const isSelected = selectedPhotoIds.has(photo.id);
            return (
              <div key={photo.id} className="mb-4 break-inside-avoid">
                <div
                  className={`group relative rounded-2xl overflow-hidden border border-primary/10 bg-surface transition ring-offset-2 ${
                    isSelected ? 'ring-2 ring-accent' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => togglePhotoSelection(photo.id)}
                    className={`absolute top-3 left-3 z-20 p-1.5 rounded-md border text-white transition ${
                      isSelected
                        ? 'bg-accent border-accent'
                        : 'bg-black/40 border-white/20 hover:border-accent/70'
                    }`}
                    title={isSelected ? 'Deselect photo' : 'Select photo'}
                  >
                    {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </button>
                  <img src={photo.url} className="w-full h-auto object-cover block" loading="lazy" />
                  {event.watermarkText && (
                    <div className="absolute bottom-2 right-3 text-[10px] text-white/60 font-bold pointer-events-none select-none drop-shadow-md">
                      {event.watermarkText}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                    <button
                      onClick={() => setCoverPhoto(event.id, photo.id)}
                      disabled={event.coverPhotoId === photo.id}
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded backdrop-blur-md transition-colors ${
                        event.coverPhotoId === photo.id
                          ? 'bg-green-500/30 text-green-100 cursor-default'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      <Star className={`w-3 h-3 ${event.coverPhotoId === photo.id ? 'fill-current' : ''}`} />
                      {event.coverPhotoId === photo.id ? 'Cover Photo' : 'Set Cover'}
                    </button>
                    <button
                      onClick={() => handleDeleteSingle(photo.id)}
                      className="bg-red-500/20 hover:bg-red-500/40 text-red-500 p-2 rounded-full backdrop-blur-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {photo.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-[10px] text-gray-300 p-1 truncate text-center">
                      {photo.caption}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Footer warning for demo */}
      <div className="mt-12 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-3 text-blue-700 dark:text-blue-200/80 text-sm">
        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        <p>
          Galleries, files, and captions now sync with the FastAPI backend. Restart the server if you update admin credentials or move the uploads folder.
        </p>
      </div>
    </div>
  );
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const UploadProgressCard: React.FC<{ status: UploadProgress }> = ({ status }) => {
  const percent = Math.min((status.current / status.total) * 100, 100);
  return (
    <div className="text-xs text-secondary bg-primary/5 border border-primary/10 rounded-2xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span>Uploading {status.current}/{status.total}</span>
        <span className="truncate font-medium text-primary/80">{status.file.name}</span>
      </div>
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wide">
        <span>{formatBytes(status.uploadedBytes)} uploaded</span>
        <span>Total {formatBytes(status.totalBytes)}</span>
      </div>
      <div className="h-1.5 bg-primary/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/edit/:id" element={<EventManager />} />
    </Routes>
  );
};