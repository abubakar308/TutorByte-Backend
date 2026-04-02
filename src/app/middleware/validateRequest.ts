import { NextFunction, Request, Response } from "express";
import { ZodObject } from "zod";

export const validateRequest = (zodSchema: ZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedResult = await zodSchema.safeParseAsync({
        body: req.body || {},
        query: req.query || {},
        params: req.params || {},
        cookies: req.cookies || {},
      });

      if (!parsedResult.success) {
        return next(parsedResult.error);
      }

      // ১. Body সরাসরি অ্যাসাইন করা যায়
      if (parsedResult.data.body) {
        req.body = parsedResult.data.body;
      }

      // ২. Query অবজেক্টটি সরাসরি রিপ্লেস না করে Object.assign ব্যবহার করুন
      // এতে 'Cannot set property query of #<IncomingMessage>' এরর আসবে না
      if (parsedResult.data.query) {
        Object.assign(req.query, parsedResult.data.query);
      }

      // ৩. Params এর জন্যও Object.assign ব্যবহার করা নিরাপদ
      if (parsedResult.data.params) {
        Object.assign(req.params, parsedResult.data.params);
      }

      // ৪. Cookies আপডেট করা
      if (parsedResult.data.cookies) {
        req.cookies = parsedResult.data.cookies;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};