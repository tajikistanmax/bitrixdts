import { Request, Response, NextFunction } from 'express';
import sanitizeHtml from 'sanitize-html';

const recursiveSanitize = (obj: any): any => {
  if (typeof obj === 'string') {
    return sanitizeHtml(obj, {
      allowedTags: [],
      allowedAttributes: {},
    });
  }
  if (Array.isArray(obj)) {
    return obj.map(recursiveSanitize);
  }
  if (obj && typeof obj === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = recursiveSanitize(value);
    }
    return sanitized;
  }
  return obj;
};

export const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body) {
    req.body = recursiveSanitize(req.body);
  }
  if (req.query) {
    req.query = recursiveSanitize(req.query) as any;
  }
  if (req.params) {
    req.params = recursiveSanitize(req.params) as any;
  }
  next();
};
