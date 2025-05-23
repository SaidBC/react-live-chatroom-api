import { Request, Response, NextFunction } from "express";

type expressRouterHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<Response<any, Record<string, any>> | undefined>;

export const tryCatch = function (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>
) {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      return await fn(req, res, next);
    } catch (err) {
      next(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } as expressRouterHandler;
};

export default tryCatch;
