import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { registerUser, loginUser, refreshTokens, logoutUser } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { authConfig, appConfig } from '../config/env';
import { durationToMs } from '../utils/time';
import logger from '../utils/logger';

const REFRESH_COOKIE_NAME = 'refreshToken';

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: appConfig.env === 'production',
    sameSite: 'strict',
    maxAge: durationToMs(authConfig.refreshToken.expiresIn)
  });
};

const clearRefreshCookie = (res: Response) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: appConfig.env === 'production',
    sameSite: 'strict'
  });
};

export const registerHandler = async (req: Request, res: Response) => {
  try {
    const result = await registerUser(req.body);
    setRefreshCookie(res, result.tokens.refreshToken);
    return sendSuccess(res, StatusCodes.CREATED, {
      user: result.user,
      tokens: {
        accessToken: result.tokens.accessToken
      }
    });
  } catch (error) {
    logger.warn({ err: error }, 'Registration failed');
    return sendError(res, StatusCodes.BAD_REQUEST, (error as Error).message);
  }
};

export const loginHandler = async (req: Request, res: Response) => {
  try {
    const result = await loginUser(req.body);
    setRefreshCookie(res, result.tokens.refreshToken);
    return sendSuccess(res, StatusCodes.OK, {
      user: result.user,
      tokens: {
        accessToken: result.tokens.accessToken
      }
    });
  } catch (error) {
    logger.warn({ err: error }, 'Login failed');
    return sendError(res, StatusCodes.UNAUTHORIZED, 'Invalid credentials');
  }
};

export const refreshHandler = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] ?? req.body?.refreshToken;
    if (!refreshToken) {
      return sendError(res, StatusCodes.UNAUTHORIZED, 'Refresh token missing');
    }

    const result = await refreshTokens(refreshToken);
    setRefreshCookie(res, result.tokens.refreshToken);

    return sendSuccess(res, StatusCodes.OK, {
      user: result.user,
      tokens: {
        accessToken: result.tokens.accessToken
      }
    });
  } catch (error) {
    logger.warn({ err: error }, 'Token refresh failed');
    clearRefreshCookie(res);
    return sendError(res, StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
  }
};

export const logoutHandler = async (req: Request, res: Response) => {
  if (!req.authUser) {
    return sendError(res, StatusCodes.UNAUTHORIZED, 'Not authenticated');
  }

  await logoutUser(req.authUser.id);
  clearRefreshCookie(res);
  return sendSuccess(res, StatusCodes.OK, { message: 'Logged out successfully' });
};

export const meHandler = (req: Request, res: Response) => {
  if (!req.authUser) {
    return sendError(res, StatusCodes.UNAUTHORIZED, 'Not authenticated');
  }

  return sendSuccess(res, StatusCodes.OK, { user: req.authUser });
};
