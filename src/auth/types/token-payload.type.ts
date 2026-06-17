export type TokenPayload = {
  sub: string;
  sessionId: string;
  type: 'access' | 'refresh';
};
