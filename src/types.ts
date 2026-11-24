export interface CustomField {
  label: string;
  value: string;
}

export interface PersonalPageSection {
  id: string;
  title: string;
  content: string;
}

export interface GalleryPhoto {
  id: string;
  url: string;
  caption?: string;
  date?: string;
  location?: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description?: string;
  location?: string;
}

export interface PersonalPageData {
  coverPhotoUrl?: string;
  tagline?: string;
  sections?: PersonalPageSection[];
  gallery?: GalleryPhoto[];
  timeline?: TimelineEvent[];
}

export type Gender = 'male' | 'female' | 'other';

export interface Person {
  id: string;
  name: string;
  arabicName?: string;
  maidenName?: string;
  gender: Gender;
  birthDate?: string; // YYYY-MM-DD
  deathDate?: string; // YYYY-MM-DD
  isDeceased: boolean;
  isPinned?: boolean;
  photoUrl?: string; // base64 DataURL or URL
  photoFit?: 'cover' | 'fill' | 'contain'; // cover (zoomed) or fill (stretched)
  fatherId?: string;
  motherId?: string;
  spouseId?: string; // primary spouse
  birthPlace?: string;
  occupation?: string;
  bio?: string;
  customFields?: CustomField[];
  personalPage?: PersonalPageData;
}

export type TreeViewMode = 'all' | 'male-only' | 'female-only' | 'couples-only';
