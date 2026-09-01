// backend/src/middleware/validate.middleware.js
// Zod validation middleware

import { ZodError } from 'zod';
import { ValidationError } from './error.middleware.js';

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const data = req[source];
      const result = schema.safeParse(data);
      
      if (!result.success) {
        throw new ValidationError(result.error.errors);
      }
      
      // Replace request data with validated/transformed data
      req[source] = result.data;
      next();
    } catch (err) {
      next(err);
    }
  };
}

// Validate multiple sources
export function validateAll(schemas) {
  return (req, res, next) => {
    try {
      for (const [source, schema] of Object.entries(schemas)) {
        const data = req[source];
        const result = schema.safeParse(data);
        
        if (!result.success) {
          throw new ValidationError(result.error.errors);
        }
        
        req[source] = result.data;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}