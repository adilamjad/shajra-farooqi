import { Person } from '../types';

const DB_NAME = 'shajra_db';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';
const TREE_KEY = 'shajra_family_tree';

export interface ServerTreeResponse {
  initialized: boolean;
  people: Person[] | null;
  pinnedPersonId: string | null;
  updatedAt?: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Fetches the shared family tree from the backend server (/api/tree).
 * Returns null if the server API is unreachable (e.g. offline static mode).
 */
export async function fetchFamilyTreeFromServer(): Promise<ServerTreeResponse | null> {
  try {
    const res = await fetch('/api/tree', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && typeof data === 'object' && 'initialized' in data) {
      return data as ServerTreeResponse;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Saves the shared family tree and pinnedPersonId to the backend server (/api/tree).
 */
export async function saveFamilyTreeToServer(
  people: Person[],
  pinnedPersonId: string | null
): Promise<boolean> {
  try {
    const res = await fetch('/api/tree', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ people, pinnedPersonId })
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Loads family tree from local IndexedDB cache
 */
export async function loadFamilyTreeFromDB(): Promise<Person[] | null> {
  try {
    const db = await openDB();
    return await new Promise<Person[] | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(TREE_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/**
 * Saves family tree to local IndexedDB and localStorage cache
 */
export async function saveFamilyTreeToDB(people: Person[]): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(people, TREE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Fallback if IndexedDB fails
  }

  try {
    localStorage.setItem(TREE_KEY, JSON.stringify(people));
  } catch {
    // Ignore localStorage quota exceeded
  }
}

/**
 * Compresses an uploaded image file to a reasonable resolution and JPEG quality
 * so galleries stay snappy and responsive.
 */
export function compressImageFile(
  file: File,
  maxWidth = 1400,
  maxHeight = 1400,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
