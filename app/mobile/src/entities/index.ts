export type Language = 'en' | 'de' | 'fr' | 'es' | 'ru';

export interface User {
  id: string;
  email?: string;
  provider?: 'apple' | 'google' | 'email';
  language: Language;
  country?: string;
  createdAt: string;
  premium: boolean;
}

export interface Pregnancy {
  id: string;
  userId: string;
  lmpDate?: string;   // last menstrual period
  edd?: string;       // estimated due date
  isFirstPregnancy: boolean;
  week: number;       // derived
  day: number;        // derived
  prePregnancyWeight?: number; // кг - вес до беременности для расчета ИМТ
  height?: number;    // см - рост для расчета ИМТ
}

export interface Tip {
  id: string;
  week: number;
  textKey: string; // i18n key
  category: 'nutrition' | 'exercise' | 'sleep' | 'mental';
}

export interface JournalEntry {
  id: string;
  userId: string;
  date: string;
  text?: string;
  photos?: string[];
  mood?: 'low' | 'neutral' | 'good' | 'great';
  weightKg?: number;
  symptoms?: string[];
}

export interface Achievement {
  id: string;
  code: string; // "STREAK_7"
  titleKey: string;
  unlockedAt: string;
}

export interface Group {
  id: string;
  week: number;
  region: string; // 'EU', 'US', etc.
  name: string;
}

export interface Message {
  id: string;
  groupId?: string;  // null => AI DM
  author: 'user' | 'ai' | 'moderator';
  text: string;
  createdAt: string;
  meta?: Record<string, any>;
}
