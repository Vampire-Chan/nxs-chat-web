import type { IUser } from './api';

/**
 * Returns the preferred identity name.
 * Priority: Display Name -> Username.
 */
export const getIdentityName = (user: IUser | null | undefined): string => {
  if (!user) return 'Deleted_Node';
  return user.displayName || user.username || 'Unknown_Node';
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
 * Falls back to high-quality avataaars with gender-aware seeds.
 */
export const getIdentityAvatar = (user: IUser | null | undefined): string => {
  if (!user) return `https://api.dicebear.com/7.x/avataaars/svg?seed=system_node`;
  if (user.avatar && user.avatar.trim() !== '') return user.avatar;

  const username = user.username || 'node';
  const gender = user.gender || 'none';

  // Use high-quality avataaars for all, but differentiate seeds
  if (gender === 'male') {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}_male&hairColor=2c1b18`;
  } else if (gender === 'female') {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}_female&top[]=longHair`;
  } else {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
  }
};
