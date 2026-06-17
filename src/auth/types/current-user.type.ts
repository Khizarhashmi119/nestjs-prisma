import { UserRole } from '../../generated/prisma/enums';

export type TCurrentUser<TUserSessionId extends string | null = string> = {
  id: string;
  email: string;
  role: UserRole;
  userSessionId: TUserSessionId;
};
