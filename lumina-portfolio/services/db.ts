import { Event, Photo } from '../types';

const DEFAULT_API_URL = import.meta.env.DEV ? 'http://localhost:8000/api' : '/api';
export const API_URL = import.meta.env.VITE_API_URL ?? DEFAULT_API_URL;
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? 'admin';

const adminHeaders: HeadersInit = {
  'x-admin-password': ADMIN_PASSWORD,
};

const toJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || response.statusText);
  }
  return response.json() as Promise<T>;
};

type EventPayload = Omit<Event, 'id' | 'createdAt' | 'coverPhotoId'>;

const withAssetUrl = (photo: Photo): Photo => ({
  ...photo,
  url: photo.url.startsWith('http') ? photo.url : `${API_ORIGIN}${photo.url}`,
});

export const getEvents = async (): Promise<Event[]> => {
  const res = await fetch(`${API_URL}/events`);
  return toJson<Event[]>(res);
};

export const saveEvent = async (payload: EventPayload): Promise<Event> => {
  const res = await fetch(`${API_URL}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...adminHeaders,
    },
    body: JSON.stringify(payload),
  });
  return toJson<Event>(res);
};

export const removeEvent = async (id: string): Promise<void> => {
  const res = await fetch(`${API_URL}/events/${id}`, {
    method: 'DELETE',
    headers: adminHeaders,
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || 'Failed to delete event');
  }
};

export const getPhotosByEvent = async (slug: string): Promise<Photo[]> => {
  const res = await fetch(`${API_URL}/events/${slug}/photos`);
  const photos = await toJson<Photo[]>(res);
  return photos.map(withAssetUrl);
};

export const getAllPhotos = async (): Promise<Photo[]> => {
  const res = await fetch(`${API_URL}/photos`);
  const photos = await toJson<Photo[]>(res);
  return photos.map(withAssetUrl);
};

export const savePhoto = async (eventId: string, file: File): Promise<Photo> => {
  const formData = new FormData();
  formData.append('files', file);

  const res = await fetch(`${API_URL}/events/${eventId}/photos`, {
    method: 'POST',
    headers: {
      ...adminHeaders,
    },
    body: formData,
  });
  const photos = await toJson<Photo[]>(res);
  if (!photos.length) {
    throw new Error('Upload succeeded but no photo record was returned');
  }
  return withAssetUrl(photos[0]);
};

export const deletePhoto = async (id: string): Promise<void> => {
  const res = await fetch(`${API_URL}/photos/${id}`, {
    method: 'DELETE',
    headers: adminHeaders,
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || 'Failed to delete photo');
  }
};

export const deletePhotos = async (ids: string[]): Promise<void> => {
  for (const id of ids) {
    await deletePhoto(id);
  }
};

export const updatePhoto = async (photoId: string, caption: string): Promise<Photo> => {
  const res = await fetch(`${API_URL}/photos/${photoId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...adminHeaders,
    },
    body: JSON.stringify({ caption }),
  });
  const photo = await toJson<Photo>(res);
  return withAssetUrl(photo);
};

export const setEventCoverPhoto = async (eventId: string, photoId: string): Promise<Event> => {
  const res = await fetch(`${API_URL}/events/${eventId}/cover`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...adminHeaders,
    },
    body: JSON.stringify({ photoId }),
  });
  return toJson<Event>(res);
};

export const setPhotoFavorite = async (photoId: string, isFavorite: boolean): Promise<Photo> => {
  const res = await fetch(`${API_URL}/photos/${photoId}/favorite`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isFavorite }),
  });
  const photo = await toJson<Photo>(res);
  return withAssetUrl(photo);
};