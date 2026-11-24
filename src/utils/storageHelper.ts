import { Person } from '../types';

const DB_NAME = 'shajra_db';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';
const TREE_KEY = 'shajra_family_tree';
export const AUTH_TOKEN_KEY = 'shajra_auth_token';

export interface ServerTreeResponse {
  initialized: boolean;
  people: Person[] | null;
  pinnedPersonId: string | null;
  updatedAt?: string;
}

export interface AuthUserResponse {
  username: string;
  role: 'admin' | 'viewer';
  isDefaultViewer?: boolean;
  accountsInfo?: {
    adminUsername: string;
    viewerUsername: string;
  };
}

export function getStoredAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

/**
 * Queries current user role from server (/api/auth/me).
 * Defaults to viewer mode if unauthenticated or offline.
 */
export async function fetchCurrentUser(): Promise<AuthUserResponse> {
  const token = getStoredAuthToken();
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch('/api/auth/me', {
      method: 'GET',
      headers,
      cache: 'no-store'
    });
    if (res.ok) {
      return (await res.json()) as AuthUserResponse;
    }
  } catch {
    // Fallback for offline/local dev without backend
  }
  return { username: 'viewer', role: 'viewer', isDefaultViewer: true };
}

/**
 * Logs in with username & password (/api/auth/login)
 */
export async function loginWithCredentials(
  username: string,
  password: string
): Promise<{
  ok: boolean;
  username?: string;
  role?: 'admin' | 'viewer';
  token?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.error || 'Invalid username or password' };
    }
    if (data.token) {
      setStoredAuthToken(data.token);
    }
    return {
      ok: true,
      username: data.username,
      role: data.role,
      token: data.token
    };
  } catch {
    // Offline fallback if server is not running
    if (username.trim().toLowerCase() === 'admin' && password === 'admin123') {
      return { ok: true, username: 'admin', role: 'admin', token: 'local-admin' };
    }
    if (username.trim().toLowerCase() === 'viewer' && password === 'viewer123') {
      return { ok: true, username: 'viewer', role: 'viewer', token: 'local-viewer' };
    }
    return { ok: false, error: 'Unable to reach authentication server' };
  }
}

/**
 * Updates Admin or Viewer credentials (/api/auth/update-credentials)
 */
export async function updateAccountCredentials(
  targetRole: 'admin' | 'viewer',
  newUsername: string,
  newPassword: string
): Promise<{
  ok: boolean;
  message?: string;
  error?: string;
  accountsInfo?: { adminUsername: string; viewerUsername: string };
}> {
  const token = getStoredAuthToken();
  try {
    const res = await fetch('/api/auth/update-credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ targetRole, newUsername, newPassword })
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.error || 'Failed to update credentials' };
    }
    if (data.token) {
      setStoredAuthToken(data.token);
    }
    return {
      ok: true,
      message: data.message,
      accountsInfo: data.accountsInfo
    };
  } catch {
    return { ok: false, error: 'Unable to reach server to update credentials' };
  }
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
 * Includes the Admin Bearer token.
 */
export async function saveFamilyTreeToServer(
  people: Person[],
  pinnedPersonId: string | null
): Promise<boolean> {
  const token = getStoredAuthToken();
  try {
    const res = await fetch('/api/tree', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
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
