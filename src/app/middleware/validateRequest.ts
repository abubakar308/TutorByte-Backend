import { NextFunction, Request, Response } from "express";
import { ZodObject } from "zod";

export const validateRequest = (zodSchema: ZodObject<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedResult = await zodSchema.safeParseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
        cookies: req.cookies,
      });

      if (!parsedResult.success) {
        return next(parsedResult.error);
      }

      // Update request properties with parsed/transformed data
      if (parsedResult.data.body) {
        req.body = parsedResult.data.body;
      }
      if (parsedResult.data.query) {
        req.query = parsedResult.data.query as any;
      }
      if (parsedResult.data.params) {
        req.params = parsedResult.data.params as any;
      }
      if (parsedResult.data.cookies) {
        req.cookies = parsedResult.data.cookies;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};