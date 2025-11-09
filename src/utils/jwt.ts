import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { authConfig } from '../config/env';
import type { AccessTokenPayload, RefreshTokenPayload } from '../types';

export const signAccessToken = (payload: Omit<AccessTokenPayload, 'exp' | 'iat'>): string => {
  const secret: Secret = authConfig.accessToken.secret;
  const options: SignOptions = {
    expiresIn: authConfig.accessToken.expiresIn as SignOptions['expiresIn']
  };
  return jwt.sign(payload, secret, options);
};

interface RefreshPayloadInput {
  sub: string;
  tokenId?: string;
}

export const signRefreshToken = (payload: RefreshPayloadInput): { token: string; tokenId: string } => {
  const tokenId = payload.tokenId ?? uuid();
  const secret: Secret = authConfig.refreshToken.secret;
  const options: SignOptions = {
    expiresIn: authConfig.refreshToken.expiresIn as SignOptions['expiresIn']
  };
  const token = jwt.sign({ sub: payload.sub, tokenId }, secret, options);
  return { token, tokenId };
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const secret: Secret = authConfig.accessToken.secret;
  return jwt.verify(token, secret) as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  const secret: Secret = authConfig.refreshToken.secret;
  return jwt.verify(token, secret) as RefreshTokenPayload;
};
