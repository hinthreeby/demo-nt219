import { FilterQuery } from 'mongoose';
import { UserModel, UserDocument, UserRole, IUser } from '../models/user.model';
import { hashPassword, comparePassword } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import type { RefreshTokenPayload } from '../types';
import logger from '../utils/logger';

export interface RegisterInput {
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

const sanitizeUser = (user: UserDocument) => {
  const { password: _password, refreshTokenHash: _refresh, ...safeUser } = user.toObject();
  return safeUser;
};

/**
 * Persist refresh token hash to user document
 * Used for token rotation and invalidation
 */
export const persistRefreshToken = async (user: UserDocument, refreshToken: string, tokenId: string): Promise<void> => {
  user.refreshTokenHash = await hashPassword(refreshToken);
  await user.save();
  logger.debug({ userId: user.id, tokenId }, 'Refresh token rotated');
};

export const registerUser = async (input: RegisterInput) => {
  const existing = await UserModel.findOne({ email: input.email } as FilterQuery<IUser>);
  if (existing) {
    throw new Error('Email already registered');
  }

  const user = new UserModel({
    email: input.email,
    password: input.password,
    role: input.role ?? 'user'
  });

  await user.save();

  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const { token: refreshToken, tokenId } = signRefreshToken({ sub: user.id });
  await persistRefreshToken(user, refreshToken, tokenId);

  return {
    user: sanitizeUser(user),
    tokens: {
      accessToken,
      refreshToken
    }
  };
};

export const loginUser = async (input: LoginInput) => {
  const user = await UserModel.findOne({ email: input.email } as FilterQuery<IUser>).select('+password +refreshTokenHash');
  if (!user || !(await user.comparePassword(input.password))) {
    throw new Error('Invalid credentials');
  }

  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const { token: refreshToken, tokenId } = signRefreshToken({ sub: user.id });
  await persistRefreshToken(user, refreshToken, tokenId);

  return {
    user: sanitizeUser(user),
    tokens: {
      accessToken,
      refreshToken
    }
  };
};

export const refreshTokens = async (refreshToken: string) => {
  const payload = verifyRefreshToken(refreshToken) as RefreshTokenPayload;
  const user = await UserModel.findById(payload.sub).select('+refreshTokenHash');
  if (!user || !user.refreshTokenHash) {
    throw new Error('Invalid refresh token');
  }

  const isValid = await comparePassword(refreshToken, user.refreshTokenHash);
  if (!isValid) {
    throw new Error('Invalid refresh token');
  }

  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const { token: rotatedRefreshToken, tokenId } = signRefreshToken({ sub: user.id, tokenId: payload.tokenId });
  await persistRefreshToken(user, rotatedRefreshToken, tokenId);

  return {
    user: sanitizeUser(user),
    tokens: {
      accessToken,
      refreshToken: rotatedRefreshToken
    }
  };
};

export const logoutUser = async (userId: string) => {
  await UserModel.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: '' } });
};
