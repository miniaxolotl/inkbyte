import { ParameterizedContext } from "koa";

import yup, { ObjectSchema } from "yup";

import { CLIENT_ERROR } from "@lib/utility";
import { validateSchema } from "@lib/schema-validator";

export const HeaderGuard = <T = unknown>(
  schema: ObjectSchema<yup.AnyObject>,
) => {
  return async (ctx: ParameterizedContext, next: () => Promise<void>) => {
    const { value, error } = validateSchema<T>(schema, ctx.request.headers, {
      stripUnknown: true,
      abortEarly: false,
    });
    if (error || !value) {
      ctx.status = CLIENT_ERROR.BAD_REQUEST.status;
      ctx.body = error || CLIENT_ERROR.BAD_REQUEST.message;
      return;
    }
    ctx.state = {
      ...ctx.state,
      headers: value,
    };
    (ctx.request as unknown as { body: T | null }).body = value;
    await next();
  };
};
