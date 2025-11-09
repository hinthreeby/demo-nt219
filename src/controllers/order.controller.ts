import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { listOrdersForUser, listAllOrders } from '../services/order.service';
import { sendSuccess, sendError } from '../utils/apiResponse';

export const listMyOrdersHandler = async (req: Request, res: Response) => {
  if (!req.authUser) {
    return sendError(res, StatusCodes.UNAUTHORIZED, 'Not authenticated');
  }
  const orders = await listOrdersForUser(req.authUser.id);
  return sendSuccess(res, StatusCodes.OK, { orders });
};

export const listAllOrdersHandler = async (_req: Request, res: Response) => {
  const orders = await listAllOrders();
  return sendSuccess(res, StatusCodes.OK, { orders });
};
