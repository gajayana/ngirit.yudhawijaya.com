export const ROLE = {
  SUPERADMIN: 'superadmin',
  MANAGER: 'manager',
  USER: 'user',
} as const;

export type Role = (typeof ROLE)[keyof typeof ROLE];

export default ROLE;
