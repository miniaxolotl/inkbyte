import { Next, ParameterizedContext } from "koa";
import { IMiddleware } from "koa-router";
import Joi from "joi";

import { CLIENT_ERROR } from "@lib/utility";
import { validateSchema } from "@lib/schema-validator";

export type HeaderContext<T = { [key: string]: unknown }> = {
  headers: T;
};

export const HeaderResolver = <T = unknown>(
  Schema: Joi.ObjectSchema,
): IMiddleware<HeaderContext<T>> => {
  return async (ctx: ParameterizedContext<HeaderContext<T>>, next: Next) => {
    const { value, error } = validateSchema<T>(Schema, ctx.request.headers, {
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
      headers: value,
    };
    await next();
  };
};
