import { JwtPayload } from 'jsonwebtoken';

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  role: string;
  email: string;
}

export interface RefreshTokenPayload extends JwtPayload {
  sub: string;
  tokenId: string;
}

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        id: string;
        email: string;
        role: string;
      };
      tokenId?: string;
    }
  }
}
