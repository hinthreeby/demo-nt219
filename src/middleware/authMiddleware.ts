import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { verifyAccessToken } from '../utils/jwt';
import { sendError } from '../utils/apiResponse';
import { UserModel, UserRole } from '../models/user.model';
import logger from '../utils/logger';

const getTokenFromHeader = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }
  return token;
};

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const token = getTokenFromHeader(req);
    if (!token) {
      return sendError(res, StatusCodes.UNAUTHORIZED, 'Authentication token missing');
    }

    const payload = verifyAccessToken(token);

    const user = await UserModel.findById(payload.sub).select('email role');
    if (!user) {
      return sendError(res, StatusCodes.UNAUTHORIZED, 'User not found');
    }

    req.authUser = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    return next();
  } catch (error) {
    logger.warn({ err: error }, 'Failed to authenticate request');
    return sendError(res, StatusCodes.UNAUTHORIZED, 'Invalid or expired token');
  }
};

export const authorize = (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction): Response | void => {
    if (!req.authUser) {
      return sendError(res, StatusCodes.FORBIDDEN, 'Access denied');
    }

    if (!roles.includes(req.authUser.role as UserRole)) {
      return sendError(res, StatusCodes.FORBIDDEN, 'Insufficient privileges');
    }

    return next();
  };
