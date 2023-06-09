import Joi from "joi";
import { ParameterizedContext } from "koa";

import { CLIENT_ERROR } from "@lib/utility";
import { validateSchema } from "@lib/schema-validator";

export const HeaderGuard = <T = unknown>(Schema: Joi.ObjectSchema) => {
  return async (ctx: ParameterizedContext, next: () => Promise<void>) => {
    const { value, error } = validateSchema<T | null>(
      Schema,
      ctx.request.headers,
      {
        allowUnknown: true,
        abortEarly: false,
        errors: { escapeHtml: true },
      },
    );
    if (error) {
      ctx.status = CLIENT_ERROR.BAD_REQUEST.status;
      ctx.body = error;
      return;
    }
    ctx.data = {
      ...ctx.data,
      headers: value,
    };
    (ctx.request as unknown as { body: T | null }).body = value;
    await next();
  };
};
