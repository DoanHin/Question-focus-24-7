import { Conversation, UserProfile } from '../types';

const CONVERSATIONS_STORAGE_KEY_PREFIX = 'qfocus_conversations_';
const USER_PROFILE_STORAGE_KEY = 'qfocus_user_profile';

export const GUEST_USER: UserProfile = {
  id: 'guest_user',
  name: 'Khách',
  email: 'guest@questionfocus.edu',
  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=qfocus_guest',
  isGuest: true,
};

export function getStoredUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load user profile from localStorage', e);
    return null;
  }
}

export function saveStoredUser(user: UserProfile | null): void {
  try {
    if (!user) {
      localStorage.removeItem(USER_PROFILE_STORAGE_KEY);
    } else {
      localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(user));
    }
  } catch (e) {
    console.error('Failed to save user profile to localStorage', e);
  }
}

export function getStoredConversations(userId: string): Conversation[] {
  try {
    const key = `${CONVERSATIONS_STORAGE_KEY_PREFIX}${userId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load conversations from localStorage', e);
    return [];
  }
}

export function saveStoredConversations(userId: string, conversations: Conversation[]): void {
  try {
    const key = `${CONVERSATIONS_STORAGE_KEY_PREFIX}${userId}`;
    localStorage.setItem(key, JSON.stringify(conversations));
  } catch (e) {
    console.error('Failed to save conversations to localStorage', e);
  }
}

export function generateTitleFromMessage(message: string): string {
  const clean = message.replace(/\n/g, ' ').trim();
  if (clean.length <= 32) return clean || 'Cuộc trò chuyện mới';
  return clean.substring(0, 30) + '...';
}
