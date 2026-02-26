import type { IUser } from './api';

/**
 * Returns the preferred identity name.
 * Respects display name if provided, otherwise falls back to username.
 */
export const getIdentityName = (user: IUser | null | undefined): string => {
  if (!user) return 'Deleted_Node';
  if (user.displayName && user.displayName.trim() !== '') {
    return user.displayName;
  }
  return user.username;
};

/**
 * Calculates age based on DOB.
 * Returns null if DOB is not provided or age should not be shown.
 */
export const getIdentityAge = (user: IUser | null | undefined): number | null => {
  if (!user || !user.dob || !user.showAge) return null;
  
  const birthDate = new Date(user.dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Returns the identity avatar URL.
 * Falls back to gender-specific DiceBear collections if no avatar is set.
 */
export const getIdentityAvatar = (user: IUser | null | undefined): string => {
  if (!user) return `https://api.dicebear.com/7.x/bottts/svg?seed=deleted`;
  if (user.avatar && user.avatar.trim() !== '') return user.avatar;

  const username = user.username || 'anonymous';
  const gender = user.gender || 'none';

  // Cyberpunk-themed gendered fallbacks
  if (gender === 'male') {
    return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`;
  } else if (gender === 'female') {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
  } else {
    return `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`;
  }
};
