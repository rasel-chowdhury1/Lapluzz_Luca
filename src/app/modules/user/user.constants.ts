export const USER_ROLE = {
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
  USER: 'user',
  ORGANIZER: 'organizer',
} as const;

export enum Login_With {
  google = 'google',
  apple = 'apple',
  facebook = 'facebook',
  credentials = 'credentials',
}

export const gender = ['Male', 'Female', 'Others'] as const;
export const Role = Object.values(USER_ROLE);
