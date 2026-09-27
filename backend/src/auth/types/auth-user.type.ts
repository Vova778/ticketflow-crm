import { UserRole } from '../../generated/prisma/client';

export type AuthUser = {
  id: number;
  email: string;
  role: UserRole;
};
