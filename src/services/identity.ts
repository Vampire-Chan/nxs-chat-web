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
