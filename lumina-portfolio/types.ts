export interface Photo {
  id: string;
  eventId: string;
  eventSlug: string;
  filename: string;
  url: string;
  name: string;
  type?: string;
  size: number;
  width?: number;
  height?: number;
  caption?: string;
  uploadedAt: number;
  isFavorite: boolean;
}

export interface UploadProgress {
  current: number;
  total: number;
  file: File;
  uploadedBytes: number;
  totalBytes: number;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  date: string; // YYYY-MM-DD
  coverPhotoId?: string;
  description?: string;
  watermarkText?: string; // Text to overlay on photos
  createdAt: number;
}

export interface AppState {
  events: Event[];
  photos: Photo[];
  loading: boolean;
  refreshData: () => Promise<void>;
  addEvent: (event: Omit<Event, 'id' | 'createdAt'>) => Promise<Event>;
  deleteEvent: (id: string) => Promise<void>;
  addPhotos: (eventId: string, files: File[], onProgress?: (progress: UploadProgress) => void) => Promise<void>;
  deletePhoto: (photoId: string) => Promise<void>;
  deletePhotos: (photoIds: string[]) => Promise<void>;
  updatePhotoCaption: (photoId: string, caption: string) => Promise<void>;
  setCoverPhoto: (eventId: string, photoId: string) => Promise<void>;
  togglePhotoFavorite: (photoId: string, isFavorite: boolean) => Promise<void>;
}