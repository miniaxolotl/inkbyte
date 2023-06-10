import { Next, ParameterizedContext } from "koa";
import { IMiddleware } from "koa-router";

import yup, { ObjectSchema } from "yup";

import { CLIENT_ERROR } from "@lib/utility";
import { validateSchema } from "@lib/schema-validator";

export type QueryContext<T = { [key: string]: unknown }> = {
  query: T;
};

export const QueryResolver = <T = unknown>(
  schema: ObjectSchema<yup.AnyObject>,
): IMiddleware<QueryContext<T>> => {
  return async (ctx: ParameterizedContext<QueryContext<T>>, next: Next) => {
    const { value, error } = validateSchema<T>(schema, ctx.request.query, {
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
      query: value,
    };
    await next();
  };
};
