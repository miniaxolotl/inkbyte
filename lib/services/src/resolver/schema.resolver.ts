import { Next, ParameterizedContext } from "koa";
import { IMiddleware } from "koa-router";

import yup, { ObjectSchema } from "yup";

import { CLIENT_ERROR } from "@lib/utility";
import { validateSchema } from "@lib/schema-validator";

export type SchemaContext<T = { [key: string]: unknown }> = {
  body: T;
};

export const SchemaResolver = <T = unknown>(
  schema: ObjectSchema<yup.AnyObject>,
): IMiddleware<SchemaContext<T>> => {
  return async (ctx: ParameterizedContext<SchemaContext<T>>, next: Next) => {
    const { value, error } = validateSchema<T>(
      schema,
      (ctx.request as unknown as { body: Record<string, unknown> }).body,
      {
        stripUnknown: true,
        abortEarly: false,
      },
    );
    if (error || !value) {
      ctx.status = CLIENT_ERROR.BAD_REQUEST.status;
      ctx.body = error || CLIENT_ERROR.BAD_REQUEST.message;
      return;
    }
    ctx.state = {
      ...ctx.state,
      body: value,
    };
    (ctx.request as unknown as { body: T | null }).body = value;
    await next();
  };
};
