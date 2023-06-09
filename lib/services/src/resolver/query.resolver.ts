import { Next, ParameterizedContext } from "koa";
import { IMiddleware } from "koa-router";
import Joi from "joi";

import { CLIENT_ERROR } from "@lib/utility";
import { validateSchema } from "@lib/schema-validator";

export type QueryContext<T = { [key: string]: unknown }> = {
  query: T;
};

export const QueryResolver = <T = unknown>(
  Schema: Joi.ObjectSchema,
): IMiddleware<QueryContext<T>> => {
  return async (ctx: ParameterizedContext<QueryContext<T>>, next: Next) => {
    const { value, error } = validateSchema<T>(Schema, ctx.request.query, {
      allowUnknown: true,
      abortEarly: false,
      errors: { escapeHtml: true },
    });
    if (error || !value) {
      ctx.status = CLIENT_ERROR.BAD_REQUEST.status;
      ctx.body = error?.[0] || "Invalid request body";
      return;
    }
    ctx.state = {
      ...ctx.state,
      query: value,
    };
    await next();
  };
};
